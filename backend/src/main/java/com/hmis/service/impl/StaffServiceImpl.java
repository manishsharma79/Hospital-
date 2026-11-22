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
        if (user.getId() == null && userRepo.findByEmailIgnoreCase(user.getEmail()).isPresent()) {
            throw new IllegalStateException("An account with this email address already exists.");
        }
        if (user.getStaffCode() == null || user.getStaffCode().isBlank()) {
            user.setStaffCode("STF-" + (1001 + userRepo.count()));
        }
        if (user.getJoinedDate() == null) {
            user.setJoinedDate(LocalDate.now());
        }
        return userRepo.save(user);
    }

    @Override
    public List<Department> getAllDepartments() {
        return deptRepo.findAll();
    }

    @Override
    @Transactional
    public Department saveDepartment(Department department) {
        if (department.getCode() == null || department.getCode().isBlank()) {
            department.setCode("DEPT-" + String.format("%02d", deptRepo.count() + 1));
        }
        return deptRepo.save(department);
    }

    @Override
    public List<StaffSchedule> getAllSchedules() {
        return scheduleRepo.findAll();
    }

    @Override
    @Transactional
    public StaffSchedule saveSchedule(StaffSchedule schedule) {
        return scheduleRepo.save(schedule);
    }
}
