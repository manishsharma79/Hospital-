import React, { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Prescription, PrescriptionItem } from '../../types/hmis';
import { formatDate, getMedicineExpiryStatus, getTodayISO } from '../../utils/hmisHelpers';

export const DoctorPrescriptionsPage: React.FC = () => {
  const { db, currentUser, createPrescription } = useHMIS();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [patientId, setPatientId] = useState(db.patients[0]?.id || '');
  const [items, setItems] = useState<PrescriptionItem[]>([]);

  const [medId, setMedId] = useState(db.medicines[0]?.id || '');
  const [dosage, setDosage] = useState('1 tablet');
  const [frequency, setFrequency] = useState('Twice daily');
  const [durationDays, setDurationDays] = useState(7);
  const [quantityRequested, setQuantityRequested] = useState(14);
  const [instructions, setInstructions] = useState('Take with water after meals');

  const addItem = () => {
    const med = db.medicines.find((m) => m.id === medId);
    if (!med) return;
    if (getMedicineExpiryStatus(med.expiryDate).status === 'Expired') {
      showToast('warning', 'Expired Stock', `${med.name} batch is expired and cannot be prescribed.`);
      return;
    }
    setItems((prev) => [
      ...prev,
      {
        medicineId: med.id,
        medicineCode: med.medicineId,
        medicineName: med.name,
        dosage: dosage.trim() || '1 unit',
        frequency: frequency.trim() || 'Once daily',
        durationDays: Math.max(1, durationDays),
        quantityRequested: Math.max(1, quantityRequested),
        instructions: instructions.trim(),
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || items.length === 0) {
      showToast('error', 'Incomplete Prescription', 'Select a patient and add at least one medicine.');
      return;
    }
    const res = createPrescription({
      patientId,
      doctorId: currentUser?.id || 'usr_doc_1',
      prescribedDate: getTodayISO(),
      items,
    });
    if (res.ok) {
      showToast('success', 'Prescription Issued', res.message);
      setItems([]);
      setModalOpen(false);
    }
  };

  const columns: TableColumn<Prescription>[] = [
    {
      key: 'prescriptionNo',
      header: 'Rx No.',
      sortable: true,
      sortValue: (r) => r.prescriptionNo,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.prescriptionNo}</span>
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
      header: 'Prescribing Doctor',
      render: (r) => {
        const doc = db.users.find((u) => u.id === r.doctorId);
        return <span className="text-xs font-medium text-slate-800">{doc?.name || '—'}</span>;
      },
    },
    {
      key: 'medicines',
      header: 'Medicines',
      render: (r) => (
        <ul className="text-xs text-slate-700 space-y-0.5">
          {r.items.map((item, idx) => (
            <li key={idx}>
              {item.medicineName} ({item.quantityRequested} units · {item.frequency})
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortValue: (r) => r.prescribedDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.prescribedDate)}</span>,
    },
    {
      key: 'status',
      header: 'Pharmacy Status',
      render: (r) => <StatusBadge label={r.status} />,
    },
  ];

  return (
    <AppShell
      pageTitle="Medicine Prescriptions"
      breadcrumb="HMIS / Doctor Workspace / E-Prescribing"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Create new patient prescriptions and track pharmacist verification &amp; dispensing status.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Prescription
          </button>
        </div>

        <DataTable
          data={db.prescriptions}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by Rx number, patient name, or medicine..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            return (
              r.prescriptionNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q) ||
              r.items.some((i) => i.medicineName.toLowerCase().includes(q))
            );
          }}
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create Patient Prescription"
        subtitle="Prescriptions are linked to your physician ID and queued for pharmacy verification."
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
            >
              {db.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientId} — {p.fullName} (Allergies: {p.allergies || 'None'})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <p className="text-xs font-semibold text-slate-800">Add Medicine Line Item</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Medicine
                </label>
                <select
                  value={medId}
                  onChange={(e) => setMedId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                >
                  {db.medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Avail: {m.availableQuantity} · Exp: {m.expiryDate})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Dosage
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Frequency
                </label>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Duration (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantityRequested}
                    onChange={(e) => setQuantityRequested(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
              <div className="sm:col-span-2 flex gap-2">
                <input
                  type="text"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Administration instructions..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 whitespace-nowrap"
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-900">{it.medicineName}</p>
                    <p className="text-slate-500">
                      {it.dosage} · {it.frequency} · {it.durationDays} days · Qty:{' '}
                      {it.quantityRequested}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
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
              <FileText className="h-4 w-4" />
              Issue Prescription
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
