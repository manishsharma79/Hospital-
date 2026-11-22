package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "appointments")
public class Appointment extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String appointmentNo;

    @NotNull(message = "Patient ID required")
    @Column(nullable = false)
    private Long patientId;

    @NotNull(message = "Doctor ID required")
    @Column(nullable = false)
    private Long doctorId;

    private Long departmentId;

    @NotNull(message = "Appointment date required")
    @Column(nullable = false)
    private LocalDate appointmentDate;

    @NotBlank(message = "Time slot required")
    @Column(nullable = false, length = 30)
    private String timeSlot;

    private String visitType;
    private String reason;
    private String status = "Scheduled";
    private Long createdBy;

    public String getAppointmentNo() { return appointmentNo; }
    public void setAppointmentNo(String appointmentNo) { this.appointmentNo = appointmentNo; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }

    public LocalDate getAppointmentDate() { return appointmentDate; }
    public void setAppointmentDate(LocalDate appointmentDate) { this.appointmentDate = appointmentDate; }

    public String getTimeSlot() { return timeSlot; }
    public void setTimeSlot(String timeSlot) { this.timeSlot = timeSlot; }

    public String getVisitType() { return visitType; }
    public void setVisitType(String visitType) { this.visitType = visitType; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getCreatedBy() { return createdBy; }
    public void setCreatedBy(Long createdBy) { this.createdBy = createdBy; }
}
