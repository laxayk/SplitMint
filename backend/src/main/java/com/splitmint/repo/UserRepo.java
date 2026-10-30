package com.splitmint.repo;

import com.splitmint.domain.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepo extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
}
