import React, { useMemo, useState } from 'react';
import { Edit2, Plus, Power, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { AvailabilityStatus, UserAccount, UserRole } from '../../types/hmis';
import { getRoleLabel } from '../../utils/hmisHelpers';

export const StaffManagementPage: React.FC = () => {
  const {
    db,
    saveStaffMember,
    toggleStaffStatus,
    updateDoctorAvailability,
    deleteStaffMember,
  } = useHMIS();
  const { showToast } = useToast();

  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<UserAccount | null>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'doctor' as UserRole,
    departmentId: db.departments[0]?.id || '',
    phone: '',
    status: 'Active' as 'Active' | 'Inactive',
    specialization: '',
    qualification: '',
    licenseNumber: '',
    consultationFee: 800,
    availabilityStatus: 'Available' as AvailabilityStatus,
  });

  const filteredUsers = useMemo(() => {
    if (roleFilter === 'all') return db.users;
    return db.users.filter((u) => u.role === roleFilter);
  }, [db.users, roleFilter]);

  const openCreateModal = () => {
    setEditingId(undefined);
    setForm({
      name: '',
      email: '',
      password: '',
      role: 'doctor',
      departmentId: db.departments[0]?.id || '',
      phone: '',
      status: 'Active',
      specialization: '',
      qualification: '',
      licenseNumber: '',
      consultationFee: 800,
      availabilityStatus: 'Available',
    });
    setModalOpen(true);
  };

  const openEditModal = (staff: UserAccount) => {
    setEditingId(staff.id);
    setForm({
      name: staff.name,
      email: staff.email,
      password: staff.password,
      role: staff.role,
      departmentId: staff.departmentId,
      phone: staff.phone,
      status: staff.status,
      specialization: staff.specialization || '',
      qualification: staff.qualification || '',
      licenseNumber: staff.licenseNumber || '',
      consultationFee: staff.consultationFee || 120,
      availabilityStatus: staff.availabilityStatus || 'Available',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || (!editingId && !form.password.trim())) {
      showToast('error', 'Validation Error', 'Name, email, and password are required.');
      return;
    }
    const res = saveStaffMember({
      id: editingId,
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      role: form.role,
      departmentId: form.departmentId,
      phone: form.phone.trim(),
      status: form.status,
      specialization: form.specialization.trim(),
      qualification: form.qualification.trim(),
      licenseNumber: form.licenseNumber.trim(),
      consultationFee: form.role === 'doctor' ? Number(form.consultationFee) || 0 : undefined,
      availabilityStatus: form.role === 'doctor' ? form.availabilityStatus : undefined,
    });
    if (!res.ok) {
      showToast('error', 'Save Failed', res.message);
      return;
    }
    showToast('success', editingId ? 'Staff Updated' : 'Staff Created', res.message);
    setModalOpen(false);
  };

  const columns: TableColumn<UserAccount>[] = [
    {
      key: 'staffCode',
      header: 'Staff ID',
      sortable: true,
      sortValue: (r) => r.staffCode,
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-900">{r.staffCode}</span>,
    },
    {
      key: 'name',
      header: 'Name & Credentials',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500">
            {r.email}
            {r.qualification ? ` · ${r.qualification}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      sortValue: (r) => r.role,
      render: (r) => <span className="text-xs font-medium text-slate-800">{getRoleLabel(r.role)}</span>,
    },
    {
      key: 'department',
      header: 'Department',
      render: (r) => {
        const dept = db.departments.find((d) => d.id === r.departmentId);
        return <span className="text-xs text-slate-700">{dept?.name || '—'}</span>;
      },
    },
    {
      key: 'availability',
      header: 'Doctor Availability',
      render: (r) =>
        r.role === 'doctor' ? (
          <select
            value={r.availabilityStatus || 'Available'}
            onChange={(e) => {
              updateDoctorAvailability(r.id, e.target.value as AvailabilityStatus);
              showToast('info', 'Availability Updated', `${r.name} marked ${e.target.value}.`);
            }}
            aria-label={`Availability for ${r.name}`}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
          >
            <option value="Available">Available</option>
            <option value="In Consultation">In Consultation</option>
            <option value="On Leave">On Leave</option>
            <option value="Off Duty">Off Duty</option>
          </select>
        ) : (
          <span className="text-xs text-slate-400">N/A</span>
        ),
    },
    {
      key: 'status',
      header: 'Account Status',
      render: (r) => <StatusBadge label={r.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => openEditModal(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Edit staff"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              toggleStaffStatus(r.id);
              showToast('info', 'Account Toggled', `${r.name} account status updated.`);
            }}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-amber-700"
            title="Toggle Active / Inactive"
          >
            <Power className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700"
            title="Delete staff"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Staff Management"
      breadcrumb="HMIS / Administration / Staff Directory"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Manage hospital staff accounts, clinical specializations, and physician availability.
          </p>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Staff Account
          </button>
        </div>

        <DataTable
          data={filteredUsers}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by staff ID, name, or email..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.staffCode.toLowerCase().includes(q) ||
            r.email.toLowerCase().includes(q)
          }
          filterControls={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'admin', 'registration', 'doctor', 'pharmacist'] as const).map((rf) => (
                <button
                  key={rf}
                  type="button"
                  onClick={() => setRoleFilter(rf)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                    roleFilter === rf
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {rf === 'all' ? 'All Roles' : getRoleLabel(rf)}
                </button>
              ))}
            </div>
          }
        />
      </div>

      {/* Add / Edit Staff Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Staff Account' : 'Create New Staff Account'}
        subtitle="Configure role access, department assignment, and credentials."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {editingId ? 'Password (leave blank to keep current)' : 'Password *'}
              </label>
              <input
                type="text"
                required={!editingId}
                placeholder={editingId ? 'Leave blank to keep existing password' : ''}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="admin">Administrator</option>
                <option value="registration">Registration Staff</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {db.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Qualification
              </label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
                placeholder="e.g. MD, Pharm.D, MHA"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as 'Active' | 'Inactive' }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {form.role === 'doctor' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-200 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={form.specialization}
                  onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                  placeholder="e.g. Cardiology"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  License No.
                </label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                  placeholder="MCI-XX-0000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Consultation Fee (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={form.consultationFee}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, consultationFee: Number(e.target.value) }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              {editingId ? 'Save Changes' : 'Create Staff'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Staff Account"
        message={`Are you sure you want to remove ${deleteTarget?.name} (${deleteTarget?.staffCode})? Associated shift schedules will also be removed.`}
        confirmLabel="Delete Account"
        onConfirm={() => {
          if (!deleteTarget) return;
          const res = deleteStaffMember(deleteTarget.id);
          showToast(res.ok ? 'success' : 'error', res.ok ? 'Removed' : 'Blocked', res.message);
        }}
      />
    </AppShell>
  );
};
