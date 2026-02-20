import { createBrowserRouter } from "react-router";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import DashboardLayout from "./pages/DashboardLayout";
import DLGenerator from "./pages/DLGenerator";
import UserManagement from "./pages/UserManagement";
import AuditTrail from "./pages/AuditTrail";
import Extraction from "./pages/Extraction";
import TemplateManager from "./pages/TemplateManager";
import SignatureConfig from "./pages/SignatureConfig";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/landing",
    element: <LandingPage />,
  },
  {
    path: "/app",
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DLGenerator /> },
      { path: "analytics", element: <AnalyticsDashboard /> },
      { path: "user-management", element: <UserManagement /> },
      { path: "audit-trail", element: <AuditTrail /> },
      { path: "extraction", element: <Extraction /> },
      { path: "template-manager", element: <TemplateManager /> },
      { path: "signature-config", element: <SignatureConfig /> },
    ],
  },
]);