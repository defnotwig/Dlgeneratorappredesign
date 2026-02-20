import { useState, useRef } from 'react';
import { PenTool, Upload, CheckCircle, AlertCircle, Send, Eye, Calendar, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCw, RotateCcw, ZoomIn, ZoomOut, Type, FileSignature, Sun, Moon, MousePointer, Clock, ChevronLeft, ChevronRight, Sliders } from 'lucide-react';
import larkBotPreview from 'figma:asset/dc72251a662d05d2daef2d6a8aa527763a3ed4e8.png';

interface ApprovalRequest {
  id: number;
  signaturePreview: string;
  requestedDate: string;
  requestedBy: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  respondedDate?: string;
  respondedBy?: string;
  validity: string;
  purpose: string;
}

interface TransformState {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
  opacity: number;
}

export function SignatureConfig() {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 1,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 12, 2026, 1:15 PM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Pending',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
    {
      id: 2,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 11, 2026, 10:36 AM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Approved',
      respondedDate: 'Feb 12, 2026, 10:05 AM',
      respondedBy: 'Rivera, Gabriel Ludwig R.',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
    {
      id: 3,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 11, 2026, 8:56 AM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Approved',
      respondedDate: 'Feb 11, 2026, 8:56 AM',
      respondedBy: 'Rivera, Gabriel Ludwig R.',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
    {
      id: 4,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 10, 2026, 10:41 AM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Approved',
      respondedDate: 'Feb 10, 2026, 10:47 AM',
      respondedBy: 'Rivera, Gabriel Ludwig R.',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
    {
      id: 5,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 10, 2026, 10:40 AM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Rejected',
      respondedDate: 'Feb 10, 2026, 10:47 AM',
      respondedBy: 'Rivera, Gabriel Ludwig R.',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
    {
      id: 6,
      signaturePreview: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgNTBRNDAgMjAgNjAgNDBUMTAwIDUwUTEyMCA2MCAxNDAgNDBUMTgwIDUwUTIwMCA2MCAyMjAgMzBUMjYwIDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxZTI5M2IiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+PC9zdmc+',
      requestedDate: 'Feb 10, 2026, 10:37 AM',
      requestedBy: 'Gabriel Ludwig Rivera',
      status: 'Rejected',
      respondedDate: 'Feb 10, 2026, 10:38 AM',
      respondedBy: 'Rivera, Gabriel Ludwig R.',
      validity: '1 Week',
      purpose: 'DL Generation',
    },
  ]);
  const [showLarkInfo, setShowLarkInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for transformation
  const [selectedElement, setSelectedElement] = useState<'signature' | 'date'>('signature');
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedElements, setSelectedElements] = useState<Set<'signature' | 'date'>>(new Set(['signature']));
  const [signatureTransform, setSignatureTransform] = useState<TransformState>({
    x: 0,
    y: -30,
    rotation: -3,
    scale: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
  });
  const [dateTransform, setDateTransform] = useState<TransformState>({
    x: 0,
    y: 30,
    rotation: -2,
    scale: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Tab state for upload section
  const [uploadTab, setUploadTab] = useState<'upload' | 'signature'>('upload');

  // Calendar state
  const [showCalendar, setShowCalendar] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 1)); // February 2026

  const activeSignature = approvalRequests.find(req => req.status === 'Approved');

  // Pagination logic
  const totalPages = Math.ceil(approvalRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = approvalRequests.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
  };

  const handleRequestApproval = () => {
    if (!signaturePreview) return;

    const newRequest: ApprovalRequest = {
      id: approvalRequests.length + 1,
      signaturePreview: signaturePreview,
      requestedDate: new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true 
      }),
      requestedBy: 'Pangasinan, Francisco G.',
      status: 'Pending',
      validity: 'Indefinite',
      purpose: 'DL Generation',
    };

    setApprovalRequests([newRequest, ...approvalRequests]);
    setShowLarkInfo(true);
    
    setSignatureFile(null);
    setSignaturePreview(null);
    
    setTimeout(() => {
      alert('✅ Approval request sent to Lark Bot!\n\nAttorney will receive notification in Lark App to ALLOW or REJECT.');
    }, 500);
  };

  const simulateApproval = (requestId: number, approve: boolean) => {
    setApprovalRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { 
            ...req, 
            status: approve ? 'Approved' : 'Rejected',
            respondedDate: new Date().toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
              hour12: true 
            }),
            respondedBy: 'Atty. Cruz, Maria S.'
          }
        : req
    ));
    alert(approve 
      ? '✅ Signature APPROVED via Lark Bot!' 
      : '❌ Signature REJECTED via Lark Bot. Please upload a new signature.'
    );
  };

  const handleDragStart = (e: React.MouseEvent, element: 'signature' | 'date') => {
    e.preventDefault();
    
    if (multiSelectMode) {
      // In multi-select mode, toggle selection
      setSelectedElements(prev => {
        const newSet = new Set(prev);
        if (newSet.has(element)) {
          newSet.delete(element);
        } else {
          newSet.add(element);
        }
        return newSet;
      });
      return; // Don't start dragging in multi-select mode on click
    }
    
    // Normal single-select behavior
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectedElement(element);
    setSelectedElements(new Set([element]));
  };

  const handleDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });

    if (selectedElement === 'signature') {
      setSignatureTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    } else if (selectedElement === 'date') {
      setDateTransform(prev => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleRotate = (direction: 'cw' | 'ccw') => {
    const angle = direction === 'cw' ? 5 : -5;
    selectedElements.forEach(element => {
      if (element === 'signature') {
        setSignatureTransform(prev => ({
          ...prev,
          rotation: prev.rotation + angle,
        }));
      } else if (element === 'date') {
        setDateTransform(prev => ({
          ...prev,
          rotation: prev.rotation + angle,
        }));
      }
    });
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const factor = direction === 'in' ? 1.1 : 0.9;
    selectedElements.forEach(element => {
      if (element === 'signature') {
        setSignatureTransform(prev => ({
          ...prev,
          scale: prev.scale * factor,
        }));
      } else if (element === 'date') {
        setDateTransform(prev => ({
          ...prev,
          scale: prev.scale * factor,
        }));
      }
    });
  };

  const handleOpacity = (direction: 'increase' | 'decrease') => {
    const factor = direction === 'increase' ? 0.1 : -0.1;
    selectedElements.forEach(element => {
      if (element === 'signature') {
        setSignatureTransform(prev => ({
          ...prev,
          opacity: Math.max(0, Math.min(1, prev.opacity + factor)),
        }));
      } else if (element === 'date') {
        setDateTransform(prev => ({
          ...prev,
          opacity: Math.max(0, Math.min(1, prev.opacity + factor)),
        }));
      }
    });
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    const delta = 5;
    selectedElements.forEach(element => {
      if (element === 'signature') {
        setSignatureTransform(prev => ({
          ...prev,
          x: direction === 'left' ? prev.x - delta : direction === 'right' ? prev.x + delta : prev.x,
          y: direction === 'up' ? prev.y - delta : direction === 'down' ? prev.y + delta : prev.y,
        }));
      } else if (element === 'date') {
        setDateTransform(prev => ({
          ...prev,
          x: direction === 'left' ? prev.x - delta : direction === 'right' ? prev.x + delta : prev.x,
          y: direction === 'up' ? prev.y - delta : direction === 'down' ? prev.y + delta : prev.y,
        }));
      }
    });
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    return { daysInMonth, startDay, year, month };
  };

  const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday to Friday
  };

  const isToday = (date: Date) => {
    const today = new Date(2026, 1, 12); // Feb 12, 2026 (current date from context)
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  };

  const getCurrentWeekRange = () => {
    const today = new Date(2026, 1, 12); // Feb 12, 2026 (Thursday)
    const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday
    
    // Calculate Monday of current week
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days
    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);
    
    // Calculate Friday of current week
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    
    return { monday, friday };
  };

  const isInCurrentWeek = (date: Date) => {
    const { monday, friday } = getCurrentWeekRange();
    return date >= monday && date <= friday;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const renderCalendar = () => {
    const { daysInMonth, startDay, year, month } = getDaysInMonth(currentMonth);
    const days = [];
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isValid = isWeekday(date);
      const isTodayDate = isToday(date);
      const inCurrentWeek = isInCurrentWeek(date);

      days.push(
        <div
          key={day}
          className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
            isValid
              ? isTodayDate
                ? 'bg-emerald-500 text-white font-bold ring-2 ring-emerald-600 ring-offset-1'
                : inCurrentWeek
                ? 'bg-emerald-300 text-emerald-900 font-semibold'
                : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
              : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          {day}
        </div>
      );
    }

    return (
      <div>
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-500 uppercase">VIEW/EDIT VALID DAYS (MON-FRI)</p>
          <div className="flex items-center gap-2">
            <button
              onClick={previousMonth}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Previous Month"
            >
              <ChevronLeft size={18} className="text-gray-700" />
            </button>
            <span className="text-sm font-semibold text-gray-900 min-w-[140px] text-center">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Next Month"
            >
              <ChevronRight size={18} className="text-gray-700" />
            </button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map((dayName) => (
            <div key={dayName} className="text-center text-xs font-medium text-gray-500">
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {days}
        </div>

        {/* Footer Text */}
        <p className="text-xs text-gray-500 text-center mt-4">
          Mon-Fri are valid signature days. Weekends are disabled.
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-7xl space-y-6">
      {/* Header */}
      <div className="rounded-xl shadow-sm border p-6 md:p-8" style={{
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow-1)'
      }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
          }}>
            <PenTool className="text-white" size={28} />
          </div>
          <div>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              fontWeight: 700,
              color: 'var(--text-1)',
              letterSpacing: '-0.02em'
            }}>Signature Configuration</h1>
            <p style={{
              color: 'var(--text-2)',
              marginTop: '4px',
              fontFamily: 'var(--font-body)',
              fontSize: '0.9375rem'
            }}>Upload signature and request approval via Lark Bot</p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="rounded-xl shadow-sm border p-6" style={{
        backgroundColor: activeSignature ? 'var(--success-soft)' : 'var(--warning-soft)',
        borderColor: activeSignature ? 'var(--success)' : 'var(--warning)'
      }}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{
            backgroundColor: activeSignature ? '#A7F3D0' : '#FDE68A'
          }}>
            {activeSignature ? (
              <CheckCircle style={{ color: 'var(--success-hover)' }} size={24} />
            ) : (
              <AlertCircle style={{ color: 'var(--warning-hover)' }} size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg" style={{
              fontFamily: 'var(--font-display)',
              color: activeSignature ? '#047857' : '#92400E'
            }}>
              {activeSignature ? 'Signature Active' : 'No Active Signature'}
            </h3>
            <p className="text-sm mt-1" style={{
              fontFamily: 'var(--font-body)',
              color: activeSignature ? '#065F46' : '#78350F'
            }}>
              {activeSignature 
                ? 'Current signature is approved and active for DL generation'
                : 'Please upload a signature and request approval via Lark Bot'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header with Icon and Title */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload size={20} className="text-gray-700" />
              </div>
              <h3 className="font-bold text-gray-900 text-lg">Signature Asset</h3>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setUploadTab('upload')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  uploadTab === 'upload'
                    ? 'bg-white border-2 border-emerald-600 text-emerald-600'
                    : 'bg-gray-100 border-2 border-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setUploadTab('signature')}
                className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  uploadTab === 'signature'
                    ? 'bg-white border-2 border-emerald-600 text-emerald-600'
                    : 'bg-gray-100 border-2 border-transparent text-gray-600 hover:bg-gray-200'
                }`}
              >
                Signature
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="px-6 pb-6 space-y-4">
            {uploadTab === 'upload' ? (
              <>
                {/* Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2.5 text-sm">Requirements:</h4>
                  <ul className="text-xs text-blue-800 space-y-1.5 ml-1">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>PNG, JPG, or SVG format with transparent background</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Actual handwritten signature (scanned)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>High resolution (minimum 300 DPI)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      <span>Clean, professional appearance</span>
                    </li>
                  </ul>
                </div>

                {/* Upload Area */}
                {!signaturePreview ? (
                  <label className="block">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".png,.jpg,.jpeg,.svg"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-emerald-500 hover:bg-gray-50 transition-all"
                    >
                      <p className="text-sm text-gray-700 font-medium mb-1">Click to upload signature</p>
                      <p className="text-xs text-gray-500">PNG, JPG, or SVG files</p>
                    </div>
                  </label>
                ) : (
                  <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-6">
                    <div className="bg-white rounded-lg p-4 mb-4">
                      <img 
                        src={signaturePreview} 
                        alt="Signature Preview" 
                        className="h-32 mx-auto object-contain"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSignatureFile(null);
                          setSignaturePreview(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm"
                      >
                        Remove
                      </button>
                      <button
                        onClick={handleRequestApproval}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition-colors text-sm flex items-center justify-center gap-2"
                      >
                        <Send size={16} />
                        Request Approval
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Signature Tab Content */
              <div className="py-8 text-center text-gray-500">
                <FileSignature size={48} className="mx-auto mb-3 text-gray-400" />
                <p className="text-sm font-medium">View and manage approved signatures</p>
                <p className="text-xs mt-1">Active signature will appear here</p>
                
                {activeSignature && (
                  <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <p className="text-xs font-semibold text-emerald-800 mb-3">Current Active Signature:</p>
                    <div className="bg-white rounded p-4">
                      <img 
                        src={activeSignature.signaturePreview} 
                        alt="Active Signature" 
                        className="h-16 mx-auto object-contain"
                      />
                    </div>
                    <div className="mt-3 text-xs text-emerald-700">
                      <p>Approved: {activeSignature.respondedDate}</p>
                      <p>By: {activeSignature.respondedBy}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sliders size={20} />
            Signature Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Validity Period
              </label>
              <div className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-900">
                1 Week (Auto-renewal every Sunday)
              </div>
            </div>

            {/* Toggle Calendar Button */}
            <button
              onClick={() => setShowCalendar(!showCalendar)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm transition-colors"
            >
              <Calendar size={16} />
              {showCalendar ? 'Hide Calendar' : 'Show Calendar'}
            </button>

            {/* Calendar */}
            {showCalendar && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                {renderCalendar()}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usage
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">DL Generator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm text-gray-700">Other Departments</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Message (for Lark approval)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                rows={3}
                placeholder="Optional message for approval request..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Approval Scheduler */}
      <div className="bg-gray-100 rounded-xl shadow-sm border border-gray-300 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
            <Clock className="text-white" size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="font-bold text-lg text-gray-900" style={{ fontFamily: 'var(--font-display)' }}>
                Auto-Approval Scheduler
              </h3>
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-xs font-bold rounded">
                Active
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Automatically sends approval requests to Lark every Sunday, 8:00 AM and 5:00 PM PHT (manual trigger available).
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Next Auto-Request</p>
                <p className="text-lg font-bold text-gray-900">Feb 15, 2026, 8:00 AM</p>
                <p className="text-xs text-gray-600">Upcoming Sundays: Feb 15, 2026; Feb 22, 2026; Mar 1, 2026; Mar 8, 2026</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Validity Period</p>
                <p className="text-lg font-bold text-gray-900">1 Week (Mon-Fri)</p>
                <p className="text-xs text-gray-600">Auto-renewal every Sunday</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm">
                Lark Setup
              </button>
              <button className="px-4 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors text-sm">
                Test Lark Connection
              </button>
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm">
                Trigger Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Requests Table */}
      {approvalRequests.length > 0 && (
        <div className="rounded-xl shadow-sm border overflow-hidden" style={{
          backgroundColor: 'var(--surface-1)',
          borderColor: 'var(--border)'
        }}>
          <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
            <h3 className="font-bold text-lg" style={{
              fontFamily: 'var(--font-display)',
              color: 'var(--text-1)'
            }}>Approval Requests</h3>
            <p className="text-sm mt-1" style={{
              fontFamily: 'var(--font-body)',
              color: 'var(--text-2)'
            }}>Track signature approval requests sent to Lark Bot</p>
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
                      <span className="text-sm text-gray-700">{request.validity}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        request.status === 'Approved' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : request.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
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
                        <div>
                          <span className="text-sm text-amber-700 italic font-medium">Pending in Lark App</span>
                          <p className="text-xs text-gray-500 mt-1">Attorney will ALLOW/REJECT</p>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center ${
                  currentPage === 1
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Previous Page"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg font-semibold transition-colors text-sm flex items-center justify-center ${
                  currentPage === totalPages
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
                title="Next Page"
              >
                <ChevronRight size={18} />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold text-gray-900">{startIndex + 1}</span> to{' '}
              <span className="font-semibold text-gray-900">{Math.min(endIndex, approvalRequests.length)}</span> of{' '}
              <span className="font-semibold text-gray-900">{approvalRequests.length}</span> requests
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors text-sm ${
                    currentPage === page
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Lark Bot Info */}
      {showLarkInfo && (
        <div className="bg-teal-50 border border-teal-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Send className="text-teal-600" size={24} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-teal-900 mb-2">Approval Request Sent to Lark Bot</h4>
              <p className="text-sm text-teal-800 mb-3">
                Attorney will receive a notification in their <strong>Lark App</strong> to review and approve/reject the signature.
              </p>
              <div className="bg-white rounded-lg p-4 border border-teal-200">
                <p className="text-xs font-semibold text-gray-700 mb-2">Lark Bot Preview:</p>
                <img 
                  src={larkBotPreview} 
                  alt="Lark Bot Approval Interface" 
                  className="w-full max-w-md mx-auto rounded-lg shadow-md"
                />
                <p className="text-xs text-gray-600 mt-2 text-center italic">
                  Attorney will see this in Lark App and click ALLOW or REJECT
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLarkInfo(false)}
              className="text-teal-600 hover:text-teal-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Handwritten Date Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Eye size={20} />
          Handwritten Date Preview (Auto-Generated)
        </h3>

        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="max-w-4xl mx-auto space-y-4">
            <p className="text-sm text-gray-600 text-center">
              Date is automatically generated using custom handwritten digit images (M.D.YY format)
            </p>
            
            {/* Draggable Preview Area */}
            <div 
              className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300 relative cursor-move select-none overflow-hidden"
              style={{ minHeight: '350px' }}
              onMouseMove={handleDrag}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <p className="text-xs text-gray-500 absolute top-2 left-2">Active Signature with date - Format: M.D.YY</p>
              <p className="text-xs text-emerald-600 font-semibold absolute top-2 right-2">
                Using active attorney signature
              </p>
              
              <div className="relative w-full h-full flex items-center justify-center" style={{ minHeight: '280px' }}>
                {/* Signature Element */}
                <div
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `translate(${signatureTransform.x}px, ${signatureTransform.y}px) rotate(${signatureTransform.rotation}deg) scale(${signatureTransform.scale}) scaleX(${signatureTransform.flipX ? -1 : 1}) scaleY(${signatureTransform.flipY ? -1 : 1})`,
                    transition: isDragging && selectedElement === 'signature' ? 'none' : 'transform 0.2s ease',
                    opacity: signatureTransform.opacity,
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'signature')}
                >
                  <img 
                    src={activeSignature?.signaturePreview || 'https://via.placeholder.com/200x80/10b981/ffffff?text=Signature'} 
                    alt="Signature" 
                    className="h-16 object-contain pointer-events-none"
                    style={{
                      filter: multiSelectMode && selectedElements.has('signature') 
                        ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' 
                        : 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                    }}
                  />
                  {multiSelectMode && selectedElements.has('signature') && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Date Element */}
                <div
                  className="absolute cursor-grab active:cursor-grabbing"
                  style={{
                    transform: `translate(${dateTransform.x}px, ${dateTransform.y}px) rotate(${dateTransform.rotation}deg) scale(${dateTransform.scale}) scaleX(${dateTransform.flipX ? -1 : 1}) scaleY(${dateTransform.flipY ? -1 : 1})`,
                    transition: isDragging && selectedElement === 'date' ? 'none' : 'transform 0.2s ease',
                    opacity: dateTransform.opacity,
                  }}
                  onMouseDown={(e) => handleDragStart(e, 'date')}
                >
                  <p 
                    className="font-['Caveat'] text-2xl text-gray-900 text-center whitespace-nowrap pointer-events-none"
                    style={{
                      filter: multiSelectMode && selectedElements.has('date') 
                        ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' 
                        : 'none',
                    }}
                  >
                    2.9.26
                  </p>
                  {multiSelectMode && selectedElements.has('date') && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-gray-700">Transformation Controls</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setMultiSelectMode(!multiSelectMode);
                      if (!multiSelectMode) {
                        setSelectedElements(new Set([selectedElement]));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      multiSelectMode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <MousePointer size={14} />
                    Select
                  </button>
                  <button
                    onClick={() => setSelectedElement('signature')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      selectedElement === 'signature'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <FileSignature size={14} />
                    Signature
                  </button>
                  <button
                    onClick={() => setSelectedElement('date')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      selectedElement === 'date'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Type size={14} />
                    Date
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {/* Movement Controls */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Position</p>
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button
                      onClick={() => handleMove('up')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Move Up"
                    >
                      <ArrowUp size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => handleMove('left')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Move Left"
                    >
                      <ArrowLeft size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => handleMove('right')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Move Right"
                    >
                      <ArrowRight size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => handleMove('down')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Move Down"
                    >
                      <ArrowDown size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                  </div>
                </div>

                {/* Rotation Controls */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Rotate</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleRotate('ccw')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Rotate Counter-Clockwise"
                    >
                      <RotateCcw size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleRotate('cw')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Rotate Clockwise"
                    >
                      <RotateCw size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Scale</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleZoom('out')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleZoom('in')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Zoom In"
                    >
                      <ZoomIn size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Opacity Controls */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Opacity</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleOpacity('decrease')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Decrease Opacity"
                    >
                      <Moon size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => handleOpacity('increase')}
                      className="p-2 bg-gray-100 hover:bg-emerald-100 rounded transition-colors flex items-center justify-center"
                      title="Increase Opacity"
                    >
                      <Sun size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              {multiSelectMode 
                ? `Multi-Select Mode • Click elements to select • Selected: ${selectedElements.size > 0 ? Array.from(selectedElements).map(el => el === 'signature' ? 'Signature' : 'Date').join(' + ') : 'None'}`
                : `Drag elements to reposition • Use controls to fine-tune • Selected: ${selectedElement === 'signature' ? 'Signature' : 'Date'}`
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}