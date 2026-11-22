package com.hmis.service;

import com.hmis.entity.Patient;
import java.util.List;

public interface PatientService {
    List<Patient> getAllPatients();
    List<Patient> searchPatients(String query);
    Patient getPatientById(Long id);
    Patient registerPatient(Patient patient);
    Patient updatePatient(Long id, Patient updatedPatient);
    void deletePatient(Long id);
}
