export type UserRole = 'admin' | 'registration' | 'doctor' | 'pharmacist';

export type AvailabilityStatus = 'Available' | 'In Consultation' | 'On Leave' | 'Off Duty';

export interface UserAccount {
  id: string;
  staffCode: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  departmentId: string;
  phone: string;
  status: 'Active' | 'Inactive';
  specialization?: string;
  qualification?: string;
  licenseNumber?: string;
  consultationFee?: number;
  availabilityStatus?: AvailabilityStatus;
  joinedDate: string;
}

export interface Department {
  id: string;
  code: string;
  name: string;
  headDoctorId: string;
  floor: string;
  extension: string;
  status: 'Active' | 'Inactive';
  description: string;
  createdAt: string;
}

export interface RolePermissionSet {
  role: UserRole;
  label: string;
  description: string;
  permissions: {
    manageStaff: boolean;
    manageDepartments: boolean;
    manageRoles: boolean;
    manageSchedules: boolean;
    viewHospitalOverview: boolean;
    viewBillingOverview: boolean;
    registerPatients: boolean;
    editDeletePatients: boolean;
    scheduleAppointments: boolean;
    viewClinicalHistory: boolean;
    writeDiagnosisTreatment: boolean;
    prescribeMedicines: boolean;
    requestDiagnosticTests: boolean;
    manageMedicineInventory: boolean;
    verifyDispensePrescriptions: boolean;
    processBillsPayments: boolean;
  };
}

export type ShiftType =
  | 'Morning (08:00 - 14:00)'
  | 'Afternoon (14:00 - 20:00)'
  | 'Night (20:00 - 08:00)';

export interface StaffSchedule {
  id: string;
  staffId: string;
  departmentId: string;
  shiftDate: string;
  shiftType: ShiftType;
  station: string;
  status: 'Scheduled' | 'Active' | 'Completed' | 'On Leave';
  notes?: string;
}

export type Gender = 'Male' | 'Female' | 'Other';
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type MaritalStatus = 'Single' | 'Married' | 'Widowed' | 'Divorced';
export type IDProofType = 'National ID / Aadhaar' | 'Passport' | 'Driving License' | 'Voter ID' | 'Insurance Card';
export type RegistrationType = 'Outpatient (OPD)' | 'Emergency' | 'Inpatient (IPD)' | 'Referral';

export interface Patient {
  id: string;
  patientId: string; // PAT-YYYY-XXXX
  // Section 1: Patient Information
  fullName: string;
  dob: string;
  age: number;
  gender: Gender;
  bloodGroup: BloodGroup;
  maritalStatus: MaritalStatus;
  // Section 2: Contact Information
  mobile: string;
  alternatePhone: string;
  email: string;
  // Section 3: Address Information
  houseNo: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pinCode: string;
  // Section 4: Emergency Contact
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // Section 5: Identification Information
  idProofType: IDProofType;
  idProofNumber: string;
  // Section 6: Registration Information
  registrationDate: string;
  registrationType: RegistrationType;
  assignedDepartmentId: string;
  assignedDoctorId: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: string;
}

export type AppointmentStatus = 'Scheduled' | 'Checked In' | 'In Consultation' | 'Completed' | 'Cancelled';

export interface Appointment {
  id: string;
  appointmentNo: string;
  patientId: string;
  doctorId: string;
  departmentId: string;
  date: string;
  timeSlot: string;
  visitType: RegistrationType;
  reason: string;
  status: AppointmentStatus;
  createdBy: string;
  createdAt: string;
}

export type ProgressStatus =
  | 'Initial Evaluation'
  | 'Under Treatment'
  | 'Improving'
  | 'Stable'
  | 'Recovered'
  | 'Critical';

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId?: string;
  visitDate: string;
  chiefComplaint: string;
  vitals: {
    bp: string;
    pulse: string;
    temp: string;
    spo2: string;
  };
  diagnosis: string;
  icdCode: string;
  treatmentPlan: string;
  clinicalNotes: string;
  progressStatus: ProgressStatus;
  followUpDate: string;
}

export interface PrescriptionItem {
  medicineId: string;
  medicineCode: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantityRequested: number;
  instructions: string;
}

export type PrescriptionStatus =
  | 'Pending Verification'
  | 'Verified & Dispensed'
  | 'Rejected';

export interface Prescription {
  id: string;
  prescriptionNo: string;
  patientId: string;
  doctorId: string;
  medicalRecordId?: string;
  prescribedDate: string;
  items: PrescriptionItem[];
  status: PrescriptionStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  pharmacistNotes?: string;
}

export type DiagnosticCategory = 'Hematology' | 'Biochemistry' | 'Radiology' | 'Microbiology' | 'Cardiology';
export type DiagnosticPriority = 'Routine' | 'Urgent' | 'STAT';
export type DiagnosticStatus = 'Requested' | 'Sample Collected' | 'Completed';
export type ResultFlag = 'Normal' | 'Abnormal' | 'Critical';

export interface DiagnosticReport {
  id: string;
  reportNo: string;
  patientId: string;
  requestedByDoctorId: string;
  testName: string;
  category: DiagnosticCategory;
  priority: DiagnosticPriority;
  requestedDate: string;
  status: DiagnosticStatus;
  findings?: string;
  referenceRange?: string;
  resultFlag?: ResultFlag;
  completedDate?: string;
}

export interface Medicine {
  id: string;
  medicineId: string; // MED-XXXX
  name: string;
  batchNumber: string;
  category: string;
  availableQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  expiryDate: string;
  supplier: string;
  updatedAt: string;
}

export interface BillLineItem {
  description: string;
  category: 'Consultation' | 'Pharmacy' | 'Diagnostic' | 'Service';
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PaymentStatus = 'Unpaid' | 'Partial' | 'Paid';
export type PaymentMethod = 'Cash' | 'Card' | 'Bank Transfer' | 'Insurance';

export interface Bill {
  id: string;
  billNo: string;
  patientId: string;
  prescriptionId?: string;
  items: BillLineItem[];
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  billDate: string;
  paidDate?: string;
  generatedBy: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  detail: string;
}

export interface HMISDatabase {
  users: UserAccount[];
  departments: Department[];
  rolePermissions: RolePermissionSet[];
  schedules: StaffSchedule[];
  patients: Patient[];
  appointments: Appointment[];
  medicalRecords: MedicalRecord[];
  prescriptions: Prescription[];
  diagnosticReports: DiagnosticReport[];
  medicines: Medicine[];
  bills: Bill[];
  activityLogs: ActivityLog[];
}
