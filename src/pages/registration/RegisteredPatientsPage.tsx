import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Trash2, UserPlus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { ConfirmDialog, Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import { Patient } from '../../types/hmis';
import { formatDate } from '../../utils/hmisHelpers';

export const RegisteredPatientsPage: React.FC = () => {
  const { db, deletePatient } = useHMIS();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [genderFilter, setGenderFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('all');
  const [viewPatient, setViewPatient] = useState<Patient | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Patient | null>(null);

  const filteredPatients = useMemo(() => {
    return db.patients.filter((p) => {
      if (genderFilter !== 'all' && p.gender !== genderFilter) return false;
      if (bloodFilter !== 'all' && p.bloodGroup !== bloodFilter) return false;
      return true;
    });
  }, [db.patients, genderFilter, bloodFilter]);

  const columns: TableColumn<Patient>[] = [
    {
      key: 'patientId',
      header: 'Patient ID',
      sortable: true,
      sortValue: (r) => r.patientId,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942] whitespace-nowrap">
          {r.patientId}
        </span>
      ),
    },
    {
      key: 'fullName',
      header: 'Name',
      sortable: true,
      sortValue: (r) => r.fullName,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900 whitespace-nowrap">{r.fullName}</p>
          <p className="text-[11px] text-slate-500 whitespace-nowrap">{r.registrationType}</p>
        </div>
      ),
    },
    {
      key: 'dob',
      header: 'DOB',
      sortable: true,
      sortValue: (r) => r.dob,
      render: (r) => <span className="text-xs tabular-nums whitespace-nowrap">{formatDate(r.dob)}</span>,
    },
    {
      key: 'age',
      header: 'Age',
      align: 'right',
      sortable: true,
      sortValue: (r) => r.age,
      render: (r) => <span className="font-mono text-xs tabular-nums">{r.age} yrs</span>,
    },
    {
      key: 'gender',
      header: 'Gender',
      sortable: true,
      sortValue: (r) => r.gender,
      render: (r) => <span className="text-xs">{r.gender}</span>,
    },
    {
      key: 'bloodGroup',
      header: 'Blood Group',
      sortable: true,
      sortValue: (r) => r.bloodGroup,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-red-700">{r.bloodGroup}</span>
      ),
    },
    {
      key: 'mobile',
      header: 'Mobile Number',
      render: (r) => <span className="font-mono text-xs whitespace-nowrap">{r.mobile}</span>,
    },
    {
      key: 'country',
      header: 'Country',
      sortable: true,
      sortValue: (r) => r.country,
      render: (r) => <span className="text-xs whitespace-nowrap">{r.country}</span>,
    },
    {
      key: 'state',
      header: 'State',
      sortable: true,
      sortValue: (r) => r.state,
      render: (r) => <span className="text-xs whitespace-nowrap">{r.state}</span>,
    },
    {
      key: 'registrationDate',
      header: 'Registration Date',
      sortable: true,
      sortValue: (r) => r.registrationDate,
      render: (r) => (
        <span className="text-xs tabular-nums whitespace-nowrap">
          {formatDate(r.registrationDate)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={() => setViewPatient(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
            title="View patient details"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => navigate(`/registration/update-patient?patientId=${r.id}`)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            title="Update patient details"
          >
            <Edit2 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteTarget(r)}
            className="rounded-md border border-slate-200 p-1.5 text-slate-600 hover:bg-red-50 hover:text-red-700"
            title="Delete patient"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Registered Patient Directory"
      breadcrumb="HMIS / Registration / Master Patient Index"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Search, filter, sort, view, edit, and manage registered hospital patients.
          </p>
          <button
            type="button"
            onClick={() => navigate('/registration/register-patient')}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Register New Patient
          </button>
        </div>

        <DataTable
          data={filteredPatients}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by Patient ID, name, mobile, city, or state..."
          searchFilter={(r, q) =>
            r.patientId.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            r.mobile.toLowerCase().includes(q) ||
            r.city.toLowerCase().includes(q) ||
            r.state.toLowerCase().includes(q) ||
            r.country.toLowerCase().includes(q)
          }
          filterControls={
            <>
              <select
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value)}
                aria-label="Filter by gender"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">All Genders</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <select
                value={bloodFilter}
                onChange={(e) => setBloodFilter(e.target.value)}
                aria-label="Filter by blood group"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
              >
                <option value="all">All Blood Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </>
          }
        />
      </div>

      {/* View Full Patient Profile Modal */}
      <Modal
        open={Boolean(viewPatient)}
        onClose={() => setViewPatient(null)}
        title={viewPatient ? `${viewPatient.fullName} · ${viewPatient.patientId}` : ''}
        subtitle="Complete 6-Section Patient Registration Record"
        maxWidthClass="max-w-3xl"
        footer={
          viewPatient && (
            <>
              <button
                type="button"
                onClick={() => setViewPatient(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = viewPatient.id;
                  setViewPatient(null);
                  navigate(`/registration/update-patient?patientId=${id}`);
                }}
                className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
              >
                Update Details
              </button>
            </>
          )
        }
      >
        {viewPatient && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-500">DOB / Age</p>
                <p className="font-semibold text-slate-900 tabular-nums">
                  {formatDate(viewPatient.dob)} ({viewPatient.age} yrs)
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Gender &amp; Blood Group</p>
                <p className="font-semibold text-slate-900">
                  {viewPatient.gender} · <span className="text-red-700">{viewPatient.bloodGroup}</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Marital Status</p>
                <p className="font-semibold text-slate-900">{viewPatient.maritalStatus}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-500">Mobile Number</p>
                <p className="font-mono font-medium text-slate-900">{viewPatient.mobile}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Alternate Phone</p>
                <p className="font-mono text-slate-800">{viewPatient.alternatePhone || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-slate-800 truncate">{viewPatient.email || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-xs text-slate-500">Residential Address</p>
                <p className="text-slate-900 mt-0.5">
                  {[viewPatient.houseNo, viewPatient.street].filter(Boolean).join(', ')}
                  <br />
                  {viewPatient.city}, {viewPatient.state} {viewPatient.pinCode}
                  <br />
                  {viewPatient.country}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Emergency Contact</p>
                <p className="font-semibold text-slate-900 mt-0.5">{viewPatient.emergencyName}</p>
                <p className="text-xs text-slate-600">
                  {viewPatient.emergencyRelation} · {viewPatient.emergencyPhone}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500">ID Proof</p>
                <p className="font-medium text-slate-900">{viewPatient.idProofType}</p>
                <p className="font-mono text-xs text-slate-600">{viewPatient.idProofNumber}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Registration Info</p>
                <p className="font-medium text-slate-900">{formatDate(viewPatient.registrationDate)}</p>
                <StatusBadge label={viewPatient.registrationType} tone="info" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Assigned Clinical Unit</p>
                <p className="font-medium text-slate-900">
                  {db.departments.find((d) => d.id === viewPatient.assignedDepartmentId)?.name || '—'}
                </p>
                <p className="text-xs text-slate-600">
                  {db.users.find((u) => u.id === viewPatient.assignedDoctorId)?.name || 'Unassigned'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete Patient Record"
        message={`Are you sure you want to permanently delete ${deleteTarget?.fullName} (${deleteTarget?.patientId}) and their scheduled appointments?`}
        confirmLabel="Delete Patient"
        onConfirm={() => {
          if (!deleteTarget) return;
          const res = deletePatient(deleteTarget.id);
          if (res.ok) showToast('success', 'Patient Deleted', res.message);
        }}
      />
    </AppShell>
  );
};
