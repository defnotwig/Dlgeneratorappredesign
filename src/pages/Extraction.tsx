import { Database, FileText, Download, Filter, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function Extraction() {
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  const processedAccounts = [
    {
      id: 1,
      client: 'BANK OF MAKATI',
      docCode: 'pFV1DL2602-21910',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'JAPAN',
      processedAt: '2/6/2026 8:11:57 AM',
      processedBy: 'Gabriel Ludwig Rivera'
    },
    {
      id: 2,
      client: 'CSB REPLEVIN',
      docCode: 'pFV1DL2601-21908',
      acctTransCode: 'TEST/ACCTRANS/CODE1223',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/23/2026 4:09:58 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 3,
      client: 'CSB REPLEVIN',
      docCode: 'pFV1DL2601-21908',
      acctTransCode: 'TEST/ACCTRANS/CODE1223',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/23/2026 4:09:58 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 4,
      client: 'CSB REPLEVIN',
      docCode: 'pFV1DL2601-21907',
      acctTransCode: 'TEST/ACCTRANS/CODE1223',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/23/2026 4:09:58 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 5,
      client: 'CSB REPLEVIN',
      docCode: 'pFV1DL2601-21906',
      acctTransCode: 'TEST/ACCTRANS/CODE1223',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/23/2026 4:09:58 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 6,
      client: 'BANKGOLD',
      docCode: 'pFV1DL2601-21905',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/13/2026 9:03:38 AM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 7,
      client: 'BANK OF MAKATI',
      docCode: 'pFV1DL2601-21904',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/7/2026 7:12:58 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 8,
      client: 'BANK OF MAKATI',
      docCode: 'pFV1DL2601-21903',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/7/2026 5:10:27 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 9,
      client: 'BANK OF MAKATI',
      docCode: 'pFV1DL2601-21902',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/7/2026 5:04:00 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
    {
      id: 10,
      client: 'BANK OF MAKATI',
      docCode: 'pFV1DL2601-21901',
      acctTransCode: 'ACCT_TRANS_CODE',
      name: 'LEADS_CHNAME',
      finalArea: 'MAKATI',
      processedAt: '1/7/2026 4:54:11 PM',
      processedBy: 'Agarin, Emmanuel Magtibay'
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
              <Database className="text-white" size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Data Extraction</h1>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Extract and export generated document data</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Total Documents</span>
              <FileText className="text-emerald-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">2,847</p>
            <p className="text-xs text-gray-500 mt-1">Generated this month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Extracted Files</span>
              <Download className="text-emerald-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">847</p>
            <p className="text-xs text-gray-500 mt-1">Downloaded this month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-600">Data Size</span>
              <Database className="text-emerald-600" size={20} />
            </div>
            <p className="text-3xl font-bold text-gray-900">124.5 MB</p>
            <p className="text-xs text-gray-500 mt-1">Total extracted data</p>
          </div>
        </div>

        {/* Extraction Options */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Filter size={20} />
            Extraction Filters
          </h3>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <span className="flex items-center text-gray-500">to</span>
                <input
                  type="date"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Document Type
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                <option>All Documents</option>
                <option>Demand Letters</option>
                <option>Final Notices</option>
                <option>Collections</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Generated By
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                <option>All Users</option>
                <option>Gabriel Ludwig Rivera</option>
                <option>Francisco G. Pangasinan</option>
                <option>Maria Santos Cruz</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Export Format
              </label>
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                <option>Excel (.xlsx)</option>
                <option>CSV (.csv)</option>
                <option>JSON (.json)</option>
                <option>PDF Summary</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-colors flex items-center justify-center gap-2">
              <Download size={20} />
              Extract & Download
            </button>
            <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
              Reset Filters
            </button>
          </div>
        </div>

        {/* Recent Extractions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg">My Processed Accounts</h3>
            <p className="text-sm text-gray-600 mt-1">View accounts you have processed or see a summary grouped by DL Code</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Doc Code</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Acct - Trans Code</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Final Area</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Processed At</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Processed By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {processedAccounts.map((account) => (
                  <tr 
                    key={account.id} 
                    className={`transition-all cursor-pointer ${
                      selectedRowId === account.id 
                        ? 'bg-emerald-50/30 ring-2 ring-inset ring-emerald-500' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRowId(account.id)}
                  >
                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">{account.client}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.docCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.acctTransCode}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.finalArea}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{account.processedAt}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{account.processedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}