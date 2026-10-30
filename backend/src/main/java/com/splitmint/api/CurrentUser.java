package com.splitmint.api;

import com.splitmint.service.Errors;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

final class CurrentUser {
    private CurrentUser() {}

    static UUID id() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UUID id)) {
            throw new Errors.Forbidden("Not signed in");
        }
        return id;
    }
}
