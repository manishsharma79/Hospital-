import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, RotateCcw, Save, Search, UserCog } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import {
  BloodGroup,
  Gender,
  IDProofType,
  MaritalStatus,
  Patient,
  RegistrationType,
} from '../../types/hmis';
import { calculateAgeFromDOB, formatDate, getTodayISO } from '../../utils/hmisHelpers';
import {
  PatientFormValues,
  RELATIONSHIP_OPTIONS,
  validatePatientForm,
} from '../../utils/patientValidation';

type EditablePatientFields = PatientFormValues;

function toEditableFields(p: Patient): EditablePatientFields {
  return {
    fullName: p.fullName,
    dob: p.dob,
    gender: p.gender,
    bloodGroup: p.bloodGroup,
    maritalStatus: p.maritalStatus,
    mobile: p.mobile,
    alternatePhone: p.alternatePhone,
    email: p.email,
    houseNo: p.houseNo,
    street: p.street,
    city: p.city,
    state: p.state,
    country: p.country,
    pinCode: p.pinCode,
    emergencyName: p.emergencyName,
    emergencyRelation: p.emergencyRelation,
    emergencyPhone: p.emergencyPhone,
    idProofType: p.idProofType,
    idProofNumber: p.idProofNumber,
    registrationDate: p.registrationDate,
    registrationType: p.registrationType,
    assignedDepartmentId: p.assignedDepartmentId,
    assignedDoctorId: p.assignedDoctorId,
    allergies: p.allergies || '',
    chronicConditions: p.chronicConditions || '',
  };
}

