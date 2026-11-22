package com.hmis.controller;

import com.hmis.entity.Patient;
import com.hmis.service.PatientService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService patientService;

    public PatientController(PatientService patientService) {
        this.patientService = patientService;
    }

    @GetMapping
    public List<Patient> getPatients(@RequestParam(required = false) String q) {
        return patientService.searchPatients(q);
    }

    @GetMapping("/{id}")
    public Patient getPatient(@PathVariable Long id) {
        return patientService.getPatientById(id);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registerPatient(@Valid @RequestBody Patient patient) {
        Patient saved = patientService.registerPatient(patient);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Patient registered successfully",
                "patient", saved
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updatePatient(
            @PathVariable Long id,
            @Valid @RequestBody Patient patient) {
        Patient updated = patientService.updatePatient(id, patient);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Patient Details Updated",
                "patient", updated
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deletePatient(@PathVariable Long id) {
        patientService.deletePatient(id);
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "message", "Patient deleted successfully"
        ));
    }
}
