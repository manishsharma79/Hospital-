package com.hmis.controller;

import com.hmis.entity.Department;
import com.hmis.entity.StaffSchedule;
import com.hmis.entity.UserAccount;
import com.hmis.service.AppointmentService;
import com.hmis.service.PatientService;
import com.hmis.service.PharmacyService;
import com.hmis.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final StaffService staffService;
    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final PharmacyService pharmacyService;

    public AdminController(
            StaffService staffService,
            PatientService patientService,
            AppointmentService appointmentService,
            PharmacyService pharmacyService) {
        this.staffService = staffService;
        this.patientService = patientService;
        this.appointmentService = appointmentService;
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/staff")
    public List<UserAccount> getAllStaff() {
        return staffService.getAllStaff();
    }

    @PostMapping("/staff")
    public UserAccount saveStaff(@Valid @RequestBody UserAccount user) {
        return staffService.saveStaff(user);
    }

    @PatchMapping("/staff/{id}/status")
    public UserAccount toggleStaffStatus(@PathVariable Long id) {
        return staffService.toggleStaffStatus(id);
    }

    @PatchMapping("/staff/{id}/availability")
    public UserAccount updateDoctorAvailability(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        return staffService.updateDoctorAvailability(id, body.getOrDefault("availabilityStatus", "Available"));
    }

    @DeleteMapping("/staff/{id}")
    public Map<String, Object> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return Map.of("ok", true, "message", "Staff account removed.");
    }

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return staffService.getAllDepartments();
    }

    @PostMapping("/departments")
    public Department saveDepartment(@Valid @RequestBody Department department) {
        return staffService.saveDepartment(department);
    }

    @DeleteMapping("/departments/{id}")
    public Map<String, Object> deleteDepartment(@PathVariable Long id) {
        staffService.deleteDepartment(id);
        return Map.of("ok", true, "message", "Department deleted.");
    }

    @GetMapping("/schedules")
    public List<StaffSchedule> getAllSchedules() {
        return staffService.getAllSchedules();
    }

    @PostMapping("/schedules")
    public StaffSchedule saveSchedule(@Valid @RequestBody StaffSchedule schedule) {
        return staffService.saveSchedule(schedule);
    }

    @DeleteMapping("/schedules/{id}")
    public Map<String, Object> deleteSchedule(@PathVariable Long id) {
        staffService.deleteSchedule(id);
        return Map.of("ok", true, "message", "Schedule removed.");
    }

    @GetMapping("/overview")
    public Map<String, Object> getHospitalOverview() {
        var staff = staffService.getAllStaff();
        var bills = pharmacyService.getAllBills();
        double revenue = bills.stream().mapToDouble(b -> b.getPaidAmount() != null ? b.getPaidAmount() : 0.0).sum();
        long doctors = staff.stream().filter(u -> "doctor".equalsIgnoreCase(u.getRole())).count();
        return Map.of(
                "totalStaff", staff.size(),
                "totalDoctors", doctors,
                "totalDepartments", staffService.getAllDepartments().size(),
                "totalPatients", patientService.getAllPatients().size(),
                "totalAppointments", appointmentService.getAllAppointments().size(),
                "totalRevenue", revenue
        );
    }
}
