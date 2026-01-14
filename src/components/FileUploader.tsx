import { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
}

export function FileUploader({ uploadedFile, setUploadedFile }: FileUploaderProps) {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
          <Upload size={18} className="text-indigo-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Upload Excel File</h3>
          <p className="text-sm text-gray-500">Upload the Excel file containing account data</p>
        </div>
      </div>

      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-8 transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload size={32} className="text-gray-400" />
            </div>
            <h4 className="font-medium text-gray-900 mb-2">
              Drag and drop your Excel file here
            </h4>
            <p className="text-sm text-gray-500 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Browse Files
            </button>
            <p className="text-xs text-gray-400 mt-4">Supports .xlsx and .xls files</p>
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
        <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <File size={24} className="text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-emerald-900">{uploadedFile.name}</h4>
                <CheckCircle size={16} className="text-emerald-600" />
              </div>
              <p className="text-sm text-emerald-700">
                {(uploadedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="w-8 h-8 bg-white hover:bg-red-50 rounded-lg flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-red-600" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
