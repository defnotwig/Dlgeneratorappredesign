import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}

export function FileUploaderLawFirm({ uploadedFile, setUploadedFile }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        setUploadedFile(file);
      } else {
        alert('Please upload an Excel file (.xlsx or .xls)');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadedFile(files[0]);
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded shadow-sm border border-stone-200 p-6">
      <div className="mb-4">
        <h3 className="font-serif font-bold text-lg text-stone-900">Upload Excel File</h3>
        <p className="text-sm text-stone-600 mt-1">Upload the Excel file containing account data</p>
      </div>

      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded p-8 transition-all ${
            isDragging
              ? 'border-amber-600 bg-amber-50'
              : 'border-stone-300 hover:border-stone-400'
          }`}
        >
          <div className="text-center">
            <Upload size={40} className="text-stone-400 mx-auto mb-4" />
            <h4 className="font-semibold text-stone-900 mb-2">
              Drag and drop your Excel file here
            </h4>
            <p className="text-sm text-stone-600 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-amber-700 text-white rounded font-semibold hover:bg-amber-800 transition-colors"
            >
              Browse Files
            </button>
            <p className="text-xs text-stone-500 mt-4">Supports .xlsx and .xls files</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border-2 border-green-600 bg-green-50 rounded p-6">
          <div className="flex items-center gap-4">
            <File size={32} className="text-green-700" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-green-900">{uploadedFile.name}</h4>
                <CheckCircle size={16} className="text-green-700" />
              </div>
              <p className="text-sm text-green-800">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="w-10 h-10 bg-white hover:bg-red-50 rounded flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-red-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
