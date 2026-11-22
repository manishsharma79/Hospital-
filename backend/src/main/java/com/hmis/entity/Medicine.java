package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

@Entity
@Table(name = "medicines")
public class Medicine extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String medicineId; // MED-XXXX

    @NotBlank(message = "Medicine name required")
    @Column(nullable = false)
    private String name;

    @NotBlank(message = "Batch number required")
    private String batchNumber;

    private String category;

    @Min(value = 0, message = "Quantity cannot be negative")
    private Integer availableQuantity = 0;

    @Min(value = 0, message = "Reorder level cannot be negative")
    private Integer reorderLevel = 20;

    @NotNull(message = "Unit price required")
    private Double unitPrice;

    @NotNull(message = "Expiry date required")
    private LocalDate expiryDate;

    private String supplier;

    public boolean isLowStock() {
        return availableQuantity != null && reorderLevel != null && availableQuantity <= reorderLevel;
    }

    public boolean isExpired() {
        return expiryDate != null && expiryDate.isBefore(LocalDate.now());
    }

    public String getMedicineId() { return medicineId; }
    public void setMedicineId(String medicineId) { this.medicineId = medicineId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getBatchNumber() { return batchNumber; }
    public void setBatchNumber(String batchNumber) { this.batchNumber = batchNumber; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public Integer getAvailableQuantity() { return availableQuantity; }
    public void setAvailableQuantity(Integer availableQuantity) { this.availableQuantity = availableQuantity; }

    public Integer getReorderLevel() { return reorderLevel; }
    public void setReorderLevel(Integer reorderLevel) { this.reorderLevel = reorderLevel; }

    public Double getUnitPrice() { return unitPrice; }
    public void setUnitPrice(Double unitPrice) { this.unitPrice = unitPrice; }

    public LocalDate getExpiryDate() { return expiryDate; }
    public void setExpiryDate(LocalDate expiryDate) { this.expiryDate = expiryDate; }

    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }
}
