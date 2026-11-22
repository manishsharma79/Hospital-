import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, FlaskConical, Search, Stethoscope, User } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatDate } from '../../utils/hmisHelpers';

export const DoctorPatientHistoryPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryPatientId = searchParams.get('patientId');

  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(queryPatientId || db.patients[0]?.id || '');

  useEffect(() => {
    if (queryPatientId) setSelectedId(queryPatientId);
  }, [queryPatientId]);

  const filteredPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return db.patients;
    return db.patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q)
    );
  }, [db.patients, search]);

  const patient = db.patients.find((p) => p.id === selectedId) || filteredPatients[0];

  const records = useMemo(
    () => (patient ? db.medicalRecords.filter((m) => m.patientId === patient.id) : []),
    [db.medicalRecords, patient]
  );
  const prescriptions = useMemo(
    () => (patient ? db.prescriptions.filter((r) => r.patientId === patient.id) : []),
    [db.prescriptions, patient]
  );
  const reports = useMemo(
    () => (patient ? db.diagnosticReports.filter((r) => r.patientId === patient.id) : []),
    [db.diagnosticReports, patient]
  );
  const appointments = useMemo(
    () => (patient ? db.appointments.filter((a) => a.patientId === patient.id) : []),
    [db.appointments, patient]
  );

  return (
    <AppShell
      pageTitle="Complete Patient Medical History"
      breadcrumb="HMIS / Doctor Workspace / Longitudinal EHR"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Selector */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col max-h-[760px]">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID or name..."
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredPatients.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-4 py-3 transition-colors ${
                  patient?.id === p.id
                    ? 'bg-blue-50 border-r-2 border-r-[#0F2942]'
                    : 'hover:bg-slate-50'
                }`}
              >
                <p className="text-sm font-semibold text-slate-900">{p.fullName}</p>
                <p className="text-xs font-mono text-slate-500 mt-0.5">
                  {p.patientId} · {p.age}y {p.gender} · {p.bloodGroup}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Full Medical Chart */}
        <div className="lg:col-span-8 space-y-6">
          {!patient ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Select a patient to view medical history.
            </div>
          ) : (
            <>
              {/* Patient Header Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F2942] text-white">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">{patient.fullName}</h2>
                      <p className="text-xs text-slate-600">
                        <span className="font-mono font-semibold text-[#0F2942]">
                          {patient.patientId}
                        </span>{' '}
                        · {patient.age} yrs ({formatDate(patient.dob)}) · {patient.gender} · Blood{' '}
                        <span className="font-semibold text-red-700">{patient.bloodGroup}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/doctor/diagnosis?patientId=${patient.id}`)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#173B5E]"
                  >
                    <Stethoscope className="h-3.5 w-3.5" />
                    Add Consultation Note
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-3 text-xs">
                  <div>
                    <p className="text-slate-500">Allergies</p>
                    <p className="font-semibold text-red-700 mt-0.5">
                      {patient.allergies || 'None documented'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Chronic Conditions</p>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {patient.chronicConditions || 'None documented'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Emergency Contact</p>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {patient.emergencyName} ({patient.emergencyRelation}) · {patient.emergencyPhone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Diagnoses & Treatment Visits */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
                  <Stethoscope className="h-4 w-4 text-blue-700" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Diagnoses, Vitals &amp; Treatment Progress ({records.length})
                  </h3>
                </div>
                {records.length === 0 ? (
                  <p className="px-5 py-6 text-xs text-slate-500">
                    No clinical notes recorded for this patient yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {records.map((rec) => {
                      const doc = db.users.find((u) => u.id === rec.doctorId);
                      return (
                        <div key={rec.id} className="p-5 space-y-2.5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {rec.diagnosis}{' '}
                                {rec.icdCode && (
                                  <span className="font-mono text-xs font-normal text-slate-500">
                                    (ICD: {rec.icdCode})
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatDate(rec.visitDate)} · Attending: {doc?.name || 'Doctor'}
                              </p>
                            </div>
                            <StatusBadge label={rec.progressStatus} />
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2 text-xs font-mono">
                            <span>BP: {rec.vitals.bp}</span>
                            <span>Pulse: {rec.vitals.pulse}</span>
                            <span>Temp: {rec.vitals.temp}</span>
                            <span>SpO2: {rec.vitals.spo2}</span>
                          </div>
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">Chief Complaint:</span>{' '}
                            {rec.chiefComplaint}
                          </p>
                          <p className="text-xs text-slate-700">
                            <span className="font-semibold">Treatment Plan:</span>{' '}
                            {rec.treatmentPlan}
                          </p>
                          {rec.clinicalNotes && (
                            <p className="text-xs text-slate-600">
                              <span className="font-semibold">Notes:</span> {rec.clinicalNotes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Prescriptions & Diagnostic Reports */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
                    <FileText className="h-4 w-4 text-blue-700" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Prescriptions ({prescriptions.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {prescriptions.length === 0 ? (
                      <p className="px-5 py-6 text-xs text-slate-500">No prescriptions issued.</p>
                    ) : (
                      prescriptions.map((rx) => (
                        <div key={rx.id} className="px-5 py-3 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-semibold text-[#0F2942]">
                              {rx.prescriptionNo}
                            </span>
                            <StatusBadge label={rx.status} />
                          </div>
                          <ul className="text-xs text-slate-700 space-y-0.5">
                            {rx.items.map((item, i) => (
                              <li key={i}>
                                {item.medicineName} — {item.dosage}, {item.frequency} ({item.durationDays}d)
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
                    <FlaskConical className="h-4 w-4 text-blue-700" />
                    <h3 className="text-sm font-semibold text-slate-900">
                      Diagnostic Reports ({reports.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {reports.length === 0 ? (
                      <p className="px-5 py-6 text-xs text-slate-500">No diagnostic tests ordered.</p>
                    ) : (
                      reports.map((rep) => (
                        <div key={rep.id} className="px-5 py-3 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900">{rep.testName}</p>
                            <StatusBadge label={rep.resultFlag || rep.status} />
                          </div>
                          <p className="text-[11px] font-mono text-slate-500">
                            {rep.reportNo} · {rep.category} · {formatDate(rep.requestedDate)}
                          </p>
                          {rep.findings && (
                            <p className="text-xs text-slate-700 mt-1">{rep.findings}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Previous Visits / Appointments */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Previous &amp; Scheduled Visits ({appointments.length})
                  </h3>
                </div>
                <div className="divide-y divide-slate-100">
                  {appointments.length === 0 ? (
                    <p className="px-5 py-5 text-xs text-slate-500">No appointment history.</p>
                  ) : (
                    appointments.map((apt) => (
                      <div key={apt.id} className="px-5 py-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <span className="font-mono font-semibold text-slate-900 mr-2">
                            {apt.appointmentNo}
                          </span>
                          <span className="text-slate-700">{apt.reason}</span>
                          <span className="text-slate-400 ml-2">
                            ({formatDate(apt.date)} {apt.timeSlot})
                          </span>
                        </div>
                        <StatusBadge label={apt.status} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};
