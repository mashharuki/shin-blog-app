import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock aws-amplify/auth before importing the hook
vi.mock("aws-amplify/auth", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  fetchAuthSession: vi.fn(),
  getCurrentUser: vi.fn(),
}));

// Prevent actual Amplify.configure from running
vi.mock("../lib/amplify.js", () => ({}));

// Import mocks after vi.mock declarations
import {
  fetchAuthSession as mockFetchAuthSession,
  getCurrentUser as mockGetCurrentUser,
  signIn as mockSignIn,
  signOut as mockSignOut,
} from "aws-amplify/auth";
import { useAuth } from "./useAuth.js";

const mockSignInFn = vi.mocked(mockSignIn);
const mockSignOutFn = vi.mocked(mockSignOut);
const mockFetchAuthSessionFn = vi.mocked(mockFetchAuthSession);
const mockGetCurrentUserFn = vi.mocked(mockGetCurrentUser);

describe("useAuth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("初期状態", () => {
    it("セッションが存在しない場合、user は null で isLoading は false になる", async () => {
      mockFetchAuthSessionFn.mockResolvedValue({ tokens: undefined } as never);

      const { result } = renderHook(() => useAuth());

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      // After session restore completes
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });

    it("セッションが存在する場合、user がセットされる", async () => {
      mockFetchAuthSessionFn.mockResolvedValue({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
            },
          },
        },
      } as never);

      mockGetCurrentUserFn.mockResolvedValue({
        userId: "user-123",
        username: "test@example.com",
      } as never);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual({
        sub: "user-123",
        email: "test@example.com",
      });
    });

    it("セッション復元でエラーが発生した場合、user は null になる", async () => {
      mockFetchAuthSessionFn.mockRejectedValue(new Error("No session"));

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();
    });
  });

  describe("signIn", () => {
    it("signIn 成功時に user がセットされる", async () => {
      // Initial: no session
      mockFetchAuthSessionFn.mockResolvedValueOnce({
        tokens: undefined,
      } as never);

      // After signIn: session exists
      mockSignInFn.mockResolvedValue({
        isSignedIn: true,
        nextStep: { signInStep: "DONE" },
      } as never);

      mockFetchAuthSessionFn.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "user@example.com",
            },
          },
        },
      } as never);

      mockGetCurrentUserFn.mockResolvedValue({
        userId: "user-456",
        username: "user@example.com",
      } as never);

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      // Perform signIn
      await act(async () => {
        await result.current.signIn("user@example.com", "password123");
      });

      expect(result.current.user).toEqual({
        sub: "user-456",
        email: "user@example.com",
      });
      expect(mockSignInFn).toHaveBeenCalledWith({
        username: "user@example.com",
        password: "password123",
        options: { authFlowType: "USER_PASSWORD_AUTH" },
      });
    });

    it("signIn 失敗時 (NotAuthorizedException) はエラーを投げ、user は null のまま", async () => {
      // Initial: no session
      mockFetchAuthSessionFn.mockResolvedValueOnce({
        tokens: undefined,
      } as never);

      const error = new Error("Incorrect username or password");
      error.name = "NotAuthorizedException";
      mockSignInFn.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBeNull();

      await expect(
        act(async () => {
          await result.current.signIn("user@example.com", "wrongpassword");
        }),
      ).rejects.toThrow("Incorrect username or password");

      expect(result.current.user).toBeNull();
    });
  });

  describe("signOut", () => {
    it("signOut 後に user が null になる", async () => {
      // Initial: session exists
      mockFetchAuthSessionFn.mockResolvedValueOnce({
        tokens: {
          idToken: {
            payload: {
              email: "test@example.com",
            },
          },
        },
      } as never);

      mockGetCurrentUserFn.mockResolvedValueOnce({
        userId: "user-789",
        username: "test@example.com",
      } as never);

      mockSignOutFn.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuth());

      // Wait for initial session restore
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual({
        sub: "user-789",
        email: "test@example.com",
      });

      // Perform signOut
      await act(async () => {
        await result.current.signOut();
      });

      expect(result.current.user).toBeNull();
      expect(mockSignOutFn).toHaveBeenCalled();
    });
  });
});
