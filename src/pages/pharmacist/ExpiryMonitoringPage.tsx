import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { Medicine } from '../../types/hmis';
import { formatDate, getMedicineExpiryStatus } from '../../utils/hmisHelpers';

export const ExpiryMonitoringPage: React.FC = () => {
  const { db } = useHMIS();
  const [filter, setFilter] = useState<'all' | 'Expired' | 'Near Expiry' | 'Valid'>('all');

  const expired = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Expired'
  );
  const nearExpiry = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Near Expiry'
  );
  const valid = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Valid'
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return db.medicines;
    return db.medicines.filter((m) => getMedicineExpiryStatus(m.expiryDate).status === filter);
  }, [db.medicines, filter]);

  const columns: TableColumn<Medicine>[] = [
    {
      key: 'medicineId',
      header: 'Medicine ID',
      render: (r) => <span className="font-mono text-xs font-semibold">{r.medicineId}</span>,
    },
    {
      key: 'name',
      header: 'Medicine Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.name}</p>
          <p className="text-xs font-mono text-slate-500">Batch {r.batchNumber}</p>
        </div>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Units Affected',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-xs font-semibold tabular-nums">{r.availableQuantity}</span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      sortValue: (r) => r.expiryDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.expiryDate)}</span>,
    },
    {
      key: 'daysRemaining',
      header: 'Timeline',
      sortable: true,
      sortValue: (r) => getMedicineExpiryStatus(r.expiryDate).daysRemaining,
      render: (r) => {
        const { daysRemaining } = getMedicineExpiryStatus(r.expiryDate);
        return (
          <span
            className={`font-mono text-xs font-semibold tabular-nums ${
              daysRemaining < 0
                ? 'text-red-700'
                : daysRemaining <= 60
                ? 'text-amber-700'
                : 'text-emerald-700'
            }`}
          >
            {daysRemaining < 0
              ? `Expired ${Math.abs(daysRemaining)}d ago`
              : `${daysRemaining} days left`}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Safety Status',
      render: (r) => <StatusBadge label={getMedicineExpiryStatus(r.expiryDate).status} />,
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => <span className="text-xs text-slate-600">{r.supplier}</span>,
    },
  ];

  return (
    <AppShell
      pageTitle="Medicine Expiry Monitoring"
      breadcrumb="HMIS / Pharmacy / Batch Safety Audit"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Expired Medicines (Blocked)"
            value={expired.length}
            detail="Automatically blocked from dispensing"
            icon={ShieldAlert}
            tone="red"
            onClick={() => setFilter('Expired')}
          />
          <StatCard
            label="Near-Expiry (<= 60 Days)"
            value={nearExpiry.length}
            detail="Prioritize FEFO issue or vendor return"
            icon={AlertTriangle}
            tone="amber"
            onClick={() => setFilter('Near Expiry')}
          />
          <StatCard
            label="Valid Shelf-Life Stock"
            value={valid.length}
            detail="More than 60 days remaining"
            icon={CheckCircle2}
            tone="emerald"
            onClick={() => setFilter('Valid')}
          />
        </section>

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search expiring batches by medicine, batch, or supplier..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.batchNumber.toLowerCase().includes(q) ||
            r.supplier.toLowerCase().includes(q)
          }
          filterControls={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'Expired', 'Near Expiry', 'Valid'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'all' ? 'All Batches' : tab}
                </button>
              ))}
            </div>
          }
        />
      </div>
    </AppShell>
  );
};
