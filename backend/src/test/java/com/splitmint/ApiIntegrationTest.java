package com.splitmint;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.zonky.test.db.AutoConfigureEmbeddedDatabase;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureEmbeddedDatabase(provider = AutoConfigureEmbeddedDatabase.DatabaseProvider.ZONKY)
@ActiveProfiles("test")
class ApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;

    private String register(String email, String name) throws Exception {
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", email, "displayName", name, "password", "password123"))))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("token").asText();
    }

    private String userId(String token) throws Exception {
        return io.jsonwebtoken.Jwts.parser()
                .verifyWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                        "test-secret-key-test-secret-key-test-secret-key-0123456789".getBytes()))
                .build().parseSignedClaims(token).getPayload().getSubject();
    }

    private String createGroup(String token, String name) throws Exception {
        MvcResult r = mvc.perform(post("/api/groups").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("name", name, "currency", "INR"))))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(r.getResponse().getContentAsString()).get("id").asText();
    }

    private Map<String, Object> expenseBody(String paidBy, List<String> sharedBy, String requestId, long amount) {
        return Map.of("title", "Dinner", "amountMinor", amount, "date", "2026-10-30",
                "paidBy", paidBy, "requestId", requestId, "splitMode", "EQUAL", "sharedBy", sharedBy);
    }

    @Test
    void fullFlowAcceptanceChecks() throws Exception {
        String alice = register("alice@example.com", "Alice");
        String bob = register("bob@example.com", "Bob");
        String outsider = register("outsider@example.com", "Out");
        String aliceId = userId(alice), bobId = userId(bob);

        String groupId = createGroup(alice, "Goa trip");

        // outsider is refused the group's data
        mvc.perform(get("/api/groups/" + groupId).header("Authorization", "Bearer " + outsider))
                .andExpect(status().isForbidden());

        // add bob by email
        mvc.perform(post("/api/groups/" + groupId + "/members").header("Authorization", "Bearer " + alice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "bob@example.com"))))
                .andExpect(status().isOk());

        // outsider cannot add themselves
        mvc.perform(post("/api/groups/" + groupId + "/members").header("Authorization", "Bearer " + outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "outsider@example.com"))))
                .andExpect(status().isForbidden());

        // idempotent create: same request id twice saves one expense
        var body = expenseBody(aliceId, List.of(aliceId, bobId), "req-1", 10000);
        String content = json.writeValueAsString(body);
        mvc.perform(post("/api/groups/" + groupId + "/expenses").header("Authorization", "Bearer " + alice)
                .contentType(MediaType.APPLICATION_JSON).content(content)).andExpect(status().isOk());
        mvc.perform(post("/api/groups/" + groupId + "/expenses").header("Authorization", "Bearer " + alice)
                .contentType(MediaType.APPLICATION_JSON).content(content)).andExpect(status().isOk());
        MvcResult list = mvc.perform(get("/api/groups/" + groupId + "/expenses")
                        .header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk()).andReturn();
        JsonNode expenseList = json.readTree(list.getResponse().getContentAsString());
        assertEquals(1, expenseList.size(), "same request id must not create a second expense");
        String expenseId = expenseList.get(0).get("id").asText();

        // balances sum to zero
        MvcResult bal = mvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk()).andReturn();
        JsonNode balances = json.readTree(bal.getResponse().getContentAsString());
        long sum = 0;
        for (JsonNode b : balances) sum += b.get("netMinor").asLong();
        assertEquals(0, sum, "group balances must sum to zero");

        // alice cannot leave with a non-zero balance
        mvc.perform(post("/api/groups/" + groupId + "/leave").header("Authorization", "Bearer " + alice))
                .andExpect(status().isConflict());

        // bob (not the creator) cannot edit the expense
        mvc.perform(put("/api/expenses/" + expenseId).header("Authorization", "Bearer " + bob)
                        .contentType(MediaType.APPLICATION_JSON).content(content))
                .andExpect(status().isForbidden());

        // outsider cannot record a payment between two other people
        mvc.perform(post("/api/groups/" + groupId + "/payments").header("Authorization", "Bearer " + outsider)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("fromUser", bobId, "toUser", aliceId,
                                "amountMinor", 5000, "requestId", "p-x"))))
                .andExpect(status().isForbidden());

        // bob records a payment to alice; alice confirms; balances settle
        MvcResult pay = mvc.perform(post("/api/groups/" + groupId + "/payments")
                        .header("Authorization", "Bearer " + bob)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("fromUser", bobId, "toUser", aliceId,
                                "amountMinor", 5000, "requestId", "p-1"))))
                .andExpect(status().isOk()).andReturn();
        String paymentId = json.readTree(pay.getResponse().getContentAsString()).get("id").asText();

        // recorder cannot confirm their own payment
        mvc.perform(post("/api/payments/" + paymentId + "/confirm").header("Authorization", "Bearer " + bob))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/payments/" + paymentId + "/confirm").header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk());

        // expenses are locked once a payment exists
        mvc.perform(put("/api/expenses/" + expenseId).header("Authorization", "Bearer " + alice)
                        .contentType(MediaType.APPLICATION_JSON).content(content))
                .andExpect(status().isConflict());
        mvc.perform(delete("/api/expenses/" + expenseId).header("Authorization", "Bearer " + alice))
                .andExpect(status().isConflict());

        // after the confirmed payment both net out to zero and alice can leave
        MvcResult bal2 = mvc.perform(get("/api/groups/" + groupId + "/balances")
                        .header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk()).andReturn();
        for (JsonNode b : json.readTree(bal2.getResponse().getContentAsString())) {
            assertEquals(0, b.get("netMinor").asLong(), "settled balances must be zero");
        }
        mvc.perform(post("/api/groups/" + groupId + "/leave").header("Authorization", "Bearer " + alice))
                .andExpect(status().isOk());

        // unauthenticated requests are refused
        mvc.perform(get("/api/groups")).andExpect(status().isForbidden());
    }

    @Test
    void badSplitIsRejected() throws Exception {
        String alice = register("carol@example.com", "Carol");
        String bob = register("dave@example.com", "Dave");
        String aliceId = userId(alice), bobId = userId(bob);
        String groupId = createGroup(alice, "Flat");
        mvc.perform(post("/api/groups/" + groupId + "/members").header("Authorization", "Bearer " + alice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of("email", "dave@example.com"))))
                .andExpect(status().isOk());

        // exact shares that do not add up to the total are rejected
        mvc.perform(post("/api/groups/" + groupId + "/expenses").header("Authorization", "Bearer " + alice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Bad split", "amountMinor", 10000, "date", "2026-10-30",
                                "paidBy", aliceId, "requestId", "bad-1", "splitMode", "EXACT",
                                "sharedBy", List.of(aliceId, bobId),
                                "exactShares", Map.of(aliceId, 6000, bobId, 3000)))))
                .andExpect(status().isBadRequest());

        // a share for a non-member is rejected
        String outsiderId = userId(register("eve@example.com", "Eve"));
        mvc.perform(post("/api/groups/" + groupId + "/expenses").header("Authorization", "Bearer " + alice)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "title", "Outsider share", "amountMinor", 10000, "date", "2026-10-30",
                                "paidBy", aliceId, "requestId", "bad-2", "splitMode", "EQUAL",
                                "sharedBy", List.of(aliceId, outsiderId)))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateEmailRegistrationIsRejected() throws Exception {
        register("dupe@example.com", "One");
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(Map.of(
                                "email", "dupe@example.com", "displayName", "Two", "password", "password123"))))
                .andExpect(status().isConflict());
    }
}
