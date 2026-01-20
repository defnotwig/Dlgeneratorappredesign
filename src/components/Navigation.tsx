import { useState, type ComponentType } from 'react';
import { Menu, X, LogOut, User } from 'lucide-react';
import logoSPM from '/src/assets/SPM Madrid logo.png?url';

interface MenuItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  adminOnly?: boolean;
}

interface NavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
  menuItems: MenuItem[];
  userRole: 'admin' | 'user';
  setUserRole: (role: 'admin' | 'user') => void;
}

export function Navigation({
  activeView,
  setActiveView,
  menuItems,
  userRole,
  setUserRole,
}: NavigationProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <img src={logoSPM} alt="SPM Madrid" className="h-7" />
          </div>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 w-64 z-40 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Desktop */}
          <div className="hidden lg:block p-6 border-b border-gray-200">
            <img src={logoSPM} alt="SPM Madrid" className="h-10 mb-3" />
            <h1 className="font-bold text-gray-900">DL Generator</h1>
            <p className="text-xs text-gray-500">Demand Letter System</p>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 mt-16 lg:mt-0 overflow-y-auto">
            <ul className="space-y-1">
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
                          ? 'bg-emerald-50 text-emerald-700 font-medium shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50'
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
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-emerald-700" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">
                  Rivera, Gabriel Ludwig R.
                </p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
            
            {/* Role Switcher (Demo) */}
            <div className="mb-2">
              <label className="text-xs text-gray-500 block mb-1">Demo Role:</label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
            </div>

            <button className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
