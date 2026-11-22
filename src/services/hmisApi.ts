import {
  Appointment,
  Bill,
  BillLineItem,
  Department,
  DiagnosticReport,
  HMISDatabase,
  MedicalRecord,
  Medicine,
  Patient,
  Prescription,
  StaffSchedule,
  UserAccount,
  UserRole,
} from '../types/hmis';

const API_TIMEOUT_MS = 3500;

export function getApiBaseUrl(): string | null {
  const configured = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (configured) {
    if (configured.toLowerCase() === 'off' || configured.toLowerCase() === 'none') {
      return null;
    }
    return configured.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:8080/api';
  }
  return null;
}

export function toNumericId(id?: string | null): number | null {
  if (!id) return null;
  const trimmed = String(id).trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

function toNullIfBlank(val?: string | null): string | null {
  if (val === undefined || val === null) return null;
  const trimmed = String(val).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function resolveUserName(users: UserAccount[], idOrName: unknown): string {
  if (idOrName === null || idOrName === undefined) return '';
  const str = String(idOrName);
  const found = users.find((u) => u.id === str);
  return found ? found.name : str;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  timeoutMs = 8000
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    throw new ApiError('Backend API is not configured.', 0);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      const message =
        data?.message || `Request failed with status ${res.status}`;
      throw new ApiError(message, res.status, data?.errors);
    }
    return data as T;
  } finally {
    clearTimeout(timer);
  }
}

interface RawBootstrapPayload {
  ok: boolean;
  users?: any[];
  departments?: any[];
  schedules?: any[];
  patients?: any[];
  appointments?: any[];
  medicalRecords?: any[];
  prescriptions?: any[];
  diagnosticReports?: any[];
  medicines?: any[];
  bills?: any[];
}

export function mapUserFromApi(u: any): UserAccount {
  return {
    id: String(u.id),
    staffCode: u.staffCode || '',
    name: u.name || '',
    email: u.email || '',
    password: '',
    role: (u.role || 'registration') as UserRole,
    departmentId: u.departmentId != null ? String(u.departmentId) : '',
    phone: u.phone || '',
    status: (u.status || 'Active') as UserAccount['status'],
    specialization: u.specialization || '',
    qualification: u.qualification || '',
    licenseNumber: u.licenseNumber || '',
    consultationFee: u.consultationFee != null ? Number(u.consultationFee) : undefined,
    availabilityStatus: u.availabilityStatus || undefined,
    joinedDate: u.joinedDate ? String(u.joinedDate) : '',
  };
}

function mapDepartmentFromApi(d: any): Department {
  return {
    id: String(d.id),
    code: d.code || '',
    name: d.name || '',
    headDoctorId: d.headDoctorId != null ? String(d.headDoctorId) : '',
    floor: d.floor || '',
    extension: d.extension || '',
    status: (d.status || 'Active') as Department['status'],
    description: d.description || '',
    createdAt: d.createdAt ? String(d.createdAt).slice(0, 10) : '',
  };
}

function mapScheduleFromApi(s: any): StaffSchedule {
  return {
    id: String(s.id),
    staffId: s.staffId != null ? String(s.staffId) : '',
    departmentId: s.departmentId != null ? String(s.departmentId) : '',
    shiftDate: s.shiftDate ? String(s.shiftDate) : '',
    shiftType: s.shiftType || 'Morning (08:00 - 14:00)',
    station: s.station || '',
    status: s.status || 'Scheduled',
    notes: s.notes || '',
  };
}

