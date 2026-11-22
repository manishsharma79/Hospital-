import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Medicine } from '../../types/hmis';
import {
  formatCurrency,
  formatDate,
  getMedicineExpiryStatus,
  getTodayISO,
  isLowStock,
} from '../../utils/hmisHelpers';

export const MedicineInventoryPage: React.FC = () => {
  const { db, saveMedicine, deleteMedicine, adjustMedicineStock } = useHMIS();
  const { showToast } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);

  const [form, setForm] = useState({
    name: '',
    batchNumber: '',
    category: 'Antibiotic',
    availableQuantity: 100,
    reorderLevel: 30,
    unitPrice: 45,
    expiryDate: getTodayISO(),
    supplier: '',
  });

  const openAdd = () => {
    setEditingId(undefined);
    setForm({
      name: '',
      batchNumber: '',
      category: 'Antibiotic',
      availableQuantity: 100,
      reorderLevel: 30,
      unitPrice: 45,
      expiryDate: getTodayISO(),
      supplier: '',
    });
    setModalOpen(true);
  };

  const openEdit = (med: Medicine) => {
    setEditingId(med.id);
    setForm({
      name: med.name,
      batchNumber: med.batchNumber,
      category: med.category,
      availableQuantity: med.availableQuantity,
      reorderLevel: med.reorderLevel,
      unitPrice: med.unitPrice,
      expiryDate: med.expiryDate,
      supplier: med.supplier,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.batchNumber.trim() || !form.supplier.trim()) {
      showToast('error', 'Missing Fields', 'Medicine name, batch number, and supplier are required.');
      return;
    }
    const res = saveMedicine({
      id: editingId,
      name: form.name.trim(),
      batchNumber: form.batchNumber.trim(),
      category: form.category.trim(),
      availableQuantity: Number(form.availableQuantity),
      reorderLevel: Number(form.reorderLevel),
      unitPrice: Number(form.unitPrice),
      expiryDate: form.expiryDate,
      supplier: form.supplier.trim(),
    });
    if (!res.ok) {
      showToast('error', 'Save Failed', res.message);
      return;
    }
    showToast('success', editingId ? 'Medicine Updated' : 'Medicine Added', res.message);
    setModalOpen(false);
  };

  const columns: TableColumn<Medicine>[] = [
    {
      key: 'medicineId',
      header: 'Medicine ID',
      sortable: true,
      sortValue: (r) => r.medicineId,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.medicineId}</span>
      ),
    },
    {
      key: 'name',
      header: 'Medicine Name',
      sortable: true,
      sortValue: (r) => r.name,
      render: (r) => <span className="font-semibold text-slate-900">{r.name}</span>,
    },
    {
      key: 'batchNumber',
      header: 'Batch Number',
      render: (r) => <span className="font-mono text-xs text-slate-700">{r.batchNumber}</span>,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      sortValue: (r) => r.category,
      render: (r) => <span className="text-xs text-slate-700">{r.category}</span>,
    },
    {
      key: 'availableQuantity',
      header: 'Available Quantity',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.availableQuantity,
      render: (r) => (
        <div className="inline-flex items-center gap-2">
          <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
            {r.availableQuantity}
          </span>
          {isLowStock(r) && <StatusBadge label="Low" tone="warning" />}
        </div>
      ),
    },
    {
      key: 'unitPrice',
      header: 'Unit Price',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.unitPrice,
      render: (r) => (
        <span className="font-mono text-xs tabular-nums text-slate-800">
          {formatCurrency(r.unitPrice)}
        </span>
      ),
    },
    {
      key: 'expiryDate',
      header: 'Expiry Date',
      sortable: true,
      sortValue: (r) => r.expiryDate,
      render: (r) => {
        const exp = getMedicineExpiryStatus(r.expiryDate);
        return (
          <div className="flex items-center gap-2">
            <span className="text-xs tabular-nums whitespace-nowrap">
              {formatDate(r.expiryDate)}
            </span>
            {exp.status !== 'Valid' && <StatusBadge label={exp.status} />}
          </div>
        );
      },
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (r) => <span className="text-xs text-slate-700">{r.supplier}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const res = adjustMedicineStock(r.id, 25);
              if (res.ok) showToast('info', 'Restocked +25', `${r.name}: ${res.message}`);
            }}
            className="rounded-md border border-slate-200 px-2 py-1 text-[11px] font-mono font-semibold text-blue-700 hover:bg-blue-50"
            title="Quick restock +25 units"
          >
            +25
          </button>
          <button
            type="button"
            onClick={() => openEdit(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Edit medicine"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700"
            title="Delete medicine"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Medicine Inventory Management"
      breadcrumb="HMIS / Pharmacy / Stock Ledger"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Maintain batch-level medicine stock, pricing, supplier records, and expiry dates.
          </p>
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Medicine
          </button>
        </div>

        <DataTable
          data={db.medicines}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by medicine name, ID, batch, category, or supplier..."
          searchFilter={(r, q) =>
            r.name.toLowerCase().includes(q) ||
            r.medicineId.toLowerCase().includes(q) ||
            r.batchNumber.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q) ||
            r.supplier.toLowerCase().includes(q)
          }
        />
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? 'Edit Medicine Record' : 'Add New Medicine Batch'}
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Medicine Name *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Azithromycin 500mg"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Batch Number *
              </label>
              <input
                type="text"
                required
                value={form.batchNumber}
                onChange={(e) => setForm((f) => ({ ...f, batchNumber: e.target.value }))}
                placeholder="BCH-26-101A"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category *</label>
              <input
                type="text"
                required
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Quantity *
              </label>
              <input
                type="number"
                min={0}
                required
                value={form.availableQuantity}
                onChange={(e) =>
                  setForm((f) => ({ ...f, availableQuantity: Number(e.target.value) }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Low-Stock Alert Threshold
              </label>
              <input
                type="number"
                min={0}
                value={form.reorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, reorderLevel: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Price (₹) *
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.unitPrice}
                onChange={(e) => setForm((f) => ({ ...f, unitPrice: Number(e.target.value) }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={form.expiryDate}
                onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier *</label>
              <input
                type="text"
                required
                value={form.supplier}
                onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
                placeholder="e.g. Cipla Healthcare Ltd."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              {editingId ? 'Save Changes' : 'Add Medicine'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Remove Medicine from Inventory"
        message={`Delete ${deleteTarget?.name} (Batch ${deleteTarget?.batchNumber}) from the pharmacy inventory?`}
        confirmLabel="Delete Medicine"
        onConfirm={() => {
          if (!deleteTarget) return;
          const res = deleteMedicine(deleteTarget.id);
          if (res.ok) showToast('success', 'Removed', res.message);
        }}
      />
    </AppShell>
  );
};
