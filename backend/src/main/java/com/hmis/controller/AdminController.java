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

    @GetMapping("/departments")
    public List<Department> getAllDepartments() {
        return staffService.getAllDepartments();
    }

    @PostMapping("/departments")
    public Department saveDepartment(@Valid @RequestBody Department department) {
        return staffService.saveDepartment(department);
    }

    @GetMapping("/schedules")
    public List<StaffSchedule> getAllSchedules() {
        return staffService.getAllSchedules();
    }

    @PostMapping("/schedules")
    public StaffSchedule saveSchedule(@Valid @RequestBody StaffSchedule schedule) {
        return staffService.saveSchedule(schedule);
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
