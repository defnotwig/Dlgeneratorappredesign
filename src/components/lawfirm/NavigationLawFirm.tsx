import { useState } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router';
import logoSPM from 'figma:asset/71326ea767111577d27374f8f8da385be3b5fe2c.png';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  adminOnly?: boolean;
}

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  menuItems: MenuItem[];
  userRole: 'admin' | 'user';
  setUserRole: (role: 'admin' | 'user') => void;
  isMobile: boolean;
}

export function NavigationLawFirm({
  activeView,
  setActiveView,
  menuItems,
  userRole,
  setUserRole,
  isMobile,
}: NavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={logoSPM} alt="SPM Madrid" className="h-7" />
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-72 z-40 transition-transform duration-300 shadow-lg ${ 
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Desktop */}
          <div className="hidden lg:block p-8 border-b border-gray-200">
            <img src={logoSPM} alt="SPM Madrid" className="h-10 mb-4" />
            <h2 className="text-lg font-bold text-[#003B5C] mb-1">DL Generator</h2>
            <p className="text-sm text-gray-600">Demand Letter System</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-6 mt-16 lg:mt-0 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        setActiveView(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? 'bg-[#D4AF37] text-[#003B5C] font-semibold shadow-md'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-[#003B5C]'
                      }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Profile */}
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg mb-3">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-full flex items-center justify-center">
                <User size={20} className="text-[#003B5C]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm text-[#003B5C]">
                  Pangasinan, Francisco G.
                </p>
                <p className="text-xs text-gray-600 capitalize">{userRole}</p>
              </div>
            </div>
            
            {/* Role Switcher (Demo) */}
            <div className="mb-3">
              <label className="text-xs text-gray-600 block mb-1 font-medium">Demo Role:</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white text-gray-700"
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <button
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </>
  );
}