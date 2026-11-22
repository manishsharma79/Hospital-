import React from 'react';
import { AlertTriangle, Calendar, FileText, Printer, Stethoscope, User } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { StatusBadge } from '../ui/StatusBadge';
import { useHMIS } from '../../context/HMISContext';
import { Prescription } from '../../types/hmis';
import { formatDate, formatDateTime } from '../../utils/hmisHelpers';

interface PrescriptionViewModalProps {
  prescription: Prescription | null;
  onClose: () => void;
  onGoToVerify?: (prescription: Prescription) => void;
}

export const PrescriptionViewModal: React.FC<PrescriptionViewModalProps> = ({
  prescription,
  onClose,
  onGoToVerify,
}) => {
  const { db } = useHMIS();

  if (!prescription) return null;

  const patient = db.patients.find((p) => p.id === prescription.patientId);
  const doctor = db.users.find((u) => u.id === prescription.doctorId);
  const department = doctor
    ? db.departments.find((d) => d.id === doctor.departmentId)
    : undefined;

  const medicalRecord =
    (prescription.medicalRecordId
      ? db.medicalRecords.find((m) => m.id === prescription.medicalRecordId)
      : undefined) ||
    db.medicalRecords.find(
      (m) => m.patientId === prescription.patientId && m.doctorId === prescription.doctorId
    ) ||
    db.medicalRecords.find((m) => m.patientId === prescription.patientId);

  const hasAllergy =
    Boolean(patient?.allergies?.trim()) &&
    patient!.allergies!.trim().toLowerCase() !== 'none';

  return (
    <Modal
      open={Boolean(prescription)}
      onClose={onClose}
      title={`Doctor Prescription · ${prescription.prescriptionNo}`}
      subtitle={`Issued on ${formatDate(prescription.prescribedDate)}`}
      maxWidthClass="max-w-3xl"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="no-print inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Prescription
          </button>
          <div className="flex items-center gap-2.5">
            {onGoToVerify && prescription.status === 'Pending Verification' && (
              <button
                type="button"
                onClick={() => onGoToVerify(prescription)}
                className="no-print rounded-lg bg-[#0F2942] px-4 py-2 text-xs font-semibold text-white hover:bg-[#173B5E]"
              >
                Open Verify &amp; Dispense
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status & Meta Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-[#0F2942]" />
            <span className="font-mono text-sm font-bold text-slate-900">
              {prescription.prescriptionNo}
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-slate-600">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(prescription.prescribedDate)}
            </span>
          </div>
          <StatusBadge label={prescription.status} />
        </div>

        {/* Doctor & Patient Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Stethoscope className="h-3.5 w-3.5 text-[#0F2942]" />
              <span>Prescribing Doctor</span>
            </div>
            <p className="text-sm font-bold text-slate-900">{doctor?.name || 'Unknown Doctor'}</p>
            <p className="text-xs text-slate-600">
              {doctor?.specialization || 'Medical Officer'}
              {department ? ` · ${department.name}` : ''}
            </p>
            {doctor?.qualification && (
              <p className="text-xs text-slate-500">Qualification: {doctor.qualification}</p>
            )}
            {doctor?.licenseNumber && (
              <p className="text-xs font-mono text-slate-500">
                Reg. No: {doctor.licenseNumber}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <User className="h-3.5 w-3.5 text-[#0F2942]" />
              <span>Patient Information</span>
            </div>
            <p className="text-sm font-bold text-slate-900">
              {patient?.fullName || 'Unknown Patient'}
            </p>
            <p className="text-xs font-mono text-slate-600">
              {patient?.patientId || '—'} · {patient ? `${patient.age} yrs / ${patient.gender}` : '—'}
              {patient?.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
            </p>
            {patient?.mobile && (
              <p className="text-xs text-slate-500">Mobile: {patient.mobile}</p>
            )}
            {patient?.chronicConditions && (
              <p className="text-xs text-slate-500">
                Conditions: {patient.chronicConditions}
              </p>
            )}
          </div>
        </div>

        {/* Patient Allergy Warning */}
        {hasAllergy && (
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Patient Allergy Alert:</span>{' '}
              <span>{patient?.allergies}</span>
            </div>
          </div>
        )}

        {/* Linked Doctor Diagnosis & Clinical Notes */}
        <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
              Doctor&apos;s Clinical Diagnosis &amp; Notes
            </h3>
            {medicalRecord?.icdCode && (
              <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-blue-800">
                ICD-10: {medicalRecord.icdCode}
              </span>
            )}
          </div>
          {medicalRecord ? (
            <div className="space-y-1.5 text-xs">
              <p className="text-slate-900">
                <span className="font-semibold">Diagnosis:</span> {medicalRecord.diagnosis}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Chief Complaint:</span>{' '}
                {medicalRecord.chiefComplaint}
              </p>
              <p className="text-slate-700">
                <span className="font-semibold">Treatment Plan:</span>{' '}
                {medicalRecord.treatmentPlan}
              </p>
              {medicalRecord.clinicalNotes && (
                <p className="text-slate-600">
                  <span className="font-semibold">Doctor Notes:</span>{' '}
                  {medicalRecord.clinicalNotes}
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              Direct e-prescription issued by {doctor?.name || 'physician'} without a linked consultation note.
            </p>
          )}
        </div>

        {/* Prescribed Medicines Table */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
            Prescribed Medicines ({prescription.items.length})
          </h3>
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Medicine</th>
                  <th className="px-3 py-2.5">Dosage</th>
                  <th className="px-3 py-2.5">Frequency</th>
                  <th className="px-3 py-2.5 text-right">Duration</th>
                  <th className="px-3 py-2.5 text-right">Qty</th>
                  <th className="px-3 py-2.5">Doctor&apos;s Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{idx + 1}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-900">{item.medicineName}</p>
                      <p className="font-mono text-[11px] text-slate-500">{item.medicineCode}</p>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800">{item.dosage}</td>
                    <td className="px-3 py-2.5 text-slate-700">{item.frequency}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-700">
                      {item.durationDays} days
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {item.quantityRequested}
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {item.instructions || 'As directed by physician'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pharmacy Verification Trail (if processed) */}
        {(prescription.verifiedBy || prescription.pharmacistNotes) && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 px-4 py-3 text-xs space-y-1">
            <p className="font-semibold text-slate-800">Pharmacy Processing Record</p>
            {prescription.verifiedBy && (
              <p className="text-slate-600">
                Processed by <span className="font-medium text-slate-900">{prescription.verifiedBy}</span>
                {prescription.verifiedAt ? ` on ${formatDateTime(prescription.verifiedAt)}` : ''}
              </p>
            )}
            {prescription.pharmacistNotes && (
              <p className="text-slate-600">Notes: {prescription.pharmacistNotes}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
