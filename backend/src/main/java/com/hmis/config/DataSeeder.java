package com.hmis.config;

import com.hmis.entity.*;
import com.hmis.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class DataSeeder implements CommandLineRunner {

    private final UserAccountRepository userRepo;
    private final DepartmentRepository deptRepo;
    private final PatientRepository patientRepo;
    private final MedicineRepository medicineRepo;
    private final AppointmentRepository appointmentRepo;

    public DataSeeder(
            UserAccountRepository userRepo,
            DepartmentRepository deptRepo,
            PatientRepository patientRepo,
            MedicineRepository medicineRepo,
            AppointmentRepository appointmentRepo) {
        this.userRepo = userRepo;
        this.deptRepo = deptRepo;
        this.patientRepo = patientRepo;
        this.medicineRepo = medicineRepo;
        this.appointmentRepo = appointmentRepo;
    }

    @Override
    public void run(String... args) {
        if (userRepo.count() > 0) {
            return;
        }

        Department cardio = new Department();
        cardio.setCode("DEPT-01");
        cardio.setName("Cardiology");
        cardio.setFloor("3rd Floor, East Wing");
        cardio.setExtension("3100");
        cardio.setStatus("Active");
        cardio.setDescription("Comprehensive cardiovascular diagnostics and outpatient care.");
        cardio = deptRepo.save(cardio);

        Department opd = new Department();
        opd.setCode("DEPT-02");
        opd.setName("Front Desk & OPD Registration");
        opd.setFloor("Ground Floor, Main Atrium");
        opd.setExtension("1100");
        opd.setStatus("Active");
        opd.setDescription("Central patient intake and appointment scheduling.");
        opd = deptRepo.save(opd);

        Department pharm = new Department();
        pharm.setCode("DEPT-03");
        pharm.setName("Clinical Pharmacy");
        pharm.setFloor("Ground Floor, South Corridor");
        pharm.setExtension("1300");
        pharm.setStatus("Active");
        pharm.setDescription("Medication dispensing, inventory, and billing.");
        pharm = deptRepo.save(pharm);

        UserAccount admin = new UserAccount();
        admin.setStaffCode("STF-1001");
        admin.setName("Neha Kumari");
        admin.setEmail("admin@hmis.in");
        admin.setPassword("Admin@123");
        admin.setRole("admin");
        admin.setPhone("+91 98201-10100");
        admin.setStatus("Active");
        admin.setJoinedDate(LocalDate.of(2022, 4, 1));
        userRepo.save(admin);

        UserAccount reg = new UserAccount();
        reg.setStaffCode("STF-1002");
        reg.setName("Manish Sharma");
        reg.setEmail("desk@hmis.in");
        reg.setPassword("Desk@123");
        reg.setRole("registration");
        reg.setDepartmentId(opd.getId());
        reg.setPhone("+91 98201-10200");
        reg.setStatus("Active");
        reg.setJoinedDate(LocalDate.of(2023, 1, 15));
        userRepo.save(reg);

        UserAccount doc = new UserAccount();
        doc.setStaffCode("STF-1003");
        doc.setName("Dr. Nisha Kumari");
        doc.setEmail("dr.nisha@hmis.in");
        doc.setPassword("Doctor@123");
        doc.setRole("doctor");
        doc.setDepartmentId(cardio.getId());
        doc.setPhone("+91 98201-10300");
        doc.setStatus("Active");
        doc.setSpecialization("Senior Cardiologist");
        doc.setQualification("MD, DM (Cardiology)");
        doc.setLicenseNumber("MCI-MH-44210");
        doc.setConsultationFee(800.0);
        doc.setAvailabilityStatus("Available");
        doc.setJoinedDate(LocalDate.of(2021, 8, 10));
        doc = userRepo.save(doc);

        UserAccount pharmacist = new UserAccount();
        pharmacist.setStaffCode("STF-1004");
        pharmacist.setName("Atit Kumar");
        pharmacist.setEmail("pharma@hmis.in");
        pharmacist.setPassword("Pharma@123");
        pharmacist.setRole("pharmacist");
        pharmacist.setDepartmentId(pharm.getId());
        pharmacist.setPhone("+91 98201-10400");
        pharmacist.setStatus("Active");
        pharmacist.setQualification("M.Pharm (Clinical Pharmacy)");
        pharmacist.setJoinedDate(LocalDate.of(2022, 11, 5));
        userRepo.save(pharmacist);

        if (patientRepo.count() == 0) {
            Patient p1 = new Patient();
            p1.setPatientId("PAT-2026-1001");
            p1.setFullName("Sunita Deshpande");
            p1.setDob(LocalDate.of(1968, 4, 12));
            p1.setGender("Female");
            p1.setBloodGroup("A+");
            p1.setMaritalStatus("Married");
            p1.setMobile("9822044120");
            p1.setEmail("sunita.deshpande@example.in");
            p1.setHouseNo("42B");
            p1.setStreet("Law College Road, Deccan Gymkhana");
            p1.setCity("Pune");
            p1.setState("Maharashtra");
            p1.setCountry("India");
            p1.setPinCode("411004");
            p1.setEmergencyName("Arvind Deshpande");
            p1.setEmergencyRelation("Spouse");
            p1.setEmergencyPhone("9822099102");
            p1.setIdProofType("National ID / Aadhaar");
            p1.setIdProofNumber("XXXX-XXXX-4120");
            p1.setRegistrationDate(LocalDate.now());
            p1.setRegistrationType("Outpatient (OPD)");
            p1.setAssignedDepartmentId(cardio.getId());
            p1.setAssignedDoctorId(doc.getId());
            p1.setAllergies("Penicillin");
            p1.setChronicConditions("Essential Hypertension");
            p1 = patientRepo.save(p1);

            Appointment apt = new Appointment();
            apt.setAppointmentNo("APT-2001");
            apt.setPatientId(p1.getId());
            apt.setDoctorId(doc.getId());
            apt.setDepartmentId(cardio.getId());
            apt.setAppointmentDate(LocalDate.now());
            apt.setTimeSlot("10:00 AM");
            apt.setVisitType("Outpatient (OPD)");
            apt.setReason("Routine cardiology check-up");
            apt.setStatus("Scheduled");
            apt.setCreatedBy(reg.getId());
            appointmentRepo.save(apt);
        }

        if (medicineRepo.count() == 0) {
            Medicine m1 = new Medicine();
            m1.setMedicineId("MED-1001");
            m1.setName("Atorvastatin 20mg");
            m1.setBatchNumber("BTH-2026-A1");
            m1.setCategory("Cardiovascular");
            m1.setAvailableQuantity(140);
            m1.setReorderLevel(30);
            m1.setUnitPrice(18.5);
            m1.setExpiryDate(LocalDate.now().plusMonths(14));
            m1.setSupplier("Cipla MedTech India");
            medicineRepo.save(m1);

            Medicine m2 = new Medicine();
            m2.setMedicineId("MED-1002");
            m2.setName("Paracetamol 650mg");
            m2.setBatchNumber("BTH-2026-P4");
            m2.setCategory("Analgesic");
            m2.setAvailableQuantity(220);
            m2.setReorderLevel(40);
            m2.setUnitPrice(4.0);
            m2.setExpiryDate(LocalDate.now().plusMonths(18));
            m2.setSupplier("Sun Pharma Distributors");
            medicineRepo.save(m2);
        }
    }
}
