import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, UserPlus, X } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import {
  BloodGroup,
  Gender,
  IDProofType,
  MaritalStatus,
  RegistrationType,
} from '../../types/hmis';
import {
  calculateAgeFromDOB,
  generateUniquePatientId,
  getTodayISO,
} from '../../utils/hmisHelpers';

interface PatientFormState {
  // Section 1: Patient Information
  fullName: string;
  dob: string;
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
  allergies: string;
  chronicConditions: string;
}

export const PatientRegistrationPage: React.FC = () => {
  const { db, registerPatient, updatePatient } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const editingPatient = useMemo(
    () => (editId ? db.patients.find((p) => p.id === editId) : undefined),
    [editId, db.patients]
  );

  const doctors = useMemo(
    () => db.users.filter((u) => u.role === 'doctor' && u.status === 'Active'),
    [db.users]
  );

  const clinicalDepartments = useMemo(
    () => db.departments.filter((d) => d.status === 'Active'),
    [db.departments]
  );

  const buildInitialForm = (): PatientFormState => ({
    fullName: '',
    dob: '',
    gender: 'Male',
    bloodGroup: 'O+',
    maritalStatus: 'Single',
    mobile: '',
    alternatePhone: '',
    email: '',
    houseNo: '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    pinCode: '',
    emergencyName: '',
    emergencyRelation: 'Spouse',
    emergencyPhone: '',
    idProofType: 'National ID / Aadhaar',
    idProofNumber: '',
    registrationDate: getTodayISO(),
    registrationType: 'Outpatient (OPD)',
    assignedDepartmentId: clinicalDepartments[0]?.id || '',
    assignedDoctorId: doctors[0]?.id || '',
    allergies: '',
    chronicConditions: '',
  });

  const [form, setForm] = useState<PatientFormState>(buildInitialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingPatient) {
      setForm({
        fullName: editingPatient.fullName,
        dob: editingPatient.dob,
        gender: editingPatient.gender,
        bloodGroup: editingPatient.bloodGroup,
        maritalStatus: editingPatient.maritalStatus,
        mobile: editingPatient.mobile,
        alternatePhone: editingPatient.alternatePhone,
        email: editingPatient.email,
        houseNo: editingPatient.houseNo,
        street: editingPatient.street,
        city: editingPatient.city,
        state: editingPatient.state,
        country: editingPatient.country,
        pinCode: editingPatient.pinCode,
        emergencyName: editingPatient.emergencyName,
        emergencyRelation: editingPatient.emergencyRelation,
        emergencyPhone: editingPatient.emergencyPhone,
        idProofType: editingPatient.idProofType,
        idProofNumber: editingPatient.idProofNumber,
        registrationDate: editingPatient.registrationDate,
        registrationType: editingPatient.registrationType,
        assignedDepartmentId: editingPatient.assignedDepartmentId,
        assignedDoctorId: editingPatient.assignedDoctorId,
        allergies: editingPatient.allergies || '',
        chronicConditions: editingPatient.chronicConditions || '',
      });
    }
  }, [editingPatient]);

  const calculatedAge = useMemo(() => calculateAgeFromDOB(form.dob), [form.dob]);
  const previewPatientId = useMemo(
    () => (editingPatient ? editingPatient.patientId : generateUniquePatientId(db.patients)),
    [editingPatient, db.patients]
  );

  const selectedDoctor = doctors.find((d) => d.id === form.assignedDoctorId);

  const validate = (): boolean => {
    const nextErrors: Record<string, string> = {};
    if (!form.fullName.trim()) nextErrors.fullName = 'Full name is required.';
    if (!form.dob) nextErrors.dob = 'Date of birth is required.';
    if (form.dob && new Date(form.dob) > new Date()) {
      nextErrors.dob = 'Date of birth cannot be in the future.';
    }
    if (!form.mobile.trim() || form.mobile.trim().length < 7) {
      nextErrors.mobile = 'Valid mobile number is required.';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!form.city.trim()) nextErrors.city = 'City is required.';
    if (!form.state.trim()) nextErrors.state = 'State / UT is required.';
    if (!form.country.trim()) nextErrors.country = 'Country is required.';
    if (!form.pinCode.trim()) nextErrors.pinCode = 'PIN / Postal code is required.';
    if (!form.emergencyName.trim()) nextErrors.emergencyName = 'Emergency contact name is required.';
    if (!form.emergencyPhone.trim()) nextErrors.emergencyPhone = 'Emergency phone is required.';
    if (!form.idProofNumber.trim()) nextErrors.idProofNumber = 'ID proof number is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('error', 'Incomplete Registration', 'Please review the highlighted fields.');
      return;
    }

    if (editingPatient) {
      const res = updatePatient(editingPatient.id, form);
      if (res.ok) {
        showToast('success', 'Patient Updated', `${form.fullName} (${editingPatient.patientId}) saved.`);
        navigate('/registration/patients');
      }
      return;
    }

    const res = registerPatient(form);
    if (res.ok) {
      showToast('success', 'Patient Registered', res.message);
      navigate('/registration/patients');
    }
  };

  const handleReset = () => {
    setForm(buildInitialForm());
    setErrors({});
    showToast('info', 'Form Cleared', 'All registration fields have been reset.');
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-400 focus:border-red-600 focus:ring-red-500/20'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
    }`;

  return (
    <AppShell
      pageTitle={editingPatient ? `Edit Patient · ${editingPatient.patientId}` : 'New Patient Registration'}
      breadcrumb="HMIS / Registration / Patient Intake Form"
    >
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Section 1: Patient Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-[#0F2942]">
              Section 1: Patient Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Core demographic profile and automatically calculated patient age.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Patient legal full name"
                className={inputClass('fullName')}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                max={getTodayISO()}
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className={inputClass('dob')}
              />
              {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Calculated Age (Years)
              </label>
              <input
                type="text"
                readOnly
                value={form.dob ? `${calculatedAge} yrs` : 'Enter DOB'}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold text-slate-800 tabular-nums"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
              <select
                value={form.gender}
                onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Gender }))}
                className={inputClass('gender')}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group *
              </label>
              <select
                value={form.bloodGroup}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bloodGroup: e.target.value as BloodGroup }))
                }
                className={inputClass('bloodGroup')}
              >
                {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Marital Status
              </label>
              <select
                value={form.maritalStatus}
                onChange={(e) =>
                  setForm((f) => ({ ...f, maritalStatus: e.target.value as MaritalStatus }))
                }
                className={inputClass('maritalStatus')}
              >
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Widowed">Widowed</option>
                <option value="Divorced">Divorced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Known Allergies
              </label>
              <input
                type="text"
                value={form.allergies}
                onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))}
                placeholder="e.g. Penicillin, Latex, None"
                className={inputClass('allergies')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chronic Conditions
              </label>
              <input
                type="text"
                value={form.chronicConditions}
                onChange={(e) => setForm((f) => ({ ...f, chronicConditions: e.target.value }))}
                placeholder="e.g. Hypertension, Diabetes"
                className={inputClass('chronicConditions')}
              />
            </div>
          </div>
        </section>

        {/* Section 2: Contact Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-[#0F2942]">
              Section 2: Contact Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Primary and alternate communication channels for appointment notifications.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                value={form.mobile}
                onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
                placeholder="+91 98201-44510"
                className={inputClass('mobile')}
              />
              {errors.mobile && <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Alternate Phone Number
              </label>
              <input
                type="tel"
                value={form.alternatePhone}
                onChange={(e) => setForm((f) => ({ ...f, alternatePhone: e.target.value }))}
                placeholder="Optional landline or secondary"
                className={inputClass('alternatePhone')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="patient@example.in"
                className={inputClass('email')}
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>
          </div>
        </section>

        {/* Section 3: Address Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-[#0F2942]">
              Section 3: Address Information
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Residential location details for billing and dispatch records.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                House / Flat Number
              </label>
              <input
                type="text"
                value={form.houseNo}
                onChange={(e) => setForm((f) => ({ ...f, houseNo: e.target.value }))}
                placeholder="e.g. Flat 402 / H.No. 14"
                className={inputClass('houseNo')}
              />
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Street / Locality
              </label>
              <input
                type="text"
                value={form.street}
                onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
                placeholder="e.g. MG Road, Indiranagar"
                className={inputClass('street')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                placeholder="e.g. Bengaluru"
                className={inputClass('city')}
              />
              {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                State / Union Territory *
              </label>
              <input
                type="text"
                value={form.state}
                onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
                placeholder="e.g. Karnataka"
                className={inputClass('state')}
              />
              {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Country *</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                placeholder="Country"
                className={inputClass('country')}
              />
              {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">PIN Code *</label>
              <input
                type="text"
                value={form.pinCode}
                onChange={(e) => setForm((f) => ({ ...f, pinCode: e.target.value }))}
                placeholder="e.g. 560038"
                className={`${inputClass('pinCode')} font-mono`}
              />
              {errors.pinCode && <p className="mt-1 text-xs text-red-600">{errors.pinCode}</p>}
            </div>
          </div>
        </section>

        {/* Section 4 & Section 5 side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 4: Emergency Contact */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="border-b border-slate-200 pb-3 mb-5">
              <h2 className="text-base font-bold text-[#0F2942]">
                Section 4: Emergency Contact
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Next-of-kin or designated emergency representative.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency Contact Name *
                </label>
                <input
                  type="text"
                  value={form.emergencyName}
                  onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
                  placeholder="Full name of contact"
                  className={inputClass('emergencyName')}
                />
                {errors.emergencyName && (
                  <p className="mt-1 text-xs text-red-600">{errors.emergencyName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relationship with Patient *
                  </label>
                  <input
                    type="text"
                    value={form.emergencyRelation}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyRelation: e.target.value }))}
                    placeholder="e.g. Spouse, Parent"
                    className={inputClass('emergencyRelation')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Emergency Contact Number *
                  </label>
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                    placeholder="+91 98200-00123"
                    className={inputClass('emergencyPhone')}
                  />
                  {errors.emergencyPhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.emergencyPhone}</p>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Identification Information */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="border-b border-slate-200 pb-3 mb-5">
              <h2 className="text-base font-bold text-[#0F2942]">
                Section 5: Identification Information
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Government-issued or insurance identity verification details.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Proof Type *
                </label>
                <select
                  value={form.idProofType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, idProofType: e.target.value as IDProofType }))
                  }
                  className={inputClass('idProofType')}
                >
                  <option value="National ID / Aadhaar">National ID / Aadhaar</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Insurance Card">Insurance Card</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Proof Number *
                </label>
                <input
                  type="text"
                  value={form.idProofNumber}
                  onChange={(e) => setForm((f) => ({ ...f, idProofNumber: e.target.value }))}
                  placeholder="Enter document number"
                  className={`${inputClass('idProofNumber')} font-mono`}
                />
                {errors.idProofNumber && (
                  <p className="mt-1 text-xs text-red-600">{errors.idProofNumber}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Section 6: Registration Information */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-[#0F2942]">
              Section 6: Registration Information &amp; Clinical Assignment
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Unique Patient ID generation, registration classification, and doctor routing.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Automatically Generated Patient ID
              </label>
              <input
                type="text"
                readOnly
                value={previewPatientId}
                className="w-full rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm font-mono font-bold text-[#0F2942]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration Date *
              </label>
              <input
                type="date"
                value={form.registrationDate}
                onChange={(e) => setForm((f) => ({ ...f, registrationDate: e.target.value }))}
                className={inputClass('registrationDate')}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registration Type *
              </label>
              <select
                value={form.registrationType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, registrationType: e.target.value as RegistrationType }))
                }
                className={inputClass('registrationType')}
              >
                <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                <option value="Emergency">Emergency</option>
                <option value="Inpatient (IPD)">Inpatient (IPD)</option>
                <option value="Referral">Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Department
              </label>
              <select
                value={form.assignedDepartmentId}
                onChange={(e) => {
                  const deptId = e.target.value;
                  const matchingDoc = doctors.find((d) => d.departmentId === deptId);
                  setForm((f) => ({
                    ...f,
                    assignedDepartmentId: deptId,
                    assignedDoctorId: matchingDoc ? matchingDoc.id : f.assignedDoctorId,
                  }));
                }}
                className={inputClass('assignedDepartmentId')}
              >
                {clinicalDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Assigned Doctor
                </label>
                {selectedDoctor && (
                  <StatusBadge label={selectedDoctor.availabilityStatus || 'Available'} />
                )}
              </div>
              <select
                value={form.assignedDoctorId}
                onChange={(e) => setForm((f) => ({ ...f, assignedDoctorId: e.target.value }))}
                className={inputClass('assignedDoctorId')}
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} — {doc.specialization || 'Consultant'} ({doc.availabilityStatus || 'Available'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Form Action Bar */}
        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-xs">
          <button
            type="button"
            onClick={() => navigate('/registration/patients')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
          >
            <RotateCcw className="h-4 w-4" />
            Reset / Clear
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            {editingPatient ? 'Update Patient Record' : 'Register Patient'}
          </button>
        </div>
      </form>
    </AppShell>
  );
};
