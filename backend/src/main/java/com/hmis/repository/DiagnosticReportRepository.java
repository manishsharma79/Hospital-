package com.hmis.repository;

import com.hmis.entity.DiagnosticReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DiagnosticReportRepository extends JpaRepository<DiagnosticReport, Long> {
    List<DiagnosticReport> findByPatientId(Long patientId);
}
