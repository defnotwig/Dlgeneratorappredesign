import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { PenTool, Upload, CheckCircle, AlertCircle, Send, Eye, Calendar, X, ChevronLeft, ChevronRight, Clock, RefreshCw, Zap, Settings, Info } from 'lucide-react';
import { CustomDateRenderer, formatDateNumeric } from './CustomDateRenderer';
import { formatPhilippinesDateTime, formatPhilippinesDate, getPhilippinesNow } from '../utils/timezoneUtils';
import { PaginationControl } from './ui/PaginationControl';
import { savePreviewImages } from '../utils/larkPreviewExport';

interface ApprovalRequest {
  id: number;
  signatureId?: number;
  signaturePreview: string;
  requestedDate: string;
  requestedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Expired';
  respondedDate?: string;
  respondedBy?: string;
  validity: string;
  validityEndDate?: string;
  selectedDays?: string[];
  purpose: string;
}

interface ActiveSignatureAsset {
  id: number;
  file_path: string;
  status: string;
  approved_at?: string;
  approved_by?: string;
  validity_period?: string;
  purpose?: string;
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

interface LarkRecipient {
  id: number;
  name: string;
  email?: string | null;
  open_id: string;
}

interface PreviewImage {
  dateLabel: string;
  dayName: string;
  url: string;
}

type ValidityOption = '1 Week';

const DEFAULT_LARK_OPEN_ID = 'ou_945fd8b7130f2db31077c6e079b9986d';

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

export function SignatureConfig() {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [isSettingActive, setIsSettingActive] = useState(false);
  const [validityPeriod, setValidityPeriod] = useState<ValidityOption>('1 Week');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDays, setSelectedDays] = useState<Set<string>>(new Set());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([]);
  const [activeSignatureAsset, setActiveSignatureAsset] = useState<ActiveSignatureAsset | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [usageOptions, setUsageOptions] = useState({ dlGenerator: true, otherDepts: false });
  const [signatureTab, setSignatureTab] = useState<'upload' | 'active'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  
  // Active signature path from server
  const ACTIVE_SIGNATURE_PATH = '/sign/atty_signatureSPM.png';
  
