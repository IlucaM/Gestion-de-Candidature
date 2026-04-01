import React, { useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";

import Toaster from "./components/Toaster";
import CandidateListPage from "./pages/CandidateListPage";
import CandidateDetailPage from "./pages/CandidateDetailPage";
import CandidateFormPage from "./pages/CandidateFormPage";
import LoginPage from "./pages/LoginPage";
import { clearToken, getToken } from "./lib/api";

const TOKEN_KEY = "test24h_token";

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, y: -8, filter: "blur(3px)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AppHeader({
  isAuthenticated,
  onLogout,
}: {
  isAuthenticated: boolean;
  onLogout: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  const navItems = [
    { label: "Liste des candidats", path: "/candidates" },
    { label: "Créer un candidat", path: "/candidates/new" },
  ];

  return (
    <header className="card" style={{ marginBottom: 16 }}>
      <nav
        aria-label="Navigation principale"
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              className={active ? "" : "button-secondary"}
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
            >
              {item.label}
            </button>
          );
        })}

        <button
          type="button"
          className="button-danger"
          style={{ marginLeft: "auto" }}
          onClick={onLogout}
        >
          Déconnexion
        </button>
      </nav>
    </header>
  );
}

function ProtectedLayout({
  isAuthenticated,
  onSessionExpired,
}: {
  isAuthenticated: boolean;
  onSessionExpired: () => void;
}) {
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = getToken();
    if (!token) {
      onSessionExpired();
    }
  }, [isAuthenticated, onSessionExpired]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

function LoginRoute({
  isAuthenticated,
  onLoginSuccess,
}: {
  isAuthenticated: boolean;
  onLoginSuccess: () => void;
}) {
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from || "/candidates";

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return <LoginPage onLoginSuccess={onLoginSuccess} />;
}

function AppShell() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(getToken()),
  );
  const [sessionMessage, setSessionMessage] = useState<string>("");

  const handleSessionExpired = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setSessionMessage("Votre session a expiré, veuillez vous reconnecter.");
    toast.error("Session expirée. Veuillez vous reconnecter.");
  }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setIsAuthenticated(false);
    setSessionMessage("Vous avez été déconnecté.");
    toast.info("Vous avez été déconnecté.");
  }, []);

  const handleLoginSuccess = useCallback(() => {
    setIsAuthenticated(true);
    setSessionMessage("");
    toast.success("Connexion réussie.");
  }, []);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TOKEN_KEY) return;
      const token = getToken();
      if (token) {
        setIsAuthenticated(true);
        setSessionMessage("");
      } else {
        handleSessionExpired();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [handleSessionExpired]);

  return (
    <div className="app">
      <Toaster />
      <AppHeader isAuthenticated={isAuthenticated} onLogout={handleLogout} />

      {sessionMessage ? (
        <div className="alert alert-error" role="status" aria-live="polite">
          {sessionMessage}
        </div>
      ) : null}

      <PageTransition>
        <Routes>
          <Route
            path="/login"
            element={
              <LoginRoute
                isAuthenticated={isAuthenticated}
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />

          <Route
            element={
              <ProtectedLayout
                isAuthenticated={isAuthenticated}
                onSessionExpired={handleSessionExpired}
              />
            }
          >
            <Route path="/candidates" element={<CandidateListPage />} />
            <Route
              path="/candidates/new"
              element={<CandidateFormPage mode="create" />}
            />
            <Route path="/candidates/:id" element={<CandidateDetailPage />} />
            <Route
              path="/candidates/:id/edit"
              element={<CandidateFormPage mode="edit" />}
            />
          </Route>

          <Route
            path="/"
            element={
              <Navigate
                to={isAuthenticated ? "/candidates" : "/login"}
                replace
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PageTransition>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
