import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  Building2,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  ShieldCheck,
  Stethoscope,
  UserPlus,
  Users,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatCurrency, formatDateTime, getRoleLabel } from '../../utils/hmisHelpers';

export const AdminDashboardPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();

  const totalStaff = db.users.length;
  const doctors = db.users.filter((u) => u.role === 'doctor');
  const activeDepartments = db.departments.filter((d) => d.status === 'Active').length;
  const totalPatients = db.patients.length;
  const totalAppointments = db.appointments.length;
  const totalRevenue = db.bills.reduce((sum, b) => sum + b.paidAmount, 0);
  const billedTotal = db.bills.reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <AppShell
      pageTitle="Administrator Dashboard"
      breadcrumb="HMIS / Administration / Overview"
    >
      <div className="space-y-6">
        {/* 6 Required Administrator Statistics */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Staff"
            value={totalStaff}
            detail={`${db.users.filter((u) => u.status === 'Active').length} active accounts`}
            icon={Users}
            tone="navy"
            onClick={() => navigate('/admin/staff')}
          />
          <StatCard
            label="Total Doctors"
            value={doctors.length}
            detail={`${doctors.filter((d) => d.availabilityStatus === 'Available').length} currently available`}
            icon={Stethoscope}
            tone="blue"
            onClick={() => navigate('/admin/staff')}
          />
          <StatCard
            label="Total Departments"
            value={db.departments.length}
            detail={`${activeDepartments} active clinical & support units`}
            icon={Building2}
            tone="blue"
            onClick={() => navigate('/admin/departments')}
          />
          <StatCard
            label="Total Patients"
            value={totalPatients}
            detail="Registered across OPD, IPD & Emergency"
            icon={UserPlus}
            tone="emerald"
            onClick={() => navigate('/admin/overview')}
          />
          <StatCard
            label="Total Appointments"
            value={totalAppointments}
            detail={`${db.appointments.filter((a) => a.status !== 'Cancelled').length} active scheduled visits`}
            icon={CalendarCheck}
            tone="amber"
            onClick={() => navigate('/admin/overview')}
          />
          <StatCard
            label="Hospital Revenue"
            value={formatCurrency(totalRevenue)}
            detail={`Collected out of ${formatCurrency(billedTotal)} billed`}
            icon={CreditCard}
            tone="emerald"
            onClick={() => navigate('/admin/billing')}
          />
        </section>

        {/* Quick Actions */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Quick Administrative Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/admin/staff')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Users className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Manage Staff</p>
                <p className="text-xs text-slate-500">Add or edit accounts</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/departments')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <Building2 className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Departments</p>
                <p className="text-xs text-slate-500">Configure units &amp; leads</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/schedules')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <CalendarClock className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Shift Schedules</p>
                <p className="text-xs text-slate-500">Assign &amp; monitor rosters</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/roles')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <ShieldCheck className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Roles &amp; Access</p>
                <p className="text-xs text-slate-500">Review permission matrix</p>
              </div>
            </button>
          </div>
        </section>

        {/* Two-column Operational Snapshot */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Doctor Duty & Availability */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">Physician Availability</h2>
              <button
                type="button"
                onClick={() => navigate('/admin/schedules')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                View Schedules
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
                        {dept} · {doc.specialization || 'General'}
                      </p>
                    </div>
                    <StatusBadge label={doc.availabilityStatus || 'Available'} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Hospital Activity */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-blue-700" />
                <h2 className="text-sm font-semibold text-slate-900">Recent Hospital Activity</h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/overview')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Full Log
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {db.activityLogs.slice(0, 7).map((log) => (
                <div key={log.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{log.action}</p>
                    <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                      {formatDateTime(log.timestamp)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">{log.detail}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {log.actorName} · {getRoleLabel(log.actorRole)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
