import { useState } from 'react';
import { ProcessModeSelectorLawFirm } from './ProcessModeSelectorLawFirm';
import { OutputFormatSelectorLawFirm } from './OutputFormatSelectorLawFirm';
import { ClientSelectorLawFirm } from './ClientSelectorLawFirm';
import { FileUploaderLawFirm } from './FileUploaderLawFirm';
import { GenerationSummaryLawFirm } from './GenerationSummaryLawFirm';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export function DashboardLawFirm() {
  const [processMode, setProcessMode] = useState<'dl-only' | 'dl-transmittal' | 'transmittal-only'>('dl-only');
  const [outputFormat, setOutputFormat] = useState<'zip' | 'print'>('zip');
  const [selectedClient, setSelectedClient] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApprovedSignature] = useState(true);

  const handleGenerate = () => {
    if (!hasApprovedSignature) {
      alert('Cannot generate DL: No approved signature asset. Please contact admin.');
      return;
    }
    if (!uploadedFile || !selectedClient) {
      alert('Please select a client and upload an Excel file.');
      return;
    }
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      alert('DL Generated Successfully! Signature and date automatically applied.');
    }, 2000);
  };

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a2332]">Dashboard</h1>
            <p className="text-gray-600 mt-2">Generate and manage demand letters</p>
          </div>
          <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors self-start md:self-auto">
            <Download size={16} className="inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Signature Asset Status */}
      <div className={`rounded-lg shadow-sm border p-6 ${
        hasApprovedSignature 
          ? 'bg-green-50 border-green-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            hasApprovedSignature ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {hasApprovedSignature ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <AlertCircle className="text-red-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${hasApprovedSignature ? 'text-green-900' : 'text-red-900'}`}>
              {hasApprovedSignature ? 'Signature Asset Active' : 'No Approved Signature'}
            </h3>
            <p className={`text-sm mt-1 ${hasApprovedSignature ? 'text-green-800' : 'text-red-800'}`}>
              {hasApprovedSignature 
                ? 'Approved signature will be automatically applied to all generated DLs with handwritten-style date'
                : 'No approved signature asset available. Please contact admin to configure signature.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Main Workflow */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <ProcessModeSelectorLawFirm processMode={processMode} setProcessMode={setProcessMode} />
          <OutputFormatSelectorLawFirm outputFormat={outputFormat} setOutputFormat={setOutputFormat} />
          <ClientSelectorLawFirm selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
          <FileUploaderLawFirm uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} />
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          <GenerationSummaryLawFirm
            processMode={processMode}
            outputFormat={outputFormat}
            selectedClient={selectedClient}
            uploadedFile={uploadedFile}
            hasValidSignature={hasApprovedSignature}
          />

          {/* Generate Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !hasApprovedSignature || !uploadedFile || !selectedClient}
              className="w-full bg-emerald-600 text-white py-4 rounded-lg font-semibold hover:bg-emerald-700 hover:shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <FileText size={20} />
                  Generate Demand Letter
                </span>
              )}
            </button>

            {!hasApprovedSignature && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle size={16} />
                  Approved signature asset required to proceed
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}