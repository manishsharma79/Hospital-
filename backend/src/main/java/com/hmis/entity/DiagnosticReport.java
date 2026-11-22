package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "diagnostic_reports")
public class DiagnosticReport extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String reportNo;

    @NotNull(message = "Patient ID required")
    @Column(nullable = false)
    private Long patientId;

    @NotNull(message = "Doctor ID required")
    @Column(nullable = false)
    private Long requestedByDoctorId;

    @NotBlank(message = "Test name required")
    private String testName;

    private String category;
    private String priority = "Routine";
    private LocalDate requestedDate = LocalDate.now();
    private String status = "Requested";

    @Column(length = 1000)
    private String findings;

    private String referenceRange;
    private String resultFlag;
    private LocalDate completedDate;

    public String getReportNo() { return reportNo; }
    public void setReportNo(String reportNo) { this.reportNo = reportNo; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getRequestedByDoctorId() { return requestedByDoctorId; }
    public void setRequestedByDoctorId(Long requestedByDoctorId) { this.requestedByDoctorId = requestedByDoctorId; }

    public String getTestName() { return testName; }
    public void setTestName(String testName) { this.testName = testName; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public LocalDate getRequestedDate() { return requestedDate; }
    public void setRequestedDate(LocalDate requestedDate) { this.requestedDate = requestedDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getFindings() { return findings; }
    public void setFindings(String findings) { this.findings = findings; }

    public String getReferenceRange() { return referenceRange; }
    public void setReferenceRange(String referenceRange) { this.referenceRange = referenceRange; }

    public String getResultFlag() { return resultFlag; }
    public void setResultFlag(String resultFlag) { this.resultFlag = resultFlag; }

    public LocalDate getCompletedDate() { return completedDate; }
    public void setCompletedDate(LocalDate completedDate) { this.completedDate = completedDate; }
}