function mapPatientFromApi(p: any): Patient {
  return {
    id: String(p.id),
    patientId: p.patientId || '',
    fullName: p.fullName || '',
    dob: p.dob ? String(p.dob) : '',
    age: Number(p.age ?? 0),
    gender: p.gender || 'Other',
    bloodGroup: p.bloodGroup || 'O+',
    maritalStatus: p.maritalStatus || 'Single',
    mobile: p.mobile || '',
    alternatePhone: p.alternatePhone || '',
    email: p.email || '',
    houseNo: p.houseNo || '',
    street: p.street || '',
    city: p.city || '',
    state: p.state || '',
    country: p.country || 'India',
    pinCode: p.pinCode || '',
    emergencyName: p.emergencyName || '',
    emergencyRelation: p.emergencyRelation || '',
    emergencyPhone: p.emergencyPhone || '',
    idProofType: p.idProofType || 'National ID / Aadhaar',
    idProofNumber: p.idProofNumber || '',
    registrationDate: p.registrationDate ? String(p.registrationDate) : '',
    registrationType: p.registrationType || 'Outpatient (OPD)',
    assignedDepartmentId: p.assignedDepartmentId != null ? String(p.assignedDepartmentId) : '',
    assignedDoctorId: p.assignedDoctorId != null ? String(p.assignedDoctorId) : '',
    allergies: p.allergies || '',
    chronicConditions: p.chronicConditions || '',
    createdAt: p.createdAt ? String(p.createdAt) : new Date().toISOString(),
  };
}

function mapAppointmentFromApi(a: any, users: UserAccount[]): Appointment {
  return {
    id: String(a.id),
    appointmentNo: a.appointmentNo || '',
    patientId: a.patientId != null ? String(a.patientId) : '',
    doctorId: a.doctorId != null ? String(a.doctorId) : '',
    departmentId: a.departmentId != null ? String(a.departmentId) : '',
    date: a.appointmentDate ? String(a.appointmentDate) : a.date || '',
    timeSlot: a.timeSlot || '',
    visitType: a.visitType || 'Outpatient (OPD)',
    reason: a.reason || '',
    status: a.status || 'Scheduled',
    createdBy: resolveUserName(users, a.createdBy) || 'Registration Staff',
    createdAt: a.createdAt ? String(a.createdAt) : new Date().toISOString(),
  };
}

function mapMedicalRecordFromApi(m: any): MedicalRecord {
  return {
    id: String(m.id),
    patientId: m.patientId != null ? String(m.patientId) : '',
    doctorId: m.doctorId != null ? String(m.doctorId) : '',
    appointmentId: m.appointmentId != null ? String(m.appointmentId) : undefined,
    visitDate: m.visitDate ? String(m.visitDate) : '',
    chiefComplaint: m.chiefComplaint || '',
    vitals: {
      bp: m.bp || '',
      pulse: m.pulse || '',
      temp: m.temp || '',
      spo2: m.spo2 || '',
    },
    diagnosis: m.diagnosis || '',
    icdCode: m.icdCode || '',
    treatmentPlan: m.treatmentPlan || '',
    clinicalNotes: m.clinicalNotes || '',
    progressStatus: m.progressStatus || 'Under Treatment',
    followUpDate: m.followUpDate ? String(m.followUpDate) : '',
  };
}

function mapPrescriptionFromApi(r: any, users: UserAccount[]): Prescription {
  return {
    id: String(r.id),
    prescriptionNo: r.prescriptionNo || '',
    patientId: r.patientId != null ? String(r.patientId) : '',
    doctorId: r.doctorId != null ? String(r.doctorId) : '',
    medicalRecordId: r.medicalRecordId != null ? String(r.medicalRecordId) : undefined,
    prescribedDate: r.prescribedDate ? String(r.prescribedDate) : '',
    status: r.status || 'Pending Verification',
    verifiedBy: r.verifiedBy != null ? resolveUserName(users, r.verifiedBy) : undefined,
    verifiedAt: r.verifiedAt ? String(r.verifiedAt) : undefined,
    pharmacistNotes: r.pharmacistNotes || '',
    items: Array.isArray(r.items)
      ? r.items.map((it: any) => ({
          medicineId: it.medicineId != null ? String(it.medicineId) : '',
          medicineCode: it.medicineCode || '',
          medicineName: it.medicineName || '',
          dosage: it.dosage || '',
          frequency: it.frequency || '',
          durationDays: Number(it.durationDays ?? 1),
          quantityRequested: Number(it.quantityRequested ?? 1),
          instructions: it.instructions || '',
        }))
      : [],
  };
}

