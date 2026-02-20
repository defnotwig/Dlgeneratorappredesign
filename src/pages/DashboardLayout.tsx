import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { FileText, Users, Search, Database, FolderOpen, PenTool, LogOut, BarChart3 } from 'lucide-react';
import { Watermark } from '../components/Watermark';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/app', label: 'DL Generator', icon: FileText },
    { path: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/app/user-management', label: 'User Management', icon: Users },
    { path: '/app/audit-trail', label: 'Audit Trail', icon: Search },
    { path: '/app/extraction', label: 'Extraction', icon: Database },
    { path: '/app/template-manager', label: 'Template Manager', icon: FolderOpen },
    { path: '/app/signature-config', label: 'Signature Config', icon: PenTool },
  ];

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside className="w-64 flex flex-col h-screen sticky top-0" style={{ 
        background: 'linear-gradient(180deg, #047857 0%, #065F46 100%)'
      }}>
        {/* Logo */}
        <div className="p-6" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <Link to="/app" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <FileText style={{ color: '#047857' }} size={24} />
            </div>
            <div>
              <div className="font-bold text-lg" style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF' }}>DL Generator</div>
              <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Document Management</div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.path === '/app' 
              ? location.pathname === '/app' 
              : location.pathname.startsWith(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                style={{
                  backgroundColor: active ? '#FFFFFF' : 'transparent',
                  color: active ? '#047857' : '#FFFFFF',
                  fontFamily: 'var(--font-body)',
                  fontSize: '15px',
                  fontWeight: active ? 600 : 500,
                  transitionDuration: 'var(--motion-fast)',
                  transitionTimingFunction: 'var(--ease-standard)',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }}>
              <span className="text-sm font-bold" style={{ color: '#FFFFFF' }}>GR</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold truncate" style={{ fontFamily: 'var(--font-body)', color: '#FFFFFF' }}>Gabriel Ludwig Rivera</div>
              <div className="text-xs truncate" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Admin</div>
            </div>
          </div>
          <button 
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              color: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              transitionDuration: 'var(--motion-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
            }}
            onClick={() => navigate('/')}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
        <Watermark />
      </main>
    </div>
  );
}