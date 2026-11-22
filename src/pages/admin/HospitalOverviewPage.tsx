import React from 'react';
import { Activity, AlertTriangle, Building2, CalendarCheck, Pill } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatDateTime, getMedicineExpiryStatus, getRoleLabel, isLowStock } from '../../utils/hmisHelpers';

export const HospitalOverviewPage: React.FC = () => {
  const { db } = useHMIS();

  const expiredMeds = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Expired'
  );
  const lowStockMeds = db.medicines.filter((m) => isLowStock(m));
  const pendingRx = db.prescriptions.filter((p) => p.status === 'Pending Verification');
  const pendingLabs = db.diagnosticReports.filter((r) => r.status !== 'Completed');

  return (
    <AppShell
      pageTitle="Hospital Activity Overview"
      breadcrumb="HMIS / Administration / Operations Monitoring"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Active Consultations & Queue"
            value={db.appointments.filter((a) => a.status !== 'Cancelled').length}
            detail={`${db.appointments.filter((a) => a.status === 'Completed').length} completed visits`}
            icon={CalendarCheck}
            tone="blue"
          />
          <StatCard
            label="Pending Prescriptions"
            value={pendingRx.length}
            detail="Awaiting pharmacy verification"
            icon={Pill}
            tone="amber"
          />
          <StatCard
            label="Open Diagnostic Orders"
            value={pendingLabs.length}
            detail={`${db.diagnosticReports.length} total lab reports`}
            icon={Activity}
            tone="blue"
          />
          <StatCard
            label="Inventory Risk Alerts"
            value={expiredMeds.length + lowStockMeds.length}
            detail={`${expiredMeds.length} expired · ${lowStockMeds.length} low stock`}
            icon={AlertTriangle}
            tone={expiredMeds.length > 0 ? 'red' : 'amber'}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Department Workload Breakdown */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center gap-2 border-b border-slate-200 px-5 py-3.5">
              <Building2 className="h-4 w-4 text-[#0F2942]" />
              <h2 className="text-sm font-semibold text-slate-900">Department Workload Summary</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th className="px-4 py-2.5">Department</th>
                    <th className="px-4 py-2.5 text-right">Staff</th>
                    <th className="px-4 py-2.5 text-right">Patients</th>
                    <th className="px-4 py-2.5 text-right">Appointments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {db.departments.map((d) => {
                    const staffCount = db.users.filter((u) => u.departmentId === d.id).length;
                    const patCount = db.patients.filter((p) => p.assignedDepartmentId === d.id).length;
                    const aptCount = db.appointments.filter((a) => a.departmentId === d.id).length;
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/70">
                        <td className="px-4 py-2.5">
                          <p className="font-medium text-slate-900">{d.name}</p>
                          <p className="text-xs text-slate-500">{d.floor}</p>
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{staffCount}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{patCount}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums">{aptCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complete Chronological Audit Feed */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="border-b border-slate-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">Hospital Activity Audit Log</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto">
              {db.activityLogs.map((log) => (
                <div key={log.id} className="px-5 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900">{log.action}</span>
                      <StatusBadge label={getRoleLabel(log.actorRole)} tone="info" />
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{log.detail}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">Actor: {log.actorName}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 tabular-nums whitespace-nowrap shrink-0">
                    {formatDateTime(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
