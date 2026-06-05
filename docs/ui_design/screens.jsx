// screens.jsx — All screens: Login, Home, Detail, Editor
// Responsive + Infinite Scroll + highlight.js
const { useState, useRef, useEffect } = React;

/* ── Login ───────────────────────────────────────────────────────────────── */
function LoginScreen({ setScreen, setIsLoggedIn }) {
  const [email, setEmail] = useState('');
  const [pw, setPw]       = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');
  const w = useWindowSize();
  const isMobile = w < 768;

  function submit(e) {
    e.preventDefault();
    if (!email || !pw) { setErr('メールアドレスとパスワードを入力してください'); return; }
    setLoading(true); setErr('');
    setTimeout(() => { setLoading(false); setIsLoggedIn(true); setScreen('home'); }, 900);
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection: isMobile?'column':'row' }}>
      {/* Left — decorative (hidden on mobile) */}
      {!isMobile && (
        <div style={{ flex:1, background:'linear-gradient(145deg,#0f2d5e 0%,#1d4ed8 55%,#3b82f6 100%)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:48, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 1px 1px,rgba(255,255,255,0.07) 1px,transparent 0)', backgroundSize:'36px 36px' }} />
          {[{t:'TypeScript',x:'12%',y:'18%',d:0},{t:'AWS CDK',x:'58%',y:'13%',d:.4},{t:'React',x:'8%',y:'52%',d:.7},{t:'Hono',x:'63%',y:'48%',d:1.1},{t:'Vitest',x:'28%',y:'72%',d:.3},{t:'Lambda',x:'65%',y:'70%',d:.9},{t:'Zod',x:'42%',y:'88%',d:.5},{t:'pnpm',x:'18%',y:'35%',d:1.3}].map(c=>(
            <div key={c.t} style={{ position:'absolute', left:c.x, top:c.y, background:'rgba(255,255,255,0.1)', backdropFilter:'blur(6px)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:20, padding:'5px 14px', fontSize:12, fontWeight:500, color:'rgba(255,255,255,0.88)', animation:`chipfloat ${2.8+c.d}s ease-in-out ${c.d}s infinite alternate` }}>{c.t}</div>
          ))}
          <div style={{ position:'relative', zIndex:1, textAlign:'center' }}>
            <div style={{ width:68, height:68, borderRadius:18, background:'rgba(255,255,255,0.13)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h1 style={{ fontSize:30, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:8 }}>Shin Tech Blog</h1>
            <p style={{ fontSize:14, color:'rgba(255,255,255,0.65)', maxWidth:260, lineHeight:1.7 }}>エンジニアのための技術ブログプラットフォーム</p>
            <div style={{ display:'flex', gap:36, marginTop:44, justifyContent:'center' }}>
              {[{n:'1,240+',l:'記事'},{n:'320+',l:'ユーザー'},{n:'8,500+',l:'いいね'}].map(s=>(
                <div key={s.l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:22, fontWeight:700, color:'#fff' }}>{s.n}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.55)', marginTop:3 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Right — form */}
      <div style={{ width:isMobile?'100%':460, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:isMobile?'48px 24px':48, background:'var(--bg)', minHeight:isMobile?'100vh':'auto' }}>
        {isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
            <div style={{ width:36, height:36, borderRadius:9, background:'var(--primary)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icons.File />
            </div>
            <span style={{ fontWeight:800, fontSize:18, color:'var(--text)' }}>Shin Tech Blog</span>
          </div>
        )}
        <div style={{ width:'100%', maxWidth:340 }}>
          <h2 style={{ fontSize:isMobile?22:26, fontWeight:700, color:'var(--text)', marginBottom:6 }}>おかえりなさい 👋</h2>
          <p style={{ color:'var(--text-secondary)', fontSize:14, marginBottom:28 }}>Shin Tech Blog にログインしてください</p>
          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <LabelInput label="メールアドレス" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} required />
            <LabelInput label="パスワード" type="password" placeholder="••••••••" value={pw} onChange={e=>setPw(e.target.value)} required />
            {err && <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#dc2626' }}>{err}</div>}
            <button type="submit" disabled={loading} style={{ marginTop:4, padding:'11px 0', borderRadius:8, border:'none', background:loading?'var(--text-muted)':'var(--primary)', color:'#fff', fontSize:15, fontWeight:600, cursor:loading?'not-allowed':'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
              {loading?'ログイン中…':'ログイン'}
            </button>
          </form>
          <div style={{ textAlign:'center', marginTop:14 }}>
            <button style={{ background:'none', border:'none', color:'var(--primary)', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>パスワードを忘れた方</button>
          </div>
          <div style={{ marginTop:28, padding:'12px 14px', background:'var(--bg-secondary)', borderRadius:10, border:'1px solid var(--border)' }}>
            <div style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:5 }}>デモ</div>
            <div style={{ fontSize:12, color:'var(--text-secondary)', marginBottom:8 }}>任意のメールとパスワードでログインできます</div>
            <button onClick={()=>{ setEmail('taro@example.com'); setPw('password123'); }} style={{ padding:'4px 12px', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--primary)', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>自動入力</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Blog Card ───────────────────────────────────────────────────────────── */
function BlogCard({ post, onClick }) {
  const [liked, setLiked] = useState(false);
  const [cnt, setCnt]     = useState(post.likes);
  const [hov, setHov]     = useState(false);
  function onLike(e) { e.stopPropagation(); setLiked(!liked); setCnt(liked?cnt-1:cnt+1); }
  return (
    <div onClick={onClick} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{ background:'var(--surface)', border:`1px solid ${hov?'var(--primary)':'var(--border)'}`, borderRadius:12, padding:'var(--card-padding)', cursor:'pointer', transition:'all 0.2s', display:'flex', flexDirection:'column', gap:11, boxShadow:hov?'0 6px 24px rgba(59,130,246,0.1)':'none', transform:hov?'translateY(-2px)':'translateY(0)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Avatar name={post.author.name} size={28} />
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{post.author.name}</div>
          <div style={{ fontSize:11, color:'var(--text-muted)' }}>{post.createdAt}</div>
        </div>
      </div>
      <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', lineHeight:1.55, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{post.title}</h3>
      <p style={{ fontSize:12.5, color:'var(--text-secondary)', lineHeight:1.7, flex:1, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{post.excerpt}</p>
      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
        {post.tags.slice(0,3).map(tag=><Badge key={tag} color={TAG_COLORS[tag]}>#{tag}</Badge>)}
      </div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid var(--border)', paddingTop:11 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'var(--text-muted)' }}><Icons.Clock /> {post.readTime}分</span>
        <button onClick={onLike} style={{ display:'flex', alignItems:'center', gap:4, border:'none', background:'transparent', cursor:'pointer', fontSize:12, fontFamily:'inherit', color:liked?'#ef4444':'var(--text-muted)', padding:'3px 7px', borderRadius:6, transition:'all 0.15s' }}
          onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <Icons.Heart filled={liked} size={13} /> {cnt}
        </button>
      </div>
    </div>
  );
}

/* ── Home ────────────────────────────────────────────────────────────────── */
function HomeScreen({ setScreen, setCurrentPost }) {
  const [tab, setTab]             = useState('latest');
  const [query, setQuery]         = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore]   = useState(false);
  const loaderRef = useRef(null);

  const allFiltered = BLOG_POSTS.filter(p => {
    const mQ = !query || p.title.includes(query) || p.tags.some(t=>t.toLowerCase().includes(query.toLowerCase()));
    const mT = !selectedTag || p.tags.includes(selectedTag);
    return mQ && mT;
  });
  const sorted  = tab === 'trending' ? [...allFiltered].sort((a,b)=>b.likes-a.likes) : allFiltered;
  const visible = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  // Infinite scroll
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        setLoadingMore(true);
        setTimeout(() => { setVisibleCount(c => Math.min(c + 6, sorted.length)); setLoadingMore(false); }, 700);
      }
    }, { rootMargin:'200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loadingMore, sorted.length]);

  // Reset on filter change
  useEffect(() => { setVisibleCount(6); }, [tab, query, selectedTag]);

  const allTags = [...new Set(BLOG_POSTS.flatMap(p=>p.tags))];

  return (
    <div className="page-container">
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:700, color:'var(--text)', marginBottom:2 }}>技術記事</h1>
          <p style={{ fontSize:13, color:'var(--text-secondary)' }}>エンジニアが書いた最新の技術記事をチェック</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg-secondary)', borderRadius:8, padding:'7px 12px', border:'1px solid var(--border)', minWidth:200 }}>
          <Icons.Search />
          <input placeholder="タイトル・タグで検索…" value={query} onChange={e=>setQuery(e.target.value)}
            style={{ border:'none', background:'transparent', outline:'none', fontSize:13, color:'var(--text)', fontFamily:'inherit', flex:1, minWidth:0 }} />
          {query && <button onClick={()=>setQuery('')} style={{ border:'none', background:'transparent', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:0 }}><Icons.X size={13} /></button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
        <div style={{ display:'flex', gap:2, background:'var(--bg-secondary)', borderRadius:8, padding:3 }}>
          {[{k:'latest',l:'最新'},{k:'trending',l:'トレンド'},{k:'following',l:'フォロー中'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{ padding:'5px 14px', borderRadius:6, border:'none', fontFamily:'inherit', fontSize:13, cursor:'pointer', transition:'all 0.15s', fontWeight:tab===t.k?600:400, background:tab===t.k?'var(--surface)':'transparent', color:tab===t.k?'var(--text)':'var(--text-secondary)', boxShadow:tab===t.k?'0 1px 3px rgba(0,0,0,0.08)':'none' }}>
              {t.l}
            </button>
          ))}
        </div>
        <span style={{ fontSize:12, color:'var(--text-muted)' }}>{sorted.length}件</span>
      </div>

      {/* Tag chips */}
      <div style={{ display:'flex', gap:7, marginBottom:28, flexWrap:'wrap' }}>
        {allTags.map(tag=>{
          const active = selectedTag === tag;
          return (
            <button key={tag} onClick={()=>setSelectedTag(active?null:tag)}
              style={{ padding:'4px 13px', borderRadius:20, border:`1px solid ${active?'var(--primary)':'var(--border)'}`, background:active?'var(--primary-light)':'var(--bg-secondary)', color:active?'var(--primary)':'var(--text-secondary)', fontSize:12, cursor:'pointer', fontFamily:'inherit', fontWeight:500, transition:'all 0.15s' }}
              onMouseEnter={e=>{ if(!active){ e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}}
              onMouseLeave={e=>{ if(!active){ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}}>
              #{tag}
            </button>
          );
        })}
      </div>

      {/* Card grid — responsive via CSS class */}
      <div className="cards-grid">
        {visible.map(post=>(
          <BlogCard key={post.id} post={post} onClick={()=>{ setCurrentPost(post); setScreen('detail'); }} />
        ))}
      </div>

      {/* Infinite scroll trigger + status */}
      <div ref={loaderRef} style={{ padding:'40px 0', display:'flex', justifyContent:'center', alignItems:'center', minHeight:80 }}>
        {loadingMore && (
          <div style={{ display:'flex', alignItems:'center', gap:10, color:'var(--text-muted)', fontSize:13 }}>
            <div className="spinner" />
            読み込み中…
          </div>
        )}
        {!hasMore && visible.length > 0 && (
          <div style={{ color:'var(--text-muted)', fontSize:13 }}>全 {sorted.length} 件を表示しました ✓</div>
        )}
      </div>
    </div>
  );
}

/* ── Detail ──────────────────────────────────────────────────────────────── */
function BlogDetailScreen({ post, setScreen, setCurrentPost }) {
  const [liked, setLiked] = useState(false);
  const [cnt, setCnt]     = useState(post?.likes||0);
  const [saved, setSaved] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const w = useWindowSize();
  const isMobile = w < 900;

  if (!post) return null;

  const html      = (window.marked?.parse || (s=>s))(post.content);
  const headings  = (post.content.match(/^#{1,3} .+$/gm)||[]).map(h=>({ level:h.match(/^#+/)[0].length, text:h.replace(/^#+\s/,'') }));
  const related   = BLOG_POSTS.filter(p=>p.id!==post.id&&p.tags.some(t=>post.tags.includes(t))).slice(0,3);

  return (
    <div className="page-container" style={{ maxWidth:1100 }}>
      <button onClick={()=>setScreen('home')} style={{ display:'flex', alignItems:'center', gap:6, border:'none', background:'transparent', color:'var(--text-secondary)', fontSize:14, cursor:'pointer', marginBottom:24, fontFamily:'inherit', padding:'6px 0' }}
        onMouseEnter={e=>e.currentTarget.style.color='var(--text)'} onMouseLeave={e=>e.currentTarget.style.color='var(--text-secondary)'}>
        <Icons.ArrowLeft /> 一覧に戻る
      </button>

      <div className="detail-grid">
        {/* Article */}
        <article>
          <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:14 }}>
            {post.tags.map(t=><Badge key={t} color={TAG_COLORS[t]}>#{t}</Badge>)}
          </div>
          <h1 style={{ fontSize:isMobile?22:28, fontWeight:800, color:'var(--text)', lineHeight:1.38, marginBottom:20, letterSpacing:'-0.5px' }}>{post.title}</h1>

          {/* Meta bar */}
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', background:'var(--bg-secondary)', borderRadius:10, marginBottom:28, border:'1px solid var(--border)', flexWrap:'wrap' }}>
            <Avatar name={post.author.name} size={40} />
            <div style={{ flex:1, minWidth:100 }}>
              <div style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{post.author.name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)' }}>{post.createdAt} · {post.readTime}分で読める</div>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {[
                { active:liked, label:cnt, color:'#ef4444', bg:'#fef2f2', icon:<Icons.Heart filled={liked} size={13}/>, onClick:()=>{ setLiked(!liked); setCnt(liked?cnt-1:cnt+1); } },
                { active:saved, label:'保存', color:'var(--primary)', bg:'var(--primary-light)', icon:<Icons.Bookmark filled={saved}/>, onClick:()=>setSaved(!saved) },
              ].map((btn,i)=>(
                <button key={i} onClick={btn.onClick} style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:8, border:'1px solid var(--border)', background:btn.active?btn.bg:'var(--bg)', color:btn.active?btn.color:'var(--text-secondary)', cursor:'pointer', fontSize:12, fontFamily:'inherit', transition:'all 0.15s' }}>
                  {btn.icon} {btn.label}
                </button>
              ))}
              <button style={{ display:'flex', alignItems:'center', padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text-secondary)', cursor:'pointer' }}>
                <Icons.Share />
              </button>
            </div>
          </div>

          {/* Mobile TOC toggle */}
          {isMobile && headings.length > 0 && (
            <div style={{ marginBottom:24 }}>
              <button onClick={()=>setTocOpen(!tocOpen)} style={{ display:'flex', alignItems:'center', gap:6, width:'100%', padding:'10px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg-secondary)', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                目次 {tocOpen ? '▲' : '▼'}
              </button>
              {tocOpen && (
                <div style={{ marginTop:4, padding:'12px 16px', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
                  {headings.map((h,i)=>(
                    <div key={i} style={{ fontSize:13, color:'var(--text-secondary)', paddingLeft:(h.level-1)*12, padding:`4px ${(h.level-1)*12+6}px`, cursor:'pointer' }}>{h.text}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="md-content" dangerouslySetInnerHTML={{ __html:html }} />

          {/* Related */}
          {related.length > 0 && (
            <div style={{ marginTop:48, paddingTop:28, borderTop:'1px solid var(--border)' }}>
              <h3 style={{ fontSize:15, fontWeight:700, color:'var(--text)', marginBottom:14 }}>関連記事</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {related.map(rp=>(
                  <div key={rp.id} onClick={()=>{ setCurrentPost(rp); }} style={{ display:'flex', gap:12, padding:'12px 14px', borderRadius:9, border:'1px solid var(--border)', cursor:'pointer', transition:'all 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.background='var(--bg-secondary)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <Avatar name={rp.author.name} size={32} />
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{rp.title}</div>
                      <div style={{ fontSize:11, color:'var(--text-muted)' }}>{rp.author.name} · {rp.readTime}分</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Sidebar — hidden on mobile via CSS */}
        <aside className="detail-sidebar">
          <div style={{ position:'sticky', top:80, display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>目次</div>
              {headings.length > 0
                ? headings.map((h,i)=>(
                  <div key={i} style={{ fontSize:12, padding:`3px ${(h.level-1)*10+6}px`, borderRadius:5, cursor:'pointer', transition:'all 0.12s', fontWeight:h.level===1?600:400, color:h.level===1?'var(--text)':'var(--text-secondary)' }}
                    onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg-tertiary)'; e.currentTarget.style.color='var(--primary)'; }}
                    onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color=h.level===1?'var(--text)':'var(--text-secondary)'; }}>
                    {h.text}
                  </div>
                ))
                : <div style={{ fontSize:12, color:'var(--text-muted)' }}>目次なし</div>}
            </div>
            <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:10, padding:'16px', textAlign:'center' }}>
              <Avatar name={post.author.name} size={48} />
              <div style={{ marginTop:10, fontWeight:600, fontSize:14, color:'var(--text)' }}>{post.author.name}</div>
              <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:3 }}>シニアエンジニア</div>
              <button style={{ marginTop:12, width:'100%', padding:'7px', borderRadius:8, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text-secondary)', fontSize:12, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}
                onMouseEnter={e=>{ e.currentTarget.style.borderColor='var(--primary)'; e.currentTarget.style.color='var(--primary)'; }}
                onMouseLeave={e=>{ e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                フォローする
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ── Editor ──────────────────────────────────────────────────────────────── */
function EditorScreen({ setScreen }) {
  const w       = useWindowSize();
  const isMobile = w < 768;

  const [title, setTitle] = useState('');
  const [body, setBody]   = useState(`# はじめに\n\nここに記事の導入を書きます。\n\n## 本題\n\n\`\`\`typescript\nconst greet = (name: string): string => {\n  return \`Hello, \${name}!\`;\n};\n\nconsole.log(greet('World'));\n\`\`\`\n\n### ポイント\n\n- **TypeScript** で型安全なコードを書く\n- コンポーネントの再利用性を高める\n- テストを先に書く（TDD）\n\n## まとめ\n\n記事のまとめをここに書きます。\n`);
  const [tags, setTags]   = useState(['TypeScript']);
  const [tagIn, setTagIn] = useState('');
  const [pane, setPane]   = useState(isMobile ? 'edit' : 'both');
  const [pub, setPub]     = useState(false);
  const [done, setDone]   = useState(false);
  const taRef             = useRef(null);

  // Force single pane on mobile
  useEffect(() => { if (isMobile && pane === 'both') setPane('edit'); }, [isMobile]);

  const preview = (window.marked?.parse || (s=>s.replace(/\n/g,'<br>')))(body);
  const words   = body.replace(/```[\s\S]*?```/g,'').replace(/[#*`[\]()]/g,'').trim().split(/\s+/).length;

  function addTag() { if(tagIn&&!tags.includes(tagIn)){ setTags([...tags,tagIn]); setTagIn(''); } }
  function rmTag(t)  { setTags(tags.filter(x=>x!==t)); }
  function insert(before, after='') {
    const ta=taRef.current; if(!ta) return;
    const s=ta.selectionStart, e=ta.selectionEnd, sel=body.slice(s,e);
    setBody(body.slice(0,s)+before+sel+after+body.slice(e));
    setTimeout(()=>{ ta.focus(); ta.setSelectionRange(s+before.length,e+before.length); },0);
  }
  function publish() {
    if(!title||pub) return;
    setPub(true);
    setTimeout(()=>{ setDone(true); setTimeout(()=>setScreen('home'),1600); },1200);
  }

  const toolbar = [
    {icon:Icons.Bold,  tip:'太字',   fn:()=>insert('**','**')},
    {icon:Icons.Italic,tip:'斜体',   fn:()=>insert('*','*')},
    {icon:Icons.Hash,  tip:'見出し', fn:()=>insert('\n## ')},
    {icon:Icons.Code,  tip:'コード', fn:()=>insert('`','`')},
    {icon:Icons.Link,  tip:'リンク', fn:()=>insert('[','](url)')},
    {icon:Icons.Img,   tip:'画像',   fn:()=>insert('![alt](',')')},
    {icon:Icons.List,  tip:'リスト', fn:()=>insert('\n- ')},
  ];

  const paneOptions = isMobile
    ? [{k:'edit',l:'編集'},{k:'preview',l:'プレビュー'}]
    : [{k:'edit',l:'編集'},{k:'both',l:'分割'},{k:'preview',l:'プレビュー'}];

  return (
    <div style={{ height:'calc(100vh - 60px)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ padding:'10px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12, background:'var(--bg)', flexShrink:0 }}>
        <button onClick={()=>setScreen('home')} style={{ display:'flex', alignItems:'center', gap:5, border:'none', background:'transparent', color:'var(--text-secondary)', fontSize:13, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
          <Icons.ArrowLeft /> {!isMobile && 'キャンセル'}
        </button>
        <input placeholder="記事のタイトルを入力…" value={title} onChange={e=>setTitle(e.target.value)}
          style={{ flex:1, border:'none', background:'transparent', outline:'none', fontSize:isMobile?15:18, fontWeight:700, color:'var(--text)', fontFamily:'inherit', minWidth:0 }} />
        <div style={{ display:'flex', background:'var(--bg-secondary)', borderRadius:7, padding:2, gap:1, flexShrink:0 }}>
          {paneOptions.map(v=>(
            <button key={v.k} onClick={()=>setPane(v.k)} style={{ padding:'4px 10px', borderRadius:5, border:'none', fontFamily:'inherit', cursor:'pointer', fontSize:12, fontWeight:pane===v.k?600:400, background:pane===v.k?'var(--bg)':'transparent', color:pane===v.k?'var(--text)':'var(--text-secondary)', boxShadow:pane===v.k?'0 1px 3px rgba(0,0,0,0.07)':'none', transition:'all 0.1s' }}>
              {v.l}
            </button>
          ))}
        </div>
        {done
          ? <span style={{ color:'#10b981', fontWeight:600, fontSize:13, flexShrink:0 }}>✓ 公開しました！</span>
          : <button onClick={publish} disabled={!title||pub} style={{ padding:'8px 18px', borderRadius:8, border:'none', fontFamily:'inherit', background:title&&!pub?'var(--primary)':'var(--text-muted)', color:'#fff', fontSize:13, fontWeight:600, cursor:title&&!pub?'pointer':'not-allowed', flexShrink:0 }}>
              {pub?'公開中…':'公開する'}
            </button>}
      </div>

      {/* Tags */}
      <div style={{ padding:'7px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:7, background:'var(--bg-secondary)', flexShrink:0, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, fontWeight:600, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', flexShrink:0 }}>タグ</span>
        {tags.map(tag=>(
          <div key={tag} style={{ display:'flex', alignItems:'center', gap:3, padding:'3px 8px 3px 10px', background:'var(--primary-light)', borderRadius:20, fontSize:12, color:'var(--primary-text)', border:'1px solid rgba(59,130,246,0.2)' }}>
            #{tag}
            <button onClick={()=>rmTag(tag)} style={{ background:'none', border:'none', cursor:'pointer', padding:1, color:'var(--primary-text)', display:'flex', alignItems:'center' }}><Icons.X size={11} /></button>
          </div>
        ))}
        <input value={tagIn} onChange={e=>setTagIn(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTag()} placeholder="タグを追加…"
          style={{ border:'none', background:'transparent', outline:'none', fontSize:12, color:'var(--text)', fontFamily:'inherit', minWidth:80 }} />
      </div>

      {/* Editor / Preview */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {(pane==='edit'||pane==='both') && (
          <div style={{ flex:1, display:'flex', flexDirection:'column', borderRight:pane==='both'?'1px solid var(--border)':'none', minWidth:0 }}>
            <div style={{ padding:'5px 14px', borderBottom:'1px solid var(--border)', display:'flex', gap:1, background:'var(--bg-secondary)', flexShrink:0, flexWrap:'wrap' }}>
              {toolbar.map((t,i)=>(
                <button key={i} onClick={t.fn} title={t.tip} style={{ width:30, height:28, borderRadius:5, border:'none', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', transition:'all 0.1s' }}
                  onMouseEnter={e=>{ e.currentTarget.style.background='var(--bg-tertiary)'; e.currentTarget.style.color='var(--text)'; }}
                  onMouseLeave={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}>
                  <t.icon />
                </button>
              ))}
            </div>
            <textarea ref={taRef} value={body} onChange={e=>setBody(e.target.value)} placeholder="マークダウンで記事を書いてください…"
              style={{ flex:1, padding:'20px', background:'var(--bg)', color:'var(--text)', fontSize:13.5, lineHeight:1.85, fontFamily:"'JetBrains Mono','Fira Code','SF Mono',monospace", resize:'none', border:'none', outline:'none' }} />
            <div style={{ padding:'4px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)', fontSize:11, color:'var(--text-muted)', display:'flex', gap:16, flexShrink:0 }}>
              <span>{body.length}文字</span><span>約{words}語</span><span>Markdown</span>
            </div>
          </div>
        )}
        {(pane==='preview'||pane==='both') && (
          <div style={{ flex:1, overflow:'auto', padding:'24px 28px', background:'var(--bg)', minWidth:0 }}>
            {title && <h1 style={{ fontSize:24, fontWeight:800, color:'var(--text)', marginBottom:24, letterSpacing:'-0.5px' }}>{title}</h1>}
            <div className="md-content" style={{ fontSize:14, lineHeight:1.8, color:'var(--text)' }} dangerouslySetInnerHTML={{ __html:preview }} />
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, HomeScreen, BlogDetailScreen, EditorScreen, BlogCard });
