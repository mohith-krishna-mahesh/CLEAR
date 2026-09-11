import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
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

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link to="/audit" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-green-700 tracking-tight">CLEAR</span>
            <span className="text-xs bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded">
              SETTLEMENT
            </span>
          </Link>
          <nav className="flex space-x-4 text-sm font-medium text-gray-600">
            <Link to="/audit" className="hover:text-gray-900">Audit Explorer</Link>
            <Link to="/gov/pending" className="hover:text-gray-900">Council Gov</Link>
            <Link to="/registry/dashboard" className="hover:text-gray-900">Registry Portal</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4 text-sm">
          {session ? (
            <div className="flex items-center space-x-3">
              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Role: {session.role}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/registry/login" className="text-green-600 font-medium hover:underline">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

const ProtectedCouncilRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth();
  if (!session || session.role !== "council") {
    return <Navigate to="/gov/login" replace />;
  }
  return <>{children}</>;
};

const ProtectedRegistryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            {/* Audit Mode (Public) */}
            <Route path="/audit" element={<AuditDashboard />} />
            <Route path="/audit/transfers" element={<TransferExplorer />} />
            <Route path="/audit/registries" element={<RegistryList />} />

            {/* Gov Mode */}
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

            {/* Registry Mode */}
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

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/audit" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
