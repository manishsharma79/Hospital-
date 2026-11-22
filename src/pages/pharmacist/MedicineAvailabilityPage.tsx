import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Medicine } from '../../types/hmis';
import { getMedicineExpiryStatus, isLowStock } from '../../utils/hmisHelpers';

export const MedicineAvailabilityPage: React.FC = () => {
  const { db, adjustMedicineStock } = useHMIS();
  const { showToast } = useToast();

  const [filter, setFilter] = useState<'all' | 'low' | 'out' | 'healthy'>('all');
  const [restockTarget, setRestockTarget] = useState<Medicine | null>(null);
  const [restockQty, setRestockQty] = useState(50);

  const filtered = useMemo(() => {
    return db.medicines.filter((m) => {
      if (filter === 'out') return m.availableQuantity === 0;
      if (filter === 'low') return m.availableQuantity > 0 && isLowStock(m);
      if (filter === 'healthy') return !isLowStock(m);
      return true;
    });
  }, [db.medicines, filter]);

  const lowCount = db.medicines.filter((m) => isLowStock(m)).length;

  const handleRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockTarget || restockQty <= 0) return;
    const res = adjustMedicineStock(restockTarget.id, Number(restockQty));
    if (res.ok) {
      showToast('success', 'Stock Replenished', `${restockTarget.name}: ${res.message}`);
      setRestockTarget(null);
    }
  };

  const columns: TableColumn<Medicine>[] = [
    {
      key: 'medicineId',
      header: 'Medicine ID',
      render: (r) => <span className="font-mono text-xs font-semibold">{r.medicineId}</span>,
    },
    {
      key: 'name',
      header: 'Medicine & Batch',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.name}</p>
          <p className="text-xs font-mono text-slate-500">
            Batch {r.batchNumber} · {r.category}
          </p>
        </div>
      ),
    },
    {
      key: 'availableQuantity',
      header: 'Available Units',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.availableQuantity,
      render: (r) => (
        <span className="font-mono text-sm font-bold tabular-nums text-slate-900">
          {r.availableQuantity}
        </span>
      ),
    },
    {
      key: 'reorderLevel',
      header: 'Reorder Level',
      align: 'right',
      render: (r) => <span className="font-mono text-xs tabular-nums text-slate-500">{r.reorderLevel}</span>,
    },
    {
      key: 'stockStatus',
      header: 'Stock Status',
      render: (r) => {
        if (r.availableQuantity === 0) return <StatusBadge label="Out of Stock" tone="danger" />;
        if (isLowStock(r)) return <StatusBadge label="Low Stock Alert" tone="warning" />;
        return <StatusBadge label="In Stock" tone="success" />;
      },
    },
    {
      key: 'expiry',
      header: 'Batch Integrity',
      render: (r) => <StatusBadge label={getMedicineExpiryStatus(r.expiryDate).status} />,
    },
    {
      key: 'actions',
      header: 'Replenish',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => {
            setRestockTarget(r);
            setRestockQty(50);
          }}
          className="inline-flex items-center gap-1 rounded-md bg-[#0F2942] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#173B5E]"
        >
          <PackagePlus className="h-3.5 w-3.5" />
          Update Stock
        </button>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Medicine Availability & Low-Stock Alerts"
      breadcrumb="HMIS / Pharmacy / Stock Readiness"
    >
      <div className="space-y-4">
        {lowCount > 0 ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              <strong>{lowCount} medicine item(s)</strong> are at or below their minimum reorder threshold. Replenish stock to prevent prescription delays.
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>All medicines are currently stocked above reorder thresholds.</span>
          </div>
        )}

        <DataTable
          data={filtered}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search medicine availability by name, ID, or category..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.medicineId.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
          }
          filterControls={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(
                [
                  { id: 'all', label: 'All Items' },
                  { id: 'low', label: 'Low Stock' },
                  { id: 'out', label: 'Out of Stock' },
                  { id: 'healthy', label: 'Healthy Stock' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <Modal
        open={Boolean(restockTarget)}
        onClose={() => setRestockTarget(null)}
        title={`Replenish Stock · ${restockTarget?.name || ''}`}
        maxWidthClass="max-w-sm"
      >
        <form onSubmit={handleRestock} className="space-y-4">
          <p className="text-xs text-slate-600">
            Current available units:{' '}
            <strong className="font-mono text-slate-900">
              {restockTarget?.availableQuantity}
            </strong>
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Units to Add *
            </label>
            <input
              type="number"
              min={1}
              required
              value={restockQty}
              onChange={(e) => setRestockQty(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRestockTarget(null)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              Confirm Restock
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
