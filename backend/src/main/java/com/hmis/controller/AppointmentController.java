package com.hmis.controller;

import com.hmis.entity.Appointment;
import com.hmis.service.AppointmentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;

    public AppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping
    public List<Appointment> getAllAppointments() {
        return appointmentService.getAllAppointments();
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> bookAppointment(@Valid @RequestBody Appointment appointment) {
        Appointment saved = appointmentService.scheduleAppointment(appointment);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Appointment scheduled: " + saved.getAppointmentNo(),
                "appointment", saved
        ));
    }

    @PatchMapping("/{id}/status")
    public Appointment updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return appointmentService.updateAppointmentStatus(id, body.getOrDefault("status", "Scheduled"));
    }
}
