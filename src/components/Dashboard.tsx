import { useState, useEffect } from 'react';
import { ProcessModeSelector } from './ProcessModeSelector';
import { OutputFormatSelector } from './OutputFormatSelector';
import { ClientSelector } from './ClientSelector';
import { FileUploader } from './FileUploader';
import { GenerationSummary } from './GenerationSummary';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface ActiveSignature {
  id: number;
  file_path: string;
  file_name?: string;
  status: string;
  approved_at?: string;
  validity_period?: string;
}

export function Dashboard() {
  const [processMode, setProcessMode] = useState<'dl-only' | 'dl-transmittal' | 'transmittal-only'>('dl-only');
  const [outputFormat, setOutputFormat] = useState<'zip' | 'print'>('zip');
  const [selectedClient, setSelectedClient] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasApprovedSignature, setHasApprovedSignature] = useState(false);
  const [activeSignature, setActiveSignature] = useState<ActiveSignature | null>(null);

  // Fetch actual signature status from backend using the dedicated active signature endpoint
  useEffect(() => {
    const checkSignatureStatus = async () => {
      try {
        // Use the dedicated endpoint that returns the active (approved) signature
        const response = await fetch('http://localhost:8000/api/signatures/status/active');
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === 'Approved') {
            setHasApprovedSignature(true);
            setActiveSignature(data);
          } else {
            setHasApprovedSignature(false);
            setActiveSignature(null);
          }
        } else {
          setHasApprovedSignature(false);
          setActiveSignature(null);
        }
      } catch (err) {
        console.log('Failed to check signature status:', err);
        setHasApprovedSignature(false);
        setActiveSignature(null);
      }
    };
    
    checkSignatureStatus();
    // Poll every 3 seconds to catch real-time updates
    const interval = setInterval(checkSignatureStatus, 3000);
    return () => clearInterval(interval);
  }, []);


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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-500 mt-1">Generate and manage demand letters</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
              <Download size={16} className="inline mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Signature Asset Status */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        hasApprovedSignature 
          ? 'bg-emerald-50 border-emerald-300' 
          : 'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            hasApprovedSignature ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {hasApprovedSignature ? (
              <CheckCircle className="text-emerald-600" size={24} />
            ) : (
              <AlertCircle className="text-red-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${hasApprovedSignature ? 'text-emerald-900' : 'text-red-900'}`}>
              {hasApprovedSignature ? 'Signature Asset Active' : 'No Approved Signature'}
            </h3>
            <p className={`text-sm mt-1 ${hasApprovedSignature ? 'text-emerald-800' : 'text-red-800'}`}>
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
          <ProcessModeSelector processMode={processMode} setProcessMode={setProcessMode} />
          <OutputFormatSelector outputFormat={outputFormat} setOutputFormat={setOutputFormat} />
          <ClientSelector selectedClient={selectedClient} setSelectedClient={setSelectedClient} />
          <FileUploader uploadedFile={uploadedFile} setUploadedFile={setUploadedFile} />
        </div>

        {/* Right Column - Summary & Actions */}
        <div className="space-y-6">
          <GenerationSummary
            processMode={processMode}
            outputFormat={outputFormat}
            selectedClient={selectedClient}
            uploadedFile={uploadedFile}
            hasValidSignature={hasApprovedSignature}
          />

          {/* Generate Button */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !hasApprovedSignature || !uploadedFile || !selectedClient}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md"
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
