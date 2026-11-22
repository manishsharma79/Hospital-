import { Medicine, Patient, UserRole } from '../types/hmis';

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function calculateAgeFromDOB(dob: string): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 0;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return Math.max(0, age);
}

export function generateUniquePatientId(existingPatients: Patient[]): string {
  const year = new Date().getFullYear();
  const existingSet = new Set(existingPatients.map((p) => p.patientId));
  let seq = existingPatients.length + 1001;
  let candidate = `PAT-${year}-${seq}`;
  while (existingSet.has(candidate)) {
    seq += 1;
    candidate = `PAT-${year}-${seq}`;
  }
  return candidate;
}

export function generatePrefixedCode(prefix: string, existingCodes: string[], startAt = 1001): string {
  const existingSet = new Set(existingCodes);
  let num = startAt + existingCodes.length;
  let candidate = `${prefix}-${num}`;
  while (existingSet.has(candidate)) {
    num += 1;
    candidate = `${prefix}-${num}`;
  }
  return candidate;
}

export function generateUID(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(isoStr?: string): string {
  if (!isoStr) return '—';
  const parsed = new Date(isoStr);
  if (Number.isNaN(parsed.getTime())) return isoStr;
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export type ExpiryClassification = 'Expired' | 'Near Expiry' | 'Valid';

export function getMedicineExpiryStatus(expiryDate: string): {
  status: ExpiryClassification;
  daysRemaining: number;
} {
  const today = new Date(getTodayISO() + 'T00:00:00');
  const exp = new Date(expiryDate + 'T00:00:00');
  const diffMs = exp.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (daysRemaining < 0) {
    return { status: 'Expired', daysRemaining };
  }
  if (daysRemaining <= 60) {
    return { status: 'Near Expiry', daysRemaining };
  }
  return { status: 'Valid', daysRemaining };
}

export function isLowStock(medicine: Medicine): boolean {
  return medicine.availableQuantity <= medicine.reorderLevel;
}

export function getRoleHomeRoute(role: UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'registration':
      return '/registration/dashboard';
    case 'doctor':
      return '/doctor/dashboard';
    case 'pharmacist':
      return '/pharmacist/dashboard';
  }
}

export function getRoleLabel(role: UserRole): string {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'registration':
      return 'Registration Staff';
    case 'doctor':
      return 'Doctor';
    case 'pharmacist':
      return 'Pharmacist';
  }
}
