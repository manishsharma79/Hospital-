import {
  BloodGroup,
  Gender,
  IDProofType,
  MaritalStatus,
  RegistrationType,
} from '../types/hmis';
import { getTodayISO } from './hmisHelpers';

export interface PatientFormValues {
  // Section 1: Patient Information
  fullName: string;
  dob: string;
  gender: Gender | '';
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
  idProofType: IDProofType | '';
  idProofNumber: string;
  // Section 6: Registration Information
  registrationDate: string;
  registrationType: RegistrationType;
  assignedDepartmentId: string;
  assignedDoctorId: string;
  allergies: string;
  chronicConditions: string;
}

export const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Father',
  'Mother',
  'Child',
  'Son',
  'Daughter',
  'Sibling',
  'Brother',
  'Sister',
  'Guardian',
  'Friend',
  'Other',
] as const;

export function isValidPhoneNumber(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  if (!/^[+\d\s()-]+$/.test(trimmed)) return false;
  let digits = trimmed.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return /^\d{10}$/.test(digits);
}

export function isValidPersonName(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  return /^[A-Za-z][A-Za-z\s.'-]{1,}$/.test(trimmed);
}

export interface PatientValidationResult {
  valid: boolean;
  errors: Record<string, string>;
  hasMissingRequired: boolean;
  summaryMessage: string;
}

export function validatePatientForm(
  form: PatientFormValues,
  todayISO: string = getTodayISO()
): PatientValidationResult {
  const errors: Record<string, string> = {};
  let hasMissingRequired = false;

  // 1. Name
  const name = form.fullName.trim();
  if (!name) {
    errors.fullName = 'Name required';
    hasMissingRequired = true;
  } else if (!isValidPersonName(name)) {
    errors.fullName = 'Invalid name';
  }

  // 2. Date of Birth
  const dob = form.dob.trim();
  if (!dob) {
    errors.dob = 'DOB required';
    hasMissingRequired = true;
  } else {
    const year = Number(dob.slice(0, 4));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(year) || year < 1900 || dob > todayISO) {
      errors.dob = 'Invalid DOB';
    }
  }

  // 3. Gender
  if (!form.gender) {
    errors.gender = 'Gender required';
    hasMissingRequired = true;
  }

  // 4. Mobile Number
  const mobile = form.mobile.trim();
  if (!mobile) {
    errors.mobile = 'Mobile required';
    hasMissingRequired = true;
  } else if (!isValidPhoneNumber(mobile)) {
    errors.mobile = 'Invalid mobile';
  }

  // Optional Alternate Phone
  if (form.alternatePhone.trim() && !isValidPhoneNumber(form.alternatePhone)) {
    errors.alternatePhone = 'Invalid alternate phone';
  }

  // 5. Email (optional unless provided)
  const email = form.email.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email';
  }

  // 6. Address fields
  if (!form.houseNo.trim()) {
    errors.houseNo = 'House No. required';
    hasMissingRequired = true;
  }

  if (!form.street.trim()) {
    errors.street = 'Street required';
    hasMissingRequired = true;
  }

  if (!form.city.trim()) {
    errors.city = 'City required';
    hasMissingRequired = true;
  }

  if (!form.state.trim()) {
    errors.state = 'State required';
    hasMissingRequired = true;
  }

  if (!form.country.trim()) {
    errors.country = 'Country required';
    hasMissingRequired = true;
  }

  const pin = form.pinCode.trim();
  if (!pin) {
    errors.pinCode = 'PIN required';
    hasMissingRequired = true;
  } else if (!/^\d{6}$/.test(pin)) {
    errors.pinCode = 'Invalid PIN';
  }

  // 7. Emergency Contact
  const emergencyName = form.emergencyName.trim();
  if (!emergencyName) {
    errors.emergencyName = 'Emergency name required';
    hasMissingRequired = true;
  } else if (!isValidPersonName(emergencyName)) {
    errors.emergencyName = 'Invalid emergency name';
  }

  if (!form.emergencyRelation.trim()) {
    errors.emergencyRelation = 'Relationship required';
    hasMissingRequired = true;
  }

  const emergencyPhone = form.emergencyPhone.trim();
  if (!emergencyPhone) {
    errors.emergencyPhone = 'Emergency number required';
    hasMissingRequired = true;
  } else if (!isValidPhoneNumber(emergencyPhone)) {
    errors.emergencyPhone = 'Invalid emergency number';
  }

  // 8. Identification Information
  if (!form.idProofType) {
    errors.idProofType = 'ID proof required';
    hasMissingRequired = true;
  }

  if (!form.idProofNumber.trim()) {
    errors.idProofNumber = 'ID number required';
    hasMissingRequired = true;
  }

  // 9. Registration Date
  if (!form.registrationDate.trim()) {
    errors.registrationDate = 'Registration date required';
    hasMissingRequired = true;
  }

  const valid = Object.keys(errors).length === 0;
  const summaryMessage = valid
    ? 'Patient registered successfully'
    : hasMissingRequired
    ? 'Please fill required fields'
    : 'Please review the highlighted invalid fields';

  return {
    valid,
    errors,
    hasMissingRequired,
    summaryMessage,
  };
}
