import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Eye, FileText, Stethoscope, Users } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { PrescriptionViewModal } from '../../components/pharmacist/PrescriptionViewModal';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { Prescription, PrescriptionStatus } from '../../types/hmis';
import { formatDate } from '../../utils/hmisHelpers';

export const DoctorPrescriptionsViewPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();

  const [doctorFilter, setDoctorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PrescriptionStatus>('all');
  const [viewingRx, setViewingRx] = useState<Prescription | null>(null);

  const doctors = useMemo(
    () => db.users.filter((u) => u.role === 'doctor'),
    [db.users]
  );

  const filtered = useMemo(() => {
    return db.prescriptions.filter((rx) => {
      if (doctorFilter !== 'all' && rx.doctorId !== doctorFilter) return false;
      if (statusFilter !== 'all' && rx.status !== statusFilter) return false;
      return true;
    });
  }, [db.prescriptions, doctorFilter, statusFilter]);

  const pendingCount = db.prescriptions.filter((p) => p.status === 'Pending Verification').length;
  const dispensedCount = db.prescriptions.filter((p) => p.status === 'Verified & Dispensed').length;

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
      sortable: true,
      sortValue: (r) => db.patients.find((p) => p.id === r.patientId)?.fullName || '',
      render: (r) => {
        const pat = db.patients.find((p) => p.id === r.patientId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{pat?.fullName || 'Unknown'}</p>
            <p className="font-mono text-[11px] text-slate-500">
              {pat?.patientId || '—'} · {pat ? `${pat.age}y / ${pat.gender}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      key: 'doctor',
      header: 'Prescribing Doctor',
      sortable: true,
      sortValue: (r) => db.users.find((u) => u.id === r.doctorId)?.name || '',
      render: (r) => {
        const doc = db.users.find((u) => u.id === r.doctorId);
        return (
          <div>
            <p className="text-xs font-semibold text-slate-900">{doc?.name || '—'}</p>
            <p className="text-[11px] text-slate-500">{doc?.specialization || 'Physician'}</p>
          </div>
        );
      },
    },
    {
      key: 'diagnosis',
      header: 'Diagnosis',
      render: (r) => {
        const rec =
          (r.medicalRecordId
            ? db.medicalRecords.find((m) => m.id === r.medicalRecordId)
            : undefined) ||
          db.medicalRecords.find(
            (m) => m.patientId === r.patientId && m.doctorId === r.doctorId
          );
        return rec ? (
          <div className="max-w-[200px]">
            <p className="text-xs font-medium text-slate-800 truncate">{rec.diagnosis}</p>
            {rec.icdCode && (
              <p className="font-mono text-[11px] text-slate-500">ICD: {rec.icdCode}</p>
            )}
          </div>
        ) : (
          <span className="text-xs text-slate-400">Direct Rx</span>
        );
      },
    },
    {
      key: 'items',
      header: 'Prescribed Medicines',
      render: (r) => (
        <ul className="text-xs text-slate-700 space-y-0.5">
          {r.items.map((it, idx) => (
            <li key={idx}>
              <span className="font-medium text-slate-900">{it.medicineName}</span>{' '}
              <span className="text-slate-500">
                ({it.dosage} · {it.frequency} · {it.durationDays}d · Qty {it.quantityRequested})
              </span>
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
      header: 'Status',
      render: (r) => <StatusBadge label={r.status} />,
    },
    {
      key: 'actions',
      header: 'View',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => setViewingRx(r)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2942] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
        >
          <Eye className="h-3.5 w-3.5" />
          View Prescription
        </button>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Doctor Prescriptions"
      breadcrumb="HMIS / Pharmacy / View Doctor Prescriptions"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Prescriptions"
            value={db.prescriptions.length}
            detail="All doctor orders in system"
            icon={FileText}
            tone="navy"
          />
          <StatCard
            label="Pending Verification"
            value={pendingCount}
            detail="Awaiting pharmacy dispensing"
            icon={ClipboardCheck}
            tone="amber"
          />
          <StatCard
            label="Verified & Dispensed"
            value={dispensedCount}
            detail="Completed pharmacy orders"
            icon={Users}
            tone="emerald"
          />
          <StatCard
            label="Prescribing Doctors"
            value={doctors.length}
            detail="Active physicians on roster"
            icon={Stethoscope}
            tone="blue"
          />
        </section>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by Rx no, patient, doctor, or medicine..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            const doc = db.users.find((u) => u.id === r.doctorId);
            const medMatch = r.items.some((i) => i.medicineName.toLowerCase().includes(q));
            return (
              r.prescriptionNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q) ||
              (pat?.patientId || '').toLowerCase().includes(q) ||
              (doc?.name || '').toLowerCase().includes(q) ||
              medMatch
            );
          }}
          filterControls={
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={doctorFilter}
                onChange={(e) => setDoctorFilter(e.target.value)}
                aria-label="Filter by Doctor"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">All Doctors</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>

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
                      {st === 'all' ? 'All' : st}
                    </button>
                  )
                )}
              </div>
            </div>
          }
        />
      </div>

      <PrescriptionViewModal
        prescription={viewingRx}
        onClose={() => setViewingRx(null)}
        onGoToVerify={(rx) => {
          setViewingRx(null);
          navigate(`/pharmacist/prescriptions?rx=${rx.id}`);
        }}
      />
    </AppShell>
  );
};
