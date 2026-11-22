import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Stethoscope,
  UserPlus,
} from 'lucide-react';
import atriumImg from '../assets/images/hospital_login_atrium_1795326270064.jpg';
import { Modal } from '../components/ui/Modal';
import { useHMIS } from '../context/HMISContext';
import { useToast } from '../context/ToastContext';
import { UserRole } from '../types/hmis';
import { getRoleHomeRoute, getRoleLabel } from '../utils/hmisHelpers';

const DEMO_ACCOUNTS: Array<{
  role: UserRole;
  label: string;
  email: string;
  password: string;
}> = [
  {
    role: 'admin',
    label: 'Administrator',
    email: 'admin@hmis.in',
    password: 'Admin@123',
  },
  {
    role: 'registration',
    label: 'Registration Staff',
    email: 'desk@hmis.in',
    password: 'Desk@123',
  },
  {
    role: 'doctor',
    label: 'Doctor',
    email: 'dr.patel@hmis.in',
    password: 'Doctor@123',
  },
  {
    role: 'pharmacist',
    label: 'Pharmacist',
    email: 'pharma@hmis.in',
    password: 'Pharma@123',
  },
];

export const LoginPage: React.FC = () => {
  const { currentUser, login, registerNewStaff, resetDemoDatabase, db } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@hmis.in');
  const [password, setPassword] = useState('Admin@123');
  const [role, setRole] = useState<UserRole>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  // Modals
  const [registerOpen, setRegisterOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  // Staff registration state
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'registration' as UserRole,
    departmentId: db.departments[0]?.id || 'dept_opd',
    phone: '',
    qualification: '',
    specialization: '',
  });
  const [regError, setRegError] = useState('');

  // Forgot password demo state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotResult, setForgotResult] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (currentUser) {
    return <Navigate to={getRoleHomeRoute(currentUser.role)} replace />;
  }

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback({ type: 'error', text: 'Enter a valid hospital email address.' });
      return;
    }
    if (!password) {
      setFeedback({ type: 'error', text: 'Enter your account password.' });
      return;
    }

    const res = login(email, password, role);
    if (!res.ok) {
      setFeedback({ type: 'error', text: res.message });
      return;
    }

    setFeedback({ type: 'success', text: res.message });
    showToast('success', 'Authenticated', res.message);
    navigate(getRoleHomeRoute(role), { replace: true });
  };

  const handleQuickFill = (acc: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setRole(acc.role);
    setFeedback(null);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regForm.name.trim()) {
      setRegError('Full name is required.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email.trim())) {
      setRegError('Provide a valid staff email address.');
      return;
    }
    if (regForm.password.length < 6) {
      setRegError('Password must be at least 6 characters.');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }
    if (!regForm.phone.trim()) {
      setRegError('Contact phone number is required.');
      return;
    }

    const res = registerNewStaff({
      name: regForm.name,
      email: regForm.email,
      password: regForm.password,
      role: regForm.role,
      departmentId: regForm.departmentId,
      phone: regForm.phone,
      qualification: regForm.qualification,
      specialization: regForm.specialization,
    });

    if (!res.ok) {
      setRegError(res.message);
      return;
    }

    showToast('success', 'Staff Account Created', res.message);
    setEmail(regForm.email.trim().toLowerCase());
    setPassword(regForm.password);
    setRole(regForm.role);
    setFeedback({ type: 'success', text: res.message });
    setRegisterOpen(false);
    setRegForm({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'registration',
      departmentId: db.departments[0]?.id || 'dept_opd',
      phone: '',
      qualification: '',
      specialization: '',
    });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotResult(null);
    const matched = db.users.find(
      (u) => u.email.toLowerCase() === forgotEmail.trim().toLowerCase()
    );
    if (!matched) {
      setForgotResult({
        type: 'error',
        text: 'No staff account matches that email address in local records.',
      });
      return;
    }
    setForgotResult({
      type: 'success',
      text: `Demonstration Reset Link Prepared for ${matched.name} (${getRoleLabel(matched.role)}). Demo password: "${matched.password}".`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F5F8FC]">
      {/* Left Architectural Clinical Panel */}
      <div className="relative hidden lg:flex lg:w-[44%] xl:w-[46%] flex-col justify-between bg-[#0F2942] text-white overflow-hidden">
        {!imgFailed && (
          <img
            src={atriumImg}
            alt="Hospital main clinical reception atrium"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#0B1F33] via-[#0F2942]/80 to-[#0F2942]/70"
          aria-hidden="true"
        />

        <div className="relative z-10 p-10">
          <div className="inline-flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-white">
                Hospital Management Information System
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-10 space-y-6">
          <h2 className="text-3xl font-bold leading-tight text-white max-w-md [text-wrap:balance]">
            Hospital Management Information System
          </h2>
          <p className="text-sm text-blue-100/90 leading-relaxed max-w-md">
            Role-based coordination across hospital administration, patient registration, clinical
            consultations, diagnostics, pharmacy dispensing, and billing.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-2 max-w-md border-t border-white/15">
            <div>
              <p className="text-xs text-blue-200/80">Active Departments</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{db.departments.length}</p>
            </div>
            <div>
              <p className="text-xs text-blue-200/80">Registered Patients</p>
              <p className="mt-1 text-xl font-bold tabular-nums">{db.patients.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Authentication Form Panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Header Brand */}
          <div className="flex items-center gap-3 lg:hidden mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2942] text-white shrink-0">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-900">
                Hospital Management Information System
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">
                Hospital Management Information System
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Select your assigned role and sign in with your credentials.
              </p>
            </div>

            {feedback && (
              <div
                role="alert"
                className={`mb-5 flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm ${
                  feedback.type === 'error'
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                }`}
              >
                {feedback.type === 'error' ? (
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="login-role" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  User Type / Role
                </label>
                <div className="relative">
                  <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <select
                    id="login-role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  >
                    <option value="admin">Administrator</option>
                    <option value="registration">Registration Staff</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@hmis.in"
                    autoComplete="username"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotResult(null);
                      setForgotOpen(true);
                    }}
                    className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#0F2942] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173B5E] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Sign In to Workspace
              </button>
            </form>

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-xs">
              <button
                type="button"
                onClick={() => {
                  setRegError('');
                  setRegisterOpen(true);
                }}
                className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-800"
              >
                <UserPlus className="h-3.5 w-3.5" />
                New Staff Registration
              </button>

              <button
                type="button"
                onClick={() => {
                  resetDemoDatabase();
                  showToast('info', 'Demo Data Restored', 'LocalStorage dataset reset to defaults.');
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800"
                title="Restore default seed data"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Demo Data
              </button>
            </div>
          </div>

          {/* Demo Accounts Quick-Fill Panel */}
          <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-xs font-semibold text-slate-800">
                Demonstration Role Accounts (Click to Autofill)
              </p>
              <span className="text-[11px] text-slate-500">LocalStorage Demo</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc)}
                  className={`text-left rounded-lg border px-3 py-2 transition-colors ${
                    role === acc.role && email === acc.email
                      ? 'border-blue-600 bg-blue-50/70'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs font-semibold text-slate-900">{acc.label}</p>
                  <p className="text-[11px] font-mono text-slate-600 truncate">{acc.email}</p>
                  <p className="text-[11px] font-mono text-slate-500">Pass: {acc.password}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-500 leading-relaxed">
              Notice: Browser-based authentication and LocalStorage persistence are for frontend
              demonstration only and are not secure for live patient or hospital production use.
            </p>
          </div>
        </div>
      </div>

      {/* New Staff Registration Modal */}
      <Modal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        title="New Staff Registration"
        subtitle="Create a demonstration staff account stored locally in your browser."
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {regError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
              {regError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={regForm.name}
                onChange={(e) => setRegForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Dr. Vikram Mehta"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={regForm.role}
                onChange={(e) => setRegForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                <option value="admin">Administrator</option>
                <option value="registration">Registration Staff</option>
                <option value="doctor">Doctor</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={regForm.email}
                onChange={(e) => setRegForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="staff@hmis.in"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={regForm.phone}
                onChange={(e) => setRegForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 98110-90000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={regForm.departmentId}
                onChange={(e) => setRegForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              >
                {db.departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {regForm.role === 'doctor' ? 'Specialization' : 'Qualification'}
              </label>
              <input
                type="text"
                value={regForm.role === 'doctor' ? regForm.specialization : regForm.qualification}
                onChange={(e) =>
                  setRegForm((f) =>
                    regForm.role === 'doctor'
                      ? { ...f, specialization: e.target.value }
                      : { ...f, qualification: e.target.value }
                  )
                }
                placeholder={regForm.role === 'doctor' ? 'e.g. Neurology' : 'e.g. B.Pharm'}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={regForm.password}
                onChange={(e) => setRegForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={regForm.confirmPassword}
                onChange={(e) => setRegForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                placeholder="Repeat password"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRegisterOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>

      {/* Forgot Password Modal (Frontend Demonstration) */}
      <Modal
        open={forgotOpen}
        onClose={() => setForgotOpen(false)}
        title="Password Recovery (Demo)"
        subtitle="Frontend-only credential lookup for demonstration accounts."
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleForgotSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Registered Staff Email
            </label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Enter your staff email"
                className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {forgotResult && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-xs ${
                forgotResult.type === 'error'
                  ? 'border-red-200 bg-red-50 text-red-800'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-800'
              }`}
            >
              {forgotResult.text}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setForgotOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
            <button
              type="submit"
              className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              Verify Email
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
