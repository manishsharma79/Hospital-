package com.hmis.controller;

import com.hmis.entity.UserAccount;
import com.hmis.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final StaffService staffService;

    public AuthController(StaffService staffService) {
        this.staffService = staffService;
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String email = body.getOrDefault("email", "");
        String password = body.getOrDefault("password", "");
        String role = body.getOrDefault("role", "");
        UserAccount user = staffService.authenticate(email, password, role);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Welcome back, " + user.getName(),
                "user", user
        ));
    }

    @PostMapping("/register-staff")
    public ResponseEntity<Map<String, Object>> registerStaff(@Valid @RequestBody UserAccount user) {
        UserAccount saved = staffService.saveStaff(user);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Staff account created with code " + saved.getStaffCode(),
                "user", saved
        ));
    }
}
