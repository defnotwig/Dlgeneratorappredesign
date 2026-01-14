import { useState, useRef } from 'react';
import { PenTool, Upload, CheckCircle, AlertCircle, Send, Eye, Calendar } from 'lucide-react';
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

export function SignatureConfig() {
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>([
    {
      id: 1,
      signaturePreview: 'data:image/png;base64,...',
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
            <p className="text-gray-500 mt-1 text-sm md:text-base">Upload signature and request approval via Lark Bot</p>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        activeSignature 
          ? 'bg-emerald-50 border-emerald-300' 
          : 'bg-amber-50 border-amber-300'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
            activeSignature ? 'bg-emerald-100' : 'bg-amber-100'
          }`}>
            {activeSignature ? (
              <CheckCircle className="text-emerald-600" size={24} />
            ) : (
              <AlertCircle className="text-amber-600" size={24} />
            )}
          </div>
          <div className="flex-1">
            <h3 className={`font-bold text-lg ${activeSignature ? 'text-emerald-900' : 'text-amber-900'}`}>
              {activeSignature ? 'Signature Active' : 'No Active Signature'}
            </h3>
            <p className={`text-sm mt-1 ${activeSignature ? 'text-emerald-800' : 'text-amber-800'}`}>
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
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {approvalRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="bg-gray-50 rounded border border-gray-200 p-2 w-32">
                        <div className="h-12 flex items-center justify-center">
                          <span className="text-xs text-gray-500 italic">Signature #{request.id}</span>
                        </div>
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
                        <span className="text-sm text-gray-500 italic">Waiting...</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {request.status === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => simulateApproval(request.id, true)}
                            className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 transition-colors"
                            title="Simulate Lark ALLOW"
                          >
                            ✓ Allow
                          </button>
                          <button
                            onClick={() => simulateApproval(request.id, false)}
                            className="px-3 py-1 bg-red-600 text-white rounded text-xs font-semibold hover:bg-red-700 transition-colors"
                            title="Simulate Lark REJECT"
                          >
                            ✗ Reject
                          </button>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={20} />
            Upload Signature Asset
          </h3>

          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 text-sm">Requirements:</h4>
              <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
                <li>PNG format with transparent background</li>
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
                  accept=".png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                >
                  <Upload size={40} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 font-medium">Click to upload signature</p>
                  <p className="text-xs text-gray-500 mt-1">PNG files only</p>
                </div>
              </label>
            ) : (
              <div className="border-2 border-emerald-500 bg-emerald-50 rounded-lg p-6">
                <div className="bg-white rounded-lg p-4 mb-4">
                  <div className="h-32 flex items-center justify-center">
                    <span className="text-sm text-gray-500 italic">Signature Preview</span>
                  </div>
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
          </div>
        </div>

        {/* Configuration Section */}
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
              <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm">
                <option>Indefinite (until replaced)</option>
                <option>1 Month</option>
                <option>3 Months</option>
                <option>6 Months</option>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                rows={3}
                placeholder="Optional message for approval request..."
              />
            </div>
          </div>
        </div>
      </div>

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
          <div className="max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-4 text-center">
              Date is automatically generated with handwritten-style font and slight randomization
            </p>
            <div className="bg-white rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="h-16 mb-3 flex items-center justify-center bg-gray-100 rounded">
                <span className="text-xs text-gray-500">Approved Signature</span>
              </div>
              <p className="font-['Caveat'] text-2xl text-gray-900" style={{ transform: 'rotate(-1deg)' }}>
                January 14, 2026
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Font: Handwritten style • Rotation: ±2° • Spacing: Randomized
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
