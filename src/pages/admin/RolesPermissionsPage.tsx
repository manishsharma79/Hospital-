import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { RolePermissionSet } from '../../types/hmis';

const PERMISSION_LABELS: Array<{
  key: keyof RolePermissionSet['permissions'];
  label: string;
  group: string;
}> = [
  { key: 'manageStaff', label: 'Manage Staff Accounts', group: 'Administration' },
  { key: 'manageDepartments', label: 'Manage Departments', group: 'Administration' },
  { key: 'manageRoles', label: 'Modify Roles & Permissions', group: 'Administration' },
  { key: 'manageSchedules', label: 'Manage Staff Schedules', group: 'Administration' },
  { key: 'viewHospitalOverview', label: 'View Hospital Activity Overview', group: 'Administration' },
  { key: 'viewBillingOverview', label: 'View Billing & Revenue', group: 'Finance' },
  { key: 'registerPatients', label: 'Register New Patients', group: 'Registration' },
  { key: 'editDeletePatients', label: 'Edit / Delete Patient Records', group: 'Registration' },
  { key: 'scheduleAppointments', label: 'Schedule Appointments', group: 'Registration' },
  { key: 'viewClinicalHistory', label: 'View Full Clinical History', group: 'Clinical' },
  { key: 'writeDiagnosisTreatment', label: 'Record Diagnosis & Treatment', group: 'Clinical' },
  { key: 'prescribeMedicines', label: 'Issue Prescriptions', group: 'Clinical' },
  { key: 'requestDiagnosticTests', label: 'Order Diagnostic Tests', group: 'Clinical' },
  { key: 'manageMedicineInventory', label: 'Manage Pharmacy Inventory', group: 'Pharmacy' },
  { key: 'verifyDispensePrescriptions', label: 'Verify & Dispense Prescriptions', group: 'Pharmacy' },
  { key: 'processBillsPayments', label: 'Generate Bills & Process Payments', group: 'Finance' },
];

export const RolesPermissionsPage: React.FC = () => {
  const { db, updateRolePermission } = useHMIS();
  const { showToast } = useToast();

  return (
    <AppShell
      pageTitle="Roles & Permissions"
      breadcrumb="HMIS / Administration / Access Control Matrix"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {db.rolePermissions.map((rp) => {
            const enabledCount = Object.values(rp.permissions).filter(Boolean).length;
            const userCount = db.users.filter((u) => u.role === rp.role).length;
            return (
              <div
                key={rp.role}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-center gap-2 text-[#0F2942]">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <h2 className="text-sm font-bold text-slate-900">{rp.label}</h2>
                </div>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{rp.description}</p>
                <p className="mt-3 text-xs font-medium text-slate-500 tabular-nums">
                  {enabledCount} permissions · {userCount} assigned staff
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-3.5 bg-slate-50/70">
            <h2 className="text-sm font-semibold text-slate-900">
              Role Capability Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toggle permissions to configure role governance policies across the facility.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="px-4 py-3">Capability</th>
                  <th className="px-4 py-3">Module Group</th>
                  {db.rolePermissions.map((rp) => (
                    <th key={rp.role} className="px-4 py-3 text-center whitespace-nowrap">
                      {rp.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_LABELS.map((perm) => (
                  <tr key={perm.key} className="hover:bg-blue-50/30">
                    <td className="px-4 py-2.5 font-medium text-slate-800">{perm.label}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500">{perm.group}</td>
                    {db.rolePermissions.map((rp) => {
                      const checked = rp.permissions[perm.key];
                      const lockedAdmin = rp.role === 'admin' && perm.key === 'manageRoles';
                      return (
                        <td key={rp.role} className="px-4 py-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={lockedAdmin}
                            onChange={(e) => {
                              updateRolePermission(rp.role, perm.key, e.target.checked);
                              showToast(
                                'info',
                                'Permission Updated',
                                `${perm.label} ${e.target.checked ? 'enabled' : 'disabled'} for ${rp.label}.`
                              );
                            }}
                            aria-label={`${perm.label} for ${rp.label}`}
                            className="h-4 w-4 rounded border-slate-300 text-[#0F2942] focus:ring-blue-600 disabled:opacity-50"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
