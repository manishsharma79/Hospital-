import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialSeedData } from '../data/seedData';
import {
  ActivityLog,
  Appointment,
  AppointmentStatus,
  AvailabilityStatus,
  Bill,
  BillLineItem,
  Department,
  DiagnosticReport,
  HMISDatabase,
  MedicalRecord,
  Medicine,
  Patient,
  PaymentMethod,
  PaymentStatus,
  Prescription,
  RolePermissionSet,
  StaffSchedule,
  UserAccount,
  UserRole,
} from '../types/hmis';
import {
  calculateAgeFromDOB,
  generatePrefixedCode,
  generateUID,
  generateUniquePatientId,
  getMedicineExpiryStatus,
  getTodayISO,
} from '../utils/hmisHelpers';

const STORAGE_KEY = 'hmis_db_v3';
const SESSION_KEY = 'hmis_session_v3';

interface ActionResult {
  ok: boolean;
  message: string;
  id?: string;
}

interface HMISContextValue {
  db: HMISDatabase;
  currentUser: UserAccount | null;
  login: (email: string, password: string, role: UserRole) => ActionResult;
  logout: () => void;
  registerNewStaff: (payload: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    departmentId: string;
    phone: string;
    qualification?: string;
    specialization?: string;
  }) => ActionResult;
  resetDemoDatabase: () => void;

  // Admin: Staff & Doctors
  saveStaffMember: (staff: Omit<UserAccount, 'id' | 'staffCode' | 'joinedDate'> & { id?: string }) => ActionResult;
  toggleStaffStatus: (staffId: string) => void;
  updateDoctorAvailability: (doctorId: string, status: AvailabilityStatus) => void;
  deleteStaffMember: (staffId: string) => ActionResult;

  // Admin: Departments
  saveDepartment: (dept: Omit<Department, 'id' | 'code' | 'createdAt'> & { id?: string }) => ActionResult;
  deleteDepartment: (deptId: string) => ActionResult;

  // Admin: Roles & Permissions
  updateRolePermission: (
    role: UserRole,
    permissionKey: keyof RolePermissionSet['permissions'],
    value: boolean
  ) => void;

  // Admin: Schedules
  saveSchedule: (schedule: Omit<StaffSchedule, 'id'> & { id?: string }) => ActionResult;
  deleteSchedule: (scheduleId: string) => void;

  // Registration & Patient CRUD
  registerPatient: (
    payload: Omit<Patient, 'id' | 'patientId' | 'age' | 'createdAt'>
  ) => ActionResult & { patient?: Patient };
  updatePatient: (id: string, updates: Partial<Patient>) => ActionResult;
  deletePatient: (id: string) => ActionResult;

  // Appointments
  createAppointment: (
    payload: Omit<Appointment, 'id' | 'appointmentNo' | 'createdAt' | 'createdBy'>
  ) => ActionResult;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;

  // Doctor: Clinical Records, Prescriptions & Diagnostics
  addMedicalRecord: (payload: Omit<MedicalRecord, 'id'>) => ActionResult & { record?: MedicalRecord };
  createPrescription: (
    payload: Omit<Prescription, 'id' | 'prescriptionNo' | 'status'>
  ) => ActionResult & { prescription?: Prescription };
  requestDiagnosticTest: (
    payload: Omit<DiagnosticReport, 'id' | 'reportNo' | 'status'>
  ) => ActionResult;
  updateDiagnosticReport: (
    id: string,
    updates: Pick<DiagnosticReport, 'status' | 'findings' | 'referenceRange' | 'resultFlag' | 'completedDate'>
  ) => ActionResult;

  // Pharmacist: Inventory, Verification & Billing
  saveMedicine: (
    payload: Omit<Medicine, 'id' | 'medicineId' | 'updatedAt'> & { id?: string }
  ) => ActionResult;
  deleteMedicine: (id: string) => ActionResult;
  adjustMedicineStock: (id: string, delta: number) => ActionResult;
  verifyAndDispensePrescription: (
    prescriptionId: string,
    pharmacistNotes?: string
  ) => ActionResult;
  rejectPrescription: (prescriptionId: string, reason: string) => ActionResult;
  generateBill: (payload: {
    patientId: string;
    prescriptionId?: string;
    items: BillLineItem[];
    paymentMethod?: PaymentMethod;
    paymentStatus?: PaymentStatus;
    paidAmount?: number;
  }) => ActionResult & { bill?: Bill };
  updateBillPayment: (
    billId: string,
    paidAmount: number,
    paymentStatus: PaymentStatus,
    paymentMethod: PaymentMethod
  ) => ActionResult;
}

