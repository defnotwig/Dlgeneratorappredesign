import { useState } from 'react';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Users, 
  TrendingUp,
  Activity,
  Database,
  CheckCircle,
  XCircle,
  Zap,
  Eye,
  HardDrive,
  Download
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  // Mock Data for Charts
  const dailyDocsData = [
    { date: '2/6', demandLetters: 450, transmittals: 180, total: 630 },
    { date: '2/7', demandLetters: 520, transmittals: 210, total: 730 },
    { date: '2/8', demandLetters: 380, transmittals: 150, total: 530 },
    { date: '2/9', demandLetters: 610, transmittals: 240, total: 850 },
    { date: '2/10', demandLetters: 580, transmittals: 230, total: 810 },
    { date: '2/11', demandLetters: 490, transmittals: 195, total: 685 },
    { date: '2/12', demandLetters: 650, transmittals: 260, total: 910 },
  ];

  const hourlyHeatmapData = [
    { hour: '6AM', mon: 12, tue: 15, wed: 10, thu: 18, fri: 14, sat: 5, sun: 3 },
    { hour: '8AM', mon: 45, tue: 50, wed: 42, thu: 55, fri: 48, sat: 8, sun: 5 },
    { hour: '10AM', mon: 78, tue: 82, wed: 75, thu: 88, fri: 80, sat: 12, sun: 8 },
    { hour: '12PM', mon: 65, tue: 70, wed: 62, thu: 75, fri: 68, sat: 10, sun: 6 },
    { hour: '2PM', mon: 92, tue: 95, wed: 88, thu: 102, fri: 90, sat: 15, sun: 10 },
    { hour: '4PM', mon: 85, tue: 88, wed: 80, thu: 95, fri: 82, sat: 12, sun: 8 },
    { hour: '6PM', mon: 35, tue: 38, wed: 32, thu: 42, fri: 36, sat: 8, sun: 5 },
  ];

  const topTemplatesData = [
    { name: 'Standard Demand Letter', count: 2450, percentage: 38 },
    { name: 'Collection Notice', count: 1820, percentage: 28 },
    { name: 'Payment Reminder', count: 980, percentage: 15 },
    { name: 'Final Notice', count: 650, percentage: 10 },
    { name: 'Legal Warning', count: 420, percentage: 6 },
    { name: 'Settlement Offer', count: 180, percentage: 3 },
  ];

  const performanceData = [
    { stage: 'Template Fetch', p50: 120, p95: 250, p99: 380 },
    { stage: 'Fill Placeholders', p50: 85, p95: 180, p99: 290 },
    { stage: 'Embed Signature', p50: 95, p95: 210, p99: 340 },
    { stage: 'DOCX→PDF', p50: 450, p95: 890, p99: 1200 },
    { stage: 'Preview Render', p50: 180, p95: 420, p99: 650 },
  ];

  const errorCategoriesData = [
    { name: 'LibreOffice Failure', value: 145, color: '#EF4444' },
    { name: 'Missing Placeholder', value: 89, color: '#F59E0B' },
    { name: 'FTP Error', value: 67, color: '#F97316' },
    { name: 'Auth/401 Error', value: 45, color: '#DC2626' },
    { name: 'Amount-to-Words', value: 34, color: '#FCD34D' },
    { name: 'Other', value: 28, color: '#9CA3AF' },
  ];

  const larkApprovalData = [
    { name: 'Approved', value: 245, color: '#10B981' },
    { name: 'Pending', value: 38, color: '#F59E0B' },
    { name: 'Rejected', value: 12, color: '#EF4444' },
    { name: 'Expired', value: 5, color: '#6B7280' },
  ];

  const batchSizeData = [
    { range: '1-50', count: 45 },
    { range: '51-100', count: 82 },
    { range: '101-250', count: 120 },
    { range: '251-500', count: 95 },
    { range: '501-1000', count: 48 },
    { range: '1000+', count: 18 },
  ];

  const activeUsersData = [
    { date: '2/6', users: 28 },
    { date: '2/7', users: 32 },
    { date: '2/8', users: 26 },
    { date: '2/9', users: 35 },
    { date: '2/10', users: 34 },
    { date: '2/11', users: 29 },
    { date: '2/12', users: 38 },
  ];

  const COLORS = ['#003B5C', '#D4AF37', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive metrics and performance insights
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Date Range Filter */}
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>

            <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#003B5C] text-white rounded-lg text-sm font-semibold hover:bg-[#002940]">
              <Download size={16} />
              Export Report
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003B5C] to-[#005580] rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                +12.5%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">5,485</div>
            <div className="text-sm text-gray-600">Total Docs (7 days)</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#10B981] to-[#059669] rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                98.7%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">5,413</div>
            <div className="text-sm text-gray-600">Successful Generations</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-white" size={24} />
              </div>
              <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-1 rounded">
                1.3%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">72</div>
            <div className="text-sm text-gray-600">Failed Generations</div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-lg flex items-center justify-center">
                <Clock className="text-white" size={24} />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                P95
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">1.8s</div>
            <div className="text-sm text-gray-600">Avg Generation Time</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-3 flex gap-2 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'performance', label: 'Performance', icon: Zap },
              { id: 'errors', label: 'Errors & Failures', icon: AlertTriangle },
              { id: 'templates', label: 'Templates', icon: FileText },
              { id: 'users', label: 'User Activity', icon: Users },
              { id: 'approvals', label: 'Approvals', icon: CheckCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedMetric(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedMetric === tab.id
                    ? 'bg-[#003B5C] text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* OVERVIEW TAB */}
            {selectedMetric === 'overview' && (
              <div className="space-y-6">
                {/* Daily Document Count */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Daily Document Inventory (by Type)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dailyDocsData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="demandLetters" name="Demand Letters" fill="#003B5C" />
                      <Bar dataKey="transmittals" name="Transmittals" fill="#D4AF37" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Hourly Heatmap */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Docs Generated Per Hour (Peak Hour Analysis)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={hourlyHeatmapData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="hour" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFF', 
                          border: '1px solid #E5E7EB',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="mon" name="Mon" stroke="#003B5C" strokeWidth={2} />
                      <Line type="monotone" dataKey="tue" name="Tue" stroke="#005580" strokeWidth={2} />
                      <Line type="monotone" dataKey="wed" name="Wed" stroke="#0077A3" strokeWidth={2} />
                      <Line type="monotone" dataKey="thu" name="Thu" stroke="#D4AF37" strokeWidth={2} />
                      <Line type="monotone" dataKey="fri" name="Fri" stroke="#B8941F" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-900">
                      <strong>Peak Hours:</strong> 2PM-4PM (Mon-Fri) | 
                      <strong className="ml-2">Staffing Recommendation:</strong> 3-4 operators during peak, 1-2 during off-peak
                    </p>
                  </div>
                </div>

                {/* Active Users & Batch Size */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Unique Users Generating Docs
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={activeUsersData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="date" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip />
                        <Area 
                          type="monotone" 
                          dataKey="users" 
                          stroke="#003B5C" 
                          fill="#003B5C" 
                          fillOpacity={0.2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Batch Size Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={batchSizeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="range" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip />
                        <Bar dataKey="count" fill="#D4AF37" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Stats Summary */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1">Avg Batch Size</div>
                    <div className="text-2xl font-bold text-blue-900">287 rows</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                    <div className="text-sm text-purple-700 mb-1">Max Batch Size</div>
                    <div className="text-2xl font-bold text-purple-900">1,450 rows</div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1">Total Batches</div>
                    <div className="text-2xl font-bold text-green-900">408</div>
                  </div>
                </div>
              </div>
            )}

            {/* PERFORMANCE TAB */}
            {selectedMetric === 'performance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    End-to-End Generation Time Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={performanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis type="number" stroke="#6B7280" label={{ value: 'Time (ms)', position: 'bottom' }} />
                      <YAxis dataKey="stage" type="category" stroke="#6B7280" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="p50" name="P50 (Median)" fill="#10B981" />
                      <Bar dataKey="p95" name="P95" fill="#F59E0B" />
                      <Bar dataKey="p99" name="P99" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Metrics Grid */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-[#003B5C]" size={20} />
                      <div className="text-xs text-gray-600">Queue Depth</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">12</div>
                    <div className="text-xs text-gray-500 mt-1">Active jobs: 5</div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="text-[#D4AF37]" size={20} />
                      <div className="text-xs text-gray-600">Concurrency</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">8</div>
                    <div className="text-xs text-gray-500 mt-1">Max: 12 workers</div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Eye className="text-green-600" size={20} />
                      <div className="text-xs text-gray-600">Cache Hit Rate</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">87.3%</div>
                    <div className="text-xs text-gray-500 mt-1">Preview cache</div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="text-purple-600" size={20} />
                      <div className="text-xs text-gray-600">Avg Wait Time</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">0.4s</div>
                    <div className="text-xs text-gray-500 mt-1">Before processing</div>
                  </div>
                </div>

                {/* Slow Operations Alert */}
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-orange-600 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-orange-900 mb-1">
                        Performance Alert: LibreOffice Conversion
                      </div>
                      <div className="text-sm text-orange-800">
                        DOCX→PDF conversion is the slowest stage (P95: 890ms, P99: 1200ms). 
                        Consider adding more worker instances or optimizing LibreOffice configuration.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ERRORS TAB */}
            {selectedMetric === 'errors' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Error Categories (Last 7 Days)
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={errorCategoriesData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {errorCategoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Error Statistics
                    </h3>
                    <div className="space-y-3">
                      {errorCategoriesData.map((error, idx) => (
                        <div key={idx} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-semibold text-gray-900">{error.name}</div>
                            <div className="text-lg font-bold" style={{ color: error.color }}>
                              {error.value}
                            </div>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all"
                              style={{ 
                                width: `${(error.value / 408) * 100}%`,
                                backgroundColor: error.color
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Top Recurring Errors */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Top Recurring Errors (Last Seen)
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Error Message</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Count</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Last Seen</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Retry Success</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            LibreOffice timeout after 30s
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600">145</td>
                          <td className="px-4 py-3 text-sm text-gray-600">2 min ago</td>
                          <td className="px-4 py-3 text-sm text-green-600">78%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Placeholder ${'{client_address}'} not found
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-600">89</td>
                          <td className="px-4 py-3 text-sm text-gray-600">15 min ago</td>
                          <td className="px-4 py-3 text-sm text-red-600">12%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            FTP connection refused (port 21)
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-orange-600">67</td>
                          <td className="px-4 py-3 text-sm text-gray-600">1 hour ago</td>
                          <td className="px-4 py-3 text-sm text-green-600">92%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Unauthorized (401): Session expired
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-red-600">45</td>
                          <td className="px-4 py-3 text-sm text-gray-600">3 hours ago</td>
                          <td className="px-4 py-3 text-sm text-green-600">100%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Retry Success Rate */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-sm text-green-700 mb-1">First Try Success</div>
                    <div className="text-2xl font-bold text-green-900">98.7%</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 mb-1">Retry Success</div>
                    <div className="text-2xl font-bold text-blue-900">85.3%</div>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-sm text-red-700 mb-1">Total Failures</div>
                    <div className="text-2xl font-bold text-red-900">11</div>
                  </div>
                </div>
              </div>
            )}

            {/* TEMPLATES TAB */}
            {selectedMetric === 'templates' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Top 10 Most Used Templates
                  </h3>
                  <div className="space-y-3">
                    {topTemplatesData.map((template, idx) => (
                      <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600">
                            {template.count} docs ({template.percentage}%)
                          </div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#003B5C] to-[#005580] transition-all"
                            style={{ width: `${template.percentage * 2.5}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Placeholder Health */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Placeholder Coverage & Health
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Template</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Coverage Score</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Most Missing</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Standard Demand Letter</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                              98.5%
                              <CheckCircle size={16} />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">${'{client_email}'} (8)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">v3.2</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Collection Notice</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-green-600">
                              97.2%
                              <CheckCircle size={16} />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">${'{payment_method}'} (12)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">v2.8</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">Payment Reminder</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600">
                              89.4%
                              <AlertTriangle size={16} />
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">${'{due_date}'} (45)</td>
                          <td className="px-4 py-3 text-sm text-gray-600">v1.5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Template Version Impact */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="text-blue-600 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-blue-900 mb-1">
                        Template Update Impact: Standard Demand Letter v3.2
                      </div>
                      <div className="text-sm text-blue-800">
                        Released 3 days ago | Error rate: -12% (1.8% → 0.6%) | 
                        Generation time: -150ms | 2,450 documents generated with new version
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS TAB */}
            {selectedMetric === 'users' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Most Active Users (Last 7 Days)
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">User</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Role</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Docs Generated</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Batches</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Failure Rate</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Maria Santos</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 text-xs font-semibold rounded">
                              Admin
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">1,245</td>
                          <td className="px-4 py-3 text-sm text-gray-600">42</td>
                          <td className="px-4 py-3 text-sm text-green-600">0.3%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Juan Dela Cruz</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              User
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">980</td>
                          <td className="px-4 py-3 text-sm text-gray-600">35</td>
                          <td className="px-4 py-3 text-sm text-green-600">0.8%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Ana Reyes</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              User
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">856</td>
                          <td className="px-4 py-3 text-sm text-gray-600">28</td>
                          <td className="px-4 py-3 text-sm text-orange-600">2.1%</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Pedro Tan</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded">
                              User
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">742</td>
                          <td className="px-4 py-3 text-sm text-gray-600">25</td>
                          <td className="px-4 py-3 text-sm text-green-600">0.5%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Suspicious Patterns Alert */}
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="text-red-600 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-red-900 mb-1">
                        Suspicious Activity Detected
                      </div>
                      <div className="text-sm text-red-800">
                        User "Ana Reyes" has abnormal failure rate (2.1% vs avg 0.6%). 
                        Possible issues: incorrect data format, outdated template version, or training needed.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role-Based Usage */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">Admin Actions (Last 7 Days)</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Template Updates</span>
                        <span className="font-bold text-gray-900">8</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Signature Changes</span>
                        <span className="font-bold text-gray-900">3</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">User Management</span>
                        <span className="font-bold text-gray-900">5</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Config Changes</span>
                        <span className="font-bold text-gray-900">12</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-gray-200 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-4">User Actions (Last 7 Days)</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Document Generations</span>
                        <span className="font-bold text-gray-900">4,240</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Excel Uploads</span>
                        <span className="font-bold text-gray-900">366</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Preview Views</span>
                        <span className="font-bold text-gray-900">5,820</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">ZIP Downloads</span>
                        <span className="font-bold text-gray-900">298</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* APPROVALS TAB */}
            {selectedMetric === 'approvals' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Lark Approval Funnel
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={larkApprovalData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, value }) => `${name}: ${value}`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {larkApprovalData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Approval Statistics
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-green-700">Approval Rate</div>
                            <div className="text-3xl font-bold text-green-900">81.7%</div>
                          </div>
                          <CheckCircle className="text-green-600" size={32} />
                        </div>
                      </div>

                      <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-orange-700">Pending Requests</div>
                            <div className="text-3xl font-bold text-orange-900">38</div>
                          </div>
                          <Clock className="text-orange-600" size={32} />
                        </div>
                      </div>

                      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-red-700">Rejection Rate</div>
                            <div className="text-3xl font-bold text-red-900">4.0%</div>
                          </div>
                          <XCircle className="text-red-600" size={32} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval Latency */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Approval Response Time
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">P50 (Median)</div>
                      <div className="text-2xl font-bold text-gray-900">4.2 min</div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">P95</div>
                      <div className="text-2xl font-bold text-gray-900">18.5 min</div>
                    </div>
                    <div className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600 mb-1">Max</div>
                      <div className="text-2xl font-bold text-gray-900">2.4 hours</div>
                    </div>
                  </div>
                </div>

                {/* Active Signatures */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Signature Usage & History
                  </h3>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Signature</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Usage Count</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Last Changed</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Changed By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            Atty. Maria Santos (Primary)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">3,240 docs</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Jan 15, 2026</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Admin User</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            Atty. Juan Cruz (Secondary)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">1,580 docs</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Dec 22, 2025</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Admin User</td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            Atty. Ana Reyes (Backup)
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">665 docs</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Nov 8, 2025</td>
                          <td className="px-4 py-3 text-sm text-gray-600">Maria Santos</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Recent Signature Changes */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Activity className="text-blue-600 flex-shrink-0" size={20} />
                    <div>
                      <div className="font-semibold text-blue-900 mb-1">
                        Recent Signature Switch
                      </div>
                      <div className="text-sm text-blue-800">
                        Admin switched from "Atty. Cruz" to "Atty. Santos" on Feb 10, 2026 at 3:45 PM. 
                        Applied to all subsequent generations.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage & Cleanup Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HardDrive size={20} />
            Storage, Cleanup & Cost Metrics
          </h3>
          
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <div className="text-sm text-blue-700 mb-1">Total Storage Used</div>
              <div className="text-2xl font-bold text-blue-900">248 GB</div>
              <div className="text-xs text-blue-600 mt-1">↑ 12 GB this week</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
              <div className="text-sm text-green-700 mb-1">Files Cleaned Up</div>
              <div className="text-2xl font-bold text-green-900">1,248</div>
              <div className="text-xs text-green-600 mt-1">38 GB freed</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <div className="text-sm text-purple-700 mb-1">Preview Cache Hit</div>
              <div className="text-2xl font-bold text-purple-900">87.3%</div>
              <div className="text-xs text-purple-600 mt-1">↑ 2.1% improvement</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
              <div className="text-sm text-orange-700 mb-1">Temp Folder Size</div>
              <div className="text-2xl font-bold text-orange-900">4.2 GB</div>
              <div className="text-xs text-orange-600 mt-1">LibreOffice temp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
