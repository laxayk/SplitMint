package com.splitmint.api;

import com.splitmint.domain.ExpenseGroup;
import com.splitmint.repo.MemberRepo;
import com.splitmint.service.BalanceService;
import com.splitmint.service.GroupService;
import com.splitmint.service.SettlementService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/groups")
public class GroupController {
    private final GroupService groupService;
    private final MemberRepo members;
    private final BalanceService balanceService;
    private final SettlementService settlementService;

    public GroupController(GroupService groupService, MemberRepo members,
                           BalanceService balanceService, SettlementService settlementService) {
        this.groupService = groupService;
        this.members = members;
        this.balanceService = balanceService;
        this.settlementService = settlementService;
    }

    @PostMapping
    public Dto.GroupResponse create(@Valid @RequestBody Dto.CreateGroupRequest req) {
        UUID me = CurrentUser.id();
        ExpenseGroup g = groupService.createGroup(req.name(), req.currency(), me);
        return new Dto.GroupResponse(g.getId(), g.getName(), g.getCurrency(), g.getCreatedBy(),
                groupService.memberViews(g.getId()));
    }

    @GetMapping
    public List<Dto.GroupResponse> mine() {
        UUID me = CurrentUser.id();
        List<Dto.GroupResponse> out = new ArrayList<>();
        for (var m : members.findByUserId(me)) {
            var g = groupService.requireMembership(m.getGroupId(), me);
            out.add(new Dto.GroupResponse(g.getId(), g.getName(), g.getCurrency(), g.getCreatedBy(),
                    groupService.memberViews(g.getId())));
        }
        out.sort(Comparator.comparing(Dto.GroupResponse::name));
        return out;
    }

    @GetMapping("/{groupId}")
    public Dto.GroupResponse one(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        var g = groupService.requireMembership(groupId, me);
        return new Dto.GroupResponse(g.getId(), g.getName(), g.getCurrency(), g.getCreatedBy(),
                groupService.memberViews(groupId));
    }

    @PostMapping("/{groupId}/members")
    public Dto.GroupResponse addMember(@PathVariable UUID groupId,
                                       @Valid @RequestBody Dto.AddMemberRequest req) {
        UUID me = CurrentUser.id();
        groupService.addMember(groupId, me, req.email());
        var g = groupService.requireMembership(groupId, me);
        return new Dto.GroupResponse(g.getId(), g.getName(), g.getCurrency(), g.getCreatedBy(),
                groupService.memberViews(groupId));
    }

    @PostMapping("/{groupId}/leave")
    public Map<String, String> leave(@PathVariable UUID groupId) {
        groupService.leaveGroup(groupId, CurrentUser.id());
        return Map.of("status", "left");
    }

    @GetMapping("/{groupId}/balances")
    public List<Dto.BalanceView> balances(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        groupService.requireMembership(groupId, me);
        Map<UUID, Long> net = balanceService.netBalances(groupId);
        List<Dto.BalanceView> out = new ArrayList<>();
        for (var m : groupService.memberViews(groupId)) {
            out.add(new Dto.BalanceView(m.userId(), m.email(), 0, 0, net.getOrDefault(m.userId(), 0L)));
        }
        return out;
    }

    @GetMapping("/{groupId}/settlements/suggestions")
    public List<Dto.TransferView> suggestions(@PathVariable UUID groupId) {
        UUID me = CurrentUser.id();
        groupService.requireMembership(groupId, me);
        return settlementService.suggest(balanceService.netBalances(groupId)).stream()
                .map(t -> new Dto.TransferView(t.fromUser(), t.toUser(), t.amountMinor()))
                .toList();
    }
}
