import { Clock, FileText, User, Filter, Download, Search, X, ChevronDown } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { formatPhilippinesDateTime } from '../../utils/timezoneUtils';
import { PaginationControl } from '../ui/PaginationControl';

interface AuditLog {
  id: number;
  created_at: string;
  user_id?: number;
  action: string;
  resource_type?: string;
  resource_id?: string;
  status: string;
  details?: string;
}

export function AuditTrailLawFirm() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [actions, setActions] = useState<string[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 100,
    offset: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchLogs();
    fetchActions();
  }, [filterAction, filterStatus]);

  const fetchLogs = async () => {
    try {
      let url = 'http://localhost:8000/api/audit/?limit=100';
      if (filterAction) url += `&action=${filterAction}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        setPagination(data.pagination || { total: 0, limit: 100, offset: 0, hasMore: false });
      }
    } catch (err) {
      console.log('Failed to fetch audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActions = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/audit/actions');
      if (response.ok) {
        const data = await response.json();
        setActions(data || []);
      }
    } catch (err) {
      console.log('Failed to fetch actions:', err);
    }
  };

  const handleExport = async (format: string) => {
    setShowExportMenu(false);
    
    try {
      let url = `http://localhost:8000/api/audit/export/download?format=${format}`;
      if (filterAction) url += `&action=${filterAction}`;
      if (filterStatus) url += `&status=${filterStatus}`;

      const response = await fetch(url);
      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('content-disposition');
        const filenameMatch = contentDisposition?.match(/filename=([^;]+)/);
        const filename = filenameMatch ? filenameMatch[1] : `audit_logs.${format}`;
        
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert('Export failed');
      }
    } catch (err) {
      alert('Failed to export audit logs');
    }
  };

  const filteredLogs = logs.filter(log =>
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.resource_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Calculate paginated logs
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage, itemsPerPage]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'error':
      case 'failure':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // FIXED: Use shared timezone utility that properly handles UTC timestamps
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '-';
    return formatPhilippinesDateTime(dateStr);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a2332] rounded-lg flex items-center justify-center">
              <Clock className="text-[#D4AF37]" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a2332]">Audit Trail</h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">Track all system activities and changes</p>
            </div>
          </div>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-5 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] transition-all flex items-center gap-2"
            >
              <Download size={18} />
              Export Logs
              <ChevronDown size={16} />
            </button>
            
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as Excel (XLSX)
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Export as JSON
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
              />
            </div>
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All Actions</option>
            {actions.map((action) => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37]"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="warning">Warning</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Logs</p>
          <p className="text-2xl font-bold text-[#1a2332]">{pagination.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Displayed</p>
          <p className="text-2xl font-bold text-[#1a2332]">{filteredLogs.length}</p>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading audit logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <Clock size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-stone-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Resource</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#1a2332]">{log.action}</span>
                    </td>
                    <td className="px-6 py-4">
                      {log.resource_type && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                          {log.resource_type}
                          {log.resource_id && ` #${log.resource_id}`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded text-xs font-semibold ${getStatusBadge(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {log.details || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Control */}
          {filteredLogs.length > 0 && (
            <div className="p-4 border-t border-gray-200">
              <PaginationControl
                currentPage={currentPage}
                totalItems={filteredLogs.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={(newSize) => {
                  setItemsPerPage(newSize);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}
