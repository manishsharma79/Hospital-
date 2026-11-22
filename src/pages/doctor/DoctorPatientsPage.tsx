import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Stethoscope } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { Patient } from '../../types/hmis';
import { formatDate } from '../../utils/hmisHelpers';

export const DoctorPatientsPage: React.FC = () => {
  const { db } = useHMIS();
  const navigate = useNavigate();

  const columns: TableColumn<Patient>[] = [
    {
      key: 'patientId',
      header: 'Patient ID',
      sortable: true,
      sortValue: (r) => r.patientId,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.patientId}</span>
      ),
    },
    {
      key: 'fullName',
      header: 'Patient Name',
      sortable: true,
      sortValue: (r) => r.fullName,
      render: (r) => (
        <div>
          <p className="font-semibold text-slate-900">{r.fullName}</p>
          <p className="text-xs text-slate-500">
            {r.age} yrs · {r.gender} · Blood {r.bloodGroup}
          </p>
        </div>
      ),
    },
    {
      key: 'conditions',
      header: 'Allergies & Chronic Conditions',
      render: (r) => (
        <div className="text-xs">
          <p className="text-slate-800">Allergies: {r.allergies || 'None'}</p>
          <p className="text-slate-500">Chronic: {r.chronicConditions || 'None'}</p>
        </div>
      ),
    },
    {
      key: 'assignedDoctor',
      header: 'Primary Doctor',
      render: (r) => {
        const doc = db.users.find((u) => u.id === r.assignedDoctorId);
        const dept = db.departments.find((d) => d.id === r.assignedDepartmentId);
        return (
          <div className="text-xs">
            <p className="font-medium text-slate-900">{doc?.name || 'Unassigned'}</p>
            <p className="text-slate-500">{dept?.name || '—'}</p>
          </div>
        );
      },
    },
    {
      key: 'latestProgress',
      header: 'Latest Progress',
      render: (r) => {
        const latest = db.medicalRecords.find((m) => m.patientId === r.id);
        return latest ? (
          <StatusBadge label={latest.progressStatus} />
        ) : (
          <span className="text-xs text-slate-400">No visits logged</span>
        );
      },
    },
    {
      key: 'regDate',
      header: 'Registered',
      sortable: true,
      sortValue: (r) => r.registrationDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.registrationDate)}</span>,
    },
    {
      key: 'actions',
      header: 'Clinical Actions',
      align: 'right',
      render: (r) => (
        <div className="inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => navigate(`/doctor/history?patientId=${r.id}`)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap"
          >
            <History className="h-3.5 w-3.5" />
            History
          </button>
          <button
            type="button"
            onClick={() => navigate(`/doctor/diagnosis?patientId=${r.id}`)}
            className="inline-flex items-center gap-1 rounded-md bg-[#0F2942] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap"
          >
            <Stethoscope className="h-3.5 w-3.5" />
            Diagnose
          </button>
        </div>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Clinical Patient List"
      breadcrumb="HMIS / Doctor Workspace / Patient Search"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Search registered patients by Patient ID or full name to inspect medical history or record new clinical notes.
        </p>

        <DataTable
          data={db.patients}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by Patient ID (e.g. PAT-2026-1001) or name..."
          searchFilter={(r, q) =>
            r.patientId.toLowerCase().includes(q) ||
            r.fullName.toLowerCase().includes(q) ||
            r.mobile.toLowerCase().includes(q)
          }
        />
      </div>
    </AppShell>
  );
};
