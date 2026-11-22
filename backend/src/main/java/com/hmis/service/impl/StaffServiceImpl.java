package com.hmis.service.impl;

import com.hmis.entity.Department;
import com.hmis.entity.StaffSchedule;
import com.hmis.entity.UserAccount;
import com.hmis.repository.DepartmentRepository;
import com.hmis.repository.StaffScheduleRepository;
import com.hmis.repository.UserAccountRepository;
import com.hmis.service.StaffService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class StaffServiceImpl implements StaffService {

    private final UserAccountRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final StaffScheduleRepository scheduleRepo;

    public StaffServiceImpl(
            UserAccountRepository userRepo,
            DepartmentRepository deptRepo,
            StaffScheduleRepository scheduleRepo) {
        this.userRepo = userRepo;
        this.deptRepo = deptRepo;
        this.scheduleRepo = scheduleRepo;
    }

    @Override
    public UserAccount authenticate(String email, String password, String role) {
        UserAccount user = userRepo.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("No staff account found with that email address."));
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Incorrect password.");
        }
        if (!user.getRole().equalsIgnoreCase(role)) {
            throw new IllegalArgumentException("Role mismatch for selected user account.");
        }
        if (!"Active".equalsIgnoreCase(user.getStatus())) {
            throw new IllegalStateException("This staff account is currently inactive.");
        }
        return user;
    }

    @Override
    public List<UserAccount> getAllStaff() {
        return userRepo.findAll();
    }

    @Override
    @Transactional
    public UserAccount saveStaff(UserAccount user) {
        String emailClean = user.getEmail() != null ? user.getEmail().trim().toLowerCase() : "";
        user.setEmail(emailClean);

        if (user.getId() != null) {
            UserAccount existing = userRepo.findById(user.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Staff member not found: " + user.getId()));

            userRepo.findByEmailIgnoreCase(emailClean).ifPresent(other -> {
                if (!other.getId().equals(existing.getId())) {
                    throw new IllegalStateException("Another staff account already uses that email address.");
                }
            });

            existing.setName(user.getName());
            existing.setEmail(emailClean);
            if (user.getPassword() != null && !user.getPassword().isBlank()) {
                existing.setPassword(user.getPassword());
            }
            existing.setRole(user.getRole());
            existing.setDepartmentId(user.getDepartmentId());
            existing.setPhone(user.getPhone());
            existing.setStatus(user.getStatus() != null ? user.getStatus() : existing.getStatus());
            existing.setSpecialization(user.getSpecialization());
            existing.setQualification(user.getQualification());
            existing.setLicenseNumber(user.getLicenseNumber());
            existing.setConsultationFee(user.getConsultationFee());
            existing.setAvailabilityStatus(
                    "doctor".equalsIgnoreCase(user.getRole())
                            ? (user.getAvailabilityStatus() != null ? user.getAvailabilityStatus() : "Available")
                            : null
            );
            return userRepo.save(existing);
        }

        if (user.getPassword() == null || user.getPassword().isBlank()) {
            throw new IllegalArgumentException("Password required");
        }
        if (userRepo.findByEmailIgnoreCase(emailClean).isPresent()) {
            throw new IllegalStateException("An account with this email address already exists.");
        }
        if (user.getStaffCode() == null || user.getStaffCode().isBlank()) {
            long seq = 1001 + userRepo.count();
            String code = "STF-" + seq;
            while (userRepo.findByStaffCode(code).isPresent()) {
                seq++;
                code = "STF-" + seq;
            }
            user.setStaffCode(code);
        }
        if (user.getJoinedDate() == null) {
            user.setJoinedDate(LocalDate.now());
        }
        if ("doctor".equalsIgnoreCase(user.getRole()) && (user.getAvailabilityStatus() == null || user.getAvailabilityStatus().isBlank())) {
            user.setAvailabilityStatus("Available");
        }
        return userRepo.save(user);
    }

    @Override
    @Transactional
    public UserAccount toggleStaffStatus(Long id) {
        UserAccount existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found: " + id));
        existing.setStatus("Active".equalsIgnoreCase(existing.getStatus()) ? "Inactive" : "Active");
        return userRepo.save(existing);
    }

    @Override
    @Transactional
    public UserAccount updateDoctorAvailability(Long id, String availabilityStatus) {
        UserAccount existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found: " + id));
        existing.setAvailabilityStatus(availabilityStatus);
        return userRepo.save(existing);
    }

    @Override
    @Transactional
    public void deleteStaff(Long id) {
        UserAccount existing = userRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Staff member not found: " + id));
        List<StaffSchedule> staffSchedules = scheduleRepo.findByStaffId(id);
        if (!staffSchedules.isEmpty()) {
            scheduleRepo.deleteAll(staffSchedules);
        }
        userRepo.delete(existing);
    }

    @Override
    public List<Department> getAllDepartments() {
        return deptRepo.findAll();
    }

    @Override
    @Transactional
    public Department saveDepartment(Department department) {
        if (department.getId() != null) {
            Department existing = deptRepo.findById(department.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Department not found: " + department.getId()));
            existing.setName(department.getName());
            existing.setHeadDoctorId(department.getHeadDoctorId());
            existing.setFloor(department.getFloor());
            existing.setExtension(department.getExtension());
            existing.setStatus(department.getStatus() != null ? department.getStatus() : existing.getStatus());
            existing.setDescription(department.getDescription());
            return deptRepo.save(existing);
        }
        if (department.getCode() == null || department.getCode().isBlank()) {
            long seq = deptRepo.count() + 1;
            String code = "DEPT-" + String.format("%02d", seq);
            while (deptRepo.findByCode(code).isPresent()) {
                seq++;
                code = "DEPT-" + String.format("%02d", seq);
            }
            department.setCode(code);
        }
        return deptRepo.save(department);
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department existing = deptRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Department not found: " + id));
        boolean hasAssignedStaff = userRepo.findAll().stream()
                .anyMatch(u -> id.equals(u.getDepartmentId()));
        if (hasAssignedStaff) {
            throw new IllegalStateException("Reassign staff members from this department before deleting it.");
        }
        deptRepo.delete(existing);
    }

    @Override
    public List<StaffSchedule> getAllSchedules() {
        return scheduleRepo.findAll();
    }

    @Override
    @Transactional
    public StaffSchedule saveSchedule(StaffSchedule schedule) {
        if (schedule.getId() != null) {
            StaffSchedule existing = scheduleRepo.findById(schedule.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Schedule not found: " + schedule.getId()));
            existing.setStaffId(schedule.getStaffId());
            existing.setDepartmentId(schedule.getDepartmentId());
            existing.setShiftDate(schedule.getShiftDate());
            existing.setShiftType(schedule.getShiftType());
            existing.setStation(schedule.getStation());
            existing.setStatus(schedule.getStatus());
            existing.setNotes(schedule.getNotes());
            return scheduleRepo.save(existing);
        }
        return scheduleRepo.save(schedule);
    }

    @Override
    @Transactional
    public void deleteSchedule(Long id) {
        scheduleRepo.deleteById(id);
    }
}
