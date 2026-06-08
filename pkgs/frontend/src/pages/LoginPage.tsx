import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";

const TECH_CHIPS = [
  "TypeScript",
  "AWS",
  "React",
  "Node.js",
  "DynamoDB",
  "Cognito",
  "Lambda",
  "Amplify",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    let valid = true;
    setEmailError("");
    setPasswordError("");

    if (!email.trim()) {
      setEmailError("メールアドレスを入力してください");
      valid = false;
    }
    if (!password) {
      setPasswordError("パスワードを入力してください");
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError("");

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err: unknown) {
      const error = err as Error;
      if (error.name === "NotAuthorizedException") {
        setAuthError("メールアドレスまたはパスワードが正しくありません。");
      } else {
        setAuthError(
          error.message ?? "ログインに失敗しました。もう一度お試しください。",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left column: hero section (desktop only) */}
      <div
        data-testid="hero-section"
        className="hidden md:flex md:w-1/2 flex-col justify-center items-center
          bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800
          text-white p-12 gap-8"
      >
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Tech Blog</h1>
          <p className="text-xl text-blue-100">
            テクノロジーの知識を共有しよう
          </p>
        </div>

        {/* Animated tech chips */}
        <div className="flex flex-wrap gap-3 justify-center max-w-sm">
          {TECH_CHIPS.map((chip, index) => (
            <span
              key={chip}
              className="px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm
                text-sm font-medium border border-white/30
                animate-bounce"
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* Right column: login form */}
      <div className="flex w-full md:w-1/2 flex-col justify-center items-center p-8 bg-white">
        {/* Mobile logo */}
        <div className="md:hidden mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Tech Blog</h1>
          <p className="text-gray-500 mt-1">テクノロジーの知識を共有しよう</p>
        </div>

        <div className="w-full max-w-sm">
          <h2
            data-testid="login-title"
            className="text-2xl font-bold text-gray-900 mb-6 text-center md:text-left"
          >
            ログイン
          </h2>

          {/* Auth error box */}
          {authError && (
            <div
              data-testid="auth-error"
              className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {authError}
            </div>
          )}

          <form
            data-testid="login-form"
            onSubmit={(e) => {
              void handleSubmit(e);
            }}
            noValidate
          >
            {/* Email field */}
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                メールアドレス
              </label>
              <input
                id="email"
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                  focus:ring-blue-500 transition
                  ${emailError ? "border-red-400 focus:ring-red-400" : "border-gray-300"}`}
                placeholder="example@mail.com"
                autoComplete="email"
              />
              {emailError && (
                <p
                  data-testid="email-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                パスワード
              </label>
              <input
                id="password"
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2
                  focus:ring-blue-500 transition
                  ${passwordError ? "border-red-400 focus:ring-red-400" : "border-gray-300"}`}
                placeholder="パスワードを入力"
                autoComplete="current-password"
              />
              {passwordError && (
                <p
                  data-testid="password-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Submit button */}
            <button
              data-testid="login-button"
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-700
                text-white font-semibold transition disabled:opacity-50
                disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {isSubmitting ? "ログイン中..." : "ログイン"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
