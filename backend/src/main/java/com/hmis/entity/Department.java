package com.hmis.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "departments")
public class Department extends BaseEntity {

    @Column(unique = true, nullable = false, length = 30)
    private String code;

    @NotBlank(message = "Department name required")
    @Column(nullable = false)
    private String name;

    private Long headDoctorId;
    private String floor;
    private String extension;

    @Column(nullable = false, length = 20)
    private String status = "Active";

    @Column(length = 500)
    private String description;

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getHeadDoctorId() { return headDoctorId; }
    public void setHeadDoctorId(Long headDoctorId) { this.headDoctorId = headDoctorId; }

    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }

    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
