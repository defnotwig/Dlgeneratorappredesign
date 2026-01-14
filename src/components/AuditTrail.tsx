import { Clock, FileText, User, Filter, Download, Search } from 'lucide-react';
import { useState } from 'react';

interface AuditLog {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  status: 'success' | 'warning' | 'error';
}

export function AuditTrail() {
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const auditLogs: AuditLog[] = [
    {
      id: 1,
      timestamp: 'Jan 14, 2026 09:45 AM',
      user: 'Pangasinan, Francisco G.',
      action: 'DL Generated',
      details: 'Template: Payment Demand | Client: John Doe',
      status: 'success',
    },
    {
      id: 2,
      timestamp: 'Jan 14, 2026 09:30 AM',
      user: 'Cruz, Maria S.',
      action: 'Signature Approved',
      details: 'Approved signature request #12',
      status: 'success',
    },
    {
      id: 3,
      timestamp: 'Jan 14, 2026 09:15 AM',
      user: 'Pangasinan, Francisco G.',
      action: 'Signature Request',
      details: 'Requested signature approval via Lark Bot',
      status: 'warning',
    },
    {
      id: 4,
      timestamp: 'Jan 13, 2026 04:20 PM',
      user: 'Santos, Robert L.',
      action: 'Template Modified',
      details: 'Updated "Payment Demand" template',
      status: 'success',
    },
    {
      id: 5,
      timestamp: 'Jan 13, 2026 02:10 PM',
      user: 'Pangasinan, Francisco G.',
      action: 'DL Generated',
      details: 'Template: Final Notice | Client: Jane Smith',
      status: 'success',
    },
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesFilter = filterAction === 'all' || log.action.toLowerCase().includes(filterAction.toLowerCase());
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
            <Clock className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Audit Trail</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Track all system activities and changes</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Filter size={16} className="inline mr-1" />
              Filter by Action
            </label>
            <select 
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            >
              <option value="all">All Actions</option>
              <option value="generated">DL Generated</option>
              <option value="signature">Signature</option>
              <option value="template">Template</option>
              <option value="user">User Management</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Search size={16} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user or details..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2">
              <Download size={16} />
              Export Logs
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Details</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <User size={16} className="text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-900">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{log.action}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {log.details}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      log.status === 'success' 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : log.status === 'warning'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLogs.length === 0 && (
          <div className="p-12 text-center">
            <Clock size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No audit logs found</p>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FileText size={20} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">124</p>
              <p className="text-sm text-gray-600">Total DLs Generated</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">342</p>
              <p className="text-sm text-gray-600">Total Actions (30 days)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
