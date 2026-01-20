import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PenTool, Upload, CheckCircle, AlertCircle, Send, Eye, Calendar, X, ChevronLeft, ChevronRight, Clock, RefreshCw, Zap, Settings, Info } from 'lucide-react';
import larkBotPreview from 'figma:asset/dc72251a662d05d2daef2d6a8aa527763a3ed4e8.png';
import { CustomDateRenderer } from '../CustomDateRenderer';
import { formatPhilippinesDateTime, formatPhilippinesDate } from '../../utils/timezoneUtils';
import { PaginationControl } from '../ui/PaginationControl';

interface ApprovalRequest {
  id: number;
  signaturePreview: string;
  requestedDate: string;
  requestedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  respondedDate?: string;
  respondedBy?: string;
  validity: string;
  validityEndDate?: string;
  selectedDays?: string[];
  purpose: string;
}

interface SchedulerStatus {
  running: boolean;
  nextSunday: string;
  description: string;
}

interface LarkConfig {
  app_id?: string;
  template_id?: string;
  self_user_id?: string;
  has_secret?: boolean;
  configured: boolean;
}

type ValidityOption = '1 Week';

// Helper to get weekdays for a date range
function getWeekdaysInRange(startDate: Date, endDate: Date): Date[] {
  const weekdays: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) { // Mon-Fri only (Mon=1, Tue=2, Wed=3, Thu=4, Fri=5)
      weekdays.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }
  return weekdays;
}

// Helper to format date as YYYY-MM-DD without timezone conversion
function formatDateLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Calculate end date from validity period
function getEndDateFromValidity(validity: ValidityOption): Date | null {
  const now = new Date();
  // All validity options currently map to 1 week
  return new Date(now.setDate(now.getDate() + 7));
}

