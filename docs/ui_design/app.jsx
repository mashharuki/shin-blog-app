// app.jsx — Root App with routing, theme, and Tweaks panel
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#3b82f6",
  "dark": false,
  "density": "comfortable"
}/*EDITMODE-END*/;

function App() {
  const [screen, setScreen]         = useState('home');
  const [currentPost, setCurrentPost] = useState(null);
  const [isLoggedIn, setIsLoggedIn]   = useState(true);
  const [t, setTweak]                = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + accent whenever tweaks change
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', t.dark ? 'dark' : 'light');
    root.style.setProperty('--primary',       t.accent);
    root.style.setProperty('--primary-hover', shadeHex(t.accent, -18));
    root.style.setProperty('--primary-light', hexAlpha(t.accent, 0.1));
    root.style.setProperty('--primary-text',  shadeHex(t.accent, -30));
    // density
    root.style.setProperty('--card-padding', t.density === 'compact' ? '14px 16px 12px' : '18px 20px 16px');
  }, [t]);

  // Persist screen (but not editor/detail — those lose state on refresh)
  useEffect(() => {
    const saved = localStorage.getItem('stb-screen');
    if (saved === 'home') setScreen('home');
  }, []);
  useEffect(() => {
    if (screen === 'home') localStorage.setItem('stb-screen', 'home');
  }, [screen]);

  return (
    <div>
      {screen !== 'login' && (
        <Header
          screen={screen} setScreen={setScreen}
          darkMode={t.dark} setDarkMode={v => setTweak('dark', v)}
          isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn}
        />
      )}

      {screen === 'login'  && <LoginScreen   setScreen={setScreen} setIsLoggedIn={setIsLoggedIn} />}
      {screen === 'home'   && <HomeScreen    setScreen={setScreen} setCurrentPost={setCurrentPost} />}
      {screen === 'detail' && currentPost && (
        <BlogDetailScreen post={currentPost} setScreen={setScreen} setCurrentPost={setCurrentPost} />
      )}
      {screen === 'editor' && <EditorScreen  setScreen={setScreen} />}

      <TweaksPanel title="Tweaks">
        <TweakSection label="カラー" />
        <TweakColor
          label="アクセント"
          value={t.accent}
          options={['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899']}
          onChange={v => setTweak('accent', v)}
        />
        <TweakToggle
          label="ダークモード"
          value={t.dark}
          onChange={v => setTweak('dark', v)}
        />
        <TweakSection label="レイアウト" />
        <TweakRadio
          label="カード密度"
          value={t.density}
          options={['compact', 'comfortable']}
          onChange={v => setTweak('density', v)}
        />
      </TweaksPanel>
    </div>
  );
}

// Utility: darken/lighten a hex color by `amount` (±)
function shadeHex(hex, amount) {
  const n = parseInt(hex.replace('#',''), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return '#' + [r,g,b].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function hexAlpha(hex, a) {
  const n = parseInt(hex.replace('#',''), 16);
  return `rgba(${n>>16},${(n>>8)&0xff},${n&0xff},${a})`;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