function mapDiagnosticFromApi(d: any): DiagnosticReport {
  return {
    id: String(d.id),
    reportNo: d.reportNo || '',
    patientId: d.patientId != null ? String(d.patientId) : '',
    requestedByDoctorId: d.requestedByDoctorId != null ? String(d.requestedByDoctorId) : '',
    testName: d.testName || '',
    category: d.category || 'Hematology',
    priority: d.priority || 'Routine',
    requestedDate: d.requestedDate ? String(d.requestedDate) : '',
    status: d.status || 'Requested',
    findings: d.findings || undefined,
    referenceRange: d.referenceRange || undefined,
    resultFlag: d.resultFlag || undefined,
    completedDate: d.completedDate ? String(d.completedDate) : undefined,
  };
}

function mapMedicineFromApi(m: any): Medicine {
  return {
    id: String(m.id),
    medicineId: m.medicineId || '',
    name: m.name || '',
    batchNumber: m.batchNumber || '',
    category: m.category || '',
    availableQuantity: Number(m.availableQuantity ?? 0),
    reorderLevel: Number(m.reorderLevel ?? 20),
    unitPrice: Number(m.unitPrice ?? 0),
    expiryDate: m.expiryDate ? String(m.expiryDate) : '',
    supplier: m.supplier || '',
    updatedAt: m.updatedAt ? String(m.updatedAt).slice(0, 10) : '',
  };
}

function mapBillFromApi(b: any, users: UserAccount[]): Bill {
  return {
    id: String(b.id),
    billNo: b.billNo || '',
    patientId: b.patientId != null ? String(b.patientId) : '',
    prescriptionId: b.prescriptionId != null ? String(b.prescriptionId) : undefined,
    items: Array.isArray(b.items)
      ? b.items.map((it: any) => ({
          description: it.description || '',
          category: it.category || 'Pharmacy',
          quantity: Number(it.quantity ?? 1),
          unitPrice: Number(it.unitPrice ?? 0),
          total: Number(it.total ?? 0),
        }))
      : [],
    subtotal: Number(b.subtotal ?? 0),
    taxAmount: Number(b.taxAmount ?? 0),
    grandTotal: Number(b.grandTotal ?? 0),
    paidAmount: Number(b.paidAmount ?? 0),
    paymentStatus: b.paymentStatus || 'Unpaid',
    paymentMethod: b.paymentMethod || undefined,
    billDate: b.billDate ? String(b.billDate) : '',
    paidDate: b.paidDate ? String(b.paidDate) : undefined,
    generatedBy: resolveUserName(users, b.generatedBy) || 'Pharmacist',
  };
}

