import { useState } from 'react';
import { ProcessModeSelector } from './ProcessModeSelector';
import { OutputFormatSelector } from './OutputFormatSelector';
import { ClientSelector } from './ClientSelector';
import { FileUploader } from './FileUploader';
import { GenerationSummary } from './GenerationSummary';
import { Download, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export function Dashboard() {
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
      <div className="rounded-xl shadow-sm border p-6" style={{ 
        backgroundColor: 'var(--surface-1)', 
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-1)'
      }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 style={{ 
              fontFamily: 'var(--font-display)', 
              fontSize: '2rem', 
              fontWeight: 700, 
              color: 'var(--text-1)',
              letterSpacing: '-0.02em'
            }}>DL Generator</h1>
            <p style={{ color: 'var(--text-2)', marginTop: '4px', fontFamily: 'var(--font-body)' }}>Generate and manage demand letters</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{
            backgroundColor: 'var(--success-soft)',
            border: '1px solid var(--success)'
          }}>
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--success)' }}></div>
            <span className="text-sm font-semibold" style={{ color: 'var(--success-hover)', fontFamily: 'var(--font-body)' }}>Online</span>
          </div>
        </div>
      </div>

      {/* Signature Asset Status */}
      <div className="rounded-xl shadow-sm border p-6" style={{
        backgroundColor: hasApprovedSignature ? 'var(--success-soft)' : 'var(--warning-soft)',
        borderColor: hasApprovedSignature ? 'var(--success)' : 'var(--warning)'
      }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
            backgroundColor: hasApprovedSignature ? '#A7F3D0' : '#FDE68A'
          }}>
            {hasApprovedSignature ? (
              <CheckCircle style={{ color: 'var(--success-hover)' }} size={24} />
            ) : (
              <AlertCircle style={{ color: 'var(--warning-hover)' }} size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg" style={{ 
              color: hasApprovedSignature ? '#047857' : '#92400E',
              fontFamily: 'var(--font-display)'
            }}>
              {hasApprovedSignature ? 'Signature Active & Ready' : 'No Active Signature'}
            </h3>
            <p className="text-sm mt-1" style={{ 
              color: hasApprovedSignature ? '#065F46' : '#78350F',
              fontFamily: 'var(--font-body)'
            }}>
              {hasApprovedSignature 
                ? 'Attorney signature approved and available for automatic application'
                : 'Please upload a signature and request approval via Signature Config'
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
          <div className="rounded-xl shadow-sm border p-6" style={{
            backgroundColor: 'var(--surface-1)',
            borderColor: 'var(--border)'
          }}>
            <button
              onClick={handleGenerate}
              disabled={isProcessing || !hasApprovedSignature || !uploadedFile || !selectedClient}
              className="w-full py-4 rounded-lg font-semibold transition-all shadow-md"
              style={{
                backgroundColor: isProcessing || !hasApprovedSignature || !uploadedFile || !selectedClient ? 'var(--border-strong)' : '#10B981',
                color: 'var(--text-inverse)',
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isProcessing || !hasApprovedSignature || !uploadedFile || !selectedClient ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-1)',
                transitionDuration: 'var(--motion-fast)'
              }}
              onMouseEnter={(e) => {
                if (!isProcessing && hasApprovedSignature && uploadedFile && selectedClient) {
                  e.currentTarget.style.backgroundColor = '#059669';
                  e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(16, 185, 129, 0.3), 0 4px 6px -2px rgba(16, 185, 129, 0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing && hasApprovedSignature && uploadedFile && selectedClient) {
                  e.currentTarget.style.backgroundColor = '#10B981';
                  e.currentTarget.style.boxShadow = 'var(--shadow-1)';
                }
              }}
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
              <div className="mt-3 p-3 rounded-lg" style={{
                backgroundColor: 'var(--danger-soft)',
                border: '1px solid var(--danger)'
              }}>
                <p className="text-sm flex items-center gap-2" style={{ 
                  color: '#991B1B',
                  fontFamily: 'var(--font-body)'
                }}>
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