CREATE DATABASE IF NOT EXISTS hmis_db;
USE hmis_db;

CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    head_doctor_id BIGINT,
    floor VARCHAR(100),
    extension VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    description VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_code VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    department_id BIGINT,
    phone VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    specialization VARCHAR(150),
    qualification VARCHAR(150),
    license_number VARCHAR(100),
    consultation_fee DOUBLE,
    availability_status VARCHAR(50),
    joined_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS staff_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_id BIGINT NOT NULL,
    department_id BIGINT,
    shift_date DATE NOT NULL,
    shift_type VARCHAR(100) NOT NULL,
    station VARCHAR(150),
    status VARCHAR(30) DEFAULT 'Scheduled',
    notes VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id VARCHAR(30) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    age INT,
    gender VARCHAR(20) NOT NULL,
    blood_group VARCHAR(10),
    marital_status VARCHAR(30),
    mobile VARCHAR(25) NOT NULL,
    alternate_phone VARCHAR(25),
    email VARCHAR(255),
    house_no VARCHAR(100) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(120) NOT NULL,
    state VARCHAR(120) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    pin_code VARCHAR(10) NOT NULL,
    emergency_name VARCHAR(255) NOT NULL,
    emergency_relation VARCHAR(60) NOT NULL,
    emergency_phone VARCHAR(25) NOT NULL,
    id_proof_type VARCHAR(80) NOT NULL,
    id_proof_number VARCHAR(100) NOT NULL,
    registration_date DATE,
    registration_type VARCHAR(50),
    assigned_department_id BIGINT,
    assigned_doctor_id BIGINT,
    allergies VARCHAR(255),
    chronic_conditions VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    appointment_no VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(30) NOT NULL,
    visit_type VARCHAR(50),
    reason VARCHAR(255),
    status VARCHAR(30) DEFAULT 'Scheduled',
    created_by BIGINT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    appointment_id BIGINT,
    visit_date DATE,
    chief_complaint VARCHAR(500) NOT NULL,
    bp VARCHAR(30),
    pulse VARCHAR(30),
    temp VARCHAR(30),
    spo2 VARCHAR(30),
    diagnosis VARCHAR(500) NOT NULL,
    icd_code VARCHAR(30),
    treatment_plan VARCHAR(1000),
    clinical_notes VARCHAR(1000),
    progress_status VARCHAR(50) DEFAULT 'Under Treatment',
    follow_up_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    available_quantity INT DEFAULT 0,
    reorder_level INT DEFAULT 20,
    unit_price DOUBLE NOT NULL,
    expiry_date DATE NOT NULL,
    supplier VARCHAR(200),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_no VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medical_record_id BIGINT,
    prescribed_date DATE,
    status VARCHAR(40) NOT NULL DEFAULT 'Pending Verification',
    verified_by BIGINT,
    verified_at DATE,
    pharmacist_notes VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT,
    medicine_code VARCHAR(30),
    medicine_name VARCHAR(255),
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration_days INT,
    quantity_requested INT,
    instructions VARCHAR(255),
    CONSTRAINT fk_rx_item FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS diagnostic_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    report_no VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    requested_by_doctor_id BIGINT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(30) DEFAULT 'Routine',
    requested_date DATE,
    status VARCHAR(40) DEFAULT 'Requested',
    findings VARCHAR(1000),
    reference_range VARCHAR(255),
    result_flag VARCHAR(30),
    completed_date DATE,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_no VARCHAR(30) NOT NULL UNIQUE,
    patient_id BIGINT NOT NULL,
    prescription_id BIGINT,
    subtotal DOUBLE DEFAULT 0,
    tax_amount DOUBLE DEFAULT 0,
    grand_total DOUBLE DEFAULT 0,
    paid_amount DOUBLE DEFAULT 0,
    payment_status VARCHAR(30) DEFAULT 'Unpaid',
    payment_method VARCHAR(50),
    bill_date DATE,
    paid_date DATE,
    generated_by BIGINT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME
);

CREATE TABLE IF NOT EXISTS bill_line_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    description VARCHAR(255),
    category VARCHAR(50),
    quantity INT,
    unit_price DOUBLE,
    total DOUBLE,
    CONSTRAINT fk_bill_item FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE
);
