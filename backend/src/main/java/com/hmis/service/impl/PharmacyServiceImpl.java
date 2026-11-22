package com.hmis.service.impl;

import com.hmis.entity.*;
import com.hmis.repository.BillRepository;
import com.hmis.repository.MedicineRepository;
import com.hmis.repository.PrescriptionRepository;
import com.hmis.service.PharmacyService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class PharmacyServiceImpl implements PharmacyService {

    private final MedicineRepository medicineRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final BillRepository billRepository;

    public PharmacyServiceImpl(
            MedicineRepository medicineRepository,
            PrescriptionRepository prescriptionRepository,
            BillRepository billRepository) {
        this.medicineRepository = medicineRepository;
        this.prescriptionRepository = prescriptionRepository;
        this.billRepository = billRepository;
    }

    @Override
    public List<Medicine> getAllMedicines() {
        return medicineRepository.findAll();
    }

    @Override
    @Transactional
    public Medicine saveMedicine(Medicine medicine) {
        if (medicine.getMedicineId() == null || medicine.getMedicineId().isBlank()) {
            long seq = 1001 + medicineRepository.count();
            medicine.setMedicineId("MED-" + seq);
        }
        return medicineRepository.save(medicine);
    }

    @Override
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    @Override
    @Transactional
    public Prescription verifyAndDispensePrescription(Long prescriptionId, Long pharmacistId, String notes) {
        Prescription rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found: " + prescriptionId));

        if (!"Pending Verification".equalsIgnoreCase(rx.getStatus())) {
            throw new IllegalStateException("Prescription has already been processed.");
        }

        Bill bill = new Bill();
        bill.setBillNo("BILL-" + (5001 + billRepository.count()));
        bill.setPatientId(rx.getPatientId());
        bill.setPrescriptionId(rx.getId());
        bill.setGeneratedBy(pharmacistId);

        for (PrescriptionItem item : rx.getItems()) {
            Medicine med = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + item.getMedicineName()));

            if (med.isExpired()) {
                throw new IllegalStateException("Cannot dispense expired medicine: " + med.getName());
            }
            if (med.getAvailableQuantity() < item.getQuantityRequested()) {
                throw new IllegalStateException("Insufficient stock for medicine: " + med.getName());
            }

            med.setAvailableQuantity(med.getAvailableQuantity() - item.getQuantityRequested());
            medicineRepository.save(med);

            BillLineItem line = new BillLineItem();
            line.setDescription(med.getName() + " (" + item.getDosage() + ")");
            line.setCategory("Pharmacy");
            line.setQuantity(item.getQuantityRequested());
            line.setUnitPrice(med.getUnitPrice());
            line.setTotal(med.getUnitPrice() * item.getQuantityRequested());
            bill.addItem(line);
        }

        bill.recalculateTotals();
        billRepository.save(bill);

        rx.setStatus("Verified & Dispensed");
        rx.setVerifiedBy(pharmacistId);
        rx.setVerifiedAt(LocalDate.now());
        rx.setPharmacistNotes(notes);
        return prescriptionRepository.save(rx);
    }

    @Override
    @Transactional
    public Prescription rejectPrescription(Long prescriptionId, Long pharmacistId, String notes) {
        Prescription rx = prescriptionRepository.findById(prescriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Prescription not found: " + prescriptionId));
        rx.setStatus("Rejected");
        rx.setVerifiedBy(pharmacistId);
        rx.setVerifiedAt(LocalDate.now());
        rx.setPharmacistNotes(notes);
        return prescriptionRepository.save(rx);
    }

    @Override
    public List<Bill> getAllBills() {
        return billRepository.findAll();
    }

    @Override
    @Transactional
    public Bill recordPayment(Long billId, Double amount, String method) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));
        double newPaid = (bill.getPaidAmount() != null ? bill.getPaidAmount() : 0.0) + amount;
        bill.setPaidAmount(Math.min(bill.getGrandTotal(), newPaid));
        bill.setPaymentMethod(method);
        if (bill.getPaidAmount() >= bill.getGrandTotal()) {
            bill.setPaymentStatus("Paid");
            bill.setPaidDate(LocalDate.now());
        } else if (bill.getPaidAmount() > 0) {
            bill.setPaymentStatus("Partial");
        }
        return billRepository.save(bill);
    }
}
