package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "staff_schedules")
public class StaffSchedule extends BaseEntity {

    @NotNull(message = "Staff ID required")
    @Column(nullable = false)
    private Long staffId;

    private Long departmentId;

    @NotNull(message = "Shift date required")
    @Column(nullable = false)
    private LocalDate shiftDate;

    @NotBlank(message = "Shift type required")
    private String shiftType;

    private String station;
    private String status = "Scheduled";
    private String notes;

    public Long getStaffId() { return staffId; }
    public void setStaffId(Long staffId) { this.staffId = staffId; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public LocalDate getShiftDate() { return shiftDate; }
    public void setShiftDate(LocalDate shiftDate) { this.shiftDate = shiftDate; }

    public String getShiftType() { return shiftType; }
    public void setShiftType(String shiftType) { this.shiftType = shiftType; }

    public String getStation() { return station; }
    public void setStation(String station) { this.station = station; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
