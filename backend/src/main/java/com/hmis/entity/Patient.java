package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "patients")
public class Patient extends Person {

    @Column(unique = true, nullable = false, length = 30)
    private String patientId; // PAT-YYYY-XXXX

    // Section 1: Patient Information
    @NotBlank(message = "Name required")
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s.'-]{1,}$", message = "Invalid name")
    @Column(nullable = false)
    private String fullName;

    @NotNull(message = "DOB required")
    @PastOrPresent(message = "Invalid DOB")
    @Column(nullable = false)
    private LocalDate dob;

    private Integer age;

    @NotBlank(message = "Gender required")
    @Column(nullable = false, length = 20)
    private String gender;

    private String bloodGroup;
    private String maritalStatus;

    // Section 2: Contact Information
    @NotBlank(message = "Mobile required")
    @Pattern(regexp = "^(\\+91[\\s-]?)?\\d{10}$|^(\\+91[\\s-]?)?\\d{5}[\\s-]\\d{5}$", message = "Invalid mobile")
    @Column(nullable = false, length = 25)
    private String mobile;

    private String alternatePhone;

    // Section 3: Address Information
    @NotBlank(message = "House No. required")
    @Column(nullable = false)
    private String houseNo;

    @NotBlank(message = "Street required")
    @Column(nullable = false)
    private String street;

    @NotBlank(message = "City required")
    @Column(nullable = false)
    private String city;

    @NotBlank(message = "State required")
    @Column(nullable = false)
    private String state;

    @NotBlank(message = "Country required")
    @Column(nullable = false)
    private String country = "India";

    @NotBlank(message = "PIN required")
    @Pattern(regexp = "^\\d{6}$", message = "Invalid PIN")
    @Column(nullable = false, length = 10)
    private String pinCode;

    // Section 4: Emergency Contact
    @NotBlank(message = "Emergency name required")
    @Pattern(regexp = "^[A-Za-z][A-Za-z\\s.'-]{1,}$", message = "Invalid emergency name")
    @Column(nullable = false)
    private String emergencyName;

    @NotBlank(message = "Relationship required")
    @Column(nullable = false)
    private String emergencyRelation;

    @NotBlank(message = "Emergency number required")
    @Pattern(regexp = "^(\\+91[\\s-]?)?\\d{10}$|^(\\+91[\\s-]?)?\\d{5}[\\s-]\\d{5}$", message = "Invalid emergency number")
    @Column(nullable = false, length = 25)
    private String emergencyPhone;

    // Section 5: Identification Information
    @NotBlank(message = "ID proof required")
    @Column(nullable = false)
    private String idProofType;

    @NotBlank(message = "ID number required")
    @Column(nullable = false)
    private String idProofNumber;

    // Section 6: Registration Information
    private LocalDate registrationDate;
    private String registrationType;
    private Long assignedDepartmentId;
    private Long assignedDoctorId;
    private String allergies;
    private String chronicConditions;

    @PrePersist
    @PreUpdate
    protected void syncDerivedFields() {
        super.onUpdate();
        if (this.dob != null) {
            this.age = Math.max(0, Period.between(this.dob, LocalDate.now()).getYears());
        }
        if (this.registrationDate == null) {
            this.registrationDate = LocalDate.now();
        }
    }

    @Override
    public String getDisplayName() {
        return fullName + " (" + patientId + ")";
    }

    @Override
    public String getPrimaryContact() {
        return mobile;
    }

    public String getPatientId() { return patientId; }
    public void setPatientId(String patientId) { this.patientId = patientId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public LocalDate getDob() { return dob; }
    public void setDob(LocalDate dob) { this.dob = dob; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public String getBloodGroup() { return bloodGroup; }
    public void setBloodGroup(String bloodGroup) { this.bloodGroup = bloodGroup; }

    public String getMaritalStatus() { return maritalStatus; }
    public void setMaritalStatus(String maritalStatus) { this.maritalStatus = maritalStatus; }

    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }

    public String getAlternatePhone() { return alternatePhone; }
    public void setAlternatePhone(String alternatePhone) { this.alternatePhone = alternatePhone; }

    public String getHouseNo() { return houseNo; }
    public void setHouseNo(String houseNo) { this.houseNo = houseNo; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getPinCode() { return pinCode; }
    public void setPinCode(String pinCode) { this.pinCode = pinCode; }

    public String getEmergencyName() { return emergencyName; }
    public void setEmergencyName(String emergencyName) { this.emergencyName = emergencyName; }

    public String getEmergencyRelation() { return emergencyRelation; }
    public void setEmergencyRelation(String emergencyRelation) { this.emergencyRelation = emergencyRelation; }

    public String getEmergencyPhone() { return emergencyPhone; }
    public void setEmergencyPhone(String emergencyPhone) { this.emergencyPhone = emergencyPhone; }

    public String getIdProofType() { return idProofType; }
    public void setIdProofType(String idProofType) { this.idProofType = idProofType; }

    public String getIdProofNumber() { return idProofNumber; }
    public void setIdProofNumber(String idProofNumber) { this.idProofNumber = idProofNumber; }

    public LocalDate getRegistrationDate() { return registrationDate; }
    public void setRegistrationDate(LocalDate registrationDate) { this.registrationDate = registrationDate; }

    public String getRegistrationType() { return registrationType; }
    public void setRegistrationType(String registrationType) { this.registrationType = registrationType; }

    public Long getAssignedDepartmentId() { return assignedDepartmentId; }
    public void setAssignedDepartmentId(Long assignedDepartmentId) { this.assignedDepartmentId = assignedDepartmentId; }

    public Long getAssignedDoctorId() { return assignedDoctorId; }
    public void setAssignedDoctorId(Long assignedDoctorId) { this.assignedDoctorId = assignedDoctorId; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getChronicConditions() { return chronicConditions; }
    public void setChronicConditions(String chronicConditions) { this.chronicConditions = chronicConditions; }
}
