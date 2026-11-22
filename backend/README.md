# HMIS Backend — Java Spring Boot + MySQL (OOP Architecture)

This folder contains the complete **Java 17 + Spring Boot 3.3 + Spring Data JPA + MySQL 8** backend aligned with the Hospital Management Information System frontend.

## Object-Oriented Architecture (OOP)

- **Abstraction & Multi-Level Inheritance**:
  - `BaseEntity` (`@MappedSuperclass`): Encapsulates `id`, `createdAt`, `updatedAt`, and JPA lifecycle hooks (`@PrePersist`, `@PreUpdate`).
  - `Person` (`abstract class extends BaseEntity`): Defines shared `email` encapsulation and polymorphic `getDisplayName()` / `getPrimaryContact()` contracts implemented by `Patient` and `UserAccount`.
- **Encapsulation & Bean Validation**:
  - `Patient` enforces all 20 registration validation rules (`Name required`, `Invalid name`, `DOB required`, `Invalid DOB`, `Gender required`, `Mobile required`, `Invalid mobile`, `Invalid email`, `House No. required`, `Street required`, `City required`, `State required`, `PIN required`, `Invalid PIN`, `Emergency name required`, `Relationship required`, `Invalid emergency number`, `ID proof required`, `ID number required`).
- **Interface-Driven Service Layer & Polymorphism**:
  - `PatientService` -> `PatientServiceImpl`
  - `AppointmentService` -> `AppointmentServiceImpl`
  - `PharmacyService` -> `PharmacyServiceImpl` (atomic prescription verification, stock deduction, and 5% GST invoice generation)
  - `StaffService` -> `StaffServiceImpl`
- **Composition**:
  - `Prescription` owns `PrescriptionItem` (`@OneToMany` cascade & orphan removal).
  - `Bill` owns `BillLineItem` (`@OneToMany` cascade & orphan removal).

## Prerequisites

1. **Java 17+** (`java -version`)
2. **Maven 3.9+** (`mvn -version`) or IntelliJ IDEA / Eclipse / Spring Tool Suite
3. **MySQL 8.0+** running locally on port `3306`

## Setup & Run Locally

1. (Optional) Execute `mysql/hmis_schema.sql` in MySQL Workbench, or let Hibernate auto-create `hmis_db` tables on startup.
2. Set your MySQL credentials via environment variables (or edit `src/main/resources/application.properties`):
   ```bash
   export MYSQL_USER=root
   export MYSQL_PASSWORD=your_mysql_password
   ```
3. Run the Spring Boot application from the `backend/` folder:
   ```bash
   mvn spring-boot:run
   ```
   The API server starts on `http://localhost:8080`.

## Seeded Accounts

- **Administrator**: `Neha Kumari` — `admin@hmis.in` / `Admin@123`
- **Registration Staff**: `Manish Sharma` — `desk@hmis.in` / `Desk@123`
- **Doctor**: `Dr. Nisha Kumari` — `dr.nisha@hmis.in` / `Doctor@123`
- **Pharmacist**: `Atit Kumar` — `pharma@hmis.in` / `Pharma@123`

## REST Endpoints

- `POST /api/auth/login`, `POST /api/auth/register-staff`
- `GET/POST/PUT/DELETE /api/patients`
- `GET/POST /api/appointments`, `PATCH /api/appointments/{id}/status`
- `GET/POST /api/doctor/records`, `/api/doctor/prescriptions`, `/api/doctor/diagnostics`
- `GET/POST /api/pharmacy/medicines`, `POST /api/pharmacy/prescriptions/{id}/verify`, `POST /api/pharmacy/bills/{id}/pay`
- `GET/POST /api/admin/staff`, `/api/admin/departments`, `/api/admin/schedules`, `GET /api/admin/overview`
