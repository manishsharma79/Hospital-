package com.hmis.service;

import com.hmis.entity.Bill;
import com.hmis.entity.Medicine;
import com.hmis.entity.Prescription;
import java.util.List;

public interface PharmacyService {
    List<Medicine> getAllMedicines();
    Medicine saveMedicine(Medicine medicine);
    void deleteMedicine(Long id);
    Medicine adjustMedicineStock(Long id, int delta);
    List<Prescription> getAllPrescriptions();
    Prescription verifyAndDispensePrescription(Long prescriptionId, Long pharmacistId, String notes);
    Prescription rejectPrescription(Long prescriptionId, Long pharmacistId, String notes);
    List<Bill> getAllBills();
    Bill generateBill(Bill bill);
    Bill recordPayment(Long billId, Double amount, String method);
}
