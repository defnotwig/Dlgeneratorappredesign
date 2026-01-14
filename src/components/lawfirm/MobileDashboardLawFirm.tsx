import { useState } from 'react';
import { FileText, Upload, Download, Building2, AlertCircle, CheckCircle } from 'lucide-react';
import dlIcon from 'figma:asset/4ea8c3dcc0384b12702c3eba88ebae3e2ef52f04.png';

export function MobileDashboardLawFirm() {
  const [processMode, setProcessMode] = useState<'dl-only' | 'dl-transmittal' | 'transmittal-only'>('dl-only');
  const [selectedClient, setSelectedClient] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [hasApprovedSignature] = useState(true);

  const clients = [
    { id: 'bpi', name: 'BPI' },
    { id: 'bpi-banko', name: 'BPI BANKO' },
    { id: 'eon-bank', name: 'EON BANK' },
    { id: 'usb-plc', name: 'USB PLC' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleGenerate = () => {
    if (!hasApprovedSignature) {
      alert('Cannot generate DL: No approved signature asset. Please contact admin.');
      return;
    }
    if (!uploadedFile || !selectedClient) {
      alert('Please select a client and upload an Excel file.');
      return;
    }
    alert('DL Generated Successfully! Signature and date automatically applied.');
  };

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-[#00B894] rounded-xl flex items-center justify-center">
            <img src={dlIcon} alt="DL" className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-[#1a2332] text-lg leading-tight">DL Generator</h1>
            <p className="text-xs text-gray-600 mt-0.5">Demand Letter System</p>
          </div>
        </div>
      </div>

      {/* Signature Asset Status */}
      {hasApprovedSignature ? (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
            <p className="text-sm text-green-800 font-medium">Signature asset active - Auto-applied to all DLs</p>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
            <p className="text-sm text-red-800 font-medium">No approved signature asset available</p>
          </div>
        </div>
      )}

      {/* Process Mode */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h3 className="font-bold text-[#1a2332] mb-3 text-sm">Processing Mode</h3>
        <div className="space-y-2">
          {[
            { id: 'dl-only' as const, label: 'DL Only' },
            { id: 'dl-transmittal' as const, label: 'DL with Transmittal' },
            { id: 'transmittal-only' as const, label: 'Transmittal Only' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setProcessMode(mode.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left text-sm font-medium ${
                processMode === mode.id
                  ? 'border-[#D4AF37] bg-amber-50 text-[#1a2332]'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client Selection */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h3 className="font-bold text-[#1a2332] mb-3 text-sm flex items-center gap-2">
          <Building2 size={16} />
          Select Client
        </h3>
        <div className="space-y-2">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left text-sm font-medium ${
                selectedClient === client.id
                  ? 'border-[#D4AF37] bg-amber-50 text-[#1a2332]'
                  : 'border-gray-200 bg-white text-gray-700'
              }`}
            >
              {client.name}
            </button>
          ))}
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
        <h3 className="font-bold text-[#1a2332] mb-3 text-sm flex items-center gap-2">
          <Upload size={16} />
          Upload Excel File
        </h3>
        {!uploadedFile ? (
          <label className="block">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#D4AF37] transition-colors">
              <Upload size={32} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 font-medium">Tap to upload file</p>
              <p className="text-xs text-gray-500 mt-1">Supports .xlsx and .xls</p>
            </div>
          </label>
        ) : (
          <div className="border-2 border-green-600 bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <FileText size={24} className="text-green-700 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-green-900 text-sm truncate">{uploadedFile.name}</p>
                <p className="text-xs text-green-700">{(uploadedFile.size / 1024).toFixed(2)} KB</p>
              </div>
              <button
                onClick={() => setUploadedFile(null)}
                className="text-red-600 text-xs font-semibold"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="pb-4">
        <button
          onClick={handleGenerate}
          disabled={!uploadedFile || !selectedClient}
          className="w-full bg-[#1a2332] text-white py-4 rounded-xl font-bold hover:bg-[#2a3342] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-lg text-sm flex items-center justify-center gap-2"
        >
          <Download size={18} />
          Generate Demand Letter
        </button>
      </div>
    </div>
  );
}