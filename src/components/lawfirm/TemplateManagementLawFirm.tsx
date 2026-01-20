import { useState, useEffect, useRef, useMemo } from 'react';
import { FileType, Upload, Trash2, Edit, Eye, X, Plus } from 'lucide-react';
import { formatPhilippinesDate } from '../../utils/timezoneUtils';
import { PaginationControl } from '../ui/PaginationControl';

interface Template {
  id: number;
  name: string;
  description?: string;
  file_path: string;
  template_type: string;
  client_id?: string;
  is_active: boolean;
  created_at: string;
}

export function TemplateManagementLawFirm() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [uploadForm, setUploadForm] = useState({
    name: '',
    description: '',
    templateType: 'DL',
    clientId: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Calculate paginated templates
  const paginatedTemplates = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return templates.slice(startIndex, startIndex + itemsPerPage);
  }, [templates, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/templates/');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.log('Failed to fetch templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.name) {
      alert('Please select a file and enter a name');
      return;
    }

    const formData = new FormData();
    formData.append('template', selectedFile);
    formData.append('name', uploadForm.name);
    formData.append('description', uploadForm.description);
    formData.append('templateType', uploadForm.templateType);
    if (uploadForm.clientId) {
      formData.append('clientId', uploadForm.clientId);
    }

    try {
      const response = await fetch('http://localhost:8000/api/templates/', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Template uploaded successfully!');
        setShowUploadModal(false);
        setUploadForm({ name: '', description: '', templateType: 'DL', clientId: '' });
        setSelectedFile(null);
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`Failed to upload: ${error.detail || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Failed to upload template');
    }
  };

  const handleEdit = async () => {
    if (!selectedTemplate) return;

    try {
      const response = await fetch(`http://localhost:8000/api/templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: uploadForm.name,
          description: uploadForm.description,
          templateType: uploadForm.templateType
        })
      });
      
      if (response.ok) {
        alert('Template updated successfully!');
        setShowEditModal(false);
        setSelectedTemplate(null);
        fetchTemplates();
      }
    } catch (err) {
      alert('Failed to update template');
    }
  };

  const handleDelete = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`http://localhost:8000/api/templates/${templateId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        alert('Template deleted');
        fetchTemplates();
      }
    } catch (err) {
      alert('Failed to delete template');
    }
  };

  const handleView = (template: Template) => {
    // Open template file in new tab
    window.open(`http://localhost:8000${template.file_path}`, '_blank');
  };

  const openEditModal = (template: Template) => {
    setSelectedTemplate(template);
    setUploadForm({
      name: template.name,
      description: template.description || '',
      templateType: template.template_type,
      clientId: template.client_id || ''
    });
    setShowEditModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a2332] rounded-lg flex items-center justify-center">
              <FileType className="text-[#D4AF37]" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a2332]">Template Management</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Manage DL and transmittal templates</p>
            </div>
          </div>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] transition-all flex items-center gap-2"
          >
            <Upload size={18} />
            Upload Template
          </button>
        </div>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <FileType size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No templates found. Upload your first template to get started.</p>
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileType size={24} className="text-blue-600" />
                </div>
                <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                  template.template_type === 'DL' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-purple-100 text-purple-800'
                }`}>
                  {template.template_type}
                </span>
              </div>

              <h3 className="font-bold text-[#1a2332] mb-2">{template.name}</h3>
              {template.client_id && <p className="text-sm text-gray-600 mb-1">Client: {template.client_id}</p>}
              <p className="text-xs text-gray-500">
                Created: {formatPhilippinesDate(template.created_at)}
              </p>

              <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                <button 
                  onClick={() => handleView(template)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Eye size={14} />
                  View
                </button>
                <button 
                  onClick={() => openEditModal(template)}
                  className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(template.id)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Control */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-6">
          <PaginationControl
            currentPage={currentPage}
            totalItems={templates.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(newSize) => {
              setItemsPerPage(newSize);
              setCurrentPage(1);
            }}
          />
        </div>
        </>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1a2332]">Upload Template</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name *</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  placeholder="e.g., BPI Standard DL Template"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={uploadForm.templateType}
                    onChange={(e) => setUploadForm({ ...uploadForm, templateType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  >
                    <option value="DL">DL</option>
                    <option value="Transmittal">Transmittal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                  <input
                    type="text"
                    value={uploadForm.clientId}
                    onChange={(e) => setUploadForm({ ...uploadForm, clientId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                    placeholder="e.g., BPI"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template File *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  accept=".docx,.doc,.pdf,.xlsx,.xls"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-[#1a2332] text-white rounded-lg font-medium hover:bg-[#2a3342]"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1a2332]">Edit Template</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                <input
                  type="text"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                  rows={2}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={uploadForm.templateType}
                  onChange={(e) => setUploadForm({ ...uploadForm, templateType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
                >
                  <option value="DL">DL</option>
                  <option value="Transmittal">Transmittal</option>
                </select>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEdit}
                  className="flex-1 px-4 py-2 bg-[#1a2332] text-white rounded-lg font-medium hover:bg-[#2a3342]"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
