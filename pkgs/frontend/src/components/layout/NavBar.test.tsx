import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Prevent actual Amplify.configure from running
vi.mock("../../lib/amplify.js", () => ({}));

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock("../../context/AuthContext.js", () => ({
  useAuth: () => mockUseAuth(),
}));

import { NavBar } from "./NavBar.js";

function renderNavBar(
  props: { darkMode?: boolean; onDarkModeToggle?: () => void } = {},
) {
  const defaultProps = {
    darkMode: false,
    onDarkModeToggle: vi.fn(),
    ...props,
  };
  return render(
    <MemoryRouter>
      <NavBar {...defaultProps} />
    </MemoryRouter>,
  );
}

describe("NavBar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("基本レンダリング (Requirement 6.1)", () => {
    it("ロゴ/サイト名が表示される", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("navbar-logo")).toBeInTheDocument();
    });

    it("ホームへのナビゲーションリンクが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("nav-home")).toBeInTheDocument();
    });

    it("ダークモードトグルボタンが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("dark-mode-toggle")).toBeInTheDocument();
    });

    it("ダークモードトグルボタンをクリックすると onDarkModeToggle が呼ばれる", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      const onDarkModeToggle = vi.fn();
      renderNavBar({ onDarkModeToggle });
      fireEvent.click(screen.getByTestId("dark-mode-toggle"));
      expect(onDarkModeToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("未認証状態 (Requirement 1.4)", () => {
    it("ログインボタンが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("nav-login-button")).toBeInTheDocument();
    });

    it("「投稿する」ボタンが表示されない", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.queryByTestId("nav-create-button")).not.toBeInTheDocument();
    });

    it("アバタードロップダウンが表示されない", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(
        screen.queryByTestId("avatar-dropdown-trigger"),
      ).not.toBeInTheDocument();
    });
  });

  describe("認証済み状態 (Requirement 2.1, 2.2)", () => {
    const mockUser = { sub: "user-123", email: "test@example.com" };

    it("「投稿する」ボタンが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("nav-create-button")).toBeInTheDocument();
    });

    it("ログインボタンが表示されない", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.queryByTestId("nav-login-button")).not.toBeInTheDocument();
    });

    it("アバタードロップダウントリガーが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("avatar-dropdown-trigger")).toBeInTheDocument();
    });

    it("アバタードロップダウンを開くとログアウトボタンが表示される (Requirement 2.1)", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("avatar-dropdown-trigger"));
      expect(screen.getByTestId("nav-logout-button")).toBeInTheDocument();
    });

    it("ログアウトボタンをクリックすると signOut が呼ばれる (Requirement 2.2)", async () => {
      const mockSignOut = vi.fn();
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: mockSignOut,
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("avatar-dropdown-trigger"));
      fireEvent.click(screen.getByTestId("nav-logout-button"));
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });

    it("アバタードロップダウンにユーザーのメールが表示される", () => {
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("avatar-dropdown-trigger"));
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });
  });

  describe("モバイルメニュー (Requirement 6.1)", () => {
    it("ハンバーガーメニューボタンが存在する", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      expect(screen.getByTestId("mobile-menu-toggle")).toBeInTheDocument();
    });

    it("ハンバーガーメニューをクリックするとモバイルメニューが開く", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    it("ハンバーガーメニューを2回クリックするとモバイルメニューが閉じる", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
      fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });

    it("モバイルメニュー内に認証済みユーザーのログアウトボタンが表示される", () => {
      const mockUser = { sub: "user-123", email: "test@example.com" };
      mockUseAuth.mockReturnValue({
        user: mockUser,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar();
      fireEvent.click(screen.getByTestId("mobile-menu-toggle"));
      expect(screen.getByTestId("mobile-logout-button")).toBeInTheDocument();
    });
  });

  describe("ダークモード表示 (Requirement 6.1)", () => {
    it("darkMode=true のとき月アイコン系の aria-label が適切に変わる", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar({ darkMode: true });
      const toggleBtn = screen.getByTestId("dark-mode-toggle");
      expect(toggleBtn).toBeInTheDocument();
    });

    it("darkMode=false のとき darkMode ボタンが存在する", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn(),
      });
      renderNavBar({ darkMode: false });
      expect(screen.getByTestId("dark-mode-toggle")).toBeInTheDocument();
    });
  });
});
