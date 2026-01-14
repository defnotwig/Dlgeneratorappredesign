import { Download, Printer } from 'lucide-react';

interface OutputFormatSelectorProps {
  outputFormat: 'zip' | 'print';
  setOutputFormat: (format: 'zip' | 'print') => void;
}

export function OutputFormatSelector({ outputFormat, setOutputFormat }: OutputFormatSelectorProps) {
  const formats = [
    {
      id: 'zip' as const,
      label: 'Download as ZIP',
      description: 'Download documents in a compressed file',
      icon: Download,
    },
    {
      id: 'print' as const,
      label: 'Direct to Print',
      description: 'Send documents directly to printer',
      icon: Printer,
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Download size={18} className="text-purple-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Output Format</h3>
          <p className="text-sm text-gray-500">Choose how the generated documents are delivered</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {formats.map((format) => {
          const Icon = format.icon;
          const isSelected = outputFormat === format.id;
          return (
            <button
              key={format.id}
              onClick={() => setOutputFormat(format.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                isSelected ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <Icon size={20} className={isSelected ? 'text-emerald-600' : 'text-gray-600'} />
              </div>
              <h4 className={`font-medium mb-1 ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>
                {format.label}
              </h4>
              <p className={`text-xs ${isSelected ? 'text-emerald-700' : 'text-gray-500'}`}>
                {format.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
