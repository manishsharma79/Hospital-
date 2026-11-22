package com.hmis.repository;

import com.hmis.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByPatientId(String patientId);
    List<Patient> findByFullNameContainingIgnoreCaseOrPatientIdContainingIgnoreCaseOrMobileContainingIgnoreCase(
            String fullName, String patientId, String mobile);
}
