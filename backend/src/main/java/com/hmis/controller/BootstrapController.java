package com.hmis.controller;

import com.hmis.repository.DiagnosticReportRepository;
import com.hmis.repository.MedicalRecordRepository;
import com.hmis.service.AppointmentService;
import com.hmis.service.PatientService;
import com.hmis.service.PharmacyService;
import com.hmis.service.StaffService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/bootstrap")
public class BootstrapController {

    private final StaffService staffService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final PharmacyService pharmacyService;
    private final MedicalRecordRepository medicalRecordRepo;
    private final DiagnosticReportRepository diagnosticReportRepo;

    public BootstrapController(
            StaffService staffService,
            PatientService patientService,
            AppointmentService appointmentService,
            PharmacyService pharmacyService,
            MedicalRecordRepository medicalRecordRepo,
            DiagnosticReportRepository diagnosticReportRepo) {
        this.staffService = staffService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.pharmacyService = pharmacyService;
        this.medicalRecordRepo = medicalRecordRepo;
        this.diagnosticReportRepo = diagnosticReportRepo;
    }

    @GetMapping
    public Map<String, Object> getBootstrapSnapshot() {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("ok", true);
        payload.put("users", staffService.getAllStaff());
        payload.put("departments", staffService.getAllDepartments());
        payload.put("schedules", staffService.getAllSchedules());
        payload.put("patients", patientService.getAllPatients());
        payload.put("appointments", appointmentService.getAllAppointments());
        payload.put("medicalRecords", medicalRecordRepo.findAll());
        payload.put("prescriptions", pharmacyService.getAllPrescriptions());
        payload.put("diagnosticReports", diagnosticReportRepo.findAll());
        payload.put("medicines", pharmacyService.getAllMedicines());
        payload.put("bills", pharmacyService.getAllBills());
        return payload;
    }
}
