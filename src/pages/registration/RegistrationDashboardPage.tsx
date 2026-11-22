import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  ClipboardList,
  History,
  Stethoscope,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatDate, getTodayISO } from '../../utils/hmisHelpers';

export const RegistrationDashboardPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();

  const today = getTodayISO();
  const todayRegistrations = db.patients.filter((p) => p.registrationDate === today).length;
  const todayAppointments = db.appointments.filter((a) => a.date === today && a.status !== 'Cancelled');
  const doctors = db.users.filter((u) => u.role === 'doctor' && u.status === 'Active');
  const availableDocs = doctors.filter((d) => d.availabilityStatus === 'Available').length;

  return (
    <AppShell
      pageTitle="Registration Desk Dashboard"
      breadcrumb="HMIS / Registration / Front Desk Overview"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Registered Patients"
            value={db.patients.length}
            detail="Active master patient index"
            icon={Users}
            tone="navy"
            onClick={() => navigate('/registration/patients')}
          />
          <StatCard
            label="Registered Today"
            value={todayRegistrations}
            detail={`Date: ${formatDate(today)}`}
            icon={UserPlus}
            tone="blue"
            onClick={() => navigate('/registration/register-patient')}
          />
          <StatCard
            label="Today's Appointments"
            value={todayAppointments.length}
            detail={`${todayAppointments.filter((a) => a.status === 'Checked In').length} checked in`}
            icon={CalendarPlus}
            tone="emerald"
            onClick={() => navigate('/registration/appointments')}
          />
          <StatCard
            label="Doctors Available Now"
            value={`${availableDocs} / ${doctors.length}`}
            detail="Real-time OPD availability"
            icon={UserCheck}
            tone="blue"
            onClick={() => navigate('/registration/appointments')}
          />
        </section>

        {/* Quick Actions */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Front-Desk Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => navigate('/registration/register-patient')}
              className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-left hover:bg-blue-100/70 transition-colors"
            >
              <UserPlus className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">New Patient</p>
                <p className="text-xs text-slate-600">6-section intake form</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/registration/update-patient')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <UserCog className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Update Patient</p>
                <p className="text-xs text-slate-500">Edit existing details</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/registration/patients')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <ClipboardList className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Patient Directory</p>
                <p className="text-xs text-slate-500">Search, edit &amp; export</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/registration/appointments')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <CalendarPlus className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Book Appointment</p>
                <p className="text-xs text-slate-500">Check doctor slots</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/registration/visit-history')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <History className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Visit History</p>
                <p className="text-xs text-slate-500">Review patient encounters</p>
              </div>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Availability Check */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Stethoscope className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-900">Doctor Availability Status</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/registration/appointments')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Schedule Visit
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {doctors.map((doc) => {
                const dept = db.departments.find((d) => d.id === doc.departmentId)?.name || '—';
                return (
                  <div key={doc.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                      <p className="text-xs text-slate-500 truncate">
                        {dept} · {doc.specialization || 'Consultant'}
                      </p>
                    </div>
                    <StatusBadge label={doc.availabilityStatus || 'Available'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Appointments Queue */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">Today&apos;s Appointment Queue</h2>
              <button
                type="button"
                onClick={() => navigate('/registration/appointments')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Manage All
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {todayAppointments.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-slate-500">
                  No active appointments scheduled for today.
                </p>
              ) : (
                todayAppointments.map((apt) => {
                  const pat = db.patients.find((p) => p.id === apt.patientId);
                  const doc = db.users.find((u) => u.id === apt.doctorId);
                  return (
                    <div key={apt.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {pat?.fullName || 'Unknown'}{' '}
                          <span className="font-mono text-xs font-normal text-slate-500">
                            ({pat?.patientId})
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {apt.timeSlot} · {doc?.name || 'Doctor'}
                        </p>
                      </div>
                      <StatusBadge label={apt.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
