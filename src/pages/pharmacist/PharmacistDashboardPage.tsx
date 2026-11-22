import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  CreditCard,
  PackageSearch,
  Pill,
} from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { formatDate, getMedicineExpiryStatus, isLowStock } from '../../utils/hmisHelpers';

export const PharmacistDashboardPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();

  const lowStock = db.medicines.filter((m) => isLowStock(m));
  const expired = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Expired'
  );
  const nearExpiry = db.medicines.filter(
    (m) => getMedicineExpiryStatus(m.expiryDate).status === 'Near Expiry'
  );
  const pendingRx = db.prescriptions.filter((p) => p.status === 'Pending Verification');

  return (
    <AppShell
      pageTitle="Clinical Pharmacy Dashboard"
      breadcrumb="HMIS / Pharmacy / Operations Overview"
    >
      <div className="space-y-6">
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Medicine SKUs"
            value={db.medicines.length}
            detail={`${db.medicines.reduce((s, m) => s + m.availableQuantity, 0)} total units in stock`}
            icon={Pill}
            tone="navy"
            onClick={() => navigate('/pharmacist/inventory')}
          />
          <StatCard
            label="Pending Prescriptions"
            value={pendingRx.length}
            detail="Ready for verification & dispensing"
            icon={ClipboardCheck}
            tone="blue"
            onClick={() => navigate('/pharmacist/prescriptions')}
          />
          <StatCard
            label="Low-Stock Alerts"
            value={lowStock.length}
            detail="At or below reorder threshold"
            icon={PackageSearch}
            tone="amber"
            onClick={() => navigate('/pharmacist/availability')}
          />
          <StatCard
            label="Expiry Warnings"
            value={expired.length + nearExpiry.length}
            detail={`${expired.length} expired · ${nearExpiry.length} near expiry`}
            icon={AlertTriangle}
            tone={expired.length > 0 ? 'red' : 'amber'}
            onClick={() => navigate('/pharmacist/expiry')}
          />
        </section>

        {/* Quick Actions */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Pharmacy Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => navigate('/pharmacist/prescriptions')}
              className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-left hover:bg-blue-100/70 transition-colors"
            >
              <ClipboardCheck className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Verify Prescriptions</p>
                <p className="text-xs text-slate-600">{pendingRx.length} pending orders</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/pharmacist/inventory')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <Pill className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Manage Inventory</p>
                <p className="text-xs text-slate-500">Add or adjust medicine stock</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/pharmacist/expiry')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <CalendarClock className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Expiry Monitor</p>
                <p className="text-xs text-slate-500">Audit expiring batches</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => navigate('/pharmacist/billing')}
              className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-left hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
            >
              <CreditCard className="h-5 w-5 text-[#0F2942] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Billing &amp; Payments</p>
                <p className="text-xs text-slate-500">Settle patient invoices</p>
              </div>
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Prescriptions Queue */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">
                Prescriptions Awaiting Verification
              </h2>
              <button
                type="button"
                onClick={() => navigate('/pharmacist/prescriptions')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Process Queue
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {pendingRx.length === 0 ? (
                <p className="px-5 py-8 text-center text-xs text-slate-500">
                  All prescriptions have been processed.
                </p>
              ) : (
                pendingRx.map((rx) => {
                  const pat = db.patients.find((p) => p.id === rx.patientId);
                  const doc = db.users.find((u) => u.id === rx.doctorId);
                  return (
                    <div key={rx.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          <span className="font-mono text-xs text-blue-700 mr-2">
                            {rx.prescriptionNo}
                          </span>
                          {pat?.fullName || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {rx.items.length} item(s) · Prescribed by {doc?.name || 'Doctor'} on{' '}
                          {formatDate(rx.prescribedDate)}
                        </p>
                      </div>
                      <StatusBadge label={rx.status} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Critical Stock & Expiry Warnings */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-slate-900">
                Stock &amp; Expiry Watchlist
              </h2>
              <button
                type="button"
                onClick={() => navigate('/pharmacist/expiry')}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Inspect All
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {db.medicines
                .filter(
                  (m) => isLowStock(m) || getMedicineExpiryStatus(m.expiryDate).status !== 'Valid'
                )
                .map((m) => {
                  const exp = getMedicineExpiryStatus(m.expiryDate);
                  return (
                    <div key={m.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{m.name}</p>
                        <p className="text-xs font-mono text-slate-500 truncate">
                          Batch {m.batchNumber} · Stock: {m.availableQuantity} · Exp: {m.expiryDate}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isLowStock(m) && <StatusBadge label="Low Stock" tone="warning" />}
                        {exp.status !== 'Valid' && <StatusBadge label={exp.status} />}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
};
