import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardCheck, ShieldAlert, XCircle } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Prescription, PrescriptionStatus } from '../../types/hmis';
import { formatDate, getMedicineExpiryStatus } from '../../utils/hmisHelpers';

export const VerifyPrescriptionsPage: React.FC = () => {
  const { db, verifyAndDispensePrescription, rejectPrescription } = useHMIS();
  const { showToast } = useToast();

  const [statusFilter, setStatusFilter] = useState<'all' | PrescriptionStatus>('all');
  const [activeRx, setActiveRx] = useState<Prescription | null>(null);
  const [notes, setNotes] = useState('');

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return db.prescriptions;
    return db.prescriptions.filter((p) => p.status === statusFilter);
  }, [db.prescriptions, statusFilter]);

  const checkSafety = (rx: Prescription) => {
    const warnings: string[] = [];
    let hasBlocker = false;

    rx.items.forEach((item) => {
      const med = db.medicines.find((m) => m.id === item.medicineId);
      if (!med) {
        warnings.push(`${item.medicineName}: Not found in inventory.`);
        hasBlocker = true;
        return;
      }
      const exp = getMedicineExpiryStatus(med.expiryDate);
      if (exp.status === 'Expired') {
        warnings.push(`${med.name} (Batch ${med.batchNumber}): EXPIRED on ${med.expiryDate}.`);
        hasBlocker = true;
      } else if (exp.status === 'Near Expiry') {
        warnings.push(`${med.name}: Near expiry (${exp.daysRemaining} days remaining).`);
      }
      if (med.availableQuantity < item.quantityRequested) {
        warnings.push(
          `${med.name}: Insufficient stock (requested ${item.quantityRequested}, available ${med.availableQuantity}).`
        );
        hasBlocker = true;
      }
    });
    return { warnings, hasBlocker };
  };

  const handleDispense = () => {
    if (!activeRx) return;
    const res = verifyAndDispensePrescription(activeRx.id, notes);
    if (!res.ok) {
      showToast('error', 'Dispense Blocked', res.message);
      return;
    }
    showToast('success', 'Verified & Dispensed', res.message);
    setActiveRx(null);
    setNotes('');
  };

  const handleReject = () => {
    if (!activeRx) return;
    const res = rejectPrescription(activeRx.id, notes || 'Rejected during pharmacist review');
    if (res.ok) {
      showToast('info', 'Prescription Rejected', res.message);
      setActiveRx(null);
      setNotes('');
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
      header: 'Doctor',
      render: (r) => {
        const doc = db.users.find((u) => u.id === r.doctorId);
        return <span className="text-xs font-medium text-slate-800">{doc?.name || '—'}</span>;
      },
    },
    {
      key: 'items',
      header: 'Prescribed Items',
      render: (r) => (
        <ul className="text-xs text-slate-700 space-y-0.5">
          {r.items.map((it, idx) => (
            <li key={idx}>
              {it.medicineName} · Qty {it.quantityRequested}
            </li>
          ))}
        </ul>
      ),
    },
    {
      key: 'date',
      header: 'Prescribed',
      sortable: true,
      sortValue: (r) => r.prescribedDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.prescribedDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge label={r.status} />,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setActiveRx(r);
            setNotes(r.pharmacistNotes || '');
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2942] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          {r.status === 'Pending Verification' ? 'Verify & Dispense' : 'Inspect'}
        </button>
      ),
    },
  ];

  const safety = activeRx ? checkSafety(activeRx) : { warnings: [], hasBlocker: false };

  return (
    <AppShell
      pageTitle="Verify & Dispense Prescriptions"
      breadcrumb="HMIS / Pharmacy / Prescription Verification"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Review doctor prescriptions, validate stock &amp; batch expiry dates, and dispense medicines with automatic inventory deduction and billing.
        </p>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by Rx number, patient, or doctor..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            const doc = db.users.find((u) => u.id === r.doctorId);
            return (
              r.prescriptionNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q) ||
              (doc?.name || '').toLowerCase().includes(q)
            );
          }}
          filterControls={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'Pending Verification', 'Verified & Dispensed', 'Rejected'] as const).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      statusFilter === st
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {st === 'all' ? 'All Prescriptions' : st}
                  </button>
                )
              )}
            </div>
          }
        />
      </div>

      <Modal
        open={Boolean(activeRx)}
        onClose={() => setActiveRx(null)}
        title={activeRx ? `Prescription Review · ${activeRx.prescriptionNo}` : ''}
        subtitle={
          activeRx
            ? `Patient: ${
                db.patients.find((p) => p.id === activeRx.patientId)?.fullName || ''
              } · Doctor: ${
                db.users.find((u) => u.id === activeRx.doctorId)?.name || ''
              }`
            : ''
        }
        maxWidthClass="max-w-2xl"
      >
        {activeRx && (
          <div className="space-y-4">
            {safety.warnings.length > 0 && (
              <div
                className={`rounded-lg border p-3.5 text-xs space-y-1 ${
                  safety.hasBlocker
                    ? 'border-red-200 bg-red-50 text-red-900'
                    : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold">
                  {safety.hasBlocker ? (
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                  )}
                  <span>
                    {safety.hasBlocker
                      ? 'Dispensing Blocked — Safety / Stock Issue'
                      : 'Pharmacist Advisory Warning'}
                  </span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5">
                  {safety.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Medicine</th>
                  <th className="px-3 py-2">Dosage &amp; Regimen</th>
                  <th className="px-3 py-2 text-right">Requested</th>
                  <th className="px-3 py-2 text-right">In Stock</th>
                  <th className="px-3 py-2">Batch Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeRx.items.map((item, idx) => {
                  const med = db.medicines.find((m) => m.id === item.medicineId);
                  const exp = med ? getMedicineExpiryStatus(med.expiryDate) : null;
                  const insufficient = !med || med.availableQuantity < item.quantityRequested;
                  return (
                    <tr key={idx}>
                      <td className="px-3 py-2.5 font-semibold text-slate-900">
                        {item.medicineName}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600">
                        {item.dosage} · {item.frequency} ({item.durationDays}d)
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums">
                        {item.quantityRequested}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-right font-mono font-semibold tabular-nums ${
                          insufficient ? 'text-red-700' : 'text-emerald-700'
                        }`}
                      >
                        {med ? med.availableQuantity : 0}
                      </td>
                      <td className="px-3 py-2.5">
                        {med && exp ? (
                          <StatusBadge
                            label={exp.status === 'Valid' ? formatDate(med.expiryDate) : exp.status}
                          />
                        ) : (
                          <StatusBadge label="Missing" tone="danger" />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pharmacist Verification / Counseling Notes
              </label>
              <textarea
                rows={2}
                disabled={activeRx.status !== 'Pending Verification'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Counseling notes, batch check confirmation, or rejection reason..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setActiveRx(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Close
              </button>
              {activeRx.status === 'Pending Verification' && (
                <>
                  <button
                    type="button"
                    onClick={handleReject}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={safety.hasBlocker}
                    onClick={handleDispense}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Verify, Dispense &amp; Generate Bill
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};
