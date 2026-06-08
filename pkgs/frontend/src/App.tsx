import { Suspense, lazy, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.js";
import { NavBar } from "./components/layout/NavBar.js";
import { AuthProvider } from "./context/AuthContext.js";
import { LoginPage } from "./pages/LoginPage.js";
import { TopPage } from "./pages/TopPage.js";

const BlogCreatePage = lazy(() =>
  import("./pages/BlogCreatePage.js").then((mod) => ({
    default: mod.BlogCreatePage,
  })),
);
const BlogDetailPage = lazy(() =>
  import("./pages/BlogDetailPage.js").then((mod) => ({
    default: mod.BlogDetailPage,
  })),
);

function PageFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-[var(--color-text-subtle)]">
      読み込み中…
    </div>
  );
}

function AppShell({
  darkMode,
  onDarkModeToggle,
}: {
  darkMode: boolean;
  onDarkModeToggle: () => void;
}) {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login";

  if (isAuthPage) {
    return (
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Suspense>
    );
  }

  return (
    <div className="app-shell">
      <NavBar darkMode={darkMode} onDarkModeToggle={onDarkModeToggle} />
      <main className="app-main">
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<TopPage />} />
            <Route path="/posts/:postId" element={<BlogDetailPage />} />
            <Route
              path="/create"
              element={
                <ProtectedRoute>
                  <BlogCreatePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("darkMode") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    try {
      localStorage.setItem("darkMode", String(darkMode));
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  const handleDarkModeToggle = () => setDarkMode((v) => !v);

  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle} />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
