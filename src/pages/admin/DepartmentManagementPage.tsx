import React, { useState } from 'react';
import { Building2, Edit2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Department } from '../../types/hmis';

export const DepartmentManagementPage: React.FC = () => {
  const { db, saveDepartment, deleteDepartment } = useHMIS();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);

  const [form, setForm] = useState({
    name: '',
    headDoctorId: db.users[0]?.id || '',
    floor: '',
    extension: '',
    status: 'Active' as 'Active' | 'Inactive',
    description: '',
  });

  const openCreate = () => {
    setEditingId(undefined);
    setForm({
      name: '',
      headDoctorId: db.users.find((u) => u.role === 'doctor')?.id || db.users[0]?.id || '',
      floor: '',
      extension: '',
      status: 'Active',
      description: '',
    });
    setModalOpen(true);
  };

  const openEdit = (dept: Department) => {
    setEditingId(dept.id);
    setForm({
      name: dept.name,
      headDoctorId: dept.headDoctorId,
      floor: dept.floor,
      extension: dept.extension,
      status: dept.status,
      description: dept.description,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('error', 'Validation Error', 'Department name is required.');
      return;
    }
    const res = saveDepartment({ id: editingId, ...form });
    if (!res.ok) {
      showToast('error', 'Save Failed', res.message);
      return;
    }
    showToast('success', editingId ? 'Department Updated' : 'Department Created', res.message);
    setModalOpen(false);
  };

  const columns: TableColumn<Department>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      sortValue: (r) => r.code,
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-900">{r.code}</span>,
    },
    {
      key: 'name',
      header: 'Department',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.name}</p>
          <p className="text-xs text-slate-500 max-w-md truncate">{r.description}</p>
        </div>
      ),
    },
    {
      key: 'head',
      header: 'Department Lead',
      render: (r) => {
        const lead = db.users.find((u) => u.id === r.headDoctorId);
        return <span className="text-xs font-medium text-slate-800">{lead?.name || 'Unassigned'}</span>;
      },
    },
    {
      key: 'location',
      header: 'Location & Ext.',
      render: (r) => (
        <div className="text-xs text-slate-600">
          <p>{r.floor || '—'}</p>
          <p className="font-mono text-slate-400">Ext. {r.extension || '—'}</p>
        </div>
      ),
    },
    {
      key: 'staffCount',
      header: 'Staff Assigned',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-800">
          {db.users.filter((u) => u.departmentId === r.id).length}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
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
            onClick={() => openEdit(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Edit department"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700"
            title="Delete department"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Department Management"
      breadcrumb="HMIS / Administration / Departments"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Organize clinical and operational hospital departments, floor locations, and department heads.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Department
          </button>
        </div>

        <DataTable
          data={db.departments}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search departments by name, code, or floor..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.code.toLowerCase().includes(q) ||
            r.floor.toLowerCase().includes(q)
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Department' : 'Create Department'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Name *
              </label>
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Neurology"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department Head / Lead
              </label>
              <select
                value={form.headDoctorId}
                onChange={(e) => setForm((f) => ({ ...f, headDoctorId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {db.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Floor / Wing
              </label>
              <input
                type="text"
                value={form.floor}
                onChange={(e) => setForm((f) => ({ ...f, floor: e.target.value }))}
                placeholder="e.g. 3rd Floor, North Wing"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Extension
              </label>
              <input
                type="text"
                value={form.extension}
                onChange={(e) => setForm((f) => ({ ...f, extension: e.target.value }))}
                placeholder="e.g. 3400"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Scope of clinical services..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

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
              {editingId ? 'Save Department' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Department"
        message={`Delete "${deleteTarget?.name}" (${deleteTarget?.code})? Departments with assigned staff cannot be deleted until staff are reassigned.`}
        confirmLabel="Delete Department"
        onConfirm={() => {
          if (!deleteTarget) return;
          const res = deleteDepartment(deleteTarget.id);
          showToast(res.ok ? 'success' : 'error', res.ok ? 'Deleted' : 'Cannot Delete', res.message);
        }}
      />
    </AppShell>
  );
};
