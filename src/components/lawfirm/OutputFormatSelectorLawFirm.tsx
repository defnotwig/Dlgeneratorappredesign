import { Download, Printer } from 'lucide-react';

interface OutputFormatSelectorProps {
  outputFormat: 'zip' | 'print';
  setOutputFormat: (format: 'zip' | 'print') => void;
}

export function OutputFormatSelectorLawFirm({ outputFormat, setOutputFormat }: OutputFormatSelectorProps) {
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
    <div className="bg-white rounded shadow-sm border border-stone-200 p-6">
      <div className="mb-4">
        <h3 className="font-serif font-bold text-lg text-stone-900">Output Format</h3>
        <p className="text-sm text-stone-600 mt-1">Choose how the generated documents are delivered</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {formats.map((format) => {
          const Icon = format.icon;
          const isSelected = outputFormat === format.id;
          return (
            <button
              key={format.id}
              onClick={() => setOutputFormat(format.id)}
              className={`p-5 rounded border-2 transition-all text-left ${
                isSelected
                  ? 'border-amber-700 bg-amber-50'
                  : 'border-stone-300 hover:border-stone-400 bg-white'
              }`}
            >
              <Icon size={24} className={isSelected ? 'text-amber-700 mb-3' : 'text-stone-500 mb-3'} />
              <h4 className={`font-semibold mb-1 ${isSelected ? 'text-amber-900' : 'text-stone-900'}`}>
                {format.label}
              </h4>
              <p className={`text-xs ${isSelected ? 'text-amber-800' : 'text-stone-600'}`}>
                {format.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
