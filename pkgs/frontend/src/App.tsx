import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { NavBar } from "./components/layout/NavBar.js";
import { ProtectedRoute } from "./components/auth/ProtectedRoute.js";
import { LoginPage } from "./pages/LoginPage.js";
import { TopPage } from "./pages/TopPage.js";
import { BlogDetailPage } from "./pages/BlogDetailPage.js";
import { BlogCreatePage } from "./pages/BlogCreatePage.js";

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
      <NavBar darkMode={darkMode} onDarkModeToggle={handleDarkModeToggle} />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
      </main>
    </BrowserRouter>
  );
}

export default App;