  // Pagination state for approval requests
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Calculate paginated approval requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return approvalRequests.slice(startIndex, startIndex + itemsPerPage);
  }, [approvalRequests, currentPage, itemsPerPage]);
  
  // Auto-approval scheduler state
  const [schedulerStatus, setSchedulerStatus] = useState<SchedulerStatus>({
    running: true,
    nextSunday: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    description: 'Auto-sends approval requests every Sunday at 8:00 AM and 5:00 PM. Sends again at 5:00 PM only if still pending or rejected.'
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
  const [larkRecipients, setLarkRecipients] = useState<LarkRecipient[]>([]);
  const [isAddingRecipient, setIsAddingRecipient] = useState(false);
  
  // Email search state
  const [recipientSearchEmail, setRecipientSearchEmail] = useState('');
  const [emailVerifyStatus, setEmailVerifyStatus] = useState<'idle' | 'verifying' | 'found' | 'not_found' | 'invalid'>('idle');
  const [verifiedUser, setVerifiedUser] = useState<{name: string; email: string; open_id: string} | null>(null);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  const formatRecipientLabel = (recipient: LarkRecipient) => {
    const primary = recipient.email || recipient.name || recipient.open_id;
    if (!recipient.open_id || recipient.open_id === primary) {
      return primary;
    }
    return `${primary} (${recipient.open_id})`;
  };

  const resolveSignatureUrl = (path?: string | null) => {
    if (!path) {
      return '';
    }
    if (path.startsWith('/uploads') || path.startsWith('uploads') || path.startsWith('/sign') || path.startsWith('sign')) {
      return `http://localhost:8000${path.startsWith('/') ? '' : '/'}${path}`;
    }
    return path;
  };

  const approvedRequest = approvalRequests.find(req => req.status === 'Approved');
  const activeSignatureId = activeSignatureAsset?.id ?? approvedRequest?.signatureId;
  const activeSignatureUrl = (
    resolveSignatureUrl(activeSignatureAsset?.file_path) ||
    resolveSignatureUrl(approvedRequest?.signaturePreview) ||
    resolveSignatureUrl(ACTIVE_SIGNATURE_PATH)
  );
  const activeSignatureValidity = activeSignatureAsset?.validity_period || approvedRequest?.validity || 'Indefinite';
  const activeSignatureValidityEnd = approvedRequest?.validityEndDate;
  const activeSignatureApprovedAt = activeSignatureAsset?.approved_at
    ? formatPhilippinesDateTime(activeSignatureAsset.approved_at)
    : approvedRequest?.respondedDate;
  const activeSignatureApprovedBy = activeSignatureAsset?.approved_by || approvedRequest?.respondedBy;
  const hasActiveSignature = Boolean(activeSignatureAsset || approvedRequest);
  const todayLabel = useMemo(() => formatDateNumeric(getPhilippinesNow()), []);
  const previewImage = useMemo(() => (
    previewImages.find(p => p.dateLabel === todayLabel) || previewImages[0]
  ), [previewImages, todayLabel]);
  
  // Fetch scheduler status and Lark config on mount
  useEffect(() => {
    fetchSchedulerStatus();
    fetchLarkConfig();
    fetchRecipients();
    fetchActiveSignatureAsset();
    fetchApprovalRequests(); // Fetch real approval requests from backend
    
    // Poll for updates every 3 seconds to catch real-time changes from Lark
    const pollInterval = setInterval(() => {
      fetchApprovalRequests();
      fetchActiveSignatureAsset();
    }, 3000);
    
    return () => clearInterval(pollInterval);
  }, []);

  // No need to fetch all available recipients - using email search now
  
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
            selfUserId: data.self_user_id || DEFAULT_LARK_OPEN_ID
          });
        }
      }
    } catch {
      console.log('Lark config fetch failed');
    }
  }, []);

  const fetchRecipients = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lark/recipients');
      if (response.ok) {
        const data = await response.json();
        const recipients = Array.isArray(data) ? data : [];
        setLarkRecipients(recipients);
        if (recipients.length > 0) {
          setLarkFormData(prev => (
            prev.selfUserId ? prev : { ...prev, selfUserId: recipients[0].open_id }
          ));
        }
      }
    } catch {
      console.log('Lark recipients fetch failed');
    }
  }, []);

  // Email verification function
  const verifyEmail = async () => {
    const email = recipientSearchEmail.trim().toLowerCase();
    
    if (!email) {
      setEmailVerifyStatus('idle');
      setVerifiedUser(null);
      return;
    }
    
    // Check for @spmadridlaw.com domain
    if (!email.endsWith('@spmadridlaw.com')) {
      setEmailVerifyStatus('invalid');
      setVerifiedUser(null);
      return;
    }
    
    setIsVerifyingEmail(true);
    setEmailVerifyStatus('verifying');
    setVerifiedUser(null);
    
    try {
      const response = await fetch(`http://localhost:8000/api/lark/recipients/verify-email?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (data.success && data.user) {
        setEmailVerifyStatus('found');
        setVerifiedUser(data.user);
      } else {
        setEmailVerifyStatus('not_found');
        setVerifiedUser(null);
      }
    } catch {
      setEmailVerifyStatus('not_found');
      setVerifiedUser(null);
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  // Add recipient after verification
  const addRecipientByEmail = async () => {
    if (!verifiedUser) {
      alert('Please verify an email first');
      return;
    }
    
    // Check if already added
    if (larkRecipients.some(r => r.open_id === verifiedUser.open_id)) {
      alert('This recipient is already in the list');
      return;
    }
    
    setIsAddingRecipient(true);
    try {
      const response = await fetch('http://localhost:8000/api/lark/recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: verifiedUser.name,
          email: verifiedUser.email,
          openId: verifiedUser.open_id
        })
      });
      const data = await response.json();
      if (data.success && data.recipient) {
        setLarkRecipients(prev => [data.recipient, ...prev.filter(item => item.open_id !== data.recipient.open_id)]);
        setLarkFormData(prev => ({ ...prev, selfUserId: data.recipient.open_id }));
        // Reset search
        setRecipientSearchEmail('');
        setEmailVerifyStatus('idle');
        setVerifiedUser(null);
      } else {
        alert(data.message || 'Failed to add recipient');
      }
    } catch {
      alert('Failed to add recipient');
    } finally {
      setIsAddingRecipient(false);
    }
  };
  
  const fetchApprovalRequests = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/lark/approval-requests');
      if (response.ok) {
        const data = await response.json();
        // Transform backend data to frontend format with Philippines timezone
        const transformed = data.map((req: any) => {
          const status = req.status === 'Superseded' ? 'Expired' : req.status;
          // Build signature URL - use backend URL for uploads, relative for static assets
          let signatureUrl = req.signature_url || '/sign/atty_signatureSPM.png';
          if (signatureUrl.startsWith('/uploads') || signatureUrl.startsWith('uploads')) {
            signatureUrl = `http://localhost:8000${signatureUrl.startsWith('/') ? '' : '/'}${signatureUrl}`;
          }
          return {
            id: req.id,
            signatureId: req.signature_id,
            signaturePreview: signatureUrl,
            requestedDate: formatPhilippinesDateTime(req.created_at),
            requestedBy: req.requested_by || 'Admin',
            status,
            respondedDate: req.approved_at ? formatPhilippinesDateTime(req.approved_at) : undefined,
            respondedBy: req.responded_by,
            validity: req.validity_period || '1 Week',
            validityEndDate: req.validity_end_date ? formatPhilippinesDate(req.validity_end_date) : undefined,
            purpose: req.purpose || 'DL Generation',
          };
        });
        setApprovalRequests(transformed);
        console.log('Fetched approval requests:', transformed.length);
      }
    } catch (err) {
      console.log('Approval requests fetch failed:', err);
    }
  }, []);

  const fetchActiveSignatureAsset = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/signatures/status/active');
      if (response.ok) {
        const data = await response.json();
        if (data && data.status === 'Approved') {
          setActiveSignatureAsset(data);
        } else {
          setActiveSignatureAsset(null);
        }
      } else {
        setActiveSignatureAsset(null);
      }
    } catch {
      setActiveSignatureAsset(null);
    }
  }, []);

  const fetchApprovalPreviews = useCallback(async (signatureId?: number) => {
    if (!signatureId) {
      setPreviewImages([]);
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/handwriting/approval-previews?signatureId=${signatureId}`);
      if (!response.ok) {
        setPreviewImages([]);
        return;
      }
      const data = await response.json();
      const previews = Array.isArray(data?.previews) ? data.previews : [];
      setPreviewImages(previews.map((preview: any) => ({
        dateLabel: preview.date_label,
        dayName: preview.day_name,
        url: preview.url
      })));
    } catch {
      setPreviewImages([]);
    }
  }, []);

  // Fetch approval previews when active signature changes
  useEffect(() => {
    fetchApprovalPreviews(activeSignatureId);
  }, [activeSignatureId, fetchApprovalPreviews]);

  const deleteRecipient = async (recipientId: number, recipientEmail: string) => {
    if (!confirm(`Remove ${recipientEmail} from approval list?`)) {
      return;
    }
    try {
      const response = await fetch(`http://localhost:8000/api/lark/recipients/${recipientId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setLarkRecipients(prev => prev.filter(r => r.id !== recipientId));
        if (larkFormData.selfUserId === larkRecipients.find(r => r.id === recipientId)?.open_id) {
          const remaining = larkRecipients.filter(r => r.id !== recipientId);
          if (remaining.length > 0) {
            setLarkFormData(prev => ({ ...prev, selfUserId: remaining[0].open_id }));
          } else {
            setLarkFormData(prev => ({ ...prev, selfUserId: DEFAULT_LARK_OPEN_ID }));
          }
        }
      } else {
        alert(data.message || 'Failed to delete recipient');
      }
    } catch (e) {
      alert('Failed to delete recipient');
    }
  };
  
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
        alert('Connection successful! Check your Lark app for the test message.');
      } else {
        alert(`Connection failed: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch {
      alert('Connection test failed: Backend not reachable');
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  const triggerManualApproval = async () => {
    setIsTriggeringApproval(true);
    try {
      const signatureId =
        activeSignatureAsset?.id || approvalRequests.find(req => req.status === 'Approved')?.signatureId;
      if (!signatureId) {
        alert('No active signature found. Please set an active signature first.');
        return;
      }
      if (!activeSignatureUrl) {
        alert('Active signature image not available. Please set an active signature first.');
        return;
      }
      await savePreviewImages({ signatureId, signatureUrl: activeSignatureUrl });
      await fetchApprovalPreviews(signatureId);

      const response = await fetch('http://localhost:8000/api/lark/scheduler/trigger', {
        method: 'POST'
      });
      const data = await response.json();
      console.log('Trigger response:', data);
      
      if (data.success) {
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
      const message = err instanceof Error ? err.message : 'Unknown error';
      alert(`Failed to trigger: ${message}`);
    } finally {
      setIsTriggeringApproval(false);
    }
  };

  // Calculate weekdays for current selection
  const validityWeekdays = useMemo(() => {
    const endDate = getEndDateFromValidity(validityPeriod);
    if (!endDate) return [];
    return getWeekdaysInRange(new Date(), endDate);
  }, [validityPeriod]);

  // Auto-select all weekdays when validity changes
  useEffect(() => {
    if (validityPeriod === '1 Week') {
      const days = validityWeekdays.map(d => formatDateLocal(d));
      setSelectedDays(new Set(days));
    } else {
      // For indefinite, select all weekdays for the displayed year
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);
      const days = getWeekdaysInRange(new Date(), endDate).map(d => formatDateLocal(d));
      setSelectedDays(new Set(days));
    }
  }, [validityPeriod, validityWeekdays]);

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
    // Reset the input so the same file can be selected again
    e.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSetActiveSignature = async () => {
    if (!signatureFile || !signaturePreview) {
      alert('Please upload a signature file first.');
      return;
    }

    const validationMessage = [
      'Please review the signature details before activating:',
      '',
      `File: ${signatureFile.name}`,
      `Validity: ${validityPeriod}`,
      `Purpose: ${usageOptions.dlGenerator ? 'DL Generation' : 'Other Departments'}`,
      adminMessage ? 'Admin Message: Provided' : 'Admin Message: None',
      '',
      'Continue?'
    ].join('\n');
    if (!confirm(validationMessage)) {
      return;
    }

    const confirmed = confirm(
      'Are you sure you want to set this as the active signature?\n\nThis will replace the current active signature.'
    );
    if (!confirmed) {
      return;
    }

    setIsSettingActive(true);
    try {
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

      const activateResponse = await fetch(
        `http://localhost:8000/api/signatures/${uploadedSignature.id}/approve?approvedBy=Admin`,
        { method: 'PATCH' }
      );

      if (!activateResponse.ok) {
        throw new Error('Failed to set signature as active');
      }

      setSignatureFile(null);
      setSignaturePreview(null);
      setAdminMessage('');
      await fetchActiveSignatureAsset();
      setSignatureTab('active');
      alert('Signature set as active.');
    } catch (error) {
      console.error('Error in handleSetActiveSignature:', error);
      alert(`Failed to set active signature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSettingActive(false);
    }
  };

  const handleRequestApproval = async () => {
    const signatureId =
      activeSignatureAsset?.id || approvalRequests.find(req => req.status === 'Approved')?.signatureId;
    if (!signatureId) {
      alert('No active signature found. Please set an active signature first.');
      return;
    }

    const confirmed = confirm(
      'Send an approval request for the current active signature?'
    );
    if (!confirmed) {
      return;
    }

    try {
      if (!activeSignatureUrl) {
        alert('Active signature image not available. Please set an active signature first.');
        return;
      }
      await savePreviewImages({ signatureId, signatureUrl: activeSignatureUrl });
      await fetchApprovalPreviews(signatureId);

      const approvalResponse = await fetch('/api/lark/send-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signatureId,
          requestedBy: 'Rivera, Gabriel Ludwig R.',
          validityPeriod: activeSignatureAsset?.validity_period || validityPeriod,
          purpose: activeSignatureAsset?.purpose || (usageOptions.dlGenerator ? 'DL Generation' : 'Other Departments'),
          adminMessage: adminMessage || null
        })
      });

      const approvalResult = await approvalResponse.json();
      console.log(' Approval request result:', approvalResult);

      await fetchApprovalRequests();
    } catch (error) {
      console.error('Error in handleRequestApproval:', error);
      alert(`Failed to send approval request: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      ? ' Signature APPROVED via Lark Bot!' 
      : ' Signature REJECTED via Lark Bot. Please upload a new signature.'
    );
  };

  // Calendar component for weekday selection
  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay();
    
    const weeks: React.ReactElement[] = [];
    let days: React.ReactElement[] = [];
    
    // Empty cells for days before first of month
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
              if (isSelected) {
                newDays.delete(dateStr);
              } else {
                newDays.add(dateStr);
              }
              setSelectedDays(newDays);
            }}
            className={`w-8 h-8 rounded-full text-xs font-medium transition-colors ${
              isWeekend ? 'text-gray-300 cursor-not-allowed' :
              isPast ? 'text-gray-300 cursor-not-allowed' :
              isSelected ? 'bg-emerald-500 text-white hover:bg-emerald-600' :
              'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
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
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-semibold text-sm">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            type="button"
            onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <table className="w-full table-fixed">
          <thead>
            <tr>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <th key={i} className={`p-1 text-xs font-medium text-center ${i === 0 || i === 6 ? 'text-gray-300' : 'text-gray-500'}`}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{weeks}</tbody>
        </table>
        <div className="flex justify-between mt-3 pt-3 border-t">
          <span className="text-xs text-gray-500">
            {selectedDays.size} days selected (Mon-Fri only)
          </span>
          <button
            type="button"
            onClick={() => setShowCalendar(false)}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  // For Signature Asset Active section - prefer the active signature asset, fallback to default
  const activeSignatureImage = activeSignatureUrl || ACTIVE_SIGNATURE_PATH;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
            <PenTool className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Signature Configuration</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Upload signature and set it as active (Lark approval optional)</p>
          </div>
        </div>
      </div>

      {/* Current Status - Now shows validity period */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        hasActiveSignature
          ? 'bg-emerald-50 border-emerald-300'
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            hasActiveSignature ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            {hasActiveSignature ? (
              <CheckCircle className="text-emerald-600" size={24} />
            ) : (
              <AlertCircle className="text-amber-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`font-bold text-lg ${hasActiveSignature ? 'text-emerald-900' : 'text-amber-900'}`}>
                {hasActiveSignature ? 'Signature Asset Active' : 'No Active Signature'}
              </h3>
              {hasActiveSignature && (
                <span className="px-3 py-1 bg-emerald-200 text-emerald-800 rounded-full text-xs font-bold">
                  Validity: {activeSignatureValidity}
                  {activeSignatureValidityEnd && activeSignatureValidity !== 'Indefinite' && (
                    <span className="ml-1">(until {activeSignatureValidityEnd})</span>
                  )}
                </span>
              )}
            </div>
            <p className={`text-sm mt-1 ${hasActiveSignature ? 'text-emerald-800' : 'text-amber-800'}`}>
              {hasActiveSignature
                ? 'Active signature will be automatically applied to all generated DLs with handwritten-style date'
                : 'Please upload a signature and set it as active'
              }
            </p>
            {hasActiveSignature && (
              <div className="mt-3 flex items-center gap-4">
                <div className="bg-white rounded-lg p-2 border border-emerald-200 inline-block">
                  <img 
                    src={activeSignatureImage}
                    alt="Active Signature" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                </div>
                <span className="text-xs text-emerald-700">
                  {activeSignatureApprovedAt
                    ? `Approved on ${activeSignatureApprovedAt}${activeSignatureApprovedBy ? ` by ${activeSignatureApprovedBy}` : ''}`
                    : 'Active signature set.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Approval Requests Table */}
      {approvalRequests.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-bold text-gray-900 text-lg">Approval Requests</h3>
            <p className="text-sm text-gray-600 mt-1">Track signature approval requests sent to Lark Bot</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
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
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded border border-gray-200 p-2 w-32">
                        <img 
                          src={request.signaturePreview} 
                          alt={`Signature #${request.id}`} 
                          className="h-12 object-contain mx-auto"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg==';
                          }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900">{request.requestedDate}</p>
                        <p className="text-xs text-gray-600">by {request.requestedBy}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-700">{request.purpose}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm text-gray-700">{request.validity}</span>
                        {request.validityEndDate && request.validity !== 'Indefinite' && (
                          <p className="text-xs text-gray-500">until {request.validityEndDate}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'Approved' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : request.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : request.status === 'Expired'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.respondedDate ? (
                        <div>
                          <p className="text-sm text-gray-900">{request.respondedDate}</p>
                          <p className="text-xs text-gray-600">by {request.respondedBy}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-amber-700 italic font-medium">Pending in Lark App</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => simulateApproval(request.id, true)}
                              className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded hover:bg-emerald-200"
                            >
                              Simulate Approve
                            </button>
                            <button
                              onClick={() => simulateApproval(request.id, false)}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
                            >
                              Reject
                            </button>
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
                setCurrentPage(1); // Reset to first page when changing size
              }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section with Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Signature Asset
          </h3>
          
          {/* Tab Buttons */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
            <button
              type="button"
              onClick={() => setSignatureTab('upload')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                signatureTab === 'upload'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload
            </button>
            <button
              type="button"
              onClick={() => setSignatureTab('active')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                signatureTab === 'active'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Active Signature
            </button>
          </div>

          {/* Tab Content */}
          {signatureTab === 'upload' ? (
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

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.svg"
                onChange={handleFileSelect}
                className="hidden"
              />

              {signaturePreview ? (
                <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-6">
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <img 
                      src={signaturePreview} 
                      alt="Signature Preview" 
                      className="h-32 mx-auto object-contain"
                    />
                  </div>
                  <p className="text-xs text-emerald-700 text-center mb-3">
                    Signature uploaded: {signatureFile?.name}
                  </p>
                  <p className="text-xs text-emerald-700 text-center mb-3">
                    Setting this signature active will replace the current active signature.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSignatureFile(null);
                        setSignaturePreview(null);
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 text-sm"
                    >
                      Remove
                    </button>
                    <button
                      onClick={handleSetActiveSignature}
                      disabled={isSettingActive}
                      className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                        isSettingActive
                          ? 'bg-emerald-200 text-emerald-700 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      <CheckCircle size={16} />
                      {isSettingActive ? 'Setting Active...' : 'Set as Active Signature'}
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  role="button"
                  tabIndex={0}
                  onClick={handleUploadClick}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUploadClick(); }}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload signature</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG files</p>
                </div>
              )}
            </div>
          ) : (
            /* Active Signature Tab */
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <h4 className="font-semibold text-green-900 text-sm">Current Active Signature</h4>
                </div>
                <p className="text-xs text-green-700">This signature is currently being used for DL generation.</p>
              </div>
              
              <div className="border-2 border-green-300 bg-white rounded-lg p-6">
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center" style={{minHeight: '128px'}}>
                  <img 
                    src={activeSignatureImage}
                    alt="Active Signature"
                    className="h-24 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-3">Attorney Signature � Active</p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleRequestApproval}
                  disabled={!hasActiveSignature}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                    hasActiveSignature
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={16} />
                  Request Approval in Lark
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                To change the active signature, use the Upload tab and set a new signature as active.
              </p>
            </div>
          )}
        </div>

        {/* Configuration Section - Now with calendar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Signature Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Validity Period
              </label>
              <select 
                value={validityPeriod}
                onChange={(e) => setValidityPeriod(e.target.value as ValidityOption)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                disabled
              >
                <option value="1 Week">1 Week (Auto-renewal every Sunday)</option>
              </select>
            </div>

            {/* Calendar toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                <Calendar size={16} />
                {showCalendar ? 'Hide Calendar' : 'View/Edit Valid Days (Mon-Fri)'}
              </button>
              {showCalendar && renderCalendar()}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usage
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={usageOptions.dlGenerator}
                    onChange={(e) => setUsageOptions(prev => ({ ...prev, dlGenerator: e.target.checked }))}
                    className="rounded" 
                  />
                  <span className="text-sm text-gray-700">DL Generator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    checked={usageOptions.otherDepts}
                    onChange={(e) => setUsageOptions(prev => ({ ...prev, otherDepts: e.target.checked }))}
                    className="rounded" 
                  />
                  <span className="text-sm text-gray-700">Other Departments</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Message (for Lark approval)
              </label>
              <textarea
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                rows={3}
                placeholder="Optional message for approval request..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Approval Scheduler Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Clock className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h3 className="font-bold text-blue-900 text-lg">Auto-Approval Scheduler</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                schedulerStatus.running 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {schedulerStatus.running ? '● Active' : '○ Inactive'}
              </span>
            </div>
            <p className="text-sm text-blue-800 mb-4">
              Automatically sends approval requests to Lark every <strong>Sunday</strong>. 
              Sends at <strong>8:00 AM</strong> and <strong>5:00 PM</strong> (PHT). 
              5:00 PM sends only if still pending or rejected.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Next Auto-Request</p>
                <p className="text-lg font-bold text-blue-900">
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
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Validity Period</p>
                <p className="text-lg font-bold text-blue-900">1 Week (Mon-Fri)</p>
                <p className="text-xs text-gray-500">Auto-renewal every Sunday</p>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowLarkSetup(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
              >
                <Settings size={16} />
                Lark Setup
              </button>
              <button
                onClick={testConnection}
                disabled={isTestingConnection || !larkConfig.configured}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
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

      {/* Handwritten Date Preview - Always shows active signature */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Eye size={20} />
          Handwritten Date Preview (Auto-Generated)
        </h3>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Date is automatically generated using custom handwritten digit images (M.D.YY format)
            </p>
            <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300 flex items-center justify-center">
              {previewImage?.url ? (
                <img
                  src={`http://localhost:8000${previewImage.url}`}
                  alt={`Handwritten Date Preview ${previewImage.dateLabel}`}
                  className="max-h-40 w-full object-contain"
                />
              ) : (
                <div 
                  className="flex flex-col items-center gap-0"
                  style={{ transform: 'rotate(-8deg)' }}
                >
                  <img 
                    src={activeSignatureImage} 
                    alt="Active Signature" 
                    className="h-28 object-contain"
                    style={{ marginBottom: '-34px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iODAiPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQ2F2ZWF0LGN1cnNpdmUiIGZvbnQtc2l6ZT0iMjRweCI+U2lnbmF0dXJlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  <div className="flex justify-center" style={{ width: '45%', marginLeft: '20.5%', marginTop: '-7px' }}>
                    <CustomDateRenderer date={new Date()} height={22.5} rotation={-20} dotScale={0.55} />
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Active Signature with date • Format: M.D.YY • Tilted for authenticity
            </p>
            <p className="text-xs text-green-600 mt-2 text-center font-medium">
              Using active attorney signature
            </p>
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
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Settings className="text-indigo-600" size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Lark Message Card Builder Setup</h3>
                  <p className="text-xs text-gray-500">Configure Lark Open API for approval messages</p>
                </div>
              </div>
              <button
                onClick={() => setShowLarkSetup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Info Banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <div className="text-sm text-blue-800">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  App ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={larkFormData.appId}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, appId: e.target.value }))}
                  placeholder="cli_xxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">From Lark Developer Console → Your App → Credentials</p>
              </div>
              
              {/* App Secret */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  App Secret {!larkConfig.configured && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  autoComplete="off"
                  value={larkFormData.appSecret}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, appSecret: e.target.value }))}
                  placeholder={larkConfig.configured ? "Leave empty to keep existing" : "••••••••••••••••••••"}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {larkConfig.configured 
                    ? "Leave empty to keep your current secret. Only fill if you want to change it." 
                    : "Keep this secure. From Lark Developer Console."}
                </p>
              </div>
              
              {/* Template ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Template ID (Optional)
                </label>
                <input
                  type="text"
                  value={larkFormData.templateId}
                  onChange={(e) => setLarkFormData(prev => ({ ...prev, templateId: e.target.value }))}
                  placeholder="ctp_xxxxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  From Message Card Builder → My Cards → Copy Card ID. 
                  If not set, a default card will be used.
                </p>
              </div>
              
              {/* Recipient Directory - Email Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Recipient Directory (S.P. Madrid & Associates)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={recipientSearchEmail}
                    onChange={(e) => {
                      setRecipientSearchEmail(e.target.value);
                      setEmailVerifyStatus('idle');
                      setVerifiedUser(null);
                    }}
                    placeholder="user@spmadridlaw.com"
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${
                      emailVerifyStatus === 'invalid' ? 'border-red-300 bg-red-50' :
                      emailVerifyStatus === 'found' ? 'border-green-300 bg-green-50' :
                      emailVerifyStatus === 'not_found' ? 'border-amber-300 bg-amber-50' :
                      'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={verifyEmail}
                    disabled={isVerifyingEmail || !recipientSearchEmail.trim()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isVerifyingEmail ? 'Verifying...' : 'Verify'}
                  </button>
                </div>
                
                {/* Validation feedback */}
                {emailVerifyStatus === 'invalid' && (
                  <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> Only @spmadridlaw.com emails allowed
                  </p>
                )}
                {emailVerifyStatus === 'not_found' && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <AlertCircle size={12} /> No Lark user found with this email
                  </p>
                )}
                {emailVerifyStatus === 'found' && verifiedUser && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-green-800 flex items-center gap-1">
                          <CheckCircle size={14} /> User Found
                        </p>
                        <p className="text-xs text-green-700">{verifiedUser.name}</p>
                        <p className="text-xs text-green-600">{verifiedUser.email}</p>
                        <p className="text-xs text-green-500 font-mono">{verifiedUser.open_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={addRecipientByEmail}
                        disabled={isAddingRecipient}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold text-sm hover:bg-green-700 disabled:opacity-50"
                      >
                        {isAddingRecipient ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Enter an @spmadridlaw.com email, click Verify to find the Lark user, then Add to list.
                </p>

                {larkRecipients.length > 0 && (
                  <div className="mt-4 border rounded-lg divide-y">
                    {larkRecipients.map((recipient) => {
                      const primary = recipient.email || recipient.name || recipient.open_id;
                      const showOpenId = recipient.open_id && recipient.open_id !== primary;
                      return (
                        <div key={recipient.open_id} className="px-3 py-2 text-xs flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-1 flex-1">
                            <span className="font-semibold text-gray-800">
                              {primary}
                              {recipient.open_id === larkFormData.selfUserId && (
                                <span className="ml-2 text-indigo-600 font-semibold">Default</span>
                              )}
                            </span>
                            {showOpenId && <span className="text-gray-500">{recipient.open_id}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteRecipient(recipient.id, recipient.email || recipient.name)}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Remove recipient"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {larkRecipients.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Recipient
                  </label>
                  <select
                    value={larkFormData.selfUserId}
                    onChange={(e) => setLarkFormData(prev => ({ ...prev, selfUserId: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    {larkRecipients.map((recipient) => (
                      <option key={recipient.open_id} value={recipient.open_id}>
                        {formatRecipientLabel(recipient)}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Used for connection tests. Approval cards go to all listed recipients.
                  </p>
                </div>
              )}
              
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
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 flex items-center justify-center gap-2"
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
