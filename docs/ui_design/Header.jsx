// Header.jsx — Sticky glass header with responsive mobile menu
const { useState, useRef, useEffect } = React;

function Header({ screen, setScreen, darkMode, setDarkMode, isLoggedIn, setIsLoggedIn }) {
  const [dropOpen,    setDropOpen]    = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [searchOpen,  setSearchOpen]  = useState(false);
  const [searchQ,     setSearchQ]     = useState('');
  const dropRef = useRef(null);
  const w       = useWindowSize();
  const isMobile = w < 768;

  // Close dropdown on outside click
  useEffect(() => {
    const fn = e => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Close mobile menu on screen change
  useEffect(() => setMobileOpen(false), [screen]);

  const navItems = [
    { label: 'ホーム', key: 'home' },
    { label: 'タグ',   key: 'tags' },
    { label: '人気',   key: 'popular' },
  ];

  const hdrBg = darkMode ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.9)';

  return (
    <header style={{ position:'sticky', top:0, zIndex:200, background:hdrBg, borderBottom:'1px solid var(--border)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)' }}>

      {/* ── Main row ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 20px', height:60, display:'flex', alignItems:'center', gap:16 }}>

        {/* Logo */}
        <button onClick={() => setScreen('home')} style={{ display:'flex', alignItems:'center', gap:8, border:'none', background:'transparent', cursor:'pointer', padding:0, flexShrink:0 }}>
          <div style={{ width:30, height:30, borderRadius:7, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icons.File />
          </div>
          <span style={{ fontWeight:800, fontSize:isMobile?14:15, color:'var(--text)', letterSpacing:'-0.4px', whiteSpace:'nowrap' }}>
            {isMobile ? 'STB' : 'Shin Tech Blog'}
          </span>
        </button>

        {/* Desktop nav */}
        {!isMobile && (
          <nav style={{ display:'flex', gap:2, flex:1 }}>
            {navItems.map(item => {
              const active = item.key === 'home' && (screen === 'home' || screen === 'detail');
              return (
                <button key={item.key} onClick={() => setScreen('home')}
                  style={{ padding:'5px 12px', borderRadius:7, border:'none', fontFamily:'inherit', background:active?'var(--primary-light)':'transparent', color:active?'var(--primary)':'var(--text-secondary)', fontWeight:active?600:400, fontSize:14, cursor:'pointer', transition:'all 0.15s' }}
                  onMouseEnter={e=>{ if(!active){ e.currentTarget.style.background='var(--bg-secondary)'; e.currentTarget.style.color='var(--text)'; }}}
                  onMouseLeave={e=>{ if(!active){ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}}
                >{item.label}</button>
              );
            })}
          </nav>
        )}

        <div style={{ flex: isMobile ? 1 : 'unset' }} />

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>

          {/* Search */}
          {searchOpen ? (
            <div style={{ display:'flex', alignItems:'center', gap:7, background:'var(--bg-secondary)', borderRadius:8, padding:'6px 10px', border:'1.5px solid var(--primary)', width: isMobile?'100%':210 }}>
              <Icons.Search />
              <input autoFocus value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="記事を検索…"
                style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--text)', fontFamily:'inherit', flex:1, minWidth:0 }} />
              <button onClick={()=>{ setSearchOpen(false); setSearchQ(''); }} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:0 }}>
                <Icons.X size={13} />
              </button>
            </div>
          ) : (
            <IconBtn onClick={()=>setSearchOpen(true)}><Icons.Search /></IconBtn>
          )}

          {/* Dark mode */}
          <IconBtn onClick={()=>setDarkMode(!darkMode)}>
            {darkMode ? <Icons.Sun /> : <Icons.Moon />}
          </IconBtn>

          {/* Desktop: write + avatar */}
          {!isMobile && isLoggedIn && (
            <>
              <Button size="sm" onClick={()=>setScreen('editor')}>
                <Icons.Edit /> 投稿する
              </Button>
              <div style={{ position:'relative' }} ref={dropRef}>
                <button onClick={()=>setDropOpen(!dropOpen)}
                  style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 6px 4px 4px', borderRadius:20, border:'1.5px solid var(--border)', background:'transparent', cursor:'pointer', transition:'border-color 0.15s' }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor='var(--primary)'}
                  onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
                >
                  <Avatar name={CURRENT_USER.name} size={26} />
                  <Icons.ChevDown />
                </button>
                {dropOpen && (
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:6, minWidth:188, boxShadow:'0 8px 32px rgba(0,0,0,0.14)', zIndex:300 }}>
                    <div style={{ padding:'8px 12px 10px', borderBottom:'1px solid var(--border)', marginBottom:4 }}>
                      <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{CURRENT_USER.name}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:1 }}>{CURRENT_USER.email}</div>
                    </div>
                    {[{ icon:Icons.User, label:'プロフィール' },{ icon:Icons.Edit, label:'自分の記事' }].map(item=>(
                      <DropItem key={item.label} icon={<item.icon />} label={item.label} onClick={()=>setDropOpen(false)} />
                    ))}
                    <div style={{ borderTop:'1px solid var(--border)', marginTop:4, paddingTop:4 }}>
                      <DropItem icon={<Icons.LogOut />} label="ログアウト" danger onClick={()=>{ setIsLoggedIn(false); setScreen('login'); setDropOpen(false); }} />
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Desktop: login button */}
          {!isMobile && !isLoggedIn && (
            <Button size="sm" onClick={()=>setScreen('login')}>ログイン</Button>
          )}

          {/* Mobile: hamburger */}
          {isMobile && (
            <button onClick={()=>setMobileOpen(!mobileOpen)}
              style={{ width:36, height:36, borderRadius:8, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', flexShrink:0 }}>
              {mobileOpen
                ? <Icons.X size={18} />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>}
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile slide-down menu ── */}
      {isMobile && mobileOpen && (
        <div style={{ borderTop:'1px solid var(--border)', background: darkMode?'rgba(15,23,42,0.97)':'rgba(255,255,255,0.97)', backdropFilter:'blur(14px)', padding:'12px 20px 16px' }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:12 }}>
            {navItems.map(item=>(
              <button key={item.key} onClick={()=>{ setScreen('home'); setMobileOpen(false); }}
                style={{ padding:'10px 14px', borderRadius:8, border:'none', fontFamily:'inherit', background:'transparent', color:'var(--text)', fontSize:15, cursor:'pointer', textAlign:'left', fontWeight:500 }}
                onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}
              >{item.label}</button>
            ))}
          </nav>
          <div style={{ display:'flex', flexDirection:'column', gap:8, paddingTop:12, borderTop:'1px solid var(--border)' }}>
            {isLoggedIn ? (
              <>
                <Button onClick={()=>{ setScreen('editor'); setMobileOpen(false); }}>
                  <Icons.Edit /> 新規投稿
                </Button>
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0' }}>
                  <Avatar name={CURRENT_USER.name} size={32} />
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, color:'var(--text)' }}>{CURRENT_USER.name}</div>
                    <div style={{ fontSize:11, color:'var(--text-muted)' }}>{CURRENT_USER.email}</div>
                  </div>
                </div>
                <button onClick={()=>{ setIsLoggedIn(false); setScreen('login'); setMobileOpen(false); }}
                  style={{ padding:'9px 14px', borderRadius:8, border:'1px solid #fecaca', background:'#fef2f2', color:'#dc2626', fontSize:14, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
                  ログアウト
                </button>
              </>
            ) : (
              <Button onClick={()=>{ setScreen('login'); setMobileOpen(false); }}>ログイン</Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function IconBtn({ onClick, children }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      style={{ width:34, height:34, borderRadius:8, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-secondary)', background:hov?'var(--bg-secondary)':'var(--bg)', transition:'all 0.15s', flexShrink:0 }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {children}
    </button>
  );
}

function DropItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'7px 12px', borderRadius:7, border:'none', background:hov?(danger?'#fef2f2':'var(--bg-secondary)'):'transparent', color:danger?'#ef4444':'var(--text-secondary)', fontSize:13, cursor:'pointer', textAlign:'left', fontFamily:'inherit', transition:'all 0.12s' }}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      {icon} {label}
    </button>
  );
}

Object.assign(window, { Header, IconBtn, DropItem });
