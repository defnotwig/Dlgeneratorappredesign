import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface GenerationSummaryProps {
  processMode: 'dl-only' | 'dl-transmittal' | 'transmittal-only';
  outputFormat: 'zip' | 'print';
  selectedClient: string;
  uploadedFile: File | null;
  hasValidSignature: boolean;
}

export function GenerationSummaryLawFirm({
  processMode,
  outputFormat,
  selectedClient,
  uploadedFile,
  hasValidSignature,
}: GenerationSummaryProps) {
  const steps = [
    {
      label: 'Valid Signature',
      completed: hasValidSignature,
      required: true,
    },
    {
      label: 'Client Selected',
      completed: !!selectedClient,
      required: true,
    },
    {
      label: 'File Uploaded',
      completed: !!uploadedFile,
      required: true,
    },
  ];

  const allComplete = steps.every((step) => step.completed);

  return (
    <div className="bg-white rounded shadow-sm border border-stone-200 p-6">
      <h3 className="font-serif font-bold text-lg text-stone-900 mb-4">Generation Summary</h3>

      {/* Configuration */}
      <div className="space-y-3 mb-6 pb-6 border-b border-stone-200">
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Process Mode:</span>
          <span className="font-semibold text-stone-900">
            {processMode === 'dl-only'
              ? 'DL Only'
              : processMode === 'dl-transmittal'
              ? 'DL with Transmittal'
              : 'Transmittal Only'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-stone-600">Output Format:</span>
          <span className="font-semibold text-stone-900">
            {outputFormat === 'zip' ? 'Download as ZIP' : 'Direct to Print'}
          </span>
        </div>
      </div>

      {/* Checklist */}
      <div className="space-y-2 mb-4">
        <p className="text-sm font-semibold text-stone-700 mb-3">Pre-flight Checklist:</p>
        {steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2">
            {step.completed ? (
              <CheckCircle size={18} className="text-green-600" />
            ) : step.required ? (
              <XCircle size={18} className="text-red-500" />
            ) : (
              <AlertCircle size={18} className="text-stone-400" />
            )}
            <span
              className={`text-sm ${
                step.completed ? 'text-stone-900' : 'text-stone-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      {/* Status */}
      <div
        className={`p-3 rounded ${
          allComplete ? 'bg-green-50 border border-green-300' : 'bg-stone-50 border border-stone-300'
        }`}
      >
        <p
          className={`text-sm font-semibold ${
            allComplete ? 'text-green-900' : 'text-stone-600'
          }`}
        >
          {allComplete ? 'Ready to Generate' : 'Complete all steps to proceed'}
        </p>
      </div>
    </div>
  );
}
