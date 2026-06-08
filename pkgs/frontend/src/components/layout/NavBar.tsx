import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";

interface NavBarProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

const navLinkClass =
  "rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]";

const mobileLinkClass =
  "block rounded-md px-3 py-2 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]";

export function NavBar({ darkMode, onDarkModeToggle }: NavBarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [avatarDropdownOpen, setAvatarDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login");
      setAvatarDropdownOpen(false);
      setMobileMenuOpen(false);
    }
  };

  const avatarInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header
      data-testid="navbar"
      className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 text-[var(--color-text)] shadow-sm backdrop-blur"
    >
      <nav
        className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4"
        aria-label="グローバルナビゲーション"
      >
        <Link
          data-testid="navbar-logo"
          to="/"
          className="shrink-0 rounded-md text-lg font-extrabold tracking-[-0.02em] text-[var(--color-text-strong)] transition-colors hover:text-[var(--color-primary)]"
        >
          Shin Tech Blog
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link data-testid="nav-home" to="/" className={navLinkClass}>
            ホーム
          </Link>
          <Link
            data-testid="nav-tags"
            to="/?view=tags"
            className={navLinkClass}
          >
            タグ
          </Link>
          <Link
            data-testid="nav-trending"
            to="/?view=trending"
            className={navLinkClass}
          >
            人気
          </Link>
        </div>

        <div className="min-w-0 flex-1" />

        <button
          type="button"
          data-testid="dark-mode-toggle"
          onClick={onDarkModeToggle}
          aria-label={darkMode ? "ライトモードに切替" : "ダークモードに切替"}
          className="rounded-md px-2 py-1.5 text-lg text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-strong)]"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {user ? (
          <>
            <Link
              data-testid="nav-create-button"
              to="/create"
              className="hidden shrink-0 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)] md:inline-flex"
            >
              投稿する
            </Link>

            <div className="relative hidden shrink-0 md:block">
              <button
                type="button"
                data-testid="avatar-dropdown-trigger"
                onClick={() => setAvatarDropdownOpen((v) => !v)}
                aria-expanded={avatarDropdownOpen}
                aria-haspopup="menu"
                aria-label="ユーザーメニューを開く"
                className="flex items-center gap-1 rounded-lg p-1 transition-colors hover:bg-[var(--color-surface-muted)]"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-bold text-white">
                  {avatarInitial}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {avatarDropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {avatarDropdownOpen ? (
                <div
                  data-testid="avatar-dropdown"
                  role="menu"
                  className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-64 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-popover)]"
                >
                  <div className="border-b border-[var(--color-border)] px-4 py-3">
                    <div className="text-sm font-semibold text-[var(--color-text-strong)]">
                      {avatarInitial}
                    </div>
                    <div className="truncate text-sm text-[var(--color-text-muted)]">
                      {user.email}
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="nav-logout-button"
                    role="menuitem"
                    onClick={() => void handleSignOut()}
                    className="block w-full px-4 py-3 text-left text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
                  >
                    ログアウト
                  </button>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <Link
            data-testid="nav-login-button"
            to="/login"
            className="hidden shrink-0 rounded-lg border border-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] md:inline-flex"
          >
            ログイン
          </Link>
        )}

        <button
          type="button"
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={mobileMenuOpen ? "メニューを閉じる" : "メニューを開く"}
          className="rounded-md px-2 py-1.5 text-xl text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-muted)] md:hidden"
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 md:hidden"
        >
          <div className="space-y-1">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              ホーム
            </Link>
            <Link
              to="/?view=tags"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              タグ
            </Link>
            <Link
              to="/?view=trending"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              人気
            </Link>
          </div>

          <div className="mt-3 border-t border-[var(--color-border)] pt-3">
            {user ? (
              <>
                <div className="truncate px-3 pb-2 text-sm text-[var(--color-text-muted)]">
                  {user.email}
                </div>
                <Link
                  to="/create"
                  onClick={() => setMobileMenuOpen(false)}
                  className="mb-2 block rounded-lg bg-[var(--color-primary)] px-3 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-strong)]"
                >
                  投稿する
                </Link>
                <button
                  type="button"
                  data-testid="mobile-logout-button"
                  onClick={() => void handleSignOut()}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger-soft)]"
                >
                  ログアウト
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block rounded-lg border border-[var(--color-primary)] px-3 py-2 text-center text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
              >
                ログイン
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
