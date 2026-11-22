package com.hmis.controller;

import com.hmis.entity.DiagnosticReport;
import com.hmis.entity.MedicalRecord;
import com.hmis.entity.Prescription;
import com.hmis.repository.DiagnosticReportRepository;
import com.hmis.repository.MedicalRecordRepository;
import com.hmis.repository.PrescriptionRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctor")
public class DoctorController {

    private final MedicalRecordRepository medicalRecordRepo;
    private final PrescriptionRepository prescriptionRepo;
    private final DiagnosticReportRepository diagnosticReportRepo;

    public DoctorController(
            MedicalRecordRepository medicalRecordRepo,
            PrescriptionRepository prescriptionRepo,
            DiagnosticReportRepository diagnosticReportRepo) {
        this.medicalRecordRepo = medicalRecordRepo;
        this.prescriptionRepo = prescriptionRepo;
        this.diagnosticReportRepo = diagnosticReportRepo;
    }

    @GetMapping("/records/{patientId}")
    public List<MedicalRecord> getPatientRecords(@PathVariable Long patientId) {
        return medicalRecordRepo.findByPatientIdOrderByVisitDateDesc(patientId);
    }

    @PostMapping("/records")
    public MedicalRecord addMedicalRecord(@Valid @RequestBody MedicalRecord record) {
        return medicalRecordRepo.save(record);
    }

    @GetMapping("/prescriptions")
    public List<Prescription> getPrescriptions() {
        return prescriptionRepo.findAll();
    }

    @PostMapping("/prescriptions")
    public Prescription createPrescription(@Valid @RequestBody Prescription prescription) {
        if (prescription.getPrescriptionNo() == null || prescription.getPrescriptionNo().isBlank()) {
            prescription.setPrescriptionNo("RX-" + (3001 + prescriptionRepo.count()));
        }
        return prescriptionRepo.save(prescription);
    }

    @GetMapping("/diagnostics")
    public List<DiagnosticReport> getDiagnostics() {
        return diagnosticReportRepo.findAll();
    }

    @PostMapping("/diagnostics")
    public DiagnosticReport requestDiagnostic(@Valid @RequestBody DiagnosticReport report) {
        if (report.getReportNo() == null || report.getReportNo().isBlank()) {
            report.setReportNo("LAB-" + (4001 + diagnosticReportRepo.count()));
        }
        return diagnosticReportRepo.save(report);
    }
}
