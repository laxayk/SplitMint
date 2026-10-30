package com.splitmint.api;

import com.splitmint.domain.AppUser;
import com.splitmint.repo.UserRepo;
import com.splitmint.security.JwtService;
import com.splitmint.service.Errors;
import jakarta.validation.Valid;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepo users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(UserRepo users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @PostMapping("/register")
    public Dto.AuthResponse register(@Valid @RequestBody Dto.RegisterRequest req) {
        String email = req.email().toLowerCase();
        if (users.findByEmail(email).isPresent()) {
            throw new Errors.Conflict("An account with this email already exists");
        }
        AppUser user = users.save(new AppUser(email, req.displayName(), encoder.encode(req.password())));
        return new Dto.AuthResponse(jwt.issue(user.getId(), user.getEmail()),
                user.getId(), user.getEmail(), user.getDisplayName());
    }

    @PostMapping("/login")
    public Dto.AuthResponse login(@Valid @RequestBody Dto.LoginRequest req) {
        AppUser user = users.findByEmail(req.email().toLowerCase())
                .orElseThrow(() -> new Errors.Forbidden("Wrong email or password"));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new Errors.Forbidden("Wrong email or password");
        }
        return new Dto.AuthResponse(jwt.issue(user.getId(), user.getEmail()),
                user.getId(), user.getEmail(), user.getDisplayName());
    }
}