export const hmisApi = {
  async fetchBootstrap(currentDb: HMISDatabase): Promise<HMISDatabase> {
    const raw = await apiRequest<RawBootstrapPayload>('/bootstrap', { method: 'GET' }, API_TIMEOUT_MS);
    const users = (raw.users || []).map(mapUserFromApi);
    return {
      users,
      departments: (raw.departments || []).map(mapDepartmentFromApi),
      schedules: (raw.schedules || []).map(mapScheduleFromApi),
      patients: (raw.patients || []).map(mapPatientFromApi).reverse(),
      appointments: (raw.appointments || []).map((a) => mapAppointmentFromApi(a, users)).reverse(),
      medicalRecords: (raw.medicalRecords || []).map(mapMedicalRecordFromApi).reverse(),
      prescriptions: (raw.prescriptions || []).map((p) => mapPrescriptionFromApi(p, users)).reverse(),
      diagnosticReports: (raw.diagnosticReports || []).map(mapDiagnosticFromApi).reverse(),
      medicines: (raw.medicines || []).map(mapMedicineFromApi).reverse(),
      bills: (raw.bills || []).map((b) => mapBillFromApi(b, users)).reverse(),
      rolePermissions: currentDb.rolePermissions,
      activityLogs: currentDb.activityLogs,
    };
  },

  async login(email: string, password: string, role: UserRole) {
    const res = await apiRequest<{ ok: boolean; message: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
    });
    return {
      ok: res.ok,
      message: res.message,
      user: mapUserFromApi(res.user),
    };
  },

  async saveStaff(staff: Omit<UserAccount, 'id' | 'staffCode' | 'joinedDate'> & { id?: string }) {
    const numericId = toNumericId(staff.id);
    const payload = {
      id: numericId,
      name: staff.name.trim(),
      email: staff.email.trim().toLowerCase(),
      password: staff.password || undefined,
      role: staff.role,
      departmentId: toNumericId(staff.departmentId),
      phone: staff.phone.trim(),
      status: staff.status || 'Active',
      specialization: toNullIfBlank(staff.specialization),
      qualification: toNullIfBlank(staff.qualification),
      licenseNumber: toNullIfBlank(staff.licenseNumber),
      consultationFee: staff.consultationFee ?? null,
      availabilityStatus: toNullIfBlank(staff.availabilityStatus),
    };
    const saved = await apiRequest<any>('/admin/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapUserFromApi(saved);
  },

  async toggleStaffStatus(id: string) {
    return apiRequest<any>(`/admin/staff/${id}/status`, { method: 'PATCH' });
  },

  async updateDoctorAvailability(id: string, availabilityStatus: string) {
    return apiRequest<any>(`/admin/staff/${id}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ availabilityStatus }),
    });
  },

  async deleteStaff(id: string) {
    return apiRequest<any>(`/admin/staff/${id}`, { method: 'DELETE' });
  },

  async saveDepartment(dept: Omit<Department, 'id' | 'code' | 'createdAt'> & { id?: string }) {
    const payload = {
      id: toNumericId(dept.id),
      name: dept.name.trim(),
      headDoctorId: toNumericId(dept.headDoctorId),
      floor: toNullIfBlank(dept.floor),
      extension: toNullIfBlank(dept.extension),
      status: dept.status || 'Active',
      description: toNullIfBlank(dept.description),
    };
    return apiRequest<any>('/admin/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteDepartment(id: string) {
    return apiRequest<any>(`/admin/departments/${id}`, { method: 'DELETE' });
  },

  async saveSchedule(schedule: Omit<StaffSchedule, 'id'> & { id?: string }) {
    const payload = {
      id: toNumericId(schedule.id),
      staffId: toNumericId(schedule.staffId),
      departmentId: toNumericId(schedule.departmentId),
      shiftDate: schedule.shiftDate,
      shiftType: schedule.shiftType,
      station: toNullIfBlank(schedule.station),
      status: schedule.status || 'Scheduled',
      notes: toNullIfBlank(schedule.notes),
    };
    return apiRequest<any>('/admin/schedules', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async deleteSchedule(id: string) {
    return apiRequest<any>(`/admin/schedules/${id}`, { method: 'DELETE' });
  },

  async registerPatient(payload: Omit<Patient, 'id' | 'patientId' | 'age' | 'createdAt'>) {
    const body = {
      fullName: payload.fullName.trim(),
      dob: payload.dob,
      gender: payload.gender,
      bloodGroup: toNullIfBlank(payload.bloodGroup),
      maritalStatus: toNullIfBlank(payload.maritalStatus),
      mobile: payload.mobile.trim(),
      alternatePhone: toNullIfBlank(payload.alternatePhone),
      email: toNullIfBlank(payload.email),
      houseNo: payload.houseNo.trim(),
      street: payload.street.trim(),
      city: payload.city.trim(),
      state: payload.state.trim(),
      country: payload.country.trim() || 'India',
      pinCode: payload.pinCode.trim(),
      emergencyName: payload.emergencyName.trim(),
      emergencyRelation: payload.emergencyRelation.trim(),
      emergencyPhone: payload.emergencyPhone.trim(),
      idProofType: payload.idProofType,
      idProofNumber: payload.idProofNumber.trim(),
      registrationDate: toNullIfBlank(payload.registrationDate),
      registrationType: toNullIfBlank(payload.registrationType),
      assignedDepartmentId: toNumericId(payload.assignedDepartmentId),
      assignedDoctorId: toNumericId(payload.assignedDoctorId),
      allergies: toNullIfBlank(payload.allergies),
      chronicConditions: toNullIfBlank(payload.chronicConditions),
    };
    return apiRequest<{ ok: boolean; message: string; patient: any }>('/patients', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updatePatient(id: string, fullPatient: Patient) {
    const body = {
      fullName: fullPatient.fullName.trim(),
      dob: fullPatient.dob,
      gender: fullPatient.gender,
      bloodGroup: toNullIfBlank(fullPatient.bloodGroup),
      maritalStatus: toNullIfBlank(fullPatient.maritalStatus),
      mobile: fullPatient.mobile.trim(),
      alternatePhone: toNullIfBlank(fullPatient.alternatePhone),
      email: toNullIfBlank(fullPatient.email),
      houseNo: fullPatient.houseNo.trim(),
      street: fullPatient.street.trim(),
      city: fullPatient.city.trim(),
      state: fullPatient.state.trim(),
      country: fullPatient.country.trim() || 'India',
      pinCode: fullPatient.pinCode.trim(),
      emergencyName: fullPatient.emergencyName.trim(),
      emergencyRelation: fullPatient.emergencyRelation.trim(),
      emergencyPhone: fullPatient.emergencyPhone.trim(),
      idProofType: fullPatient.idProofType,
      idProofNumber: fullPatient.idProofNumber.trim(),
      registrationDate: toNullIfBlank(fullPatient.registrationDate),
      registrationType: toNullIfBlank(fullPatient.registrationType),
      assignedDepartmentId: toNumericId(fullPatient.assignedDepartmentId),
      assignedDoctorId: toNumericId(fullPatient.assignedDoctorId),
      allergies: toNullIfBlank(fullPatient.allergies),
      chronicConditions: toNullIfBlank(fullPatient.chronicConditions),
    };
    return apiRequest<{ ok: boolean; message: string; patient: any }>(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async deletePatient(id: string) {
    return apiRequest<any>(`/patients/${id}`, { method: 'DELETE' });
  },

  async createAppointment(
    payload: Omit<Appointment, 'id' | 'appointmentNo' | 'createdAt' | 'createdBy'>,
    createdById?: string
  ) {
    const body = {
      patientId: toNumericId(payload.patientId),
      doctorId: toNumericId(payload.doctorId),
      departmentId: toNumericId(payload.departmentId),
      appointmentDate: payload.date,
      timeSlot: payload.timeSlot,
      visitType: payload.visitType,
      reason: payload.reason,
      status: payload.status || 'Scheduled',
      createdBy: toNumericId(createdById),
    };
    return apiRequest<any>('/appointments', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateAppointmentStatus(id: string, status: string) {
    return apiRequest<any>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async addMedicalRecord(payload: Omit<MedicalRecord, 'id'>) {
    const body = {
      patientId: toNumericId(payload.patientId),
      doctorId: toNumericId(payload.doctorId),
      appointmentId: toNumericId(payload.appointmentId),
      visitDate: toNullIfBlank(payload.visitDate),
      chiefComplaint: payload.chiefComplaint,
      bp: payload.vitals.bp,
      pulse: payload.vitals.pulse,
      temp: payload.vitals.temp,
      spo2: payload.vitals.spo2,
      diagnosis: payload.diagnosis,
      icdCode: toNullIfBlank(payload.icdCode),
      treatmentPlan: toNullIfBlank(payload.treatmentPlan),
      clinicalNotes: toNullIfBlank(payload.clinicalNotes),
      progressStatus: payload.progressStatus,
      followUpDate: toNullIfBlank(payload.followUpDate),
    };
    return apiRequest<any>('/doctor/records', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async createPrescription(payload: Omit<Prescription, 'id' | 'prescriptionNo' | 'status'>) {
    const body = {
      patientId: toNumericId(payload.patientId),
      doctorId: toNumericId(payload.doctorId),
      medicalRecordId: toNumericId(payload.medicalRecordId),
      prescribedDate: toNullIfBlank(payload.prescribedDate),
      status: 'Pending Verification',
      items: payload.items.map((it) => ({
        medicineId: toNumericId(it.medicineId),
        medicineCode: it.medicineCode,
        medicineName: it.medicineName,
        dosage: it.dosage,
        frequency: it.frequency,
        durationDays: it.durationDays,
        quantityRequested: it.quantityRequested,
        instructions: it.instructions,
      })),
    };
    return apiRequest<any>('/doctor/prescriptions', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async requestDiagnosticTest(payload: Omit<DiagnosticReport, 'id' | 'reportNo' | 'status'>) {
    const body = {
      patientId: toNumericId(payload.patientId),
      requestedByDoctorId: toNumericId(payload.requestedByDoctorId),
      testName: payload.testName,
      category: payload.category,
      priority: payload.priority,
      requestedDate: toNullIfBlank(payload.requestedDate),
      status: 'Requested',
    };
    return apiRequest<any>('/doctor/diagnostics', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateDiagnosticReport(
    id: string,
    updates: Pick<DiagnosticReport, 'status' | 'findings' | 'referenceRange' | 'resultFlag' | 'completedDate'>
  ) {
    return apiRequest<any>(`/doctor/diagnostics/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: updates.status,
        findings: toNullIfBlank(updates.findings),
        referenceRange: toNullIfBlank(updates.referenceRange),
        resultFlag: toNullIfBlank(updates.resultFlag),
        completedDate: toNullIfBlank(updates.completedDate),
      }),
    });
  },

  async saveMedicine(payload: Omit<Medicine, 'id' | 'medicineId' | 'updatedAt'> & { id?: string }) {
    const body = {
      id: toNumericId(payload.id),
      name: payload.name,
      batchNumber: payload.batchNumber,
      category: payload.category,
      availableQuantity: payload.availableQuantity,
      reorderLevel: payload.reorderLevel,
      unitPrice: payload.unitPrice,
      expiryDate: payload.expiryDate,
      supplier: payload.supplier,
    };
    return apiRequest<any>('/pharmacy/medicines', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async deleteMedicine(id: string) {
    return apiRequest<any>(`/pharmacy/medicines/${id}`, { method: 'DELETE' });
  },

  async adjustMedicineStock(id: string, delta: number) {
    return apiRequest<any>(`/pharmacy/medicines/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ delta }),
    });
  },

  async verifyAndDispensePrescription(prescriptionId: string, pharmacistId?: string, notes?: string) {
    return apiRequest<any>(`/pharmacy/prescriptions/${prescriptionId}/verify`, {
      method: 'POST',
      body: JSON.stringify({
        pharmacistId: toNumericId(pharmacistId) ?? 1,
        notes: notes || '',
      }),
    });
  },

  async rejectPrescription(prescriptionId: string, pharmacistId?: string, notes?: string) {
    return apiRequest<any>(`/pharmacy/prescriptions/${prescriptionId}/reject`, {
      method: 'POST',
      body: JSON.stringify({
        pharmacistId: toNumericId(pharmacistId) ?? 1,
        notes: notes || '',
      }),
    });
  },

  async generateBill(payload: {
    patientId: string;
    prescriptionId?: string;
    items: BillLineItem[];
    paymentMethod?: string;
    paymentStatus?: string;
    paidAmount?: number;
    generatedById?: string;
  }) {
    return apiRequest<any>('/pharmacy/bills', {
      method: 'POST',
      body: JSON.stringify({
        patientId: toNumericId(payload.patientId),
        prescriptionId: toNumericId(payload.prescriptionId),
        items: payload.items,
        paymentMethod: payload.paymentMethod || null,
        paymentStatus: payload.paymentStatus || 'Unpaid',
        paidAmount: payload.paidAmount ?? 0,
        generatedBy: toNumericId(payload.generatedById) ?? 1,
      }),
    });
  },

  async updateBillPayment(billId: string, amount: number, method: string) {
    return apiRequest<any>(`/pharmacy/bills/${billId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
  },
};
