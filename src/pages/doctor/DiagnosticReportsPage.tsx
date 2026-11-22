import React, { useState } from 'react';
import { Eye, FlaskConical, Plus } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell';
import { DataTable, TableColumn } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { useToast } from '../../context/ToastContext';
import {
  DiagnosticCategory,
  DiagnosticPriority,
  DiagnosticReport,
  DiagnosticStatus,
  ResultFlag,
} from '../../types/hmis';
import { formatDate, getTodayISO } from '../../utils/hmisHelpers';

export const DiagnosticReportsPage: React.FC = () => {
  const { db, currentUser, requestDiagnosticTest, updateDiagnosticReport } = useHMIS();
  const { showToast } = useToast();

  const [requestOpen, setRequestOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);

  const [reqForm, setReqForm] = useState({
    patientId: db.patients[0]?.id || '',
    testName: '',
    category: 'Biochemistry' as DiagnosticCategory,
    priority: 'Routine' as DiagnosticPriority,
  });

  const [resultForm, setResultForm] = useState({
    status: 'Completed' as DiagnosticStatus,
    findings: '',
    referenceRange: '',
    resultFlag: 'Normal' as ResultFlag,
  });

  const openReport = (rep: DiagnosticReport) => {
    setSelectedReport(rep);
    setResultForm({
      status: rep.status,
      findings: rep.findings || '',
      referenceRange: rep.referenceRange || '',
      resultFlag: rep.resultFlag || 'Normal',
    });
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqForm.testName.trim()) {
      showToast('error', 'Missing Test Name', 'Enter the diagnostic test name.');
      return;
    }
    const res = requestDiagnosticTest({
      patientId: reqForm.patientId,
      requestedByDoctorId: currentUser?.id || 'usr_doc_1',
      testName: reqForm.testName.trim(),
      category: reqForm.category,
      priority: reqForm.priority,
      requestedDate: getTodayISO(),
    });
    if (res.ok) {
      showToast('success', 'Test Requested', res.message);
      setReqForm((f) => ({ ...f, testName: '' }));
      setRequestOpen(false);
    }
  };

  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;
    const res = updateDiagnosticReport(selectedReport.id, {
      status: resultForm.status,
      findings: resultForm.findings.trim(),
      referenceRange: resultForm.referenceRange.trim(),
      resultFlag: resultForm.resultFlag,
      completedDate: resultForm.status === 'Completed' ? getTodayISO() : undefined,
    });
    if (res.ok) {
      showToast('success', 'Report Updated', res.message);
      setSelectedReport(null);
    }
  };

  const columns: TableColumn<DiagnosticReport>[] = [
    {
      key: 'reportNo',
      header: 'Order ID',
      sortable: true,
      sortValue: (r) => r.reportNo,
      render: (r) => (
        <span className="font-mono text-xs font-semibold text-[#0F2942]">{r.reportNo}</span>
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
      key: 'testName',
      header: 'Diagnostic Test',
      render: (r) => (
        <div>
          <p className="font-medium text-slate-900">{r.testName}</p>
          <p className="text-xs text-slate-500">{r.category}</p>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (r) => <StatusBadge label={r.priority} />,
    },
    {
      key: 'requestedDate',
      header: 'Ordered',
      sortable: true,
      sortValue: (r) => r.requestedDate,
      render: (r) => <span className="text-xs tabular-nums">{formatDate(r.requestedDate)}</span>,
    },
    {
      key: 'status',
      header: 'Status / Result',
      render: (r) => <StatusBadge label={r.resultFlag && r.status === 'Completed' ? `${r.status} (${r.resultFlag})` : r.status} />,
    },
    {
      key: 'actions',
      header: 'Report',
      align: 'right',
      render: (r) => (
        <button
          type="button"
          onClick={() => openReport(r)}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100"
        >
          <Eye className="h-3.5 w-3.5" />
          View / Update
        </button>
      ),
    },
  ];

  return (
    <AppShell
      pageTitle="Diagnostic Test Requests & Reports"
      breadcrumb="HMIS / Doctor Workspace / Lab & Imaging"
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            Order laboratory or radiology investigations and review completed diagnostic findings.
          </p>
          <button
            type="button"
            onClick={() => setRequestOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E] whitespace-nowrap shrink-0"
          >
            <Plus className="h-4 w-4" />
            Request Diagnostic Test
          </button>
        </div>

        <DataTable
          data={db.diagnosticReports}
          columns={columns}
          keyExtractor={(r) => r.id}
          searchPlaceholder="Search by order ID, patient, or test name..."
          searchFilter={(r, q) => {
            const pat = db.patients.find((p) => p.id === r.patientId);
            return (
              r.reportNo.toLowerCase().includes(q) ||
              r.testName.toLowerCase().includes(q) ||
              (pat?.fullName || '').toLowerCase().includes(q)
            );
          }}
        />
      </div>

      {/* Request New Diagnostic Test Modal */}
      <Modal
        open={requestOpen}
        onClose={() => setRequestOpen(false)}
        title="Request Diagnostic Investigation"
        maxWidthClass="max-w-lg"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient *</label>
            <select
              value={reqForm.patientId}
              onChange={(e) => setReqForm((f) => ({ ...f, patientId: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {db.patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientId} — {p.fullName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Name *</label>
            <input
              type="text"
              required
              value={reqForm.testName}
              onChange={(e) => setReqForm((f) => ({ ...f, testName: e.target.value }))}
              placeholder="e.g. Chest PA Radiograph, Serum Creatinine"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={reqForm.category}
                onChange={(e) =>
                  setReqForm((f) => ({ ...f, category: e.target.value as DiagnosticCategory }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Hematology">Hematology</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Radiology">Radiology</option>
                <option value="Microbiology">Microbiology</option>
                <option value="Cardiology">Cardiology</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={reqForm.priority}
                onChange={(e) =>
                  setReqForm((f) => ({ ...f, priority: e.target.value as DiagnosticPriority }))
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Routine">Routine</option>
                <option value="Urgent">Urgent</option>
                <option value="STAT">STAT</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setRequestOpen(false)}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
            >
              <FlaskConical className="h-4 w-4" />
              Submit Request
            </button>
          </div>
        </form>
      </Modal>

      {/* View / Record Report Findings Modal */}
      <Modal
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title={selectedReport ? `${selectedReport.reportNo} · ${selectedReport.testName}` : ''}
        subtitle={
          selectedReport
            ? `Patient: ${
                db.patients.find((p) => p.id === selectedReport.patientId)?.fullName || ''
              }`
            : ''
        }
      >
        {selectedReport && (
          <form onSubmit={handleSaveReport} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Report Status
                </label>
                <select
                  value={resultForm.status}
                  onChange={(e) =>
                    setResultForm((f) => ({ ...f, status: e.target.value as DiagnosticStatus }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Requested">Requested</option>
                  <option value="Sample Collected">Sample Collected</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Result Flag
                </label>
                <select
                  value={resultForm.resultFlag}
                  onChange={(e) =>
                    setResultForm((f) => ({ ...f, resultFlag: e.target.value as ResultFlag }))
                  }
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Findings &amp; Observations
              </label>
              <textarea
                rows={3}
                value={resultForm.findings}
                onChange={(e) => setResultForm((f) => ({ ...f, findings: e.target.value }))}
                placeholder="Enter quantitative values or radiologist impression..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reference Range
              </label>
              <input
                type="text"
                value={resultForm.referenceRange}
                onChange={(e) =>
                  setResultForm((f) => ({ ...f, referenceRange: e.target.value }))
                }
                placeholder="Normal reference interval"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
              >
                Close
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white hover:bg-[#173B5E]"
              >
                Save Report
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AppShell>
  );
};
