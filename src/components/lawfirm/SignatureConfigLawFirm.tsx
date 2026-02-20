import { useState, useRef } from 'react';
import { PenTool, Upload, CheckCircle, AlertCircle, Send, Eye, Calendar, Clock, CheckSquare, XSquare, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, RotateCw, RotateCcw, FlipHorizontal, FlipVertical, ZoomIn, ZoomOut, Type, FileSignature, Sun, Moon } from 'lucide-react';
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

export function SignatureConfigLawFirm() {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 1,
      signaturePreview: 'https://via.placeholder.com/200x80/003B5C/D4AF37?text=Signature+Sample',
      requestedDate: 'Jan 12, 2026 10:30 AM',
      requestedBy: 'Pangasinan, Francisco G.',
      status: 'Approved',
      respondedDate: 'Jan 12, 2026 11:15 AM',
      respondedBy: 'Atty. Cruz, Maria S.',
      validity: 'Indefinite',
      purpose: 'DL Generation',
    },
  ]);
  const [showLarkInfo, setShowLarkInfo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New states for transformation
  const [selectedElement, setSelectedElement] = useState<'signature' | 'date'>('signature');
  const [signatureTransform, setSignatureTransform] = useState<TransformState>({
    x: 0,
    y: -20,
    rotation: -8,
    scale: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
  });
  const [dateTransform, setDateTransform] = useState<TransformState>({
    x: 0,
    y: 20,
    rotation: -5,
    scale: 1,
    flipX: false,
    flipY: false,
    opacity: 1,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const activeSignature = approvalRequests.find(req => req.status === 'Approved');

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

    // Add new request to table
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
    
    // Clear upload form
    setSignatureFile(null);
    setSignaturePreview(null);
    
    // Simulate Lark Bot sending notification
    setTimeout(() => {
      alert('✅ Approval request sent to Lark Bot!\n\nAttorney will receive notification in Lark App to ALLOW or REJECT.');
    }, 500);
  };

  // Simulate approval response from Lark Bot
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

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent, element: 'signature' | 'date') => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setSelectedElement(element);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Handle drag move
  const handleDragMove = (e: React.MouseEvent) => {
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

  return (
    <div className="max-w-7xl space-y-6">
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

      {/* Current Status */}
      <div className={`rounded-lg shadow-sm border p-6 ${
        activeSignature 
          ? 'bg-green-50 border-green-300' 
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            activeSignature ? 'bg-green-100' : 'bg-amber-100'
          }`}>
            {activeSignature ? (
              <CheckCircle className="text-green-600" size={24} />
            ) : (
              <AlertCircle className="text-amber-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${activeSignature ? 'text-green-900' : 'text-amber-900'}`}>
              {activeSignature ? 'Signature Active' : 'No Active Signature'}
            </h3>
            <p className={`text-sm mt-1 ${activeSignature ? 'text-green-800' : 'text-amber-800'}`}>
              {activeSignature 
                ? 'Current signature is approved and active for DL generation'
                : 'Please upload a signature and request approval via Lark Bot'
              }
            </p>
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
                {approvalRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-stone-50 transition-colors">
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
                          ? 'bg-green-100 text-green-800' 
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
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload Signature Asset
          </h3>

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
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#D4AF37] transition-colors"
                >
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload signature</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, or SVG files</p>
                </div>
              </label>
            ) : (
              <div className="border-2 border-[#D4AF37] bg-amber-50 rounded-lg p-6">
                <div className="bg-white rounded-lg p-4 mb-4 pointer-events-none">
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
                    className="flex-1 px-4 py-2 bg-[#1a2332] text-white rounded-lg font-semibold hover:bg-[#2a3342] transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    <Send size={16} />
                    Request Approval
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
            <Calendar size={20} />
            Signature Configuration
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1a2332] mb-2">
                Validity Period
              </label>
              <select className="w-full px-4 py-2.5 border-2 border-stone-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#003B5C] focus:border-transparent text-sm bg-white">
                <option>Indefinite (until replaced)</option>
                <option>1 Week</option>
                <option>2 Weeks</option>
                <option>3 Weeks</option>
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
                <option>9 Months</option>
                <option>1 Year</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Usage
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked className="rounded" />
                  <span className="text-sm text-gray-700">DL Generator</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Other Departments</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admin Message (for Lark approval)
              </label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                rows={3}
                placeholder="Optional message for approval request..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lark Bot Info */}
      {showLarkInfo && (
        <div className="bg-teal-50 border border-teal-300 rounded-lg p-6">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-[#1a2332] mb-4 flex items-center gap-2">
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
              className="bg-white rounded-lg p-8 border-2 border-dashed border-gray-300 relative overflow-hidden cursor-move select-none"
              style={{ minHeight: '300px' }}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
            >
              <p className="text-xs text-gray-500 absolute top-2 left-2">Active Signature with date - Format: M.D.YY</p>
              <p className="text-xs text-[#D4AF37] font-semibold absolute top-2 right-2">
                Using active attorney signature
              </p>
              
              <div className="relative w-full h-full flex items-center justify-center">
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
                    src={activeSignature?.signaturePreview || 'https://via.placeholder.com/200x80/003B5C/D4AF37?text=Signature'} 
                    alt="Signature" 
                    className="h-16 object-contain pointer-events-none"
                    style={{
                      filter: selectedElement === 'signature' ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : 'none',
                    }}
                  />
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
                      filter: selectedElement === 'date' ? 'drop-shadow(0 0 8px rgba(212, 175, 55, 0.5))' : 'none',
                    }}
                  >
                    2.9.26
                  </p>
                </div>
              </div>
            </div>

            {/* Control Panel */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#1a2332]">Transformation Controls</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedElement('signature')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      selectedElement === 'signature'
                        ? 'bg-[#003B5C] text-white'
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
                        ? 'bg-[#003B5C] text-white'
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
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, y: prev.y - 5 }));
                        } else {
                          setDateTransform(prev => ({ ...prev, y: prev.y - 5 }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Move Up"
                    >
                      <ArrowUp size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, x: prev.x - 5 }));
                        } else {
                          setDateTransform(prev => ({ ...prev, x: prev.x - 5 }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Move Left"
                    >
                      <ArrowLeft size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, x: prev.x + 5 }));
                        } else {
                          setDateTransform(prev => ({ ...prev, x: prev.x + 5 }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Move Right"
                    >
                      <ArrowRight size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                    <button
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, y: prev.y + 5 }));
                        } else {
                          setDateTransform(prev => ({ ...prev, y: prev.y + 5 }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Move Down"
                    >
                      <ArrowDown size={16} className="text-gray-700" />
                    </button>
                    <div></div>
                  </div>
                </div>

                {/* Rotation & Flip Controls */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Rotate & Flip</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        const angle = -5;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, rotation: prev.rotation + angle }));
                        } else {
                          setDateTransform(prev => ({ ...prev, rotation: prev.rotation + angle }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Rotate Counter-Clockwise"
                    >
                      <RotateCcw size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        const angle = 5;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, rotation: prev.rotation + angle }));
                        } else {
                          setDateTransform(prev => ({ ...prev, rotation: prev.rotation + angle }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Rotate Clockwise"
                    >
                      <RotateCw size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, flipX: !prev.flipX }));
                        } else {
                          setDateTransform(prev => ({ ...prev, flipX: !prev.flipX }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Flip Horizontal"
                    >
                      <FlipHorizontal size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, flipY: !prev.flipY }));
                        } else {
                          setDateTransform(prev => ({ ...prev, flipY: !prev.flipY }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Flip Vertical"
                    >
                      <FlipVertical size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Zoom Controls */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-600 mb-1.5">Scale</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        const factor = 0.9;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, scale: prev.scale * factor }));
                        } else {
                          setDateTransform(prev => ({ ...prev, scale: prev.scale * factor }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Zoom Out"
                    >
                      <ZoomOut size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        const factor = 1.1;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, scale: prev.scale * factor }));
                        } else {
                          setDateTransform(prev => ({ ...prev, scale: prev.scale * factor }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
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
                      onClick={() => {
                        const factor = -0.1;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, opacity: Math.max(0, Math.min(1, prev.opacity + factor)) }));
                        } else {
                          setDateTransform(prev => ({ ...prev, opacity: Math.max(0, Math.min(1, prev.opacity + factor)) }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Lighter (Decrease Opacity)"
                    >
                      <Moon size={16} className="text-gray-700" />
                    </button>
                    <button
                      onClick={() => {
                        const factor = 0.1;
                        if (selectedElement === 'signature') {
                          setSignatureTransform(prev => ({ ...prev, opacity: Math.max(0, Math.min(1, prev.opacity + factor)) }));
                        } else {
                          setDateTransform(prev => ({ ...prev, opacity: Math.max(0, Math.min(1, prev.opacity + factor)) }));
                        }
                      }}
                      className="p-2 bg-gray-100 hover:bg-amber-50 rounded transition-colors flex items-center justify-center"
                      title="Darker (Increase Opacity)"
                    >
                      <Sun size={16} className="text-gray-700" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Drag elements to reposition • Use controls to fine-tune • Selected: <span className="font-bold text-[#D4AF37]">{selectedElement === 'signature' ? 'Signature' : 'Date'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}