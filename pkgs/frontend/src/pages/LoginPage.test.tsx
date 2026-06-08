import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>(
      "react-router-dom",
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock useAuth
const mockSignIn = vi.fn();
vi.mock("../context/AuthContext.js", () => ({
  useAuth: () => ({
    user: null,
    isLoading: false,
    signIn: mockSignIn,
    signOut: vi.fn(),
  }),
}));

// Prevent actual Amplify.configure from running
vi.mock("../lib/amplify.js", () => ({}));

import { LoginPage } from "./LoginPage.js";

function renderLoginPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("レンダリング", () => {
    it("email フィールドが表示される", () => {
      renderLoginPage();
      expect(screen.getByTestId("email-input")).toBeInTheDocument();
    });

    it("password フィールドが表示される", () => {
      renderLoginPage();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
    });

    it("ログインボタンが表示される", () => {
      renderLoginPage();
      expect(screen.getByTestId("login-button")).toBeInTheDocument();
    });

    it("ページタイトルが表示される", () => {
      renderLoginPage();
      expect(screen.getByTestId("login-title")).toBeInTheDocument();
    });
  });

  describe("バリデーション (Requirement 1.3)", () => {
    it("email が空のまま送信するとバリデーションエラーが表示される", async () => {
      renderLoginPage();
      const button = screen.getByTestId("login-button");
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toBeInTheDocument();
      });
    });

    it("password が空のまま送信するとバリデーションエラーが表示される", async () => {
      renderLoginPage();
      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "test@example.com" },
      });
      const button = screen.getByTestId("login-button");
      fireEvent.click(button);
      await waitFor(() => {
        expect(screen.getByTestId("password-error")).toBeInTheDocument();
      });
    });

    it("両フィールドが空のとき signIn は呼ばれない", async () => {
      renderLoginPage();
      fireEvent.click(screen.getByTestId("login-button"));
      await waitFor(() => {
        expect(screen.getByTestId("email-error")).toBeInTheDocument();
      });
      expect(mockSignIn).not.toHaveBeenCalled();
    });
  });

  describe("ログイン成功 (Requirement 1.1)", () => {
    it("ログイン成功後に / へナビゲートする", async () => {
      mockSignIn.mockResolvedValue(undefined);
      renderLoginPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("signIn が email と password で呼ばれる", async () => {
      mockSignIn.mockResolvedValue(undefined);
      renderLoginPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "user@example.com",
          "password123",
        );
      });
    });
  });

  describe("ログイン失敗 (Requirement 1.2)", () => {
    it("NotAuthorizedException 発生時にエラーボックスが表示される", async () => {
      const error = new Error("Incorrect username or password.");
      error.name = "NotAuthorizedException";
      mockSignIn.mockRejectedValue(error);

      renderLoginPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(screen.getByTestId("auth-error")).toBeInTheDocument();
      });
    });

    it("NotAuthorizedException のとき / へナビゲートしない", async () => {
      const error = new Error("Incorrect username or password.");
      error.name = "NotAuthorizedException";
      mockSignIn.mockRejectedValue(error);

      renderLoginPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "wrongpassword" },
      });
      fireEvent.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(screen.getByTestId("auth-error")).toBeInTheDocument();
      });
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("その他のエラー発生時もエラーボックスが表示される", async () => {
      const error = new Error("Network error");
      mockSignIn.mockRejectedValue(error);

      renderLoginPage();

      fireEvent.change(screen.getByTestId("email-input"), {
        target: { value: "user@example.com" },
      });
      fireEvent.change(screen.getByTestId("password-input"), {
        target: { value: "password123" },
      });
      fireEvent.click(screen.getByTestId("login-button"));

      await waitFor(() => {
        expect(screen.getByTestId("auth-error")).toBeInTheDocument();
      });
    });
  });

  describe("レイアウト", () => {
    it("デスクトップ用の左カラム (hero section) が存在する", () => {
      renderLoginPage();
      expect(screen.getByTestId("hero-section")).toBeInTheDocument();
    });

    it("ログインフォームが存在する", () => {
      renderLoginPage();
      expect(screen.getByTestId("login-form")).toBeInTheDocument();
    });
  });
});
