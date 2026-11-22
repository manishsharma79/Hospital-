package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "bills")
public class Bill extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String billNo;

    @NotNull(message = "Patient ID required")
    @Column(nullable = false)
    private Long patientId;

    private Long prescriptionId;
    private Double subtotal = 0.0;
    private Double taxAmount = 0.0;
    private Double grandTotal = 0.0;
    private Double paidAmount = 0.0;
    private String paymentStatus = "Unpaid";
    private String paymentMethod;
    private LocalDate billDate = LocalDate.now();
    private LocalDate paidDate;
    private Long generatedBy;

    @OneToMany(mappedBy = "bill", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    private List<BillLineItem> items = new ArrayList<>();

    public void addItem(BillLineItem item) {
        item.setBill(this);
        this.items.add(item);
    }

    public void recalculateTotals() {
        this.subtotal = items.stream().mapToDouble(i -> i.getTotal() != null ? i.getTotal() : 0.0).sum();
        this.taxAmount = Math.round(this.subtotal * 0.05 * 100.0) / 100.0;
        this.grandTotal = Math.round((this.subtotal + this.taxAmount) * 100.0) / 100.0;
    }

    public String getBillNo() { return billNo; }
    public void setBillNo(String billNo) { this.billNo = billNo; }

    public Long getPatientId() { return patientId; }
    public void setPatientId(Long patientId) { this.patientId = patientId; }

    public Long getPrescriptionId() { return prescriptionId; }
    public void setPrescriptionId(Long prescriptionId) { this.prescriptionId = prescriptionId; }

    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }

    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }

    public Double getGrandTotal() { return grandTotal; }
    public void setGrandTotal(Double grandTotal) { this.grandTotal = grandTotal; }

    public Double getPaidAmount() { return paidAmount; }
    public void setPaidAmount(Double paidAmount) { this.paidAmount = paidAmount; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }

    public LocalDate getBillDate() { return billDate; }
    public void setBillDate(LocalDate billDate) { this.billDate = billDate; }

    public LocalDate getPaidDate() { return paidDate; }
    public void setPaidDate(LocalDate paidDate) { this.paidDate = paidDate; }

    public Long getGeneratedBy() { return generatedBy; }
    public void setGeneratedBy(Long generatedBy) { this.generatedBy = generatedBy; }

    public List<BillLineItem> getItems() { return items; }
    public void setItems(List<BillLineItem> items) {
        this.items.clear();
        if (items != null) {
            items.forEach(this::addItem);
        }
    }
}
