import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { SignatureConfig } from './components/SignatureConfig';
import { TemplateManagement } from './components/TemplateManagement';
import { AuditTrail } from './components/AuditTrail';
import { Navigation } from './components/Navigation';
import { FileText, Users, PenTool, FileType, Clock } from 'lucide-react';

export default function AppModern() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'DL Generator', icon: FileText },
    { id: 'signature', label: 'Signature Config', icon: PenTool, adminOnly: true },
    { id: 'templates', label: 'Templates', icon: FileType, adminOnly: true },
    { id: 'users', label: 'User Management', icon: Users, adminOnly: true },
    { id: 'audit', label: 'Audit Trail', icon: Clock, adminOnly: true },
  ];

  // Filter menu items based on role
  const filteredMenuItems = menuItems.filter(
    item => !item.adminOnly || userRole === 'admin'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        activeView={activeView}
        setActiveView={setActiveView}
        menuItems={filteredMenuItems}
        userRole={userRole}
        setUserRole={setUserRole}
      />
      
      <main className="lg:ml-64 min-h-screen">
        <div className="pl-10 pr-8 py-4 lg:py-8">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'signature' && userRole === 'admin' && <SignatureConfig />}
          {activeView === 'templates' && userRole === 'admin' && <TemplateManagement />}
          {activeView === 'users' && userRole === 'admin' && <UserManagement />}
          {activeView === 'audit' && userRole === 'admin' && <AuditTrail />}
        </div>
      </main>
    </div>
  );
}