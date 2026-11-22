import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HMISProvider } from './context/HMISContext';
import { ToastProvider } from './context/ToastContext';

// Login
import { LoginPage } from './pages/LoginPage';

// Administrator
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { BillingOverviewPage } from './pages/admin/BillingOverviewPage';
import { DepartmentManagementPage } from './pages/admin/DepartmentManagementPage';
import { HospitalOverviewPage } from './pages/admin/HospitalOverviewPage';
import { RolesPermissionsPage } from './pages/admin/RolesPermissionsPage';
import { StaffManagementPage } from './pages/admin/StaffManagementPage';
import { StaffSchedulesPage } from './pages/admin/StaffSchedulesPage';

// Registration Staff
import { AppointmentsPage } from './pages/registration/AppointmentsPage';
import { PatientRegistrationPage } from './pages/registration/PatientRegistrationPage';
import { RegisteredPatientsPage } from './pages/registration/RegisteredPatientsPage';
import { RegistrationDashboardPage } from './pages/registration/RegistrationDashboardPage';
import { UpdatePatientPage } from './pages/registration/UpdatePatientPage';
import { VisitHistoryPage } from './pages/registration/VisitHistoryPage';

// Doctor
import { DiagnosisTreatmentPage } from './pages/doctor/DiagnosisTreatmentPage';
import { DiagnosticReportsPage } from './pages/doctor/DiagnosticReportsPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorPatientHistoryPage } from './pages/doctor/DoctorPatientHistoryPage';
import { DoctorPatientsPage } from './pages/doctor/DoctorPatientsPage';
import { DoctorPrescriptionsPage } from './pages/doctor/DoctorPrescriptionsPage';

// Pharmacist
import { BillingPaymentsPage } from './pages/pharmacist/BillingPaymentsPage';
import { ExpiryMonitoringPage } from './pages/pharmacist/ExpiryMonitoringPage';
import { MedicineAvailabilityPage } from './pages/pharmacist/MedicineAvailabilityPage';
import { MedicineInventoryPage } from './pages/pharmacist/MedicineInventoryPage';
import { PharmacistDashboardPage } from './pages/pharmacist/PharmacistDashboardPage';
import { VerifyPrescriptionsPage } from './pages/pharmacist/VerifyPrescriptionsPage';

export default function App() {
  return (
    <ToastProvider>
      <HMISProvider>
        <HashRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            {/* Administrator Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/departments"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DepartmentManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <RolesPermissionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schedules"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <StaffSchedulesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/overview"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <HospitalOverviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/billing"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <BillingOverviewPage />
                </ProtectedRoute>
              }
            />

            {/* Registration Staff Routes */}
            <Route
              path="/registration/dashboard"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <RegistrationDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registration/register-patient"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <PatientRegistrationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registration/update-patient"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <UpdatePatientPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registration/patients"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <RegisteredPatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registration/appointments"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <AppointmentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/registration/visit-history"
              element={
                <ProtectedRoute allowedRoles={['registration']}>
                  <VisitHistoryPage />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patients"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPatientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/history"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPatientHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/diagnosis"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DiagnosisTreatmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorPrescriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/reports"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DiagnosticReportsPage />
                </ProtectedRoute>
              }
            />

            {/* Pharmacist Routes */}
            <Route
              path="/pharmacist/dashboard"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <PharmacistDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/inventory"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <MedicineInventoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/availability"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <MedicineAvailabilityPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/prescriptions"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <VerifyPrescriptionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/billing"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <BillingPaymentsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacist/expiry"
              element={
                <ProtectedRoute allowedRoles={['pharmacist']}>
                  <ExpiryMonitoringPage />
                </ProtectedRoute>
              }
            />

            {/* Fallback Redirect */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </HashRouter>
      </HMISProvider>
    </ToastProvider>
  );
}
