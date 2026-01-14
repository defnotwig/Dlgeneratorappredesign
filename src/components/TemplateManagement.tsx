import { FileType, Upload, Trash2, Edit, Eye } from 'lucide-react';

export function TemplateManagement() {
  const templates = [
    { id: 1, name: 'BPI - Standard DL Template', type: 'DL', client: 'BPI', lastModified: 'Jan 10, 2026' },
    { id: 2, name: 'BPI - Transmittal Template', type: 'Transmittal', client: 'BPI', lastModified: 'Jan 10, 2026' },
    { id: 3, name: 'BPI BANKO - Standard DL', type: 'DL', client: 'BPI BANKO', lastModified: 'Jan 8, 2026' },
    { id: 4, name: 'EON BANK - Standard DL', type: 'DL', client: 'EON BANK', lastModified: 'Dec 15, 2025' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <FileType className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Template Management</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Manage DL and transmittal templates</p>
            </div>
          </div>
          <button className="px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2">
            <Upload size={18} />
            Upload Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileType size={24} className="text-blue-600" />
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                template.type === 'DL' 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {template.type}
              </span>
            </div>

            <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-1">Client: {template.client}</p>
            <p className="text-xs text-gray-500">Modified: {template.lastModified}</p>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
              <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1">
                <Eye size={14} />
                View
              </button>
              <button className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1">
                <Edit size={14} />
                Edit
              </button>
              <button className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
