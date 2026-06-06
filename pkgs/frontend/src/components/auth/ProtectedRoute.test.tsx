import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Prevent actual Amplify.configure from running
vi.mock("../../lib/amplify.js", () => ({}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("../../hooks/useAuth.js", () => ({
  useAuth: () => mockUseAuth(),
}));

import { ProtectedRoute } from "./ProtectedRoute.js";

function renderWithRouter(
  ui: React.ReactNode,
  { initialPath = "/create" } = {},
) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route
          path="/login"
          element={<div data-testid="login-page">ログインページ</div>}
        />
        <Route path="/create" element={ui} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ローディング状態 (Requirement 1.4)", () => {
    it("isLoading が true のときローディングスピナーを表示する", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    it("isLoading が true のとき子コンポーネントを表示しない", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });

    it("isLoading が true のときログインページにリダイレクトしない", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: true,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    });
  });

  describe("未認証リダイレクト (Requirement 1.4, 5.5)", () => {
    it("ユーザーが null のとき /login へリダイレクトする", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.getByTestId("login-page")).toBeInTheDocument();
    });

    it("未認証のとき子コンポーネントを表示しない", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByTestId("protected-content")).not.toBeInTheDocument();
    });
  });

  describe("認証済みアクセス (Requirement 5.5)", () => {
    it("認証済みユーザーのとき子コンポーネントを表示する", () => {
      mockUseAuth.mockReturnValue({
        user: { sub: "user-123", email: "test@example.com" },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    });

    it("認証済みのときログインページにリダイレクトしない", () => {
      mockUseAuth.mockReturnValue({
        user: { sub: "user-123", email: "test@example.com" },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByTestId("login-page")).not.toBeInTheDocument();
    });

    it("認証済みのときローディングスピナーを表示しない", () => {
      mockUseAuth.mockReturnValue({
        user: { sub: "user-123", email: "test@example.com" },
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderWithRouter(
        <ProtectedRoute>
          <div data-testid="protected-content">保護されたコンテンツ</div>
        </ProtectedRoute>,
      );
      expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
    });
  });
});
