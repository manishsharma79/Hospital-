# Hospital Management Information System (HMIS)

A frontend-only, role-based Hospital Management Information System (HMIS) built with React, TypeScript, Vite, Tailwind CSS, React Router (`HashRouter`), and Lucide Icons. All operational data is persisted locally in the browser using `localStorage` and seeded with fictional Indian hospital demonstration records.

> **Security & Privacy Notice:** Browser-based authentication and `localStorage` persistence are strictly for frontend demonstration and academic/portfolio evaluation. Do not use this system with real patient Protected Health Information (PHI) or in live hospital production environments without a compliant backend and server-side authentication.

---

## Demo Login Credentials

Use the role quick-fill cards on the login page or enter these demonstration credentials directly:

| Role | Name | Email | Password |
| :--- | :--- | :--- | :--- |
| **Administrator** | Priya Nair | `admin@hmis.in` | `Admin@123` |
| **Registration Staff** | Manish Sharma | `desk@hmis.in` | `Desk@123` |
| **Doctor** | Dr. Aarav Patel | `dr.patel@hmis.in` | `Doctor@123` |
| **Pharmacist** | Anjali Kulkarni | `pharma@hmis.in` | `Pharma@123` |

Additional seeded physician accounts (all use `Doctor@123`):
- `dr.iyer@hmis.in` — Dr. Kavita Iyer (Internal Medicine)
- `dr.verma@hmis.in` — Dr. Rajesh Verma (Orthopedic Surgery)
- `dr.sneha@hmis.in` — Dr. Sneha Deshmukh (Pediatrics)

---

## Implemented Functionalities

### 1. Authentication & Role-Based Access Control
- Hospital-themed split-screen login with email, password (show/hide toggle), and user type selector.
- Inline form validation, error/success alerts, **New Staff Registration**, and **Forgot Password** demonstration modal.
- Strict route-level role guards (`ProtectedRoute`) redirecting unauthorized roles away from restricted portals.
- Collapsible sidebar navigation, top bar role-specific alert notifications, user profile summary, and logout.

### 2. Administrator Dashboard
- Live metrics: Total Staff, Total Doctors, Total Departments, Total Patients, Total Appointments, and Hospital Revenue (₹ INR).
- **Staff Management**: Create, edit, toggle active/inactive, update doctor availability, and delete staff accounts.
- **Department Management**: Create, edit, delete departments, assign department leads, floors, and extensions.
- **Roles & Permissions**: Interactive capability matrix across all four roles.
- **Staff Schedules**: Shift roster assignment and monitoring.
- **Hospital Overview & Billing Overview**: Department workload table, chronological audit trail, and invoice revenue ledger.

### 3. Registration Staff Dashboard
- **6-Section Patient Registration Form**: Patient Info (auto-calculated Age from DOB), Contact Info, Address Info, Emergency Contact, Identification Info, and Registration Info (auto-generated unique `PAT-YYYY-XXXX` ID, Department & Doctor assignment).
- **Update Patient Details**: Dedicated patient lookup and 6-section edit workflow with unsaved change tracking and validation.
- **Registered Patient Directory**: Search, filter (gender, blood group), column sorting, pagination, view modal, edit flow, and delete with confirmation.
- **Appointments & Availability**: Real-time doctor availability checks, time-slot conflict prevention, check-in status flow, and per-patient visit history timeline.

### 4. Doctor Dashboard
- Physician availability toggle (`Available`, `In Consultation`, `On Leave`, `Off Duty`) and assigned consultation queue.
- **Patient List & Complete Patient History**: Search by Patient ID or name; inspect demographics, allergies, vitals, diagnoses, prescriptions, and lab reports.
- **Diagnosis & Treatment**: Record vitals, ICD-10 diagnosis, treatment plan, clinical notes, and patient progress status (`Initial Evaluation` through `Recovered` / `Critical`).
- **E-Prescribing & Diagnostic Orders**: Issue multi-item prescriptions directly to the pharmacy queue and request/review diagnostic lab & imaging reports.

### 5. Pharmacist Dashboard
- **Medicine Inventory**: Full batch-level CRUD (Medicine ID, Batch Number, Category, Quantity, Unit Price, Expiry Date, Supplier) + quick restocking.
- **Medicine Availability**: Low-stock and out-of-stock alerts with threshold replenishment.
- **Verify Prescriptions**: Validates live stock & batch expiry before dispensing; blocks expired batches and over-dispensing; automatically deducts inventory and generates a patient invoice on dispense.
- **Billing & Payments**: Generate custom bills, update payment status (`Unpaid`, `Partial`, `Paid`) and payment method, and print patient receipts.
- **Expiry Monitoring**: Tracks Expired, Near-Expiry (<= 60 days), and Valid batches.

---

## Project Structure

```text
├── .github/workflows/deploy.yml   # Automated GitHub Pages deployment
├── index.html
├── vite.config.ts                 # Configured with base: './' for GitHub Pages
└── src/
    ├── App.tsx                    # HashRouter & role-protected routes
    ├── index.css                  # Tailwind CSS v4 + clinical typography
    ├── types/hmis.ts              # Centralized TypeScript interfaces
    ├── utils/hmisHelpers.ts       # ID generators, age calculator, expiry & INR helpers
    ├── data/seedData.ts           # Fictional Indian clinical demonstration data
    ├── context/
    │   ├── HMISContext.tsx        # LocalStorage state & relational operations
    │   └── ToastContext.tsx       # Non-intrusive notification system
    ├── components/
    │   ├── auth/ProtectedRoute.tsx
    │   ├── layout/AppShell.tsx
    │   └── ui/                    # DataTable, Modal, StatCard, StatusBadge
    └── pages/
        ├── LoginPage.tsx
        ├── admin/                 # 7 Administrator views
        ├── registration/          # 6 Registration Staff views
        ├── doctor/                # 6 Doctor views
        └── pharmacist/            # 6 Pharmacist views
```

---

## Installation & Local Development

```bash
npm install
npm run dev
```

To create a production build:

```bash
npm run build
```

---

## GitHub Pages Deployment

This project is pre-configured for GitHub Pages:
- `vite.config.ts` sets `base: './'` so static assets resolve cleanly from any repository subpath.
- `src/App.tsx` uses `HashRouter` so deep links and refreshes never 404 on static hosting.
- `.github/workflows/deploy.yml` builds and deploys `./dist` automatically on pushes to `main`.

### Steps to Enable GitHub Pages
1. Push this codebase to the `main` branch of your GitHub repository.
2. Open your repository on GitHub and navigate to **Settings -> Pages**.
3. Under **Build and deployment -> Source**, select **GitHub Actions**.
4. Trigger or wait for the **Deploy Hospital Management Information System to GitHub Pages** workflow to finish, then open the published URL shown in the Actions summary.

---

## Known Limitations
- **Client-Side Storage Only**: All data lives in browser `localStorage` (`hmis_db_v2`). Clearing browser site data resets changes (a "Reset Demo Data" button is also available on the login screen).
- **Single-Browser Scope**: Data created in one browser or device is not synchronized across other devices because there is no backend database or API.
- **Demonstration Auth**: Passwords are stored in plain demonstration seed objects in `localStorage` for easy testing across roles.
