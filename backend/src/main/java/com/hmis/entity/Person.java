package com.hmis.entity;

import jakarta.persistence.MappedSuperclass;
import jakarta.validation.constraints.Email;

@MappedSuperclass
public abstract class Person extends BaseEntity {

    @Email(message = "Invalid email")
    private String email;

    protected Person() {
    }

    protected Person(String email) {
        this.email = email;
    }

    public abstract String getDisplayName();

    public abstract String getPrimaryContact();

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