const HMISContext = createContext<HMISContextValue | undefined>(undefined);

function loadDatabase(): HMISDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as HMISDatabase;
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.patients)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data if storage is corrupted
  }
  const seed = createInitialSeedData();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
}

export const HMISProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<HMISDatabase>(() => loadDatabase());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    } catch {
      // Ignore storage quota errors
    }
  }, [db]);

  const currentUser = db.users.find((u) => u.id === currentUserId && u.status === 'Active') || null;

  const appendLog = useCallback(
    (
      prev: HMISDatabase,
      action: string,
      detail: string,
      actor?: UserAccount | null
    ): ActivityLog[] => {
      const who = actor || currentUser;
      const entry: ActivityLog = {
        id: generateUID('log'),
        timestamp: new Date().toISOString(),
        actorName: who?.name || 'System',
        actorRole: who?.role || 'admin',
        action,
        detail,
      };
      return [entry, ...prev.activityLogs].slice(0, 60);
    },
    [currentUser]
  );

  const login = useCallback(
    (email: string, password: string, role: UserRole): ActionResult => {
      const normalized = email.trim().toLowerCase();
      const user = db.users.find((u) => u.email.toLowerCase() === normalized);
      if (!user) {
        return { ok: false, message: 'No staff account found with that email address.' };
      }
      if (user.password !== password) {
        return { ok: false, message: 'Incorrect password. Please verify and try again.' };
      }
      if (user.role !== role) {
        return {
          ok: false,
          message: `Role mismatch: this account is registered as "${user.role}", not "${role}".`,
        };
      }
      if (user.status !== 'Active') {
        return {
          ok: false,
          message: 'This staff account is currently inactive. Contact an Administrator.',
        };
      }
      localStorage.setItem(SESSION_KEY, user.id);
      setCurrentUserId(user.id);
      setDb((prev) => ({
        ...prev,
        activityLogs: appendLog(prev, 'Staff Sign-In', `${user.name} signed in as ${user.role}.`, user),
      }));
      return { ok: true, message: `Welcome back, ${user.name}.` };
    },
    [db.users, appendLog]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    setCurrentUserId(null);
  }, []);

  const registerNewStaff = useCallback(
    (payload: {
      name: string;
      email: string;
      password: string;
      role: UserRole;
      departmentId: string;
      phone: string;
      qualification?: string;
      specialization?: string;
    }): ActionResult => {
      const emailClean = payload.email.trim().toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === emailClean)) {
        return { ok: false, message: 'An account with this email address already exists.' };
      }
      const staffCode = generatePrefixedCode(
        'STF',
        db.users.map((u) => u.staffCode),
        1001
      );
      const newUser: UserAccount = {
        id: generateUID('usr'),
        staffCode,
        name: payload.name.trim(),
        email: emailClean,
        password: payload.password,
        role: payload.role,
        departmentId: payload.departmentId,
        phone: payload.phone.trim(),
        status: 'Active',
        qualification: payload.qualification?.trim() || '',
        specialization: payload.specialization?.trim() || '',
        consultationFee: payload.role === 'doctor' ? 120 : undefined,
        availabilityStatus: payload.role === 'doctor' ? 'Available' : undefined,
        joinedDate: getTodayISO(),
      };
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, newUser],
        activityLogs: appendLog(
          prev,
          'New Staff Registered',
          `${newUser.name} (${newUser.staffCode}) registered for ${newUser.role} portal.`,
          newUser
        ),
      }));
      return {
        ok: true,
        message: `Staff account ${staffCode} created. You may now sign in.`,
        id: newUser.id,
      };
    },
    [db.users, appendLog]
  );

  const resetDemoDatabase = useCallback(() => {
    const fresh = createInitialSeedData();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    localStorage.removeItem(SESSION_KEY);
    setCurrentUserId(null);
    setDb(fresh);
  }, []);

  const saveStaffMember = useCallback(
    (
      staff: Omit<UserAccount, 'id' | 'staffCode' | 'joinedDate'> & { id?: string }
    ): ActionResult => {
      const emailClean = staff.email.trim().toLowerCase();
      const duplicate = db.users.find(
        (u) => u.email.toLowerCase() === emailClean && u.id !== staff.id
      );
      if (duplicate) {
        return { ok: false, message: 'Another staff account already uses that email address.' };
      }

      if (staff.id) {
        setDb((prev) => ({
          ...prev,
          users: prev.users.map((u) =>
            u.id === staff.id
              ? {
                  ...u,
                  ...staff,
                  email: emailClean,
                  availabilityStatus:
                    staff.role === 'doctor' ? staff.availabilityStatus || u.availabilityStatus || 'Available' : undefined,
                }
              : u
          ),
          activityLogs: appendLog(prev, 'Staff Updated', `Updated profile for ${staff.name}.`),
        }));
        return { ok: true, message: `${staff.name} updated successfully.` };
      }

      const staffCode = generatePrefixedCode(
        'STF',
        db.users.map((u) => u.staffCode),
        1001
      );
      const created: UserAccount = {
        ...staff,
        id: generateUID('usr'),
        staffCode,
        email: emailClean,
        joinedDate: getTodayISO(),
        availabilityStatus: staff.role === 'doctor' ? staff.availabilityStatus || 'Available' : undefined,
      };
      setDb((prev) => ({
        ...prev,
        users: [...prev.users, created],
        activityLogs: appendLog(
          prev,
          'Staff Created',
          `Created ${created.name} (${created.staffCode}) as ${created.role}.`
        ),
      }));
      return { ok: true, message: `Staff member ${created.name} (${staffCode}) created.` };
    },
    [db.users, appendLog]
  );

  const toggleStaffStatus = useCallback(
    (staffId: string) => {
      setDb((prev) => {
        const target = prev.users.find((u) => u.id === staffId);
        if (!target) return prev;
        const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
        return {
          ...prev,
          users: prev.users.map((u) => (u.id === staffId ? { ...u, status: nextStatus } : u)),
          activityLogs: appendLog(
            prev,
            'Staff Status Changed',
            `${target.name} marked as ${nextStatus}.`
          ),
        };
      });
    },
    [appendLog]
  );

  const updateDoctorAvailability = useCallback(
    (doctorId: string, status: AvailabilityStatus) => {
      setDb((prev) => {
        const doc = prev.users.find((u) => u.id === doctorId);
        return {
          ...prev,
          users: prev.users.map((u) =>
            u.id === doctorId ? { ...u, availabilityStatus: status } : u
          ),
          activityLogs: appendLog(
            prev,
            'Doctor Availability Updated',
            `${doc?.name || 'Doctor'} set to ${status}.`
          ),
        };
      });
    },
    [appendLog]
  );

  const deleteStaffMember = useCallback(
    (staffId: string): ActionResult => {
      if (staffId === currentUserId) {
        return { ok: false, message: 'You cannot delete the currently signed-in account.' };
      }
      const target = db.users.find((u) => u.id === staffId);
      setDb((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== staffId),
        schedules: prev.schedules.filter((s) => s.staffId !== staffId),
        activityLogs: appendLog(
          prev,
          'Staff Removed',
          `Removed staff record for ${target?.name || staffId}.`
        ),
      }));
      return { ok: true, message: 'Staff account removed.' };
    },
    [currentUserId, db.users, appendLog]
  );

  const saveDepartment = useCallback(
    (dept: Omit<Department, 'id' | 'code' | 'createdAt'> & { id?: string }): ActionResult => {
      const duplicate = db.departments.find(
        (d) => d.name.toLowerCase() === dept.name.trim().toLowerCase() && d.id !== dept.id
      );
      if (duplicate) {
        return { ok: false, message: 'A department with this name already exists.' };
      }
      if (dept.id) {
        setDb((prev) => ({
          ...prev,
          departments: prev.departments.map((d) =>
            d.id === dept.id ? { ...d, ...dept, name: dept.name.trim() } : d
          ),
          activityLogs: appendLog(prev, 'Department Updated', `Updated department ${dept.name}.`),
        }));
        return { ok: true, message: `Department "${dept.name}" updated.` };
      }

      const code = generatePrefixedCode(
        'DEPT',
        db.departments.map((d) => d.code),
        1
      );
      const created: Department = {
        ...dept,
        id: generateUID('dept'),
        code,
        name: dept.name.trim(),
        createdAt: getTodayISO(),
      };
      setDb((prev) => ({
        ...prev,
        departments: [...prev.departments, created],
        activityLogs: appendLog(
          prev,
          'Department Created',
          `Created department ${created.name} (${created.code}).`
        ),
      }));
      return { ok: true, message: `Department "${created.name}" created.` };
    },
    [db.departments, appendLog]
  );

  const deleteDepartment = useCallback(
    (deptId: string): ActionResult => {
      const assignedStaff = db.users.some((u) => u.departmentId === deptId);
      if (assignedStaff) {
        return {
          ok: false,
          message: 'Reassign staff members from this department before deleting it.',
        };
      }
      const target = db.departments.find((d) => d.id === deptId);
      setDb((prev) => ({
        ...prev,
        departments: prev.departments.filter((d) => d.id !== deptId),
        activityLogs: appendLog(
          prev,
          'Department Deleted',
          `Deleted department ${target?.name || deptId}.`
        ),
      }));
      return { ok: true, message: 'Department deleted.' };
    },
    [db.users, db.departments, appendLog]
  );

  const updateRolePermission = useCallback(
    (role: UserRole, permissionKey: keyof RolePermissionSet['permissions'], value: boolean) => {
      setDb((prev) => ({
        ...prev,
        rolePermissions: prev.rolePermissions.map((rp) =>
          rp.role === role
            ? { ...rp, permissions: { ...rp.permissions, [permissionKey]: value } }
            : rp
        ),
        activityLogs: appendLog(
          prev,
          'Permission Modified',
          `Set ${String(permissionKey)} to ${value ? 'Enabled' : 'Disabled'} for ${role}.`
        ),
      }));
    },
    [appendLog]
  );

  const saveSchedule = useCallback(
    (schedule: Omit<StaffSchedule, 'id'> & { id?: string }): ActionResult => {
      if (schedule.id) {
        setDb((prev) => ({
          ...prev,
          schedules: prev.schedules.map((s) =>
            s.id === schedule.id ? { ...s, ...schedule } : s
          ),
          activityLogs: appendLog(prev, 'Schedule Updated', `Updated shift on ${schedule.shiftDate}.`),
        }));
        return { ok: true, message: 'Shift schedule updated.' };
      }
      const created: StaffSchedule = {
        ...schedule,
        id: generateUID('sch'),
      };
      setDb((prev) => ({
        ...prev,
        schedules: [created, ...prev.schedules],
        activityLogs: appendLog(
          prev,
          'Schedule Added',
          `Assigned ${schedule.shiftType} on ${schedule.shiftDate}.`
        ),
      }));
      return { ok: true, message: 'Shift schedule assigned.' };
    },
    [appendLog]
  );

  const deleteSchedule = useCallback((scheduleId: string) => {
    setDb((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== scheduleId),
    }));
  }, []);

  const registerPatient = useCallback(
    (
      payload: Omit<Patient, 'id' | 'patientId' | 'age' | 'createdAt'>
    ): ActionResult & { patient?: Patient } => {
      const patientId = generateUniquePatientId(db.patients);
      const age = calculateAgeFromDOB(payload.dob);
      const newPatient: Patient = {
        ...payload,
        id: generateUID('pat'),
        patientId,
        age,
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        patients: [newPatient, ...prev.patients],
        activityLogs: appendLog(
          prev,
          'Patient Registered',
          `Registered ${newPatient.fullName} (${newPatient.patientId}) — ${newPatient.registrationType}.`
        ),
      }));
      return {
        ok: true,
        message: `Patient registered with ID ${patientId}.`,
        id: newPatient.id,
        patient: newPatient,
      };
    },
    [db.patients, appendLog]
  );

  const updatePatient = useCallback(
    (id: string, updates: Partial<Patient>): ActionResult => {
      setDb((prev) => ({
        ...prev,
        patients: prev.patients.map((p) => {
          if (p.id !== id) return p;
          const nextDob = updates.dob ?? p.dob;
          return {
            ...p,
            ...updates,
            age: calculateAgeFromDOB(nextDob),
          };
        }),
        activityLogs: appendLog(
          prev,
          'Patient Updated',
          `Updated patient record ${updates.fullName || id}.`
        ),
      }));
      return { ok: true, message: 'Patient details updated.' };
    },
    [appendLog]
  );

  const deletePatient = useCallback(
    (id: string): ActionResult => {
      const target = db.patients.find((p) => p.id === id);
      setDb((prev) => ({
        ...prev,
        patients: prev.patients.filter((p) => p.id !== id),
        appointments: prev.appointments.filter((a) => a.patientId !== id),
        activityLogs: appendLog(
          prev,
          'Patient Record Removed',
          `Deleted patient ${target?.fullName || ''} (${target?.patientId || id}).`
        ),
      }));
      return { ok: true, message: 'Patient record deleted.' };
    },
    [db.patients, appendLog]
  );

  const createAppointment = useCallback(
    (
      payload: Omit<Appointment, 'id' | 'appointmentNo' | 'createdAt' | 'createdBy'>
    ): ActionResult => {
      const doctor = db.users.find((u) => u.id === payload.doctorId);
      if (doctor?.availabilityStatus === 'On Leave' || doctor?.availabilityStatus === 'Off Duty') {
        return {
          ok: false,
          message: `${doctor.name} is currently ${doctor.availabilityStatus}. Please select an available doctor.`,
        };
      }
      const conflict = db.appointments.find(
        (a) =>
          a.doctorId === payload.doctorId &&
          a.date === payload.date &&
          a.timeSlot === payload.timeSlot &&
          a.status !== 'Cancelled'
      );
      if (conflict) {
        return {
          ok: false,
          message: `${doctor?.name || 'Doctor'} already has an appointment at ${payload.timeSlot} on ${payload.date}.`,
        };
      }
      const appointmentNo = generatePrefixedCode(
        'APT',
        db.appointments.map((a) => a.appointmentNo),
        2001
      );
      const patient = db.patients.find((p) => p.id === payload.patientId);
      const created: Appointment = {
        ...payload,
        id: generateUID('apt'),
        appointmentNo,
        createdBy: currentUser?.name || 'Registration Staff',
        createdAt: new Date().toISOString(),
      };
      setDb((prev) => ({
        ...prev,
        appointments: [created, ...prev.appointments],
        activityLogs: appendLog(
          prev,
          'Appointment Scheduled',
          `${appointmentNo}: ${patient?.fullName || 'Patient'} with ${doctor?.name || 'Doctor'} on ${payload.date} at ${payload.timeSlot}.`
        ),
      }));
      return { ok: true, message: `Appointment ${appointmentNo} scheduled.`, id: created.id };
    },
    [db.users, db.appointments, db.patients, currentUser, appendLog]
  );

  const updateAppointmentStatus = useCallback(
    (id: string, status: AppointmentStatus) => {
      setDb((prev) => ({
        ...prev,
        appointments: prev.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
        activityLogs: appendLog(prev, 'Appointment Status', `Updated appointment status to ${status}.`),
      }));
    },
    [appendLog]
  );

  const addMedicalRecord = useCallback(
    (payload: Omit<MedicalRecord, 'id'>): ActionResult & { record?: MedicalRecord } => {
      const record: MedicalRecord = {
        ...payload,
        id: generateUID('mr'),
      };
      const patient = db.patients.find((p) => p.id === payload.patientId);
      setDb((prev) => ({
        ...prev,
        medicalRecords: [record, ...prev.medicalRecords],
        activityLogs: appendLog(
          prev,
          'Diagnosis & Progress Recorded',
          `Added clinical note (${payload.diagnosis}) for ${patient?.fullName || 'patient'}.`
        ),
      }));
      return { ok: true, message: 'Clinical diagnosis and progress saved.', record };
    },
    [db.patients, appendLog]
  );

  const createPrescription = useCallback(
    (
      payload: Omit<Prescription, 'id' | 'prescriptionNo' | 'status'>
    ): ActionResult & { prescription?: Prescription } => {
      if (!payload.items.length) {
        return { ok: false, message: 'Add at least one medicine to the prescription.' };
      }
      const prescriptionNo = generatePrefixedCode(
        'RX',
        db.prescriptions.map((r) => r.prescriptionNo),
        5001
      );
      const prescription: Prescription = {
        ...payload,
        id: generateUID('rx'),
        prescriptionNo,
        status: 'Pending Verification',
      };
      const patient = db.patients.find((p) => p.id === payload.patientId);
      setDb((prev) => ({
        ...prev,
        prescriptions: [prescription, ...prev.prescriptions],
        activityLogs: appendLog(
          prev,
          'Prescription Issued',
          `Issued ${prescriptionNo} (${payload.items.length} items) for ${patient?.fullName || 'patient'}.`
        ),
      }));
      return {
        ok: true,
        message: `Prescription ${prescriptionNo} sent to Clinical Pharmacy.`,
        prescription,
      };
    },
    [db.prescriptions, db.patients, appendLog]
  );

  const requestDiagnosticTest = useCallback(
    (payload: Omit<DiagnosticReport, 'id' | 'reportNo' | 'status'>): ActionResult => {
      const reportNo = generatePrefixedCode(
        'LAB',
        db.diagnosticReports.map((r) => r.reportNo),
        8001
      );
      const created: DiagnosticReport = {
        ...payload,
        id: generateUID('rpt'),
        reportNo,
        status: 'Requested',
      };
      const patient = db.patients.find((p) => p.id === payload.patientId);
      setDb((prev) => ({
        ...prev,
        diagnosticReports: [created, ...prev.diagnosticReports],
        activityLogs: appendLog(
          prev,
          'Diagnostic Test Requested',
          `Ordered ${payload.testName} (${reportNo}) for ${patient?.fullName || 'patient'}.`
        ),
      }));
      return { ok: true, message: `Diagnostic request ${reportNo} created.` };
    },
    [db.diagnosticReports, db.patients, appendLog]
  );

  const updateDiagnosticReport = useCallback(
    (
      id: string,
      updates: Pick<DiagnosticReport, 'status' | 'findings' | 'referenceRange' | 'resultFlag' | 'completedDate'>
    ): ActionResult => {
      setDb((prev) => ({
        ...prev,
        diagnosticReports: prev.diagnosticReports.map((r) =>
          r.id === id ? { ...r, ...updates } : r
        ),
        activityLogs: appendLog(
          prev,
          'Diagnostic Report Updated',
          `Updated diagnostic report status to ${updates.status}.`
        ),
      }));
      return { ok: true, message: 'Diagnostic report updated.' };
    },
    [appendLog]
  );

  const saveMedicine = useCallback(
    (payload: Omit<Medicine, 'id' | 'medicineId' | 'updatedAt'> & { id?: string }): ActionResult => {
      if (payload.availableQuantity < 0 || payload.unitPrice < 0) {
        return { ok: false, message: 'Quantity and unit price must be zero or positive.' };
      }
      if (payload.id) {
        setDb((prev) => ({
          ...prev,
          medicines: prev.medicines.map((m) =>
            m.id === payload.id ? { ...m, ...payload, updatedAt: getTodayISO() } : m
          ),
          activityLogs: appendLog(
            prev,
            'Medicine Updated',
            `Updated inventory for ${payload.name} (Batch ${payload.batchNumber}).`
          ),
        }));
        return { ok: true, message: `Medicine "${payload.name}" updated.` };
      }
      const medicineId = generatePrefixedCode(
        'MED',
        db.medicines.map((m) => m.medicineId),
        1001
      );
      const created: Medicine = {
        ...payload,
        id: generateUID('med'),
        medicineId,
        updatedAt: getTodayISO(),
      };
      setDb((prev) => ({
        ...prev,
        medicines: [created, ...prev.medicines],
        activityLogs: appendLog(
          prev,
          'Medicine Added',
          `Added ${created.name} (${medicineId}) — Qty: ${created.availableQuantity}.`
        ),
      }));
      return { ok: true, message: `Medicine ${created.name} (${medicineId}) added to inventory.` };
    },
    [db.medicines, appendLog]
  );

  const deleteMedicine = useCallback(
    (id: string): ActionResult => {
      const target = db.medicines.find((m) => m.id === id);
      setDb((prev) => ({
        ...prev,
        medicines: prev.medicines.filter((m) => m.id !== id),
        activityLogs: appendLog(
          prev,
          'Medicine Removed',
          `Removed ${target?.name || id} from inventory.`
        ),
      }));
      return { ok: true, message: 'Medicine removed from inventory.' };
    },
    [db.medicines, appendLog]
  );

  const adjustMedicineStock = useCallback(
    (id: string, delta: number): ActionResult => {
      const med = db.medicines.find((m) => m.id === id);
      if (!med) return { ok: false, message: 'Medicine not found.' };
      const nextQty = med.availableQuantity + delta;
      if (nextQty < 0) {
        return { ok: false, message: 'Stock quantity cannot drop below zero.' };
      }
      setDb((prev) => ({
        ...prev,
        medicines: prev.medicines.map((m) =>
          m.id === id ? { ...m, availableQuantity: nextQty, updatedAt: getTodayISO() } : m
        ),
        activityLogs: appendLog(
          prev,
          'Stock Adjusted',
          `${med.name}: ${delta >= 0 ? `+${delta}` : delta} units (New stock: ${nextQty}).`
        ),
      }));
      return { ok: true, message: `Stock updated to ${nextQty} units.` };
    },
    [db.medicines, appendLog]
  );

  const verifyAndDispensePrescription = useCallback(
    (prescriptionId: string, pharmacistNotes?: string): ActionResult => {
      const rx = db.prescriptions.find((r) => r.id === prescriptionId);
      if (!rx) return { ok: false, message: 'Prescription not found.' };
      if (rx.status !== 'Pending Verification') {
        return { ok: false, message: `Prescription is already ${rx.status}.` };
      }

      // Validate stock availability and expiry safety for every item
      for (const item of rx.items) {
        const med = db.medicines.find((m) => m.id === item.medicineId);
        if (!med) {
          return {
            ok: false,
            message: `Medicine "${item.medicineName}" is no longer in the pharmacy inventory.`,
          };
        }
        const expiry = getMedicineExpiryStatus(med.expiryDate);
        if (expiry.status === 'Expired') {
          return {
            ok: false,
            message: `Blocked: "${med.name}" (Batch ${med.batchNumber}) expired on ${med.expiryDate}. Replace stock before dispensing.`,
          };
        }
        if (med.availableQuantity < item.quantityRequested) {
          return {
            ok: false,
            message: `Insufficient stock for "${med.name}": requested ${item.quantityRequested}, available ${med.availableQuantity}.`,
          };
        }
      }

      // Deduct stock and generate invoice automatically if none exists
      const billNo = generatePrefixedCode(
        'INV',
        db.bills.map((b) => b.billNo),
        3001
      );
      const patient = db.patients.find((p) => p.id === rx.patientId);
      const doctor = db.users.find((u) => u.id === rx.doctorId);

      const billItems: BillLineItem[] = [];
      if (doctor?.consultationFee) {
        billItems.push({
          description: `Consultation (${doctor.name})`,
          category: 'Consultation',
          quantity: 1,
          unitPrice: doctor.consultationFee,
          total: doctor.consultationFee,
        });
      }

      rx.items.forEach((item) => {
        const med = db.medicines.find((m) => m.id === item.medicineId)!;
        const lineTotal = Number((med.unitPrice * item.quantityRequested).toFixed(2));
        billItems.push({
          description: `${med.name} (Batch ${med.batchNumber})`,
          category: 'Pharmacy',
          quantity: item.quantityRequested,
          unitPrice: med.unitPrice,
          total: lineTotal,
        });
      });

      const subtotal = Number(billItems.reduce((sum, i) => sum + i.total, 0).toFixed(2));
      const taxAmount = Number((subtotal * 0.05).toFixed(2));
      const grandTotal = Number((subtotal + taxAmount).toFixed(2));

      const newBill: Bill = {
        id: generateUID('bill'),
        billNo,
        patientId: rx.patientId,
        prescriptionId: rx.id,
        items: billItems,
        subtotal,
        taxAmount,
        grandTotal,
        paidAmount: 0,
        paymentStatus: 'Unpaid',
        billDate: getTodayISO(),
        generatedBy: currentUser?.name || 'Pharmacist',
      };

      setDb((prev) => ({
        ...prev,
        medicines: prev.medicines.map((med) => {
          const ordered = rx.items.find((i) => i.medicineId === med.id);
          if (!ordered) return med;
          return {
            ...med,
            availableQuantity: med.availableQuantity - ordered.quantityRequested,
            updatedAt: getTodayISO(),
          };
        }),
        prescriptions: prev.prescriptions.map((p) =>
          p.id === rx.id
            ? {
                ...p,
                status: 'Verified & Dispensed',
                verifiedBy: currentUser?.name || 'Pharmacist',
                verifiedAt: new Date().toISOString(),
                pharmacistNotes: pharmacistNotes?.trim() || '',
              }
            : p
        ),
        bills: [newBill, ...prev.bills],
        activityLogs: appendLog(
          prev,
          'Prescription Dispensed',
          `Verified ${rx.prescriptionNo} for ${patient?.fullName || 'patient'}, deducted stock, and generated ${billNo}.`
        ),
      }));

      return {
        ok: true,
        message: `${rx.prescriptionNo} verified & dispensed. Stock updated and invoice ${billNo} generated.`,
      };
    },
    [db.prescriptions, db.medicines, db.bills, db.patients, db.users, currentUser, appendLog]
  );

  const rejectPrescription = useCallback(
    (prescriptionId: string, reason: string): ActionResult => {
      const rx = db.prescriptions.find((r) => r.id === prescriptionId);
      if (!rx) return { ok: false, message: 'Prescription not found.' };
      setDb((prev) => ({
        ...prev,
        prescriptions: prev.prescriptions.map((p) =>
          p.id === prescriptionId
            ? {
                ...p,
                status: 'Rejected',
                verifiedBy: currentUser?.name || 'Pharmacist',
                verifiedAt: new Date().toISOString(),
                pharmacistNotes: reason.trim() || 'Rejected by pharmacist',
              }
            : p
        ),
        activityLogs: appendLog(
          prev,
          'Prescription Rejected',
          `Rejected ${rx.prescriptionNo}: ${reason.trim() || 'Clarification required'}.`
        ),
      }));
      return { ok: true, message: `${rx.prescriptionNo} marked as Rejected.` };
    },
    [db.prescriptions, currentUser, appendLog]
  );

  const generateBill = useCallback(
    (payload: {
      patientId: string;
      prescriptionId?: string;
      items: BillLineItem[];
      paymentMethod?: PaymentMethod;
      paymentStatus?: PaymentStatus;
      paidAmount?: number;
    }): ActionResult & { bill?: Bill } => {
      if (!payload.items.length) {
        return { ok: false, message: 'Add at least one billable item.' };
      }
      const billNo = generatePrefixedCode(
        'INV',
        db.bills.map((b) => b.billNo),
        3001
      );
      const subtotal = Number(payload.items.reduce((s, i) => s + i.total, 0).toFixed(2));
      const taxAmount = Number((subtotal * 0.05).toFixed(2));
      const grandTotal = Number((subtotal + taxAmount).toFixed(2));
      const status = payload.paymentStatus || 'Unpaid';
      const paid =
        status === 'Paid'
          ? grandTotal
          : status === 'Partial'
          ? Math.min(grandTotal, payload.paidAmount || 0)
          : 0;

      const bill: Bill = {
        id: generateUID('bill'),
        billNo,
        patientId: payload.patientId,
        prescriptionId: payload.prescriptionId,
        items: payload.items,
        subtotal,
        taxAmount,
        grandTotal,
        paidAmount: paid,
        paymentStatus: status,
        paymentMethod: status === 'Unpaid' ? undefined : payload.paymentMethod || 'Cash',
        billDate: getTodayISO(),
        paidDate: status === 'Paid' ? getTodayISO() : undefined,
        generatedBy: currentUser?.name || 'Pharmacist',
      };
      const patient = db.patients.find((p) => p.id === payload.patientId);
      setDb((prev) => ({
        ...prev,
        bills: [bill, ...prev.bills],
        activityLogs: appendLog(
          prev,
          'Invoice Generated',
          `Generated ${billNo} (₹${grandTotal.toFixed(2)}) for ${patient?.fullName || 'patient'}.`
        ),
      }));
      return { ok: true, message: `Bill ${billNo} generated.`, bill };
    },
    [db.bills, db.patients, currentUser, appendLog]
  );

  const updateBillPayment = useCallback(
    (
      billId: string,
      paidAmount: number,
      paymentStatus: PaymentStatus,
      paymentMethod: PaymentMethod
    ): ActionResult => {
      const target = db.bills.find((b) => b.id === billId);
      if (!target) return { ok: false, message: 'Invoice not found.' };
      const finalPaid =
        paymentStatus === 'Paid'
          ? target.grandTotal
          : paymentStatus === 'Unpaid'
          ? 0
          : Math.min(target.grandTotal, Math.max(0, paidAmount));
      setDb((prev) => ({
        ...prev,
        bills: prev.bills.map((b) =>
          b.id === billId
            ? {
                ...b,
                paidAmount: finalPaid,
                paymentStatus,
                paymentMethod: paymentStatus === 'Unpaid' ? undefined : paymentMethod,
                paidDate: paymentStatus === 'Paid' ? getTodayISO() : b.paidDate,
              }
            : b
        ),
        activityLogs: appendLog(
          prev,
          'Payment Updated',
          `${target.billNo} marked ${paymentStatus} via ${paymentMethod}.`
        ),
      }));
      return { ok: true, message: `Invoice ${target.billNo} updated to ${paymentStatus}.` };
    },
    [db.bills, appendLog]
  );

  return (
    <HMISContext.Provider
      value={{
        db,
        currentUser,
        login,
        logout,
        registerNewStaff,
        resetDemoDatabase,
        saveStaffMember,
        toggleStaffStatus,
        updateDoctorAvailability,
        deleteStaffMember,
        saveDepartment,
        deleteDepartment,
        updateRolePermission,
        saveSchedule,
        deleteSchedule,
        registerPatient,
        updatePatient,
        deletePatient,
        createAppointment,
        updateAppointmentStatus,
        addMedicalRecord,
        createPrescription,
        requestDiagnosticTest,
        updateDiagnosticReport,
        saveMedicine,
        deleteMedicine,
        adjustMedicineStock,
        verifyAndDispensePrescription,
        rejectPrescription,
        generateBill,
        updateBillPayment,
      }}
    >
      {children}
    </HMISContext.Provider>
  );
};

export function useHMIS(): HMISContextValue {
  const ctx = useContext(HMISContext);
  if (!ctx) throw new Error('useHMIS must be used within HMISProvider');
  return ctx;
}
