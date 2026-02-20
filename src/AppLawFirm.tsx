import { useState, useEffect } from 'react';
import { DashboardLawFirm } from './components/lawfirm/DashboardLawFirm';
import { UserManagementLawFirm } from './components/lawfirm/UserManagementLawFirm';
import { SignatureConfigLawFirm } from './components/lawfirm/SignatureConfigLawFirm';
import { TemplateManagementLawFirm } from './components/lawfirm/TemplateManagementLawFirm';
import { AuditTrailLawFirm } from './components/lawfirm/AuditTrailLawFirm';
import { MobileDashboardLawFirm } from './components/lawfirm/MobileDashboardLawFirm';
import { NavigationLawFirm } from './components/lawfirm/NavigationLawFirm';
import { FileText, Users, PenTool, FileType, Clock } from 'lucide-react';

export default function AppLawFirm() {
  const [activeView, setActiveView] = useState('dashboard');
  const [isMobile, setIsMobile] = useState(false);
  const [userRole, setUserRole] = useState<'admin' | 'user'>('admin');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
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

  // Mobile/Tablet view - role-based routing
  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <NavigationLawFirm
          activeView={activeView}
          setActiveView={setActiveView}
          menuItems={filteredMenuItems}
          userRole={userRole}
          setUserRole={setUserRole}
          isMobile={isMobile}
        />
        
        <main className="pt-20 pb-8">
          {activeView === 'dashboard' && <MobileDashboardLawFirm />}
          {activeView === 'signature' && userRole === 'admin' && <SignatureConfigLawFirm />}
          {activeView === 'templates' && userRole === 'admin' && <TemplateManagementLawFirm />}
          {activeView === 'users' && userRole === 'admin' && <UserManagementLawFirm />}
          {activeView === 'audit' && userRole === 'admin' && <AuditTrailLawFirm />}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <NavigationLawFirm
        activeView={activeView}
        setActiveView={setActiveView}
        menuItems={filteredMenuItems}
        userRole={userRole}
        setUserRole={setUserRole}
        isMobile={isMobile}
      />
      
      <main className="lg:ml-72 min-h-screen">
        <div className="pl-10 pr-8 py-4 lg:py-8">
          {activeView === 'dashboard' && <DashboardLawFirm />}
          {activeView === 'signature' && userRole === 'admin' && <SignatureConfigLawFirm />}
          {activeView === 'templates' && userRole === 'admin' && <TemplateManagementLawFirm />}
          {activeView === 'users' && userRole === 'admin' && <UserManagementLawFirm />}
          {activeView === 'audit' && userRole === 'admin' && <AuditTrailLawFirm />}
        </div>
      </main>
    </div>
  );
}