import React, { useMemo, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Building2,
  CalendarClock,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PackageSearch,
  Pill,
  ShieldCheck,
  Stethoscope,
  UserCog,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { UserRole } from '../../types/hmis';
import { getMedicineExpiryStatus, getRoleLabel, isLowStock } from '../../utils/hmisHelpers';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const ROLE_NAV_MAP: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Staff Management', to: '/admin/staff', icon: Users },
    { label: 'Department Management', to: '/admin/departments', icon: Building2 },
    { label: 'Roles & Permissions', to: '/admin/roles', icon: ShieldCheck },
    { label: 'Staff Schedules', to: '/admin/schedules', icon: CalendarClock },
    { label: 'Hospital Overview', to: '/admin/overview', icon: Activity },
    { label: 'Billing Overview', to: '/admin/billing', icon: CreditCard },
  ],
  registration: [
    { label: 'Dashboard', to: '/registration/dashboard', icon: LayoutDashboard },
    { label: 'Register Patient', to: '/registration/register-patient', icon: UserPlus },
    { label: 'Update Patient Details', to: '/registration/update-patient', icon: UserCog },
    { label: 'Registered Patients', to: '/registration/patients', icon: ClipboardList },
    { label: 'Appointments', to: '/registration/appointments', icon: CalendarPlus },
    { label: 'Visit History', to: '/registration/visit-history', icon: History },
  ],
  doctor: [
    { label: 'Dashboard', to: '/doctor/dashboard', icon: LayoutDashboard },
    { label: 'Patient List', to: '/doctor/patients', icon: Users },
    { label: 'Patient History', to: '/doctor/history', icon: History },
    { label: 'Diagnosis & Treatment', to: '/doctor/diagnosis', icon: Stethoscope },
    { label: 'Prescriptions', to: '/doctor/prescriptions', icon: FileText },
    { label: 'Diagnostic Reports', to: '/doctor/reports', icon: FlaskConical },
  ],
  pharmacist: [
    { label: 'Dashboard', to: '/pharmacist/dashboard', icon: LayoutDashboard },
    { label: 'Medicine Inventory', to: '/pharmacist/inventory', icon: Pill },
    { label: 'Medicine Availability', to: '/pharmacist/availability', icon: PackageSearch },
    { label: 'Verify Prescriptions', to: '/pharmacist/prescriptions', icon: ClipboardCheck },
    { label: 'Billing & Payments', to: '/pharmacist/billing', icon: CreditCard },
    { label: 'Expiry Monitoring', to: '/pharmacist/expiry', icon: CalendarClock },
  ],
};

