import { FileText, Send, Files } from 'lucide-react';

interface ProcessModeSelectorProps {
  processMode: 'dl-only' | 'dl-transmittal' | 'transmittal-only';
  setProcessMode: (mode: 'dl-only' | 'dl-transmittal' | 'transmittal-only') => void;
}

export function ProcessModeSelectorLawFirm({ processMode, setProcessMode }: ProcessModeSelectorProps) {
  const modes = [
    {
      id: 'dl-only' as const,
      label: 'DL Only',
      description: 'Generate demand letters only',
      icon: FileText,
    },
    {
      id: 'dl-transmittal' as const,
      label: 'DL with Transmittal',
      description: 'Generate DL and transmittal documents',
      icon: Files,
    },
    {
      id: 'transmittal-only' as const,
      label: 'Transmittal Only',
      description: 'Generate transmittal documents only',
      icon: Send,
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#003B5C]">Processing Mode</h3>
        <p className="text-sm text-gray-600 mt-1">Select how you want to process your documents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = processMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setProcessMode(mode.id)}
              className={`p-5 rounded-lg border-2 transition-all text-left ${
                isSelected
                  ? 'border-[#D4AF37] bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <Icon size={24} className={isSelected ? 'text-[#D4AF37] mb-3' : 'text-gray-500 mb-3'} />
              <h4 className={`font-semibold mb-1 ${isSelected ? 'text-[#003B5C]' : 'text-gray-900'}`}>
                {mode.label}
              </h4>
              <p className={`text-xs ${isSelected ? 'text-gray-700' : 'text-gray-600'}`}>
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
