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
        if (medicine.getId() != null) {
            Medicine existing = medicineRepository.findById(medicine.getId())
                    .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + medicine.getId()));
            existing.setName(medicine.getName());
            existing.setBatchNumber(medicine.getBatchNumber());
            existing.setCategory(medicine.getCategory());
            existing.setAvailableQuantity(medicine.getAvailableQuantity());
            existing.setReorderLevel(medicine.getReorderLevel());
            existing.setUnitPrice(medicine.getUnitPrice());
            existing.setExpiryDate(medicine.getExpiryDate());
            existing.setSupplier(medicine.getSupplier());
            return medicineRepository.save(existing);
        }
        if (medicine.getMedicineId() == null || medicine.getMedicineId().isBlank()) {
            long maxSeq = medicineRepository.findAll().stream()
                    .map(Medicine::getMedicineId)
                    .filter(code -> code != null && code.startsWith("MED-"))
                    .mapToLong(code -> {
                        try {
                            return Long.parseLong(code.substring(4));
                        } catch (NumberFormatException e) {
                            return 1000L;
                        }
                    })
                    .max()
                    .orElse(1000L);
            medicine.setMedicineId("MED-" + Math.max(1001L, maxSeq + 1));
        }
        return medicineRepository.save(medicine);
    }

    @Override
    @Transactional
    public void deleteMedicine(Long id) {
        medicineRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Medicine adjustMedicineStock(Long id, int delta) {
        Medicine med = medicineRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Medicine not found: " + id));
        int current = med.getAvailableQuantity() != null ? med.getAvailableQuantity() : 0;
        int next = current + delta;
        if (next < 0) {
            throw new IllegalStateException("Stock quantity cannot drop below zero.");
        }
        med.setAvailableQuantity(next);
        return medicineRepository.save(med);
    }

    @Override
    public List<Prescription> getAllPrescriptions() {
        return prescriptionRepository.findAll();
    }

    private String nextBillNo() {
        long maxSeq = billRepository.findAll().stream()
                .map(Bill::getBillNo)
                .filter(code -> code != null && (code.startsWith("BILL-") || code.startsWith("INV-")))
                .mapToLong(code -> {
                    try {
                        int dash = code.indexOf('-');
                        return Long.parseLong(code.substring(dash + 1));
                    } catch (NumberFormatException e) {
                        return 3000L;
                    }
                })
                .max()
                .orElse(3000L);
        return "INV-" + Math.max(3001L, maxSeq + 1);
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
        bill.setBillNo(nextBillNo());
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
    public Bill generateBill(Bill bill) {
        if (bill.getBillNo() == null || bill.getBillNo().isBlank()) {
            bill.setBillNo(nextBillNo());
        }
        if (bill.getItems() != null) {
            bill.getItems().forEach(item -> item.setBill(bill));
        }
        bill.recalculateTotals();
        if ("Paid".equalsIgnoreCase(bill.getPaymentStatus())) {
            bill.setPaidAmount(bill.getGrandTotal());
            if (bill.getPaidDate() == null) {
                bill.setPaidDate(LocalDate.now());
            }
        } else if ("Partial".equalsIgnoreCase(bill.getPaymentStatus())) {
            double paid = bill.getPaidAmount() != null ? bill.getPaidAmount() : 0.0;
            bill.setPaidAmount(Math.min(bill.getGrandTotal(), Math.max(0.0, paid)));
        } else {
            bill.setPaymentStatus("Unpaid");
            bill.setPaidAmount(0.0);
        }
        return billRepository.save(bill);
    }

    @Override
    @Transactional
    public Bill recordPayment(Long billId, Double amount, String method) {
        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new IllegalArgumentException("Bill not found: " + billId));
        double targetPaid = amount != null ? amount : 0.0;
        bill.setPaidAmount(Math.min(bill.getGrandTotal(), Math.max(0.0, targetPaid)));
        bill.setPaymentMethod(method);
        if (bill.getPaidAmount() >= bill.getGrandTotal()) {
            bill.setPaymentStatus("Paid");
            bill.setPaidDate(LocalDate.now());
        } else if (bill.getPaidAmount() > 0) {
            bill.setPaymentStatus("Partial");
        } else {
            bill.setPaymentStatus("Unpaid");
        }
        return billRepository.save(bill);
    }
}
