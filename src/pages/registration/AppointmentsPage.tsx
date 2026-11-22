import React, { useMemo, useState } from 'react';
import { CalendarPlus, Plus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Appointment, AppointmentStatus, RegistrationType } from '../../types/hmis';
import { formatDate, getTodayISO } from '../../utils/hmisHelpers';

const TIME_SLOTS = [
  '09:00 AM',
  '09:30 AM',
  '10:00 AM',
  '10:30 AM',
  '11:00 AM',
  '11:45 AM',
  '02:00 PM',
  '02:30 PM',
  '03:30 PM',
  '04:30 PM',
];

export const AppointmentsPage: React.FC = () => {
  const { db, createAppointment, updateAppointmentStatus } = useHMIS();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | AppointmentStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);

  const doctors = useMemo(
    () => db.users.filter((u) => u.role === 'doctor' && u.status === 'Active'),
    [db.users]
  );

  const [form, setForm] = useState({
    patientId: db.patients[0]?.id || '',
    departmentId: db.departments[0]?.id || '',
    doctorId: doctors[0]?.id || '',
    date: getTodayISO(),
    timeSlot: TIME_SLOTS[0],
    visitType: 'Outpatient (OPD)' as RegistrationType,
    reason: '',
  });

  const selectedDoctor = doctors.find((d) => d.id === form.doctorId);

  const bookedSlotsForDoctor = useMemo(() => {
    return new Set(
      db.appointments
        .filter(
          (a) =>
            a.doctorId === form.doctorId &&
            a.date === form.date &&
            a.status !== 'Cancelled'
        )
        .map((a) => a.timeSlot)
    );
  }, [db.appointments, form.doctorId, form.date]);

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return db.appointments;
    return db.appointments.filter((a) => a.status === statusFilter);
  }, [db.appointments, statusFilter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId || !form.reason.trim()) {
      showToast('error', 'Missing Details', 'Select a patient, doctor, and reason for visit.');
      return;
    }
    const res = createAppointment({
      patientId: form.patientId,
      doctorId: form.doctorId,
      departmentId: form.departmentId,
      date: form.date,
      timeSlot: form.timeSlot,
      visitType: form.visitType,
      reason: form.reason.trim(),
      status: 'Scheduled',
    });
    if (!res.ok) {
      showToast('error', 'Booking Conflict', res.message);
      return;
    }
    showToast('success', 'Appointment Booked', res.message);
    setModalOpen(false);
    setForm((f) => ({ ...f, reason: '' }));
  };

  const columns: TableColumn<Appointment>[] = [
    {
      key: 'appointmentNo',
      header: 'Appt No.',
      sortable: true,
      sortValue: (r) => r.appointmentNo,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.appointmentNo}</span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (r) => {
        const pat = db.patients.find((p) => p.id === r.patientId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{pat?.fullName || 'Unknown'}</p>
            <p className="font-mono text-[11px] text-slate-500">{pat?.patientId || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'doctor',
      header: 'Doctor & Department',
      render: (r) => {
        const doc = db.users.find((u) => u.id === r.doctorId);
        const dept = db.departments.find((d) => d.id === r.departmentId);
        return (
          <div>
            <p className="font-medium text-slate-900">{doc?.name || '—'}</p>
            <p className="text-xs text-slate-500">{dept?.name || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'schedule',
      header: 'Date & Slot',
      sortable: true,
      sortValue: (r) => `${r.date} ${r.timeSlot}`,
      render: (r) => (
        <div className="text-xs tabular-nums">
          <p className="font-medium text-slate-900">{formatDate(r.date)}</p>
          <p className="font-mono text-slate-500">{r.timeSlot}</p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'Reason',
      render: (r) => <span className="text-xs text-slate-700 max-w-xs block truncate">{r.reason}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge label={r.status} />,
    },
    {
      key: 'update',
      header: 'Check-In / Flow',
      align: 'right',
      render: (r) => (
        <select
          value={r.status}
          onChange={(e) => {
            updateAppointmentStatus(r.id, e.target.value as AppointmentStatus);
            showToast('info', 'Status Updated', `${r.appointmentNo} marked ${e.target.value}.`);
          }}
          aria-label={`Status for ${r.appointmentNo}`}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Checked In">Checked In</option>
          <option value="In Consultation">In Consultation</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Appointments & Doctor Availability"
      breadcrumb="HMIS / Registration / Scheduling"
    >
      <div className="space-y-6">
        {/* Live Doctor Availability Strip */}
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Doctor Availability Directory
            </h2>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
            >
              <Plus className="h-4 w-4" />
              Schedule Appointment
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {doctors.map((doc) => {
              const dept = db.departments.find((d) => d.id === doc.departmentId)?.name || '—';
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 flex flex-col justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {dept} · {doc.specialization || 'Consultant'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge label={doc.availabilityStatus || 'Available'} />
                    <button
                      type="button"
                      disabled={
                        doc.availabilityStatus === 'On Leave' ||
                        doc.availabilityStatus === 'Off Duty'
                      }
                      onClick={() => {
                        setForm((f) => ({
                          ...f,
                          doctorId: doc.id,
                          departmentId: doc.departmentId,
                        }));
                        setModalOpen(true);
                      }}
                      className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                      Book
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by appointment no, patient name, or doctor..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            const doc = db.users.find((u) => u.id === r.doctorId);
            return (
              r.appointmentNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q) ||
              (pat?.patientId || '').toLowerCase().includes(q) ||
              (doc?.name || '').toLowerCase().includes(q)
            );
          }}
          filterControls={
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | AppointmentStatus)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Checked In">Checked In</option>
              <option value="In Consultation">In Consultation</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule New Appointment"
        subtitle="Select patient, department, available physician, and open time slot."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
              <select
                value={form.patientId}
                onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {db.patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.patientId} — {p.fullName} ({p.age}y, {p.gender})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Department *
              </label>
              <select
                value={form.departmentId}
                onChange={(e) => {
                  const deptId = e.target.value;
                  const matchingDoc = doctors.find((d) => d.departmentId === deptId);
                  setForm((f) => ({
                    ...f,
                    departmentId: deptId,
                    doctorId: matchingDoc ? matchingDoc.id : f.doctorId,
                  }));
                }}
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Doctor *</label>
                {selectedDoctor && (
                  <StatusBadge label={selectedDoctor.availabilityStatus || 'Available'} />
                )}
              </div>
              <select
                value={form.doctorId}
                onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.availabilityStatus || 'Available'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                min={getTodayISO()}
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Visit Type
              </label>
              <select
                value={form.visitType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, visitType: e.target.value as RegistrationType }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="Outpatient (OPD)">Outpatient (OPD)</option>
                <option value="Emergency">Emergency</option>
                <option value="Inpatient (IPD)">Inpatient (IPD)</option>
                <option value="Referral">Referral</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Available Time Slots ({formatDate(form.date)})
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const taken = bookedSlotsForDoctor.has(slot);
                  const active = form.timeSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={taken}
                      onClick={() => setForm((f) => ({ ...f, timeSlot: slot }))}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-mono transition-colors ${
                        taken
                          ? 'border-slate-200 bg-slate-100 text-slate-400 line-through cursor-not-allowed'
                          : active
                          ? 'border-[#0F2942] bg-[#0F2942] text-white font-semibold'
                          : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Visit / Chief Complaint *
              </label>
              <input
                type="text"
                required
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="e.g. Routine cardiology follow-up"
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
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              <CalendarPlus className="h-4 w-4" />
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
