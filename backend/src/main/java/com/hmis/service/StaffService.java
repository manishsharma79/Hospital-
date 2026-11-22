package com.hmis.service;

import com.hmis.entity.Department;
import com.hmis.entity.StaffSchedule;
import com.hmis.entity.UserAccount;
import java.util.List;

public interface StaffService {
    UserAccount authenticate(String email, String password, String role);
    List<UserAccount> getAllStaff();
    UserAccount saveStaff(UserAccount user);
    UserAccount toggleStaffStatus(Long id);
    UserAccount updateDoctorAvailability(Long id, String availabilityStatus);
    void deleteStaff(Long id);
    List<Department> getAllDepartments();
    Department saveDepartment(Department department);
    void deleteDepartment(Long id);
    List<StaffSchedule> getAllSchedules();
    StaffSchedule saveSchedule(StaffSchedule schedule);
    void deleteSchedule(Long id);
}
