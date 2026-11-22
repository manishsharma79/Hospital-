import React, { useMemo, useState } from 'react';
import { Calendar, Search, User } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatDate } from '../../utils/hmisHelpers';

export const VisitHistoryPage: React.FC = () => {
  const { db } = useHMIS();
  const [search, setSearch] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState(db.patients[0]?.id || '');

  const matchedPatients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return db.patients;
    return db.patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(q) ||
        p.patientId.toLowerCase().includes(q) ||
        p.mobile.toLowerCase().includes(q)
    );
  }, [db.patients, search]);

  const patient = db.patients.find((p) => p.id === selectedPatientId) || matchedPatients[0];

  const patientAppointments = useMemo(
    () => (patient ? db.appointments.filter((a) => a.patientId === patient.id) : []),
    [db.appointments, patient]
  );

  const patientRecords = useMemo(
    () => (patient ? db.medicalRecords.filter((m) => m.patientId === patient.id) : []),
    [db.medicalRecords, patient]
  );

  return (
    <AppShell
      pageTitle="Patient Visit History"
      breadcrumb="HMIS / Registration / Visit Log"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Selector List */}
        <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden flex flex-col max-h-[680px]">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search patient ID or name..."
                className="w-full rounded-lg border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {matchedPatients.map((p) => {
              const active = patient?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    active ? 'bg-blue-50 border-r-2 border-r-[#0F2942]' : 'hover:bg-slate-50'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{p.fullName}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {p.patientId} · {p.age}y {p.gender}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Patient Visit Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {!patient ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
              Select a patient to view visit history.
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#0F2942]/10 text-[#0F2942]">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{patient.fullName}</h2>
                    <p className="text-xs text-slate-500">
                      <span className="font-mono font-semibold text-slate-700">{patient.patientId}</span>{' '}
                      · Registered {formatDate(patient.registrationDate)} · {patient.mobile}
                    </p>
                  </div>
                </div>
                <StatusBadge label={patient.registrationType} tone="info" />
              </div>

              {/* Scheduled & Past Appointments */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
                  <Calendar className="h-4 w-4 text-blue-700" />
                  <h3 className="text-sm font-semibold text-slate-900">
                    Appointments ({patientAppointments.length})
                  </h3>
                </div>
                {patientAppointments.length === 0 ? (
                  <p className="px-5 py-6 text-xs text-slate-500">No appointments recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patientAppointments.map((apt) => {
                      const doc = db.users.find((u) => u.id === apt.doctorId);
                      const dept = db.departments.find((d) => d.id === apt.departmentId);
                      return (
                        <div key={apt.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              <span className="font-mono text-xs text-blue-700 mr-2">
                                {apt.appointmentNo}
                              </span>
                              {apt.reason}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatDate(apt.date)} at {apt.timeSlot} · {doc?.name || 'Doctor'} (
                              {dept?.name || 'Department'})
                            </p>
                          </div>
                          <StatusBadge label={apt.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Clinical Visit Encounters */}
              <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="border-b border-slate-200 px-5 py-3.5">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Recorded Clinical Visits ({patientRecords.length})
                  </h3>
                </div>
                {patientRecords.length === 0 ? (
                  <p className="px-5 py-6 text-xs text-slate-500">No clinical encounters logged yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {patientRecords.map((rec) => {
                      const doc = db.users.find((u) => u.id === rec.doctorId);
                      return (
                        <div key={rec.id} className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{rec.diagnosis}</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {formatDate(rec.visitDate)} · Attending: {doc?.name || 'Physician'}
                            </p>
                          </div>
                          <StatusBadge label={rec.progressStatus} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
};
