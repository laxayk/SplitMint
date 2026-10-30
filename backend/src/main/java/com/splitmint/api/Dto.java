package com.splitmint.api;

import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public final class Dto {
    private Dto() {}

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(max = 120) String displayName,
            @NotBlank @Size(min = 8, max = 72) String password) {}

    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}

    public record AuthResponse(String token, UUID userId, String email, String displayName) {}

    public record CreateGroupRequest(@NotBlank @Size(max = 120) String name,
                                     @NotBlank @Pattern(regexp = "[A-Za-z]{3}") String currency) {}

    public record GroupResponse(UUID id, String name, String currency, UUID createdBy, List<MemberView> members, List<MemberView> formerMembers) {}

    public record MemberView(UUID userId, String email, String displayName) {}

    public record AddMemberRequest(@NotBlank @Email String email) {}

    public record ExpenseRequest(
            @NotBlank @Size(max = 200) String title,
            @Positive long amountMinor,
            @NotNull LocalDate date,
            @NotNull UUID paidBy,
            @NotBlank @Size(max = 80) String requestId,
            @NotBlank @Pattern(regexp = "EQUAL|EXACT|PERCENT") String splitMode,
            @NotEmpty List<UUID> sharedBy,
            Map<UUID, Long> exactShares,
            Map<UUID, Double> percentShares) {}

    public record ShareView(UUID userId, long shareMinor) {}

    public record ExpenseResponse(UUID id, UUID groupId, String title, long amountMinor, LocalDate date,
                                  UUID paidBy, UUID createdBy, String requestId, List<ShareView> shares) {}

    public record PaymentRequest(@NotNull UUID fromUser, @NotNull UUID toUser,
                                 @Positive long amountMinor,
                                 @NotBlank @Size(max = 80) String requestId) {}

    public record PaymentResponse(UUID id, UUID groupId, UUID fromUser, UUID toUser, long amountMinor,
                                  String status, UUID recordedBy, UUID confirmedBy, String requestId) {}

    public record BalanceView(UUID userId, String email, long paidMinor, long shareMinor, long netMinor) {}

    public record TransferView(UUID fromUser, UUID toUser, long amountMinor) {}

    public record ActivityItem(String kind, UUID id, String text, String at) {}
}
