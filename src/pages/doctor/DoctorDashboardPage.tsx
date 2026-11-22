import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FlaskConical,
  History,
  Stethoscope,
  Users,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { AvailabilityStatus } from '../../types/hmis';
import { formatDate } from '../../utils/hmisHelpers';

export const DoctorDashboardPage: React.FC = () => {
  const { db, currentUser, updateDoctorAvailability } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const myAppointments = db.appointments.filter(
    (a) => a.doctorId === currentUser?.id && a.status !== 'Cancelled'
  );
  const myPrescriptions = db.prescriptions.filter((p) => p.doctorId === currentUser?.id);
  const myPendingLabs = db.diagnosticReports.filter(
    (r) => r.requestedByDoctorId === currentUser?.id && r.status !== 'Completed'
  );

  return (
    <AppShell
      pageTitle="Physician Clinical Dashboard"
      breadcrumb={`HMIS / Doctor Workspace / ${currentUser?.name || ''}`}
    >
      <div className="space-y-6">
        {/* Availability Control Banner */}
        {currentUser && (
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div>
              <p className="text-sm font-bold text-slate-900">
                {currentUser.name} · {currentUser.specialization || 'Medical Officer'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentUser.qualification || 'MD'} · License {currentUser.licenseNumber || 'Verified'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-600">Duty Status:</span>
              <select
                value={currentUser.availabilityStatus || 'Available'}
                onChange={(e) => {
                  const next = e.target.value as AvailabilityStatus;
                  updateDoctorAvailability(currentUser.id, next);
                  showToast('info', 'Availability Updated', `Status changed to ${next}.`);
                }}
                aria-label="Update duty availability"
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="Available">Available</option>
                <option value="In Consultation">In Consultation</option>
                <option value="On Leave">On Leave</option>
                <option value="Off Duty">Off Duty</option>
              </select>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="My Active Appointments"
            value={myAppointments.filter((a) => a.status !== 'Completed').length}
            detail={`${myAppointments.length} total assigned visits`}
            icon={Stethoscope}
            tone="navy"
            onClick={() => navigate('/doctor/diagnosis')}
          />
          <StatCard
            label="Registered Patients"
            value={db.patients.length}
            detail="Full hospital patient index"
            icon={Users}
            tone="blue"
            onClick={() => navigate('/doctor/patients')}
          />
          <StatCard
            label="My Prescriptions"
            value={myPrescriptions.length}
            detail={`${myPrescriptions.filter((r) => r.status === 'Pending Verification').length} awaiting pharmacy`}
            icon={FileText}
            tone="emerald"
            onClick={() => navigate('/doctor/prescriptions')}
          />
          <StatCard
            label="Pending Lab Results"
            value={myPendingLabs.length}
            detail={`${db.diagnosticReports.filter((r) => r.requestedByDoctorId === currentUser?.id).length} total ordered`}
            icon={FlaskConical}
            tone="amber"
            onClick={() => navigate('/doctor/reports')}
          />
        </section>

        {/* Quick Clinical Actions */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Clinical Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/doctor/diagnosis')}
              className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-left hover:bg-blue-100/70 transition-colors"
            >
              <Stethoscope className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Record Diagnosis</p>
                <p className="text-xs text-slate-600">Vitals, treatment &amp; progress</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/history')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <History className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Patient History</p>
                <p className="text-xs text-slate-500">Full longitudinal chart</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/prescriptions')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <FileText className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Write Prescription</p>
                <p className="text-xs text-slate-500">Send directly to pharmacy</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/doctor/reports')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <FlaskConical className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Diagnostic Orders</p>
                <p className="text-xs text-slate-500">Request &amp; review lab tests</p>
              </div>
            </button>
          </div>
        </section>

        {/* Consultation Queue */}
        <section className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
            <h2 className="text-sm font-semibold text-slate-900">Assigned Patient Consultation Queue</h2>
            <button
              type="button"
              onClick={() => navigate('/doctor/patients')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              All Patients
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {myAppointments.length === 0 ? (
              <p className="px-5 py-8 text-center text-xs text-slate-500">
                No appointments currently assigned to you.
              </p>
            ) : (
              myAppointments.map((apt) => {
                const pat = db.patients.find((p) => p.id === apt.patientId);
                return (
                  <div
                    key={apt.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 hover:bg-blue-50/30"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {pat?.fullName || 'Unknown'}{' '}
                        <span className="font-mono text-xs font-normal text-slate-500">
                          ({pat?.patientId})
                        </span>
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {formatDate(apt.date)} · {apt.timeSlot} — {apt.reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <StatusBadge label={apt.status} />
                      {pat && (
                        <button
                          type="button"
                          onClick={() => navigate(`/doctor/diagnosis?patientId=${pat.id}`)}
                          className="rounded-lg bg-[#0F2942] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
                        >
                          Open Chart
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
};
