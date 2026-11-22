package com.hmis.controller;

import com.hmis.entity.Bill;
import com.hmis.entity.Medicine;
import com.hmis.entity.Prescription;
import com.hmis.service.PharmacyService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pharmacy")
public class PharmacyController {

    private final PharmacyService pharmacyService;

    public PharmacyController(PharmacyService pharmacyService) {
        this.pharmacyService = pharmacyService;
    }

    @GetMapping("/medicines")
    public List<Medicine> getMedicines() {
        return pharmacyService.getAllMedicines();
    }

    @PostMapping("/medicines")
    public Medicine saveMedicine(@Valid @RequestBody Medicine medicine) {
        return pharmacyService.saveMedicine(medicine);
    }

    @GetMapping("/prescriptions")
    public List<Prescription> getPrescriptions() {
        return pharmacyService.getAllPrescriptions();
    }

    @PostMapping("/prescriptions/{id}/verify")
    public Prescription verifyAndDispense(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long pharmacistId = body.get("pharmacistId") != null
                ? Long.valueOf(body.get("pharmacistId").toString())
                : 1L;
        String notes = body.getOrDefault("notes", "").toString();
        return pharmacyService.verifyAndDispensePrescription(id, pharmacistId, notes);
    }

    @PostMapping("/prescriptions/{id}/reject")
    public Prescription rejectPrescription(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        Long pharmacistId = body.get("pharmacistId") != null
                ? Long.valueOf(body.get("pharmacistId").toString())
                : 1L;
        String notes = body.getOrDefault("notes", "").toString();
        return pharmacyService.rejectPrescription(id, pharmacistId, notes);
    }

    @GetMapping("/bills")
    public List<Bill> getBills() {
        return pharmacyService.getAllBills();
    }

    @PostMapping("/bills/{id}/pay")
    public Bill payBill(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Double amount = Double.valueOf(body.get("amount").toString());
        String method = body.getOrDefault("method", "Cash").toString();
        return pharmacyService.recordPayment(id, amount, method);
    }
}
