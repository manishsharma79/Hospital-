package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "medical_records")
public class MedicalRecord extends BaseEntity {

    @NotNull(message = "Patient ID required")
    @Column(nullable = false)
    private Long patientId;

    @NotNull(message = "Doctor ID required")
    @Column(nullable = false)
    private Long doctorId;

    private Long appointmentId;
    private LocalDate visitDate = LocalDate.now();

    @NotBlank(message = "Chief complaint required")
    @Column(length = 500)
    private String chiefComplaint;

    private String bp;
    private String pulse;
    private String temp;
    private String spo2;

    @NotBlank(message = "Diagnosis required")
    @Column(length = 500)
    private String diagnosis;

    private String icdCode;

    @Column(length = 1000)
    private String treatmentPlan;

    @Column(length = 1000)
    private String clinicalNotes;

    private String progressStatus = "Under Treatment";
    private LocalDate followUpDate;

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getAppointmentId() { return appointmentId; }
    public void setAppointmentId(Long appointmentId) { this.appointmentId = appointmentId; }

    public LocalDate getVisitDate() { return visitDate; }
    public void setVisitDate(LocalDate visitDate) { this.visitDate = visitDate; }

    public String getChiefComplaint() { return chiefComplaint; }
    public void setChiefComplaint(String chiefComplaint) { this.chiefComplaint = chiefComplaint; }

    public String getBp() { return bp; }
    public void setBp(String bp) { this.bp = bp; }

    public String getPulse() { return pulse; }
    public void setPulse(String pulse) { this.pulse = pulse; }

    public String getTemp() { return temp; }
    public void setTemp(String temp) { this.temp = temp; }

    public String getSpo2() { return spo2; }
    public void setSpo2(String spo2) { this.spo2 = spo2; }

    public String getDiagnosis() { return diagnosis; }
    public void setDiagnosis(String diagnosis) { this.diagnosis = diagnosis; }

    public String getIcdCode() { return icdCode; }
    public void setIcdCode(String icdCode) { this.icdCode = icdCode; }

    public String getTreatmentPlan() { return treatmentPlan; }
    public void setTreatmentPlan(String treatmentPlan) { this.treatmentPlan = treatmentPlan; }

    public String getClinicalNotes() { return clinicalNotes; }
    public void setClinicalNotes(String clinicalNotes) { this.clinicalNotes = clinicalNotes; }

    public String getProgressStatus() { return progressStatus; }
    public void setProgressStatus(String progressStatus) { this.progressStatus = progressStatus; }

    public LocalDate getFollowUpDate() { return followUpDate; }
    public void setFollowUpDate(LocalDate followUpDate) { this.followUpDate = followUpDate; }
}
