import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FlaskConical, Pill, Plus, Stethoscope, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import {
  DiagnosticCategory,
  DiagnosticPriority,
  PrescriptionItem,
  ProgressStatus,
} from '../../types/hmis';
import { formatDate, getMedicineExpiryStatus, getTodayISO } from '../../utils/hmisHelpers';

export const DiagnosisTreatmentPage: React.FC = () => {
  const { db, currentUser, addMedicalRecord, createPrescription, requestDiagnosticTest } =
    useHMIS();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const initialPat = searchParams.get('patientId') || db.patients[0]?.id || '';

  const [patientId, setPatientId] = useState(initialPat);
  const [visitDate, setVisitDate] = useState(getTodayISO());
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [vitals, setVitals] = useState({
    bp: '120/80 mmHg',
    pulse: '74 bpm',
    temp: '98.6 °F',
    spo2: '99%',
  });
  const [diagnosis, setDiagnosis] = useState('');
  const [icdCode, setIcdCode] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [progressStatus, setProgressStatus] = useState<ProgressStatus>('Under Treatment');
  const [followUpDate, setFollowUpDate] = useState('');

  // Quick Prescription Draft
  const [rxItems, setRxItems] = useState<PrescriptionItem[]>([]);
  const [draftMedId, setDraftMedId] = useState(db.medicines[0]?.id || '');
  const [draftDosage, setDraftDosage] = useState('1 tablet');
  const [draftFreq, setDraftFreq] = useState('Twice daily');
  const [draftDays, setDraftDays] = useState(7);
  const [draftQty, setDraftQty] = useState(14);
  const [draftInstr, setDraftInstr] = useState('Take after meals');

  // Quick Lab Order Draft
  const [labTestName, setLabTestName] = useState('');
  const [labCategory, setLabCategory] = useState<DiagnosticCategory>('Biochemistry');
  const [labPriority, setLabPriority] = useState<DiagnosticPriority>('Routine');

  useEffect(() => {
    const paramId = searchParams.get('patientId');
    if (paramId) setPatientId(paramId);
  }, [searchParams]);

  const patient = db.patients.find((p) => p.id === patientId);
  const patientHistory = db.medicalRecords.filter((m) => m.patientId === patientId);

  const handleAddMedicineToDraft = () => {
    const med = db.medicines.find((m) => m.id === draftMedId);
    if (!med) return;
    const expiry = getMedicineExpiryStatus(med.expiryDate);
    if (expiry.status === 'Expired') {
      showToast(
        'warning',
        'Expired Batch Alert',
        `${med.name} (Batch ${med.batchNumber}) is expired. Choose a valid medicine or notify pharmacy.`
      );
      return;
    }
    setRxItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineCode: med.medicineId,
        medicineName: med.name,
        dosage: draftDosage.trim() || 'As directed',
        frequency: draftFreq.trim() || 'Once daily',
        durationDays: Math.max(1, Number(draftDays) || 1),
        quantityRequested: Math.max(1, Number(draftQty) || 1),
        instructions: draftInstr.trim(),
      },
    ]);
  };

  const handleSaveClinicalEncounter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !diagnosis.trim() || !treatmentPlan.trim()) {
      showToast(
        'error',
        'Required Clinical Fields',
        'Select a patient and complete Diagnosis and Treatment Plan.'
      );
      return;
    }

    const res = addMedicalRecord({
      patientId,
      doctorId: currentUser?.id || 'usr_doc_1',
      visitDate,
      chiefComplaint: chiefComplaint.trim() || 'Outpatient consultation',
      vitals,
      diagnosis: diagnosis.trim(),
      icdCode: icdCode.trim(),
      treatmentPlan: treatmentPlan.trim(),
      clinicalNotes: clinicalNotes.trim(),
      progressStatus,
      followUpDate,
    });

    if (res.ok && rxItems.length > 0) {
      createPrescription({
        patientId,
        doctorId: currentUser?.id || 'usr_doc_1',
        medicalRecordId: res.record?.id,
        prescribedDate: visitDate,
        items: rxItems,
      });
    }

    if (res.ok && labTestName.trim()) {
      requestDiagnosticTest({
        patientId,
        requestedByDoctorId: currentUser?.id || 'usr_doc_1',
        testName: labTestName.trim(),
        category: labCategory,
        priority: labPriority,
        requestedDate: visitDate,
      });
    }

    showToast(
      'success',
      'Consultation Saved',
      `Diagnosis${rxItems.length ? ', prescription' : ''}${labTestName.trim() ? ', and lab order' : ''} recorded for ${patient?.fullName || 'patient'}.`
    );

    setChiefComplaint('');
    setDiagnosis('');
    setIcdCode('');
    setTreatmentPlan('');
    setClinicalNotes('');
    setRxItems([]);
    setLabTestName('');
  };

  return (
    <AppShell
      pageTitle="Diagnosis, Treatment & Progress"
      breadcrumb="HMIS / Doctor Workspace / Clinical Encounter"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSaveClinicalEncounter} className="lg:col-span-8 space-y-6">
          {/* Patient Selection & Vitals */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-[#0F2942]" />
                <h2 className="text-base font-bold text-slate-900">Clinical Assessment</h2>
              </div>
              {patient && (
                <span className="text-xs text-slate-600">
                  Allergies: <strong className="text-red-700">{patient.allergies || 'None'}</strong>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Patient *
                </label>
                <select
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  {db.patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.patientId} — {p.fullName} ({p.age}y, {p.gender})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Visit Date *
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Blood Pressure
                </label>
                <input
                  type="text"
                  value={vitals.bp}
                  onChange={(e) => setVitals((v) => ({ ...v, bp: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Pulse Rate
                </label>
                <input
                  type="text"
                  value={vitals.pulse}
                  onChange={(e) => setVitals((v) => ({ ...v, pulse: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Temperature
                </label>
                <input
                  type="text"
                  value={vitals.temp}
                  onChange={(e) => setVitals((v) => ({ ...v, temp: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2</label>
                <input
                  type="text"
                  value={vitals.spo2}
                  onChange={(e) => setVitals((v) => ({ ...v, spo2: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Chief Complaint
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                placeholder="Primary presenting symptoms and duration..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Diagnosis *
                </label>
                <input
                  type="text"
                  required
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="e.g. Acute Bronchitis"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ICD-10 Code
                </label>
                <input
                  type="text"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  placeholder="e.g. J20.9"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Treatment Plan *
              </label>
              <textarea
                rows={3}
                required
                value={treatmentPlan}
                onChange={(e) => setTreatmentPlan(e.target.value)}
                placeholder="Therapeutic interventions, dietary advice, and monitoring instructions..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient Progress Status
                </label>
                <select
                  value={progressStatus}
                  onChange={(e) => setProgressStatus(e.target.value as ProgressStatus)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                >
                  <option value="Initial Evaluation">Initial Evaluation</option>
                  <option value="Under Treatment">Under Treatment</option>
                  <option value="Improving">Improving</option>
                  <option value="Stable">Stable</option>
                  <option value="Recovered">Recovered</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Follow-up Date
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Notes
              </label>
              <textarea
                rows={2}
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
                placeholder="Examination findings or specialist remarks..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </section>

          {/* Optional Prescription Attachment */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <Pill className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Attach Medicine Prescription (Optional)
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Medicine
                </label>
                <select
                  value={draftMedId}
                  onChange={(e) => setDraftMedId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                >
                  {db.medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.availableQuantity})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={draftDosage}
                  onChange={(e) => setDraftDosage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={draftFreq}
                  onChange={(e) => setDraftFreq(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Qty / Days
                </label>
                <div className="flex gap-1">
                  <input
                    type="number"
                    min={1}
                    value={draftQty}
                    onChange={(e) => setDraftQty(Number(e.target.value))}
                    aria-label="Quantity"
                    className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs font-mono"
                  />
                  <input
                    type="number"
                    min={1}
                    value={draftDays}
                    onChange={(e) => setDraftDays(Number(e.target.value))}
                    aria-label="Days"
                    className="w-1/2 rounded-lg border border-slate-300 px-2 py-2 text-xs font-mono"
                  />
                </div>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddMedicineToDraft}
                  className="w-full inline-flex items-center justify-center gap-1 rounded-lg border border-blue-600 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
            </div>

            {rxItems.length > 0 && (
              <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
                {rxItems.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                    <span>
                      <strong>{item.medicineName}</strong> · {item.dosage}, {item.frequency} · Qty{' '}
                      {item.quantityRequested} ({item.durationDays}d)
                    </span>
                    <button
                      type="button"
                      onClick={() => setRxItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Optional Diagnostic Order */}
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
              <FlaskConical className="h-4 w-4 text-blue-700" />
              <h2 className="text-sm font-bold text-slate-900">
                Request Diagnostic Test (Optional)
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name</label>
                <input
                  type="text"
                  value={labTestName}
                  onChange={(e) => setLabTestName(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC)"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={labCategory}
                  onChange={(e) => setLabCategory(e.target.value as DiagnosticCategory)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Hematology">Hematology</option>
                  <option value="Biochemistry">Biochemistry</option>
                  <option value="Radiology">Radiology</option>
                  <option value="Microbiology">Microbiology</option>
                  <option value="Cardiology">Cardiology</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                <select
                  value={labPriority}
                  onChange={(e) => setLabPriority(e.target.value as DiagnosticPriority)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="STAT">STAT</option>
                </select>
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              Save Consultation, Diagnosis &amp; Orders
            </button>
          </div>
        </form>

        {/* Right Sidebar: Recent Progress for Selected Patient */}
        <aside className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Recent Progress · {patient?.fullName || 'Patient'}
            </h3>
            {patientHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No prior diagnosis records for this patient.</p>
            ) : (
              <div className="space-y-4 divide-y divide-slate-100">
                {patientHistory.slice(0, 4).map((rec) => (
                  <div key={rec.id} className="pt-3 first:pt-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900">{rec.diagnosis}</span>
                      <StatusBadge label={rec.progressStatus} />
                    </div>
                    <p className="text-[11px] text-slate-500">{formatDate(rec.visitDate)}</p>
                    <p className="text-xs text-slate-600">{rec.treatmentPlan}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </AppShell>
  );
};
