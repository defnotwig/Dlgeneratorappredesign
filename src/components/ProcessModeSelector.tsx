import { FileText, Send, Files } from 'lucide-react';

interface ProcessModeSelectorProps {
  processMode: 'dl-only' | 'dl-transmittal' | 'transmittal-only';
  setProcessMode: (mode: 'dl-only' | 'dl-transmittal' | 'transmittal-only') => void;
}

export function ProcessModeSelector({ processMode, setProcessMode }: ProcessModeSelectorProps) {
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText size={18} className="text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Processing Mode</h3>
          <p className="text-sm text-gray-500">Select how you want to process your documents</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isSelected = processMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => setProcessMode(mode.id)}
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
                {mode.label}
              </h4>
              <p className={`text-xs ${isSelected ? 'text-emerald-700' : 'text-gray-500'}`}>
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
