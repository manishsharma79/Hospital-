import React, { useMemo, useState } from 'react';
import { CreditCard, DollarSign, Eye, Receipt } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { Bill, PaymentStatus } from '../../types/hmis';
import { formatCurrency, formatDate } from '../../utils/hmisHelpers';

export const BillingOverviewPage: React.FC = () => {
  const { db } = useHMIS();
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const totalBilled = db.bills.reduce((s, b) => s + b.grandTotal, 0);
  const collected = db.bills.reduce((s, b) => s + b.paidAmount, 0);
  const outstanding = Math.max(0, totalBilled - collected);

  const filteredBills = useMemo(() => {
    if (statusFilter === 'all') return db.bills;
    return db.bills.filter((b) => b.paymentStatus === statusFilter);
  }, [db.bills, statusFilter]);

  const columns: TableColumn<Bill>[] = [
    {
      key: 'billNo',
      header: 'Invoice No.',
      sortable: true,
      sortValue: (r) => r.billNo,
      render: (r) => <span className="font-mono text-xs font-semibold text-slate-900">{r.billNo}</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (r) => {
        const pat = db.patients.find((p) => p.id === r.patientId);
        return (
          <div>
            <p className="font-semibold text-slate-900">{pat?.fullName || 'Unknown'}</p>
            <p className="text-xs font-mono text-slate-500">{pat?.patientId || '—'}</p>
          </div>
        );
      },
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
        <span className="font-mono text-xs font-semibold tabular-nums text-slate-900">
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
      header: 'Payment Status',
      render: (r) => <StatusBadge label={r.paymentStatus} />,
    },
    {
      key: 'actions',
      header: 'Details',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => setSelectedBill(r)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Billing Overview"
      breadcrumb="HMIS / Administration / Revenue Ledger"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Total Billed Volume"
            value={formatCurrency(totalBilled)}
            detail={`${db.bills.length} invoices issued`}
            icon={Receipt}
            tone="navy"
          />
          <StatCard
            label="Collected Revenue"
            value={formatCurrency(collected)}
            detail={`${db.bills.filter((b) => b.paymentStatus === 'Paid').length} fully settled`}
            icon={DollarSign}
            tone="emerald"
          />
          <StatCard
            label="Outstanding Receivables"
            value={formatCurrency(outstanding)}
            detail={`${db.bills.filter((b) => b.paymentStatus !== 'Paid').length} pending invoices`}
            icon={CreditCard}
            tone="amber"
          />
        </section>

        <DataTable
          data={filteredBills}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by invoice number or patient name..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            return (
              r.billNo.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q) ||
              (pat?.patientId || '').toLowerCase().includes(q)
            );
          }}
          filterControls={
            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['all', 'Paid', 'Partial', 'Unpaid'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    statusFilter === st
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st === 'all' ? 'All Invoices' : st}
                </button>
              ))}
            </div>
          }
        />
      </div>

      <Modal
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        title={`Invoice ${selectedBill?.billNo || ''}`}
        subtitle={`Issued on ${formatDate(selectedBill?.billDate)} · Generated by ${selectedBill?.generatedBy || 'Pharmacy'}`}
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm border-b border-slate-200 pb-3">
              <div>
                <p className="text-xs text-slate-500">Patient</p>
                <p className="font-semibold text-slate-900">
                  {db.patients.find((p) => p.id === selectedBill.patientId)?.fullName || 'Unknown'}
                </p>
              </div>
              <StatusBadge label={selectedBill.paymentStatus} />
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 text-left">Item Description</th>
                  <th className="py-2 text-right">Qty</th>
                  <th className="py-2 text-right">Unit Price</th>
                  <th className="py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedBill.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-slate-800">{item.description}</td>
                    <td className="py-2 text-right font-mono tabular-nums">{item.quantity}</td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums font-medium">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">{formatCurrency(selectedBill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax (5%)</span>
                <span className="font-mono tabular-nums">{formatCurrency(selectedBill.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1">
                <span>Grand Total</span>
                <span className="font-mono tabular-nums">{formatCurrency(selectedBill.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Amount Paid</span>
                <span className="font-mono tabular-nums">{formatCurrency(selectedBill.paidAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </AppShell>
  );
};
