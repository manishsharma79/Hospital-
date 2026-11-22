package com.hmis.service.impl;

import com.hmis.entity.Patient;
import com.hmis.repository.PatientRepository;
import com.hmis.service.PatientService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;
import java.util.List;

@Service
public class PatientServiceImpl implements PatientService {

    private final PatientRepository patientRepository;

    public PatientServiceImpl(PatientRepository patientRepository) {
        this.patientRepository = patientRepository;
    }

    @Override
    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    @Override
    public List<Patient> searchPatients(String query) {
        if (query == null || query.isBlank()) {
            return patientRepository.findAll();
        }
        String q = query.trim();
        return patientRepository
                .findByFullNameContainingIgnoreCaseOrPatientIdContainingIgnoreCaseOrMobileContainingIgnoreCase(q, q, q);
    }

    @Override
    public Patient getPatientById(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found with id: " + id));
    }

    @Override
    @Transactional
    public Patient registerPatient(Patient patient) {
        long seq = 1001 + patientRepository.count();
        patient.setPatientId("PAT-" + Year.now().getValue() + "-" + seq);
        return patientRepository.save(patient);
    }

    @Override
    @Transactional
    public Patient updatePatient(Long id, Patient updated) {
        Patient existing = getPatientById(id);
        existing.setFullName(updated.getFullName());
        existing.setDob(updated.getDob());
        existing.setGender(updated.getGender());
        existing.setBloodGroup(updated.getBloodGroup());
        existing.setMaritalStatus(updated.getMaritalStatus());
        existing.setMobile(updated.getMobile());
        existing.setAlternatePhone(updated.getAlternatePhone());
        existing.setEmail(updated.getEmail());
        existing.setHouseNo(updated.getHouseNo());
        existing.setStreet(updated.getStreet());
        existing.setCity(updated.getCity());
        existing.setState(updated.getState());
        existing.setCountry(updated.getCountry());
        existing.setPinCode(updated.getPinCode());
        existing.setEmergencyName(updated.getEmergencyName());
        existing.setEmergencyRelation(updated.getEmergencyRelation());
        existing.setEmergencyPhone(updated.getEmergencyPhone());
        existing.setIdProofType(updated.getIdProofType());
        existing.setIdProofNumber(updated.getIdProofNumber());
        existing.setRegistrationDate(updated.getRegistrationDate());
        existing.setRegistrationType(updated.getRegistrationType());
        existing.setAssignedDepartmentId(updated.getAssignedDepartmentId());
        existing.setAssignedDoctorId(updated.getAssignedDoctorId());
        existing.setAllergies(updated.getAllergies());
        existing.setChronicConditions(updated.getChronicConditions());
        return patientRepository.save(existing);
    }

    @Override
    @Transactional
    public void deletePatient(Long id) {
        Patient existing = getPatientById(id);
        patientRepository.delete(existing);
    }
}
