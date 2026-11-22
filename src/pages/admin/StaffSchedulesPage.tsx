import React, { useMemo, useState } from 'react';
import { CalendarClock, Edit2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { ShiftType, StaffSchedule } from '../../types/hmis';
import { formatDate, getRoleLabel, getTodayISO } from '../../utils/hmisHelpers';

export const StaffSchedulesPage: React.FC = () => {
  const { db, saveSchedule, deleteSchedule } = useHMIS();
  const { showToast } = useToast();

  const [deptFilter, setDeptFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);

  const [form, setForm] = useState({
    staffId: db.users[0]?.id || '',
    departmentId: db.departments[0]?.id || '',
    shiftDate: getTodayISO(),
    shiftType: 'Morning (08:00 - 14:00)' as ShiftType,
    station: '',
    status: 'Scheduled' as StaffSchedule['status'],
    notes: '',
  });

  const filtered = useMemo(() => {
    if (deptFilter === 'all') return db.schedules;
    return db.schedules.filter((s) => s.departmentId === deptFilter);
  }, [db.schedules, deptFilter]);

  const openCreate = () => {
    const firstUser = db.users[0];
    setEditingId(undefined);
    setForm({
      staffId: firstUser?.id || '',
      departmentId: firstUser?.departmentId || db.departments[0]?.id || '',
      shiftDate: getTodayISO(),
      shiftType: 'Morning (08:00 - 14:00)',
      station: '',
      status: 'Scheduled',
      notes: '',
    });
    setModalOpen(true);
  };

  const openEdit = (sch: StaffSchedule) => {
    setEditingId(sch.id);
    setForm({
      staffId: sch.staffId,
      departmentId: sch.departmentId,
      shiftDate: sch.shiftDate,
      shiftType: sch.shiftType,
      station: sch.station,
      status: sch.status,
      notes: sch.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.staffId || !form.shiftDate || !form.station.trim()) {
      showToast('error', 'Missing Details', 'Select staff, date, and room/station.');
      return;
    }
    const res = saveSchedule({ id: editingId, ...form });
    if (res.ok) {
      showToast('success', editingId ? 'Schedule Updated' : 'Shift Assigned', res.message);
      setModalOpen(false);
    }
  };

  const columns: TableColumn<StaffSchedule>[] = [
    {
      key: 'staff',
      header: 'Staff Member',
      sortable: true,
      sortValue: (r) => db.users.find((u) => u.id === r.staffId)?.name || '',
      render: (r) => {
        const staff = db.users.find((u) => u.id === r.staffId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{staff?.name || 'Unknown'}</p>
            <p className="text-xs text-slate-500">
              {staff ? `${staff.staffCode} · ${getRoleLabel(staff.role)}` : '—'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'department',
      header: 'Department',
      render: (r) => {
        const dept = db.departments.find((d) => d.id === r.departmentId);
        return <span className="text-xs font-medium text-slate-800">{dept?.name || '—'}</span>;
      },
    },
    {
      key: 'shiftDate',
      header: 'Date',
      sortable: true,
      sortValue: (r) => r.shiftDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.shiftDate)}</span>,
    },
    {
      key: 'shiftType',
      header: 'Shift Window',
      render: (r) => <span className="text-xs font-mono text-slate-700">{r.shiftType}</span>,
    },
    {
      key: 'station',
      header: 'Room / Station',
      render: (r) => (
        <div>
          <p className="text-xs font-medium text-slate-900">{r.station}</p>
          {r.notes && <p className="text-[11px] text-slate-500">{r.notes}</p>}
        </div>
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
            title="Edit shift"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              deleteSchedule(r.id);
              showToast('info', 'Shift Removed', 'Schedule entry deleted.');
            }}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700"
            title="Remove shift"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Staff & Doctor Schedules"
      breadcrumb="HMIS / Administration / Duty Roster"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Assign shifts, manage duty stations, and monitor daily staff and physician coverage.
          </p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Assign Shift
          </button>
        </div>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by staff name, station, or notes..."
          searchFilter={(r, q) => {
            const name = db.users.find((u) => u.id === r.staffId)?.name.toLowerCase() || '';
            return (
              name.includes(q) ||
              r.station.toLowerCase().includes(q) ||
              (r.notes || '').toLowerCase().includes(q)
            );
          }}
          filterControls={
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Departments</option>
              {db.departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Staff Shift' : 'Assign Staff Shift'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Staff / Doctor *
              </label>
              <select
                value={form.staffId}
                onChange={(e) => {
                  const chosen = db.users.find((u) => u.id === e.target.value);
                  setForm((f) => ({
                    ...f,
                    staffId: e.target.value,
                    departmentId: chosen?.departmentId || f.departmentId,
                  }));
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {db.users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({getRoleLabel(u.role)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Date *</label>
              <input
                type="date"
                required
                value={form.shiftDate}
                onChange={(e) => setForm((f) => ({ ...f, shiftDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Window</label>
              <select
                value={form.shiftType}
                onChange={(e) => setForm((f) => ({ ...f, shiftType: e.target.value as ShiftType }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="Morning (08:00 - 14:00)">Morning (08:00 - 14:00)</option>
                <option value="Afternoon (14:00 - 20:00)">Afternoon (14:00 - 20:00)</option>
                <option value="Night (20:00 - 08:00)">Night (20:00 - 08:00)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as StaffSchedule['status'] }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assigned Room / Station *
              </label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  value={form.station}
                  onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}
                  placeholder="e.g. Cardiology Suite 302"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Optional shift instructions..."
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
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
