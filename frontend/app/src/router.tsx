import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import { useAuth } from "./lib/auth-context";

// Audit mode components
import { AuditDashboard } from "./modes/audit/AuditDashboard";
import { TransferExplorer } from "./modes/audit/TransferExplorer";
import { RegistryList } from "./modes/audit/RegistryList";

// Gov mode components
import { GovLogin } from "./modes/gov/GovLogin";
import { PendingApplications } from "./modes/gov/PendingApplications";
import { ApprovalDetail } from "./modes/gov/ApprovalDetail";

// Registry mode components
import { SignupForm } from "./modes/registry/SignupForm";
import { Login } from "./modes/registry/Login";
import { Dashboard } from "./modes/registry/Dashboard";
import { CreditsList } from "./modes/registry/CreditsList";
import { NewTransfer } from "./modes/registry/NewTransfer";
import { IncomingTransfers } from "./modes/registry/IncomingTransfers";
import { TransferHistory } from "./modes/registry/TransferHistory";

// Layout components
const MainNav: React.FC = () => {
  const { session, logout } = useAuth();
  const location = useLocation();

  const isAudit = location.pathname.startsWith("/audit");
  const isGov = location.pathname.startsWith("/gov");
  const isRegistry = location.pathname.startsWith("/registry");

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link to="/audit" className="flex items-center space-x-2">
              <span className="text-xl font-black text-green-700 tracking-tight">
                CLEAR
              </span>
              <span className="text-[10px] bg-green-100 text-green-800 font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                SETTLEMENT
              </span>
            </Link>

            {/* Mode Switcher Tabs */}
            <nav className="flex items-center space-x-1 sm:space-x-2 bg-gray-100 p-1 rounded-lg text-xs font-semibold">
              <Link
                to="/audit"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  isAudit
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                /audit (Public)
              </Link>
              <Link
                to="/gov/pending"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  isGov
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                /gov (Council)
              </Link>
              <Link
                to="/registry/dashboard"
                className={`px-3 py-1.5 rounded-md transition-all ${
                  isRegistry
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                /registry (Tenant)
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4 text-xs">
            {session ? (
              <div className="flex items-center space-x-3">
                <span className="bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full font-mono text-[11px]">
                  {session.name || `User: ${session.userId}`} ({session.role})
                </span>
                <button
                  onClick={logout}
                  className="text-red-600 hover:text-red-800 font-semibold transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/registry/login"
                  className="text-gray-600 hover:text-gray-900 font-medium"
                >
                  Registry Sign In
                </Link>
                <span className="text-gray-300">|</span>
                <Link
                  to="/gov/login"
                  className="text-green-700 font-semibold hover:underline"
                >
                  Council Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Navigation Bars depending on Active Mode */}
        {isAudit && (
          <div className="flex space-x-6 py-2 border-t border-gray-100 text-xs font-medium text-gray-600">
            <Link
              to="/audit"
              className={`hover:text-green-700 ${location.pathname === "/audit" ? "text-green-700 font-bold" : ""}`}
            >
              Overview & Metrics
            </Link>
            <Link
              to="/audit/transfers"
              className={`hover:text-green-700 ${location.pathname === "/audit/transfers" ? "text-green-700 font-bold" : ""}`}
            >
              Transfer Explorer
            </Link>
            <Link
              to="/audit/registries"
              className={`hover:text-green-700 ${location.pathname === "/audit/registries" ? "text-green-700 font-bold" : ""}`}
            >
              Directory of Registries
            </Link>
          </div>
        )}

        {isRegistry && session && session.role === "registry" && (
          <div className="flex space-x-6 py-2 border-t border-gray-100 text-xs font-medium text-gray-600 overflow-x-auto">
            <Link
              to="/registry/dashboard"
              className={`hover:text-green-700 whitespace-nowrap ${location.pathname === "/registry/dashboard" ? "text-green-700 font-bold" : ""}`}
            >
              Dashboard
            </Link>
            <Link
              to="/registry/credits"
              className={`hover:text-green-700 whitespace-nowrap ${location.pathname === "/registry/credits" ? "text-green-700 font-bold" : ""}`}
            >
              Domestic Credits
            </Link>
            <Link
              to="/registry/transfers/new"
              className={`hover:text-green-700 whitespace-nowrap ${location.pathname === "/registry/transfers/new" ? "text-green-700 font-bold" : ""}`}
            >
              New Transfer
            </Link>
            <Link
              to="/registry/transfers/incoming"
              className={`hover:text-green-700 whitespace-nowrap ${location.pathname === "/registry/transfers/incoming" ? "text-green-700 font-bold" : ""}`}
            >
              Incoming Settlements
            </Link>
            <Link
              to="/registry/transfers/history"
              className={`hover:text-green-700 whitespace-nowrap ${location.pathname === "/registry/transfers/history" ? "text-green-700 font-bold" : ""}`}
            >
              Transfer History
            </Link>
          </div>
        )}

        {isGov && session && session.role === "council" && (
          <div className="flex space-x-6 py-2 border-t border-gray-100 text-xs font-medium text-gray-600">
            <Link
              to="/gov/pending"
              className={`hover:text-green-700 ${location.pathname.startsWith("/gov/pending") ? "text-green-700 font-bold" : ""}`}
            >
              Pending Registry Applications
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

const ProtectedCouncilRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { session } = useAuth();
  if (!session || session.role !== "council") {
    return <Navigate to="/gov/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedRegistryRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { session } = useAuth();
  if (!session || session.role !== "registry") {
    return <Navigate to="/registry/login" replace />;
  }
  return <>{children}</>;
};

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <MainNav />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Audit Mode (Public, No Auth) */}
            <Route path="/audit" element={<AuditDashboard />} />
            <Route path="/audit/transfers" element={<TransferExplorer />} />
            <Route path="/audit/registries" element={<RegistryList />} />

            {/* Gov Mode (Council Only) */}
            <Route path="/gov/login" element={<GovLogin />} />
            <Route
              path="/gov/pending"
              element={
                <ProtectedCouncilRoute>
                  <PendingApplications />
                </ProtectedCouncilRoute>
              }
            />
            <Route
              path="/gov/approval/:registryId"
              element={
                <ProtectedCouncilRoute>
                  <ApprovalDetail />
                </ProtectedCouncilRoute>
              }
            />

            {/* Registry Mode (Authenticated Tenant) */}
            <Route path="/registry/login" element={<Login />} />
            <Route path="/registry/signup" element={<SignupForm />} />
            <Route
              path="/registry/dashboard"
              element={
                <ProtectedRegistryRoute>
                  <Dashboard />
                </ProtectedRegistryRoute>
              }
            />
            <Route
              path="/registry/credits"
              element={
                <ProtectedRegistryRoute>
                  <CreditsList />
                </ProtectedRegistryRoute>
              }
            />
            <Route
              path="/registry/transfers/new"
              element={
                <ProtectedRegistryRoute>
                  <NewTransfer />
                </ProtectedRegistryRoute>
              }
            />
            <Route
              path="/registry/transfers/incoming"
              element={
                <ProtectedRegistryRoute>
                  <IncomingTransfers />
                </ProtectedRegistryRoute>
              }
            />
            <Route
              path="/registry/transfers/history"
              element={
                <ProtectedRegistryRoute>
                  <TransferHistory />
                </ProtectedRegistryRoute>
              }
            />

            {/* Default Fallback Route */}
            <Route path="*" element={<Navigate to="/audit" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