export const UpdatePatientPage: React.FC = () => {
  const { db, updatePatient } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramId = searchParams.get('patientId') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>(paramId || db.patients[0]?.id || '');

  useEffect(() => {
    if (paramId && db.patients.some((p) => p.id === paramId)) {
      setSelectedId(paramId);
    }
  }, [paramId, db.patients]);

  const matchingPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return db.patients;
    return db.patients.filter(
      (p) =>
        p.patientId.toLowerCase().includes(q) ||
        p.fullName.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q)
    );
  }, [db.patients, searchQuery]);

  const selectedPatient = useMemo(
    () => db.patients.find((p) => p.id === selectedId) || matchingPatients[0] || null,
    [db.patients, selectedId, matchingPatients]
  );

  const [form, setForm] = useState<EditablePatientFields | null>(() =>
    selectedPatient ? toEditableFields(selectedPatient) : null
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [savedBanner, setSavedBanner] = useState<string | null>(null);

  useEffect(() => {
    if (selectedPatient) {
      setForm(toEditableFields(selectedPatient));
      setErrors({});
    } else {
      setForm(null);
    }
  }, [selectedPatient]);

  const doctors = useMemo(
    () => db.users.filter((u) => u.role === 'doctor' && u.status === 'Active'),
    [db.users]
  );

  const clinicalDepartments = useMemo(
    () => db.departments.filter((d) => d.status === 'Active'),
    [db.departments]
  );

  const calculatedAge = useMemo(() => (form ? calculateAgeFromDOB(form.dob) : 0), [form]);
  const selectedDoctor = form ? doctors.find((d) => d.id === form.assignedDoctorId) : undefined;

  const isDirty = useMemo(() => {
    if (!selectedPatient || !form) return false;
    const original = toEditableFields(selectedPatient);
    return JSON.stringify(original) !== JSON.stringify(form);
  }, [selectedPatient, form]);

  const handleSelectPatient = (id: string) => {
    setSelectedId(id);
    setSearchParams({ patientId: id });
    setSavedBanner(null);
  };

  const updateField = <K extends keyof EditablePatientFields>(
    field: K,
    value: EditablePatientFields[K]
  ) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !form) return;
    const validation = validatePatientForm(form);
    if (!validation.valid) {
      setErrors(validation.errors);
      showToast('error', validation.summaryMessage, 'Please review the highlighted fields.');
      return;
    }
    setErrors({});
    const payload = {
      ...form,
      fullName: form.fullName.trim(),
      gender: form.gender as Gender,
      idProofType: form.idProofType as IDProofType,
      mobile: form.mobile.trim(),
      alternatePhone: form.alternatePhone.trim(),
      email: form.email.trim(),
      houseNo: form.houseNo.trim(),
      street: form.street.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      country: form.country.trim(),
      pinCode: form.pinCode.trim(),
      emergencyName: form.emergencyName.trim(),
      emergencyRelation: form.emergencyRelation.trim(),
      emergencyPhone: form.emergencyPhone.trim(),
      idProofNumber: form.idProofNumber.trim(),
    };
    const res = updatePatient(selectedPatient.id, payload);
    if (res.ok) {
      const msg = `Updated details for ${payload.fullName} (${selectedPatient.patientId}).`;
      setSavedBanner(msg);
      showToast('success', 'Patient Details Updated', msg);
    }
  };

  const handleRevert = () => {
    if (!selectedPatient) return;
    setForm(toEditableFields(selectedPatient));
    setErrors({});
    setSavedBanner(null);
    showToast('info', 'Changes Discarded', 'Restored last saved patient details.');
  };

  const inputClass = (field: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 ${
      errors[field]
        ? 'border-red-400 focus:border-red-600 focus:ring-red-500/20'
        : 'border-slate-300 focus:border-blue-600 focus:ring-blue-600/20'
    }`;

  return (
    <AppShell
      pageTitle="Update Patient Details"
      breadcrumb="HMIS / Registration / Update Patient Record"
    >
      <div className="space-y-6">
        {/* Patient Lookup & Selection Card */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2942]/10 text-[#0F2942]">
                <UserCog className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Select Patient to Update</h2>
                <p className="text-xs text-slate-500">
                  Search by Patient ID, full name, or mobile number to load and modify records.
                </p>
              </div>
            </div>
            {selectedPatient && (
              <div className="text-xs text-slate-600 font-mono">
                Active Record:{' '}
                <span className="font-bold text-[#0F2942]">{selectedPatient.patientId}</span> ·
                Registered {formatDate(selectedPatient.registrationDate)}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter patient list by ID, name, or mobile..."
                className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
              />
            </div>

            <select
              value={selectedPatient?.id || ''}
              onChange={(e) => handleSelectPatient(e.target.value)}
              aria-label="Choose patient record"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
            >
              {matchingPatients.length === 0 ? (
                <option value="">No patients match your search</option>
              ) : (
                matchingPatients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patientId} — {p.fullName} ({p.mobile})
                  </option>
                ))
              )}
            </select>
          </div>
        </section>

        {savedBanner && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{savedBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/registration/patients')}
              className="text-xs font-semibold text-emerald-800 underline whitespace-nowrap"
            >
              View Patient Directory
            </button>
          </div>
        )}

        {!selectedPatient || !form ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No matching patient found. Clear your search filter or register a new patient first.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {Object.keys(errors).length > 0 && (
              <div
                role="alert"
                className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
              >
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                <span>{validatePatientForm(form).summaryMessage}</span>
              </div>
            )}
            {/* Section 1: Patient Information */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-200 pb-3 mb-5 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#0F2942]">
                    Section 1: Patient Information
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update demographic details; age recalculates automatically from DOB.
                  </p>
                </div>
                {isDirty && <StatusBadge label="Unsaved Changes" tone="warning" />}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className={inputClass('fullName')}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    max={getTodayISO()}
                    value={form.dob}
                    onChange={(e) => updateField('dob', e.target.value)}
                    className={inputClass('dob')}
                  />
                  {errors.dob && <p className="mt-1 text-xs text-red-600">{errors.dob}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calculated Age
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={form.dob ? `${calculatedAge} yrs` : '—'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-mono font-semibold text-slate-800 tabular-nums"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => updateField('gender', e.target.value as Gender | '')}
                    className={inputClass('gender')}
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Blood Group *
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, bloodGroup: e.target.value as BloodGroup })
                    }
                    className={inputClass('bloodGroup')}
                  >
                    {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as BloodGroup[]).map(
                      (bg) => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    value={form.maritalStatus}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, maritalStatus: e.target.value as MaritalStatus })
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
                    value={form.allergies || ''}
                    onChange={(e) => setForm((f) => f && { ...f, allergies: e.target.value })}
                    className={inputClass('allergies')}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Chronic Conditions
                  </label>
                  <input
                    type="text"
                    value={form.chronicConditions || ''}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, chronicConditions: e.target.value })
                    }
                    className={inputClass('chronicConditions')}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Contact Information */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-200 pb-3 mb-5">
                <h3 className="text-base font-bold text-[#0F2942]">
                  Section 2: Contact Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => updateField('mobile', e.target.value)}
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
                    onChange={(e) => updateField('alternatePhone', e.target.value)}
                    className={inputClass('alternatePhone')}
                  />
                  {errors.alternatePhone && (
                    <p className="mt-1 text-xs text-red-600">{errors.alternatePhone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={inputClass('email')}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </div>
              </div>
            </section>

            {/* Section 3: Address Information */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-200 pb-3 mb-5">
                <h3 className="text-base font-bold text-[#0F2942]">
                  Section 3: Address Information
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    House / Flat Number *
                  </label>
                  <input
                    type="text"
                    value={form.houseNo}
                    onChange={(e) => updateField('houseNo', e.target.value)}
                    className={inputClass('houseNo')}
                  />
                  {errors.houseNo && <p className="mt-1 text-xs text-red-600">{errors.houseNo}</p>}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Street / Locality *
                  </label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => updateField('street', e.target.value)}
                    className={inputClass('street')}
                  />
                  {errors.street && <p className="mt-1 text-xs text-red-600">{errors.street}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
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
                    onChange={(e) => updateField('state', e.target.value)}
                    className={inputClass('state')}
                  />
                  {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={form.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className={inputClass('country')}
                  />
                  {errors.country && <p className="mt-1 text-xs text-red-600">{errors.country}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={form.pinCode}
                    onChange={(e) => updateField('pinCode', e.target.value)}
                    className={`${inputClass('pinCode')} font-mono`}
                  />
                  {errors.pinCode && <p className="mt-1 text-xs text-red-600">{errors.pinCode}</p>}
                </div>
              </div>
            </section>

            {/* Section 4 & 5 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h3 className="text-base font-bold text-[#0F2942]">
                    Section 4: Emergency Contact
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      value={form.emergencyName}
                      onChange={(e) => updateField('emergencyName', e.target.value)}
                      className={inputClass('emergencyName')}
                    />
                    {errors.emergencyName && (
                      <p className="mt-1 text-xs text-red-600">{errors.emergencyName}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Relationship *
                      </label>
                      <select
                        value={form.emergencyRelation}
                        onChange={(e) => updateField('emergencyRelation', e.target.value)}
                        className={inputClass('emergencyRelation')}
                      >
                        <option value="">Select relationship</option>
                        {RELATIONSHIP_OPTIONS.map((rel) => (
                          <option key={rel} value={rel}>
                            {rel}
                          </option>
                        ))}
                        {form.emergencyRelation &&
                          !RELATIONSHIP_OPTIONS.includes(
                            form.emergencyRelation as (typeof RELATIONSHIP_OPTIONS)[number]
                          ) && (
                            <option value={form.emergencyRelation}>{form.emergencyRelation}</option>
                          )}
                      </select>
                      {errors.emergencyRelation && (
                        <p className="mt-1 text-xs text-red-600">{errors.emergencyRelation}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Emergency Phone *
                      </label>
                      <input
                        type="tel"
                        value={form.emergencyPhone}
                        onChange={(e) => updateField('emergencyPhone', e.target.value)}
                        className={inputClass('emergencyPhone')}
                      />
                      {errors.emergencyPhone && (
                        <p className="mt-1 text-xs text-red-600">{errors.emergencyPhone}</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="border-b border-slate-200 pb-3 mb-5">
                  <h3 className="text-base font-bold text-[#0F2942]">
                    Section 5: Identification Information
                  </h3>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Proof Type *
                    </label>
                    <select
                      value={form.idProofType}
                      onChange={(e) => updateField('idProofType', e.target.value as IDProofType | '')}
                      className={inputClass('idProofType')}
                    >
                      <option value="">Select ID type</option>
                      <option value="National ID / Aadhaar">National ID / Aadhaar</option>
                      <option value="Passport">Passport</option>
                      <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option>
                      <option value="Insurance Card">Insurance Card</option>
                    </select>
                    {errors.idProofType && (
                      <p className="mt-1 text-xs text-red-600">{errors.idProofType}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      ID Proof Number *
                    </label>
                    <input
                      type="text"
                      value={form.idProofNumber}
                      onChange={(e) => updateField('idProofNumber', e.target.value)}
                      className={`${inputClass('idProofNumber')} font-mono`}
                    />
                    {errors.idProofNumber && (
                      <p className="mt-1 text-xs text-red-600">{errors.idProofNumber}</p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Section 6: Registration & Assignment */}
            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="border-b border-slate-200 pb-3 mb-5">
                <h3 className="text-base font-bold text-[#0F2942]">
                  Section 6: Registration &amp; Clinical Assignment
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Patient ID (Permanent)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={selectedPatient.patientId}
                    className="w-full rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-sm font-mono font-bold text-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Date
                  </label>
                  <input
                    type="date"
                    value={form.registrationDate}
                    onChange={(e) =>
                      setForm((f) => f && { ...f, registrationDate: e.target.value })
                    }
                    className={inputClass('registrationDate')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registration Type
                  </label>
                  <select
                    value={form.registrationType}
                    onChange={(e) =>
                      setForm(
                        (f) => f && { ...f, registrationType: e.target.value as RegistrationType }
                      )
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
                    onChange={(e) =>
                      setForm((f) => f && { ...f, assignedDepartmentId: e.target.value })
                    }
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
                    onChange={(e) =>
                      setForm((f) => f && { ...f, assignedDoctorId: e.target.value })
                    }
                    className={inputClass('assignedDoctorId')}
                  >
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.name} — {doc.specialization || 'Consultant'} (
                        {doc.availabilityStatus || 'Available'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {/* Footer Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white px-6 py-4 shadow-xs">
              <button
                type="button"
                onClick={() => navigate('/registration/patients')}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap"
              >
                Back to Directory
              </button>
              <button
                type="button"
                disabled={!isDirty}
                onClick={handleRevert}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Discard Changes
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-5 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
              >
                <Save className="h-4 w-4" />
                Update Patient Details
              </button>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
};