export function SignatureConfigLawFirm() {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [validityPeriod, setValidityPeriod] = useState<ValidityOption>('1 Week');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [showLarkInfo, setShowLarkInfo] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  const [usageOptions, setUsageOptions] = useState({ dlGenerator: true, otherDepts: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Pagination state for approval requests
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Auto-approval scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    running: true,
    nextSunday: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Auto-sends approval requests every Sunday at 9:00 AM. Retries hourly if rejected or pending.'
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isTriggeringApproval, setIsTriggeringApproval] = useState(false);
  
  // Lark Message Card Builder configuration state
  const [showLarkSetup, setShowLarkSetup] = useState(false);
  const [larkConfig, setLarkConfig] = useState<LarkConfig>({ configured: false });
  const [larkFormData, setLarkFormData] = useState({
    appId: '',
    appSecret: '',
    templateId: '',
    selfUserId: ''
  });
  const [isSavingLarkConfig, setIsSavingLarkConfig] = useState(false);

  // Active signature is ONLY from approved approval requests - not from uploaded preview
  const activeSignature = approvalRequests.find(req => req.status === 'Approved');
  
  // Calculate paginated approval requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return approvalRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [approvalRequests, currentPage, itemsPerPage]);
  
  // Fetch scheduler status and Lark config on mount
  useEffect(() => {
    fetchSchedulerStatus();
    fetchLarkConfig();
    fetchApprovalRequests(); // Fetch real approval requests from backend
    
    // Poll for updates every 3 seconds to catch real-time changes from Lark
    const pollInterval = setInterval(() => {
      fetchApprovalRequests();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, []);
  
  const fetchSchedulerStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lark/scheduler/status');
      if (response.ok) {
        const data = await response.json();
        setSchedulerStatus(data);
      }
    } catch {
      console.log('Scheduler status fetch failed (backend may not be running)');
    }
  }, []);
  
  const fetchLarkConfig = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lark/config/openapi');
      if (response.ok) {
        const data = await response.json();
        if (data?.app_id) {
          setLarkConfig({ ...data, configured: true });
          setLarkFormData({
            appId: data.app_id || '',
            appSecret: '', // Don't show secret
            templateId: data.template_id || '',
            selfUserId: data.self_user_id || ''
          });
        }
      }
    } catch {
      console.log('Lark config fetch failed');
    }
  }, []);
  
  const fetchApprovalRequests = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lark/approval-requests');
      if (response.ok) {
        const data = await response.json();
        // Transform backend data to frontend format with Philippines timezone
        const transformed = data.map((req: any) => ({
          id: req.id,
          signaturePreview: req.signature_url || '/sign/assets/testsign.png',
          requestedDate: formatPhilippinesDateTime(req.created_at),
          requestedBy: req.requested_by || 'Admin',
          status: req.status,
          respondedDate: req.responded_at ? formatPhilippinesDateTime(req.responded_at) : undefined,
          respondedBy: req.responded_by,
          validity: req.validity_period || '1 Week',
          validityEndDate: req.validity_end_date ? formatPhilippinesDate(req.validity_end_date) : undefined,
          purpose: req.purpose || 'DL Generation',
        }));
        setApprovalRequests(transformed);
        console.log(' Fetched approval requests:', transformed.length);
      }
    } catch (err) {
      console.log('Approval requests fetch failed:', err);
    }
  }, []);
  
  const saveLarkConfig = async () => {
    // Only require secret for new configuration
    if (!larkFormData.appId) {
      alert('App ID is required');
      return;
    }
    
    // Check if this is a new config (no existing config) - then secret is required
    if (!larkConfig.configured && !larkFormData.appSecret) {
      alert('App Secret is required for new configuration');
      return;
    }
    
    setIsSavingLarkConfig(true);
    try {
      const response = await fetch('http://localhost:8000/api/lark/config/openapi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: larkFormData.appId,
          appSecret: larkFormData.appSecret || null, // null = use existing secret
          templateId: larkFormData.templateId || null,
          selfUserId: larkFormData.selfUserId || null
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Lark configuration saved successfully!');
        fetchLarkConfig();
        setShowLarkSetup(false);
      } else {
        alert(`Failed to save: ${data.message || 'Unknown error'}`);
      }
    } catch {
      alert('Failed to save Lark configuration');
    } finally {
      setIsSavingLarkConfig(false);
    }
  };
  
  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('http://localhost:8000/api/lark/approval/self-test', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        alert(' Connection successful! Check your Lark app for the test message.');
      } else {
        alert(` Connection failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch {
      alert(' Connection test failed: Backend not reachable');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const triggerManualApproval = async () => {
    setIsTriggeringApproval(true);
    try {
      const response = await fetch('http://localhost:8000/api/lark/scheduler/trigger', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('Trigger response:', data);
      
      if (data.success) {
        alert('Approval request sent to Lark! Check your Lark app.');
        fetchSchedulerStatus();
        // Fetch updated approval requests after sending
        setTimeout(() => fetchApprovalRequests(), 1000);
      } else {
        // Handle nested error structure from backend
        const errorMsg = data.result?.error || data.error || 'Unknown error';
        const errorCode = data.result?.code || data.code || '';
        
        // Provide helpful messages for common errors
        let helpMessage = '';
        if (errorMsg.includes('im:resource')) {
          helpMessage = '\n\nFix: Add "im:resource" permission in Lark Developer Console → Permissions & Scopes';
        } else if (errorMsg.includes('template is not visible') || errorMsg.includes('11310')) {
          helpMessage = '\n\nFix: Publish your template in Lark Message Card Builder and enable "Visible to all apps"';
        }
        
        const codeStr = errorCode ? ' (Code: ' + errorCode + ')' : '';
        alert('Failed to send: ' + errorMsg + codeStr + helpMessage);
      }
    } catch (err) {
      console.error('Trigger error:', err);
      alert('Failed to trigger: Backend not reachable');
    } finally {
      setIsTriggeringApproval(false);
    }
  };

  const validityWeekdays = useMemo(() => {
    const endDate = getEndDateFromValidity(validityPeriod);
    if (!endDate) return [];
    return getWeekdaysInRange(new Date(), endDate);
  }, [validityPeriod]);

  useEffect(() => {
    // Since validityPeriod is always '1 Week', use the calculated end date
    const endDate = getEndDateFromValidity(validityPeriod);
    if (endDate) {
      const days = getWeekdaysInRange(new Date(), endDate).map(d => formatDateLocal(d));
      setSelectedDays(new Set(days));
    }
  }, [validityPeriod]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignatureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleRequestApproval = async () => {
    if (!signatureFile || !signaturePreview) {
      alert(' Please upload a signature file first');
      return;
    }

    try {
      // Step 1: Upload signature to backend
      const formData = new FormData();
      formData.append('signature', signatureFile);
      formData.append('validityPeriod', validityPeriod);
      formData.append('purpose', usageOptions.dlGenerator ? 'DL Generation' : 'Other Departments');
      if (adminMessage) {
        formData.append('adminMessage', adminMessage);
      }

      const uploadResponse = await fetch('http://localhost:8000/api/signatures/', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload signature');
      }

      const uploadedSignature = await uploadResponse.json();
      console.log(' Signature uploaded:', uploadedSignature);

      // Step 2: Send approval request to Lark via backend
      const approvalResponse = await fetch('http://localhost:8000/api/lark/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureId: uploadedSignature.id,
          requestedBy: 'Rivera, Gabriel Ludwig R.',
          validityPeriod: validityPeriod,
          purpose: usageOptions.dlGenerator ? 'DL Generation' : 'Other Departments',
          adminMessage: adminMessage || null
        })
      });

      const approvalResult = await approvalResponse.json();
      console.log(' Approval request result:', approvalResult);

      // Step 3: Clear form and refresh data
      setSignatureFile(null);
      setSignaturePreview(null);
      setAdminMessage('');
      setShowLarkInfo(true);

      // Fetch updated approval requests from backend
      await fetchApprovalRequests();

      alert(' Approval request sent to Lark Bot!\n\nAttorney will receive notification in Lark App to ALLOW or REJECT.');
    } catch (error) {
      console.error('Error in handleRequestApproval:', error);
      alert(` Failed to send approval request: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const simulateApproval = (requestId: number, approve: boolean) => {
    // Get current Philippines time using timezone utility
    const phNow = formatPhilippinesDateTime(new Date().toISOString());
    
    setApprovalRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: approve ? 'Approved' : 'Rejected',
            respondedDate: phNow,
            respondedBy: 'Atty. Cruz, Maria S.'
          }
        : req
    ));
    alert(approve 
      ? 'Signature APPROVED via Lark Bot!' 
      : 'Signature REJECTED via Lark Bot. Please upload a new signature.'
    );
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const weeks: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];
    
    for (let i = 0; i < startDay; i++) {
      days.push(<td key={`empty-${i}`} className="p-1"></td>);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = formatDateLocal(date);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const isPast = date < new Date(new Date().setHours(0,0,0,0));
      const isSelected = selectedDays.has(dateStr);
      
      days.push(
        <td key={day} className="p-1 text-center">
          <button
            type="button"
            disabled={isWeekend || isPast}
            onClick={() => {
              const newDays = new Set(selectedDays);
              isSelected ? newDays.delete(dateStr) : newDays.add(dateStr);
              setSelectedDays(newDays);
            }}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              isWeekend || isPast ? 'text-gray-300 cursor-not-allowed' :
              isSelected ? 'bg-[#D4AF37] text-[#1a2332] hover:bg-[#c4a035]' :
              'text-gray-700 hover:bg-gray-100'
            }`}
          >{day}</button>
        </td>
      );
      
      if ((startDay + day) % 7 === 0 || day === daysInMonth) {
        weeks.push(<tr key={`week-${weeks.length}`}>{days}</tr>);
        days = [];
      }
    }
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 mt-2">
        <div className="flex items-center justify-between mb-3">
          <button type="button" onClick={() => setCalendarMonth(new Date(year, month - 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-sm">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={() => setCalendarMonth(new Date(year, month + 1, 1))} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={16} />
          </button>
        </div>
        <table className="w-full table-fixed">
          <thead>
            <tr>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <th key={i} className={`p-1 text-xs font-medium text-center ${i === 0 || i === 6 ? 'text-gray-300' : 'text-gray-500'}`}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>{weeks}</tbody>
        </table>
        <div className="flex justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-gray-500">{selectedDays.size} days selected (Mon-Fri only)</span>
          <button type="button" onClick={() => setShowCalendar(false)} className="text-xs text-[#D4AF37] hover:text-[#b39b30] font-medium">Done</button>
        </div>
      </div>
    );
  };

  // Get the display signature for preview - uploaded preview takes precedence for preview section only
  const displaySignature = signaturePreview || activeSignature?.signaturePreview;
  
  // For Signature Asset Active section - ONLY show the approved signature from approval requests
  const activeSignatureDisplay = activeSignature?.signaturePreview;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-[#1a2332] rounded-lg flex items-center justify-center">
            <PenTool className="text-[#D4AF37]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a2332]">Signature Configuration</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">Upload signature and request approval via Lark Bot</p>
          </div>
        </div>
      </div>

      {/* Current Status with Validity Badge */}
      <div className={`rounded-lg shadow-sm border p-6 ${activeSignature ? 'bg-green-50 border-green-300' : 'bg-amber-50 border-amber-300'}`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${activeSignature ? 'bg-green-100' : 'bg-amber-100'}`}>
            {activeSignature ? <CheckCircle className="text-green-600" size={24} /> : <AlertCircle className="text-amber-600" size={24} />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`font-bold text-lg ${activeSignature ? 'text-green-900' : 'text-amber-900'}`}>
                {activeSignature ? 'Signature Asset Active' : 'No Active Signature'}
              </h3>
              {activeSignature && (
                <span className="px-3 py-1 bg-[#D4AF37] text-[#1a2332] rounded-full text-xs font-bold">
                  Validity: {activeSignature.validity}
                  {activeSignature.validityEndDate && activeSignature.validity !== 'Indefinite' && ` (until ${activeSignature.validityEndDate})`}
                </span>
              )}
            </div>
            <p className={`text-sm mt-1 ${activeSignature ? 'text-green-800' : 'text-amber-800'}`}>
              {activeSignature ? 'Approved signature will be automatically applied to all generated DLs with handwritten-style date' : 'Please upload a signature and request approval via Lark Bot'}
            </p>
            {activeSignature && (
              <div className="mt-3 flex items-center gap-4">
                <div className="bg-white rounded-lg p-2 border border-green-200 inline-block">
                <img src={activeSignatureDisplay || activeSignature.signaturePreview} alt="Active Signature" className="h-12 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg=='; }}
                  />
                </div>
                <span className="text-xs text-green-700">Approved on {activeSignature.respondedDate} by {activeSignature.respondedBy}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Requests Table */}
      {approvalRequests.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-[#1a2332] text-lg">Approval Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Track signature approval requests sent to Lark Bot</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-stone-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Signature</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Requested</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Validity</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Response</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded border border-gray-200 p-2 w-32">
                        <img src={request.signaturePreview} alt={`Signature #${request.id}`} className="h-12 object-contain mx-auto"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg=='; }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">{request.requestedDate}</p>
                      <p className="text-xs text-gray-600">by {request.requestedBy}</p>
                    </td>
                    <td className="px-6 py-4"><span className="text-sm text-gray-700">{request.purpose}</span></td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{request.validity}</span>
                      {request.validityEndDate && request.validity !== 'Indefinite' && <p className="text-xs text-gray-500">until {request.validityEndDate}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${request.status === 'Approved' ? 'bg-green-100 text-green-800' : request.status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{request.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {request.respondedDate ? (
                        <div><p className="text-sm text-gray-900">{request.respondedDate}</p><p className="text-xs text-gray-600">by {request.respondedBy}</p></div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-amber-700 italic font-medium">Pending in Lark</span>
                          <div className="flex gap-1">
                            <button onClick={() => simulateApproval(request.id, true)} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200">Approve</button>
                            <button onClick={() => simulateApproval(request.id, false)} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200">Reject</button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Control */}
          <div className="p-4 border-t border-gray-200">
            <PaginationControl
              currentPage={currentPage}
              totalItems={approvalRequests.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(newSize) => {
                setItemsPerPage(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section - Fixed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2"><Upload size={20} />Upload Signature Asset</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Requirements:</h4>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>PNG, JPG, or SVG format with transparent background</li>
                <li>Actual handwritten signature (scanned)</li>
                <li>High resolution (minimum 300 DPI)</li>
                <li>Clean, professional appearance</li>
              </ul>
            </div>
            <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.svg" onChange={handleFileSelect} className="hidden" />
            {signaturePreview ? (
              <div className="border-2 border-[#D4AF37] bg-amber-50 rounded-lg p-6">
                <div className="bg-white rounded-lg p-4 mb-4">
                  <img src={signaturePreview} alt="Signature Preview" className="h-32 mx-auto object-contain" />
                </div>
                <p className="text-xs text-amber-700 text-center mb-3">Signature uploaded: {signatureFile?.name}</p>
                <div className="flex gap-2">
                  <button onClick={() => { setSignatureFile(null); setSignaturePreview(null); }} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 text-sm">Remove</button>
                  <button onClick={handleRequestApproval} className="flex-1 px-4 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] text-sm flex items-center justify-center gap-2"><Send size={16} />Request Approval</button>
                </div>
              </div>
            ) : (
              <div 
                role="button"
                tabIndex={0}
                onClick={handleUploadClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUploadClick(); }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-colors"
              >
                <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 font-medium">Click to upload signature</p>
                <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG files</p>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section with Calendar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2"><Calendar size={20} />Signature Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1a2332] mb-2">Validity Period</label>
              <select value={validityPeriod} onChange={(e) => setValidityPeriod(e.target.value as ValidityOption)}
                className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003B5C] text-sm bg-white" disabled>
                <option value="1 Week">1 Week (Auto-renewal every Sunday)</option>
              </select>
            </div>
            <div>
              <button type="button" onClick={() => setShowCalendar(!showCalendar)} className="flex items-center gap-2 text-sm text-[#D4AF37] hover:text-[#b39b30] font-medium">
                <Calendar size={16} />{showCalendar ? 'Hide Calendar' : 'View/Edit Valid Days (Mon-Fri)'}
              </button>
              {showCalendar && renderCalendar()}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Usage</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={usageOptions.dlGenerator} onChange={(e) => setUsageOptions(prev => ({ ...prev, dlGenerator: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">DL Generator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={usageOptions.otherDepts} onChange={(e) => setUsageOptions(prev => ({ ...prev, otherDepts: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Other Departments</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Message (for Lark approval)</label>
              <textarea value={adminMessage} onChange={(e) => setAdminMessage(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm" rows={3} placeholder="Optional message for approval request..." />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Approval Scheduler Section */}
      <div className="bg-gradient-to-r from-[#1a2332]/5 to-[#003B5C]/10 rounded-lg shadow-sm border border-[#1a2332]/20 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-[#1a2332] rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="text-[#D4AF37]" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h3 className="font-bold text-[#1a2332] text-lg">Auto-Approval Scheduler</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                schedulerStatus.running 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {schedulerStatus.running ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Automatically sends approval requests to Lark every <strong>Sunday</strong>. 
              If rejected or no response, retries <strong>every hour</strong> until approved.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Next Auto-Request</p>
                <p className="text-lg font-bold text-[#1a2332]">
                  {formatPhilippinesDateTime(schedulerStatus.nextSunday, {
                    weekday: 'long', 
                    month: 'short', 
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'Asia/Manila'
                  })}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Validity Period</p>
                <p className="text-lg font-bold text-[#1a2332]">1 Week (Mon-Fri)</p>
                <p className="text-xs text-gray-500">Auto-renewal every Sunday</p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowLarkSetup(true)}
                className="px-4 py-2 bg-[#D4AF37] text-[#1a2332] rounded-lg font-semibold hover:bg-[#c4a035] transition-colors text-sm flex items-center gap-2"
              >
                <Settings size={16} />
                Lark Setup
              </button>
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !larkConfig.configured}
                className="px-4 py-2 bg-white border border-[#1a2332]/30 text-[#1a2332] rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isTestingConnection ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Zap size={16} />
                )}
                Test Connection
              </button>
              <button
                onClick={triggerManualApproval}
                disabled={isTriggeringApproval || !larkConfig.configured}
                className="px-4 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {isTriggeringApproval ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Send Test Approval Request
              </button>
            </div>
            
            {larkConfig.configured ? (
              <p className="text-xs text-green-600 mt-3">
                Lark configured: App ID {larkConfig.app_id?.substring(0, 8)}...
                {larkConfig.template_id && ` • Template: ${larkConfig.template_id.substring(0, 15)}...`}
                {larkConfig.self_user_id && ` • Self-test enabled`}
              </p>
            ) : (
              <p className="text-xs text-amber-600 mt-3">
                Lark not configured. Click "Lark Setup" to configure Message Card Builder integration.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Lark Bot Info */}
      {showLarkInfo && (
        <div className="bg-teal-50 border border-teal-300 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0"><Send className="text-teal-600" size={24} /></div>
            <div className="flex-1">
              <h4 className="font-bold text-teal-900 mb-2">Approval Request Sent to Lark Bot</h4>
              <p className="text-sm text-teal-800 mb-3">Attorney will receive a notification in their <strong>Lark App</strong> to review and approve/reject the signature.</p>
              <div className="bg-white rounded-lg p-4 border border-teal-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Lark Bot Preview:</p>
                <img src={larkBotPreview} alt="Lark Bot Approval Interface" className="w-full max-w-md mx-auto rounded-lg shadow-md" />
                <p className="text-xs text-gray-600 mt-2 text-center italic">Attorney will see this in Lark App and click ALLOW or REJECT</p>
              </div>
            </div>
            <button onClick={() => setShowLarkInfo(false)} className="text-teal-600 hover:text-teal-800"><X size={20} /></button>
          </div>
        </div>
      )}

      {/* Handwritten Date Preview - Shows Uploaded Signature */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2"><Eye size={20} />Handwritten Date Preview (Auto-Generated)</h3>
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-4 text-center">Date is automatically generated using custom handwritten digit images (M.D.YY format)</p>
            <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div 
                className="flex flex-col items-center gap-0"
                style={{ transform: 'rotate(-8deg)' }}
              >
                {displaySignature ? (
                  <img src={displaySignature} alt="Signature Preview" className="h-16 object-contain"
                    style={{ marginBottom: '-8px' }}
                    onError={(e) => { (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg=='; }}
                  />
                ) : (
                  <div className="text-gray-400 text-center mb-2"><PenTool size={40} className="mx-auto mb-2 opacity-50" /><p className="text-xs">Upload a signature to preview</p></div>
                )}
                <div className="flex justify-center">
                  <CustomDateRenderer date={new Date()} height={32} rotation={0} />
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">Signature with date • Format: M.D.YY • Tilted for authenticity</p>
            {signaturePreview && <p className="text-xs text-[#D4AF37] mt-2 text-center font-medium">Showing uploaded signature preview</p>}
          </div>
        </div>
      </div>

      {/* Lark Setup Modal */}
      {showLarkSetup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl flex flex-col" style={{ width: '520px', maxWidth: '95vw', maxHeight: '90vh' }}>
            {/* Sticky Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#D4AF37]/20 rounded-lg flex items-center justify-center">
                  <Settings className="text-[#D4AF37]" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[#1a2332]">Lark Message Card Builder Setup</h3>
                  <p className="text-xs text-gray-500">Configure Lark Open API for approval messages</p>
                </div>
              </div>
              <button onClick={() => setShowLarkSetup(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Info Banner */}
              <div className="bg-[#1a2332]/5 border border-[#1a2332]/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="text-[#1a2332] flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-[#1a2332]">
                    <p className="font-semibold mb-1">Using Lark Message Card Builder</p>
                    <p className="text-xs">
                      This integration uses Lark's Message Card Builder to send rich approval request cards. 
                      You can create custom card templates in Lark and reference them by Template ID.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* App ID */}
              <div>
                <label className="block text-sm font-semibold text-[#1a2332] mb-2">
                  App ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={larkFormData.appId}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, appId: e.target.value }))}
                  placeholder="cli_xxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">From Lark Developer Console → Your App → Credentials</p>
              </div>
              
              {/* App Secret */}
              <div>
                <label className="block text-sm font-semibold text-[#1a2332] mb-2">
                  App Secret {!larkConfig.configured && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={larkFormData.appSecret}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                  placeholder={larkConfig.configured ? "Leave empty to keep existing" : "••••••••••••••••••••"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {larkConfig.configured 
                    ? "Leave empty to keep your current secret. Only fill if you want to change it." 
                    : "Keep this secure. From Lark Developer Console."}
                </p>
              </div>
              
              {/* Template ID */}
              <div>
                <label className="block text-sm font-semibold text-[#1a2332] mb-2">
                  Template ID (Optional)
                </label>
                <input
                  type="text"
                  value={larkFormData.templateId}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, templateId: e.target.value }))}
                  placeholder="ctp_xxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  From Message Card Builder → My Cards → Copy Card ID. 
                  If not set, a default card will be used.
                </p>
              </div>
              
              {/* Self User ID */}
              <div>
                <label className="block text-sm font-semibold text-[#1a2332] mb-2">
                  Your User ID (for self-testing)
                </label>
                <input
                  type="text"
                  value={larkFormData.selfUserId}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, selfUserId: e.target.value }))}
                  placeholder="ou_xxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your open_id or user_id. Test messages will be sent to yourself.
                  Find this in Lark Developer Console → API Testing.
                </p>
              </div>
              
              {/* Template Variables Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Template Variables (for custom templates)</p>
                <div className="text-xs text-gray-600 space-y-1 font-mono">
                  <p>• request_type - "AUTO", "MANUAL", or "RETRY"</p>
                  <p>• request_date - Date and time of request</p>
                  <p>• requested_by - Name of requester</p>
                  <p>• validity_period - "1 Week (Mon - Fri)"</p>
                  <p>• purpose - "DL Generation"</p>
                  <p>• signature_id - ID of the signature asset</p>
                </div>
              </div>
            </div>
            
            {/* Sticky Footer */}
            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowLarkSetup(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={saveLarkConfig}
                disabled={isSavingLarkConfig || !larkFormData.appId || (!larkConfig.configured && !larkFormData.appSecret)}
                className="flex-1 px-4 py-2 bg-[#D4AF37] text-[#1a2332] rounded-lg font-semibold hover:bg-[#c4a035] transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSavingLarkConfig ? (
                  <RefreshCw size={16} className="animate-spin" />
                ) : (
                  <CheckCircle size={16} />
                )}
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}