import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.js";

interface NavBarProps {
  darkMode: boolean;
  onDarkModeToggle: () => void;
}

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
    }
  };

  const handleMobileSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate("/login");
      setMobileMenuOpen(false);
    }
  };

  // Avatar initial from email
  const avatarInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <header
      data-testid="navbar"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        background: darkMode ? "rgba(15, 23, 42, 0.85)" : "rgba(255, 255, 255, 0.85)",
        borderBottom: darkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Main nav row */}
      <nav
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "0 16px",
          height: 56,
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Logo */}
        <Link
          data-testid="navbar-logo"
          to="/"
          style={{
            textDecoration: "none",
            fontWeight: 800,
            fontSize: 18,
            color: darkMode ? "#f8fafc" : "#1e293b",
            letterSpacing: "-0.5px",
            flexShrink: 0,
          }}
        >
          Shin Tech Blog
        </Link>

        {/* Desktop nav links */}
        <div
          style={{
            display: "flex",
            gap: 4,
            alignItems: "center",
          }}
          className="desktop-nav"
        >
          <Link
            data-testid="nav-home"
            to="/"
            style={{
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: darkMode ? "#cbd5e1" : "#475569",
            }}
          >
            ホーム
          </Link>
          <Link
            data-testid="nav-tags"
            to="/?view=tags"
            style={{
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: darkMode ? "#cbd5e1" : "#475569",
            }}
          >
            タグ
          </Link>
          <Link
            data-testid="nav-trending"
            to="/?view=trending"
            style={{
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 14,
              fontWeight: 500,
              color: darkMode ? "#cbd5e1" : "#475569",
            }}
          >
            人気
          </Link>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Dark mode toggle */}
        <button
          type="button"
          data-testid="dark-mode-toggle"
          onClick={onDarkModeToggle}
          aria-label={darkMode ? "ライトモードに切替" : "ダークモードに切替"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 18,
            color: darkMode ? "#fbbf24" : "#475569",
            flexShrink: 0,
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {/* Auth-dependent buttons (desktop) */}
        {user ? (
          <>
            {/* Create post button */}
            <Link
              data-testid="nav-create-button"
              to="/create"
              style={{
                textDecoration: "none",
                padding: "6px 16px",
                borderRadius: 8,
                background: "#6366f1",
                color: "#fff",
                fontSize: 14,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              投稿する
            </Link>

            {/* Avatar dropdown */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                type="button"
                data-testid="avatar-dropdown-trigger"
                onClick={() => setAvatarDropdownOpen((v) => !v)}
                aria-expanded={avatarDropdownOpen}
                aria-haspopup="true"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  borderRadius: 8,
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: "#6366f1",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {avatarInitial}
                </span>
                <span style={{ fontSize: 10, color: darkMode ? "#94a3b8" : "#64748b" }}>▼</span>
              </button>

              {avatarDropdownOpen && (
                <div
                  data-testid="avatar-dropdown"
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: darkMode ? "#1e293b" : "#fff",
                    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
                    borderRadius: 10,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
                    minWidth: 200,
                    zIndex: 100,
                    padding: "8px 0",
                  }}
                >
                  {/* User info */}
                  <div
                    style={{
                      padding: "8px 16px 12px",
                      borderBottom: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: darkMode ? "#f8fafc" : "#1e293b",
                        marginBottom: 2,
                      }}
                    >
                      {avatarInitial}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: darkMode ? "#94a3b8" : "#64748b",
                      }}
                    >
                      {user.email}
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    type="button"
                    data-testid="nav-logout-button"
                    onClick={() => void handleSignOut()}
                    style={{
                      display: "block",
                      width: "100%",
                      padding: "10px 16px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      fontSize: 14,
                      color: "#ef4444",
                      fontWeight: 500,
                    }}
                  >
                    ログアウト
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Login button */
          <Link
            data-testid="nav-login-button"
            to="/login"
            style={{
              textDecoration: "none",
              padding: "6px 16px",
              borderRadius: 8,
              border: "1px solid #6366f1",
              color: "#6366f1",
              fontSize: 14,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ログイン
          </Link>
        )}

        {/* Mobile hamburger */}
        <button
          type="button"
          data-testid="mobile-menu-toggle"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          aria-label="メニューを開く"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "6px 8px",
            borderRadius: 6,
            fontSize: 20,
            color: darkMode ? "#cbd5e1" : "#475569",
            flexShrink: 0,
          }}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>
      </nav>

      {/* Mobile menu slide-down */}
      {mobileMenuOpen && (
        <div
          data-testid="mobile-menu"
          style={{
            borderTop: darkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
            background: darkMode ? "rgba(15, 23, 42, 0.97)" : "rgba(255, 255, 255, 0.97)",
            padding: "12px 16px 16px",
          }}
        >
          {/* Nav links */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 500,
                color: darkMode ? "#cbd5e1" : "#475569",
              }}
            >
              ホーム
            </Link>
            <Link
              to="/?view=tags"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 500,
                color: darkMode ? "#cbd5e1" : "#475569",
              }}
            >
              タグ
            </Link>
            <Link
              to="/?view=trending"
              onClick={() => setMobileMenuOpen(false)}
              style={{
                textDecoration: "none",
                padding: "8px 12px",
                borderRadius: 6,
                fontSize: 15,
                fontWeight: 500,
                color: darkMode ? "#cbd5e1" : "#475569",
              }}
            >
              人気
            </Link>
          </div>

          {/* Auth section */}
          {user ? (
            <div
              style={{
                borderTop: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
                paddingTop: 12,
              }}
            >
              {/* User info */}
              <div
                style={{
                  padding: "4px 12px 8px",
                  fontSize: 13,
                  color: darkMode ? "#94a3b8" : "#64748b",
                }}
              >
                {user.email}
              </div>

              <Link
                to="/create"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: "#6366f1",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                  marginBottom: 8,
                }}
              >
                投稿する
              </Link>

              <button
                type="button"
                data-testid="mobile-logout-button"
                onClick={() => void handleMobileSignOut()}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: 14,
                  color: "#ef4444",
                  fontWeight: 500,
                  borderRadius: 6,
                }}
              >
                ログアウト
              </button>
            </div>
          ) : (
            <div
              style={{
                borderTop: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
                paddingTop: 12,
              }}
            >
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid #6366f1",
                  color: "#6366f1",
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                  textAlign: "center",
                }}
              >
                ログイン
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
