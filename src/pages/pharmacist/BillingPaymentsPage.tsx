import React, { useState } from 'react';
import { CreditCard, Plus, Printer, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Bill, BillLineItem, PaymentMethod, PaymentStatus } from '../../types/hmis';
import { formatCurrency, formatDate } from '../../utils/hmisHelpers';

export const BillingPaymentsPage: React.FC = () => {
  const { db, generateBill, updateBillPayment } = useHMIS();
  const { showToast } = useToast();

  const [createOpen, setCreateOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<Bill | null>(null);
  const [payStatus, setPayStatus] = useState<PaymentStatus>('Paid');
  const [payMethod, setPayMethod] = useState<PaymentMethod>('Card');
  const [payAmount, setPayAmount] = useState(0);

  // New Bill Builder
  const [billPatientId, setBillPatientId] = useState(db.patients[0]?.id || '');
  const [billItems, setBillItems] = useState<BillLineItem[]>([
    {
      description: 'OPD Consultation Fee',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 600,
      total: 600,
    },
  ]);
  const [newDesc, setNewDesc] = useState('');
  const [newCat, setNewCat] = useState<BillLineItem['category']>('Pharmacy');
  const [newQty, setNewQty] = useState(1);
  const [newPrice, setNewPrice] = useState(150);

  const openPaymentModal = (bill: Bill) => {
    setPayTarget(bill);
    setPayStatus(bill.paymentStatus === 'Paid' ? 'Paid' : 'Paid');
    setPayMethod(bill.paymentMethod || 'Card');
    setPayAmount(bill.grandTotal);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    const res = updateBillPayment(payTarget.id, Number(payAmount), payStatus, payMethod);
    if (res.ok) {
      showToast('success', 'Payment Updated', res.message);
      setPayTarget(null);
    }
  };

  const addBillLine = () => {
    if (!newDesc.trim()) return;
    const qty = Math.max(1, Number(newQty) || 1);
    const price = Math.max(0, Number(newPrice) || 0);
    setBillItems((prev) => [
      ...prev,
      {
        description: newDesc.trim(),
        category: newCat,
        quantity: qty,
        unitPrice: price,
        total: Number((qty * price).toFixed(2)),
      },
    ]);
    setNewDesc('');
  };

  const handleCreateBill = (e: React.FormEvent) => {
    e.preventDefault();
    const res = generateBill({
      patientId: billPatientId,
      items: billItems,
      paymentStatus: 'Unpaid',
    });
    if (!res.ok) {
      showToast('error', 'Cannot Create Bill', res.message);
      return;
    }
    showToast('success', 'Invoice Generated', res.message);
    setCreateOpen(false);
  };

  const columns: TableColumn<Bill>[] = [
    {
      key: 'billNo',
      header: 'Invoice No.',
      sortable: true,
      sortValue: (r) => r.billNo,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.billNo}</span>
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
      key: 'items',
      header: 'Items',
      render: (r) => (
        <span className="text-xs text-slate-700">{r.items.length} line item(s)</span>
      ),
    },
    {
      key: 'billDate',
      header: 'Bill Date',
      sortable: true,
      sortValue: (r) => r.billDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.billDate)}</span>,
    },
    {
      key: 'grandTotal',
      header: 'Total',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.grandTotal,
      render: (r) => (
        <span className="font-mono text-xs font-semibold tabular-nums">
          {formatCurrency(r.grandTotal)}
        </span>
      ),
    },
    {
      key: 'paidAmount',
      header: 'Paid',
      align: 'right',
      render: (r) => (
        <span className="font-mono text-xs tabular-nums text-emerald-700">
          {formatCurrency(r.paidAmount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <StatusBadge label={r.paymentStatus} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => openPaymentModal(r)}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#0F2942] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
        >
          <CreditCard className="h-3.5 w-3.5" />
          Manage Payment
        </button>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Billing & Patient Payments"
      breadcrumb="HMIS / Pharmacy / Billing Counter"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Generate patient bills, process cash/card/insurance settlements, and print receipts.
          </p>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Generate New Bill
          </button>
        </div>

        <DataTable
          data={db.bills}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by invoice no or patient name..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            return (
              r.billNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q)
            );
          }}
        />
      </div>

      {/* Generate Custom Bill Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Generate Patient Bill"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleCreateBill} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
            <select
              value={billPatientId}
              onChange={(e) => setBillPatientId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {db.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientId} — {p.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end rounded-lg border border-slate-200 bg-slate-50/70 p-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Medicine or service"
                className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Category
              </label>
              <select
                value={newCat}
                onChange={(e) => setNewCat(e.target.value as BillLineItem['category'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
              >
                <option value="Pharmacy">Pharmacy</option>
                <option value="Consultation">Consultation</option>
                <option value="Diagnostic">Diagnostic</option>
                <option value="Service">Service</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qty</label>
              <input
                type="number"
                min={1}
                value={newQty}
                onChange={(e) => setNewQty(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Unit (₹)
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-mono"
              />
            </div>
            <button
              type="button"
              onClick={addBillLine}
              className="rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Add Line
            </button>
          </div>

          <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
            {billItems.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between px-3 py-2 text-xs">
                <span>
                  <strong>{it.description}</strong> ({it.category}) · {it.quantity} ×{' '}
                  {formatCurrency(it.unitPrice)}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold">{formatCurrency(it.total)}</span>
                  <button
                    type="button"
                    onClick={() => setBillItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              Issue Invoice
            </button>
          </div>
        </form>
      </Modal>

      {/* Update Payment & Receipt Modal */}
      <Modal
        open={Boolean(payTarget)}
        onClose={() => setPayTarget(null)}
        title={`Invoice & Payment · ${payTarget?.billNo || ''}`}
      >
        {payTarget && (
          <form onSubmit={handlePaymentSubmit} className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-2 text-xs">
              {payTarget.items.map((it, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {it.description} × {it.quantity}
                  </span>
                  <span className="font-mono">{formatCurrency(it.total)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total (incl. 5% tax)</span>
                <span className="font-mono">{formatCurrency(payTarget.grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={payStatus}
                  onChange={(e) => {
                    const st = e.target.value as PaymentStatus;
                    setPayStatus(st);
                    if (st === 'Paid') setPayAmount(payTarget.grandTotal);
                    if (st === 'Unpaid') setPayAmount(0);
                  }}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm"
                >
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Insurance">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount Paid (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={payTarget.grandTotal}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => window.print()}
                className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Printer className="h-3.5 w-3.5" />
                Print Receipt
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPayTarget(null)}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
                >
                  Save Payment
                </button>
              </div>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};