interface AppShellProps {
  pageTitle: string;
  breadcrumb?: string;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ pageTitle, breadcrumb, children }) => {
  const { currentUser, logout, db } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const navItems = currentUser ? ROLE_NAV_MAP[currentUser.role] : [];
  const deptName =
    db.departments.find((d) => d.id === currentUser?.departmentId)?.name || 'Hospital Operations';

  const notifications = useMemo(() => {
    if (!currentUser) return [];
    const alerts: Array<{ id: string; title: string; detail: string; to: string }> = [];

    if (currentUser.role === 'pharmacist' || currentUser.role === 'admin') {
      const expired = db.medicines.filter((m) => getMedicineExpiryStatus(m.expiryDate).status === 'Expired');
      const near = db.medicines.filter((m) => getMedicineExpiryStatus(m.expiryDate).status === 'Near Expiry');
      const low = db.medicines.filter((m) => isLowStock(m));
      const pendingRx = db.prescriptions.filter((r) => r.status === 'Pending Verification');

      if (expired.length > 0) {
        alerts.push({
          id: 'al_exp',
          title: `${expired.length} Expired Medicine Batch${expired.length > 1 ? 'es' : ''}`,
          detail: `${expired[0].name} requires quarantine.`,
          to: currentUser.role === 'pharmacist' ? '/pharmacist/expiry' : '/admin/overview',
        });
      }
      if (near.length > 0) {
        alerts.push({
          id: 'al_near',
          title: `${near.length} Near-Expiry Stock Item${near.length > 1 ? 's' : ''}`,
          detail: 'Expiring within 60 days.',
          to: currentUser.role === 'pharmacist' ? '/pharmacist/expiry' : '/admin/overview',
        });
      }
      if (low.length > 0) {
        alerts.push({
          id: 'al_low',
          title: `${low.length} Low-Stock Alert${low.length > 1 ? 's' : ''}`,
          detail: `${low[0].name} is at ${low[0].availableQuantity} units.`,
          to: currentUser.role === 'pharmacist' ? '/pharmacist/availability' : '/admin/overview',
        });
      }
      if (pendingRx.length > 0 && currentUser.role === 'pharmacist') {
        alerts.push({
          id: 'al_rx',
          title: `${pendingRx.length} Pending Prescription${pendingRx.length > 1 ? 's' : ''}`,
          detail: 'Awaiting pharmacist verification & dispensing.',
          to: '/pharmacist/prescriptions',
        });
      }
    }

    if (currentUser.role === 'doctor') {
      const myApts = db.appointments.filter(
        (a) =>
          a.doctorId === currentUser.id &&
          (a.status === 'Checked In' || a.status === 'In Consultation' || a.status === 'Scheduled')
      );
      if (myApts.length > 0) {
        alerts.push({
          id: 'al_doc_apt',
          title: `${myApts.length} Active Queue Appointment${myApts.length > 1 ? 's' : ''}`,
          detail: 'Patients scheduled for consultation.',
          to: '/doctor/diagnosis',
        });
      }
      const pendingReports = db.diagnosticReports.filter(
        (r) => r.requestedByDoctorId === currentUser.id && r.status !== 'Completed'
      );
      if (pendingReports.length > 0) {
        alerts.push({
          id: 'al_doc_lab',
          title: `${pendingReports.length} Pending Lab Order${pendingReports.length > 1 ? 's' : ''}`,
          detail: 'Diagnostic reports awaiting results.',
          to: '/doctor/reports',
        });
      }
    }

    if (currentUser.role === 'registration') {
      const activeApts = db.appointments.filter((a) => a.status === 'Scheduled');
      alerts.push({
        id: 'al_reg',
        title: `${activeApts.length} Scheduled Appointments`,
        detail: 'Check patients in at the reception desk.',
        to: '/registration/appointments',
      });
    }

    return alerts;
  }, [currentUser, db]);

  const handleLogout = () => {
    logout();
    showToast('info', 'Signed Out', 'You have safely exited the Hospital Management Information System.');
    navigate('/login');
  };

  const initials = currentUser?.name
    .split(' ')
    .filter((w) => w.length > 0 && !w.startsWith('Dr.'))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || 'HM';

  return (
    <div className="min-h-screen flex bg-[#F5F8FC] text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0F2942] text-white transition-all duration-200 lg:static ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-[76px]' : 'w-[260px]'}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 border border-blue-400/30 text-blue-200">
              <Stethoscope className="h-5 w-5" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-white truncate">HMIS Portal</p>
                <p className="text-[11px] text-blue-200/80 truncate">
                  {currentUser ? getRoleLabel(currentUser.role) : 'Hospital System'}
                </p>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1 text-blue-200 hover:bg-white/10 lg:hidden"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:inline-flex rounded-md p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1" aria-label="Role Navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white shadow-xs'
                      : 'text-blue-100/85 hover:bg-white/10 hover:text-white'
                  } ${collapsed ? 'justify-center px-2' : ''}`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-100 hover:bg-red-500/20 hover:text-white transition-colors whitespace-nowrap ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="inline-flex rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50 lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              {breadcrumb && (
                <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
              )}
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {pageTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                aria-label="Operational alerts"
              >
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-700 px-1 text-[10px] font-bold text-white tabular-nums">
                    {notifications.length}
                  </span>
                )}
              </button>

              {notifOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setNotifOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    <div className="border-b border-slate-200 px-4 py-2.5 bg-slate-50">
                      <p className="text-xs font-semibold text-slate-900">Operational Alerts</p>
                    </div>
                    <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="px-4 py-6 text-center text-xs text-slate-500">
                          No urgent alerts for your workspace.
                        </p>
                      ) : (
                        notifications.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              setNotifOpen(false);
                              navigate(n.to);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-blue-50/50 transition-colors"
                          >
                            <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{n.detail}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile Summary */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5 border-l border-slate-200 pl-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F2942] text-xs font-bold text-white shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                    {currentUser.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                    {getRoleLabel(currentUser.role)} · {deptName}
                  </p>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-red-700 transition-colors whitespace-nowrap shrink-0"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
