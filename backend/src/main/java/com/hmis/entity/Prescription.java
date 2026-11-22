package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "prescriptions")
public class Prescription extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String prescriptionNo;

    @NotNull(message = "Patient ID required")
    @Column(nullable = false)
    private Long patientId;

    @NotNull(message = "Doctor ID required")
    @Column(nullable = false)
    private Long doctorId;

    private Long medicalRecordId;
    private LocalDate prescribedDate = LocalDate.now();

    @NotBlank(message = "Status required")
    private String status = "Pending Verification";

    private Long verifiedBy;
    private LocalDate verifiedAt;

    @Column(length = 500)
    private String pharmacistNotes;

    @OneToMany(mappedBy = "prescription", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<PrescriptionItem> items = new ArrayList<>();

    public void addItem(PrescriptionItem item) {
        item.setPrescription(this);
        this.items.add(item);
    }

    public String getPrescriptionNo() { return prescriptionNo; }
    public void setPrescriptionNo(String prescriptionNo) { this.prescriptionNo = prescriptionNo; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getDoctorId() { return doctorId; }
    public void setDoctorId(Long doctorId) { this.doctorId = doctorId; }

    public Long getMedicalRecordId() { return medicalRecordId; }
    public void setMedicalRecordId(Long medicalRecordId) { this.medicalRecordId = medicalRecordId; }

    public LocalDate getPrescribedDate() { return prescribedDate; }
    public void setPrescribedDate(LocalDate prescribedDate) { this.prescribedDate = prescribedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getVerifiedBy() { return verifiedBy; }
    public void setVerifiedBy(Long verifiedBy) { this.verifiedBy = verifiedBy; }

    public LocalDate getVerifiedAt() { return verifiedAt; }
    public void setVerifiedAt(LocalDate verifiedAt) { this.verifiedAt = verifiedAt; }

    public String getPharmacistNotes() { return pharmacistNotes; }
    public void setPharmacistNotes(String pharmacistNotes) { this.pharmacistNotes = pharmacistNotes; }

    public List<PrescriptionItem> getItems() { return items; }
    public void setItems(List<PrescriptionItem> items) {
        this.items.clear();
        if (items != null) {
            items.forEach(this::addItem);
        }
    }
}
