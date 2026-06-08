import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        data-testid="loading-spinner"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontFamily: "system-ui, sans-serif",
          color: "var(--color-text-subtle)",
          fontSize: 16,
        }}
      >
        <div>読み込み中…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  return <>{children}</>;
}
