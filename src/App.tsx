import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, Bot, BrainCircuit, Check, ChevronRight, CircleDollarSign, Clock3, Camera as Instagram,
  LayoutDashboard, MessageCircle, Pause, Play, PlugZap, Search, Send, Settings,
  Sparkles, Target, Users, Zap, ShieldCheck, BarChart3, CreditCard, Menu, X, Info
} from 'lucide-react';

type Message = { id: string; from: 'lead' | 'ai' | 'human'; body: string; time: string };

type StyleProfile = {
  language?: string;
  address?: string;
  formality?: string;
  sentenceLength?: string;
  messageLength?: string;
  emojiUsage?: string;
  slang?: string;
  energy?: string;
  directness?: string;
  humor?: string;
  punctuation?: string;
  notes?: string;
};

type Conversation = {
  id: string; name: string; username: string; avatar: string; score: number; temperature: string; stage: string;
  aiMode: 'active' | 'paused'; lastMessage: string; time: string; goal: string; painPoint: string; experience: string;
  budget: string; objection: string; messages: Message[];
  summary?: string; knownFacts?: string; openQuestions?: string; nextStep?: string; styleProfile?: StyleProfile;
};
type Bootstrap = {
  user?: { id?: string; name: string; email: string; role: string; emailVerified?: boolean };
  organization: { id?: string; name: string; plan: string };
  instagram: { connected: boolean; username: string; status: string; ready?: boolean };
  billing?: {
    provider?: string;
    plan?: string;
    status?: string;
    subscriptionId?: string;
    currentPeriodEnd?: string;
    configured?: boolean;
    webhookConfigured?: boolean;
    mode?: string;
  };
  access?: {
    billingEnforced?: boolean;
    adminBypass?: boolean;
    paid?: boolean;
    granted?: boolean;
    emailVerificationEnforced?: boolean;
    emailVerified?: boolean;
  };
  metrics: Record<string, number>;
  conversations: Conversation[];
  agent: Record<string, any>;
};

type View = 'dashboard' | 'inbox' | 'test' | 'leads' | 'agent' | 'analytics' | 'integrations' | 'billing' | 'settings';

const nav = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['inbox', 'Inbox', MessageCircle], ['test', 'Test-Chat', Bot], ['leads', 'Leads', Users],
  ['agent', 'AI Agent', BrainCircuit], ['analytics', 'Analytics', BarChart3],
  ['integrations', 'Integrationen', PlugZap], ['billing', 'Billing', CreditCard], ['settings', 'Einstellungen', Settings],
] as const;

const stageLabel: Record<string, string> = {
  discovery: 'Discovery', painpoint: 'Painpoint', goal: 'Ziel', qualification: 'Qualifizierung', solution: 'Lösung', objection: 'Einwand', close: 'Close'
};

export function App() {
  const params=new URLSearchParams(window.location.search);
  const verifyToken=params.get('verify');
  const resetToken=params.get('reset');

  const [auth,setAuth]=useState<any>(null);
  const [checking,setChecking]=useState(!verifyToken&&!resetToken);

  useEffect(()=>{
    if(verifyToken||resetToken)return;

    fetch('/api/auth/me')
      .then(async r=>{
        if(!r.ok)return null;
        return r.json();
      })
      .then(j=>setAuth(j?.authenticated?j:null))
      .catch(()=>setAuth(null))
      .finally(()=>setChecking(false));
  },[]);

  if(verifyToken){
    return <VerifyEmailPage token={verifyToken}/>;
  }

  if(resetToken){
    return <ResetPasswordPage token={resetToken}/>;
  }

  if(checking){
    return <div className="loading"><div className="spinner"/><span>Sichere Sitzung wird geprüft…</span></div>;
  }

  if(!auth){
    return <Login onAuthenticated={setAuth}/>;
  }

  return <ProductApp auth={auth} onLogout={()=>setAuth(null)}/>;
}

function AuthBrandPanel(){
  return <div className="login-visual">
    <div className="login-brand"><div className="brand-mark"><Sparkles size={18}/></div><strong>DM Sales AI</strong></div>
    <div className="login-copy">
      <span className="eyebrow light">AI SALES AGENT</span>
      <h1>Aus DMs werden<br/><em>Verkaufsgespräche.</em></h1>
      <p>Ein privater Workspace für AI-gestützte Instagram-Verkaufsgespräche, Lead Intelligence und deinen eigenen Sales Agent.</p>
      <div className="login-flow"><span><MessageCircle/> Nachricht</span><ChevronRight/><span><BrainCircuit/> Verstehen</span><ChevronRight/><span><Target/> Qualifizieren</span><ChevronRight/><span><CircleDollarSign/> Verkaufen</span></div>
    </div>
    <small>Instagram DMs · AI Sales Agent · Lead Intelligence</small>
  </div>;
}

function Login({onAuthenticated}:{onAuthenticated:(value:any)=>void}) {
  const [mode,setMode]=useState<'login'|'register'|'forgot'>('login');
  const [name,setName]=useState('');
  const [workspaceName,setWorkspaceName]=useState('');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);

  async function submit(e?:React.FormEvent){
    e?.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);

    try{
      if(mode==='forgot'){
        const r=await fetch('/api/auth/forgot-password',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email}),
        });
        const j:any=await r.json();
        if(!r.ok){
          setError(j.error||'Anfrage fehlgeschlagen.');
          return;
        }
        setNotice(j.message||'Falls ein Konto existiert, wurde eine E-Mail gesendet.');
        return;
      }

      const endpoint=mode==='login'?'/api/auth/login':'/api/auth/register';
      const payload=mode==='login'
        ? {email,password}
        : {name,email,password,workspaceName};

      const r=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(payload),
      });
      const j:any=await r.json();

      if(!r.ok){
        setError(j.error||'Anmeldung fehlgeschlagen.');
        return;
      }

      onAuthenticated({
        authenticated:true,
        user:j.user,
        organization:j.organization,
        verificationRequired:j.verificationRequired,
      });
    }catch{
      setError('Verbindung fehlgeschlagen. Bitte versuche es erneut.');
    }finally{
      setLoading(false);
    }
  }

  function switchMode(next:'login'|'register'|'forgot'){
    setMode(next);
    setError('');
    setNotice('');
    setPassword('');
  }

  return <div className="login-page">
    <AuthBrandPanel/>

    <div className="login-form-wrap">
      <form className="login-form" onSubmit={submit}>
        <span className="eyebrow">
          {mode==='login'?'WORKSPACE LOGIN':mode==='register'?'ACCOUNT ERSTELLEN':'PASSWORT ZURÜCKSETZEN'}
        </span>
        <h2>
          {mode==='login'?'Willkommen zurück':mode==='register'?'Dein eigener Workspace':'Passwort vergessen?'}
        </h2>
        <p>
          {mode==='login'
            ? 'Melde dich an, um deinen privaten DM Sales AI Workspace zu öffnen.'
            : mode==='register'
              ? 'Erstelle dein Konto. Deine Agent-Einstellungen, Leads und Abos werden getrennt von allen anderen Kunden gespeichert.'
              : 'Gib deine E-Mail-Adresse ein. Falls ein Konto existiert, senden wir dir einen sicheren Reset-Link.'}
        </p>

        {mode!=='forgot'&&<div className="auth-tabs">
          <button type="button" className={mode==='login'?'active':''} onClick={()=>switchMode('login')}>Anmelden</button>
          <button type="button" className={mode==='register'?'active':''} onClick={()=>switchMode('register')}>Registrieren</button>
        </div>}

        {mode==='register'&&<>
          <label><span>Dein Name</span><input autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="Max Mustermann" required/></label>
          <label><span>Workspace-Name</span><input value={workspaceName} onChange={e=>setWorkspaceName(e.target.value)} placeholder="z. B. Max Media" required/></label>
        </>}

        <label><span>E-Mail</span><input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@unternehmen.de" required/></label>

        {mode!=='forgot'&&<label>
          <span>Passwort</span>
          <input type="password" autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode==='register'?'Mind. 10 Zeichen, Buchstabe + Zahl':'Dein Passwort'} required/>
        </label>}

        {mode==='login'&&<button type="button" className="forgot-link" onClick={()=>switchMode('forgot')}>Passwort vergessen?</button>}

        {error&&<div className="auth-error">{error}</div>}
        {notice&&<div className="auth-success">{notice}</div>}

        <button className="primary login-submit" type="submit" disabled={loading}>
          {loading
            ? 'Bitte warten…'
            : mode==='login'
              ? 'Workspace öffnen'
              : mode==='register'
                ? 'Konto erstellen'
                : 'Reset-Link senden'} <ChevronRight size={16}/>
        </button>

        {mode==='forgot'&&<button type="button" className="auth-back-link" onClick={()=>switchMode('login')}><ArrowLeft size={14}/> Zurück zur Anmeldung</button>}

      </form>
    </div>
  </div>;
}

function VerifyEmailPage({token}:{token:string}){
  const [state,setState]=useState<'loading'|'success'|'error'>('loading');
  const [message,setMessage]=useState('E-Mail-Adresse wird bestätigt…');

  useEffect(()=>{
    let redirectTimer:number|undefined;

    fetch('/api/auth/verify-email',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token}),
    })
      .then(async r=>{
        const j:any=await r.json();
        if(!r.ok)throw new Error(j.error||'Bestätigung fehlgeschlagen.');

        setMessage('Deine E-Mail-Adresse wurde bestätigt. Du wirst zur Plan-Auswahl weitergeleitet.');
        setState('success');

        redirectTimer=window.setTimeout(()=>{
          window.history.replaceState({},'',window.location.pathname);
          window.location.replace('/');
        },900);
      })
      .catch(error=>{
        setMessage(error?.message||'Bestätigung fehlgeschlagen.');
        setState('error');
      });

    return ()=>{
      if(redirectTimer)window.clearTimeout(redirectTimer);
    };
  },[token]);

  return <AuthResultPage
    title={state==='success'?'E-Mail bestätigt':'E-Mail bestätigen'}
    message={message}
    success={state==='success'}
    loading={state==='loading'}
    buttonLabel={state==='success'?'Weiter zur Plan-Auswahl':'Zur Anmeldung'}
  />;
}

function ResetPasswordPage({token}:{token:string}){
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [error,setError]=useState('');
  const [done,setDone]=useState(false);
  const [loading,setLoading]=useState(false);

  async function submit(e:React.FormEvent){
    e.preventDefault();
    setError('');

    if(password!==confirm){
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    setLoading(true);
    try{
      const r=await fetch('/api/auth/reset-password',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token,password}),
      });
      const j:any=await r.json();
      if(!r.ok){
        setError(j.error||'Passwort konnte nicht geändert werden.');
        return;
      }
      setDone(true);
    }catch{
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    }finally{
      setLoading(false);
    }
  }

  if(done){
    return <AuthResultPage
      title="Passwort geändert"
      message="Dein neues Passwort ist aktiv. Du kannst dich jetzt wieder anmelden."
      success
      buttonLabel="Jetzt anmelden"
    />;
  }

  return <div className="login-page">
    <AuthBrandPanel/>
    <div className="login-form-wrap">
      <form className="login-form" onSubmit={submit}>
        <span className="eyebrow">NEUES PASSWORT</span>
        <h2>Passwort festlegen</h2>
        <p>Das neue Passwort muss mindestens 10 Zeichen sowie mindestens einen Buchstaben und eine Zahl enthalten.</p>

        <label><span>Neues Passwort</span><input type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
        <label><span>Passwort wiederholen</span><input type="password" autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} required/></label>

        {error&&<div className="auth-error">{error}</div>}

        <button className="primary login-submit" type="submit" disabled={loading}>
          {loading?'Bitte warten…':'Passwort speichern'} <ChevronRight size={16}/>
        </button>
      </form>
    </div>
  </div>;
}

function AuthResultPage({
  title,
  message,
  success=false,
  loading=false,
  buttonLabel,
}:{
  title:string,
  message:string,
  success?:boolean,
  loading?:boolean,
  buttonLabel:string,
}){
  function goHome(){
    window.history.replaceState({},'',window.location.pathname);
    window.location.href='/';
  }

  return <div className="auth-result-page">
    <div className={`auth-result-card ${success?'success':''}`}>
      <div className="brand-mark"><Sparkles size={20}/></div>
      <span className="eyebrow">DM SALES AI</span>
      <h1>{title}</h1>
      {loading?<div className="spinner"/>:<p>{message}</p>}
      {!loading&&<button className="primary" onClick={goHome}>{buttonLabel}<ChevronRight size={16}/></button>}
    </div>
  </div>;
}

function ProductApp({auth,onLogout}:{auth:any,onLogout:()=>void}) {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState('');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    fetch('/api/bootstrap')
      .then(async r=>{
        if(r.status===401){
          onLogout();
          return null;
        }
        return r.json();
      })
      .then(j=>{
        if(!j)return;
        setData(j);
        if(j.conversations?.[0]?.id)setSelectedId(j.conversations[0].id);
      })
      .catch(()=>undefined);
  }, []);

  async function logout(){
    await fetch('/api/auth/logout',{method:'POST'}).catch(()=>undefined);
    onLogout();
  }

  if (!data) return <div className="loading"><div className="spinner"/><span>Workspace wird geladen…</span></div>;

  const selected = data.conversations.find(c => c.id === selectedId) || data.conversations[0];
  const user=data.user||auth?.user||{name:'Account Owner',email:'',role:'owner'};
  const initials=String(user.name||user.email||'U').split(/\s+/).filter(Boolean).slice(0,2).map((x:string)=>x[0]?.toUpperCase()).join('')||'U';
  const workspaceInitial=String(data.organization.name||'W').trim().slice(0,1).toUpperCase();
  const billingStatus=String(data.billing?.status||'').toLowerCase();
  const billingPeriodEnd=Date.parse(String(data.billing?.currentPeriodEnd||''));
  const billingActive=
    billingStatus==='active' ||
    (
      billingStatus==='cancelled' &&
      Number.isFinite(billingPeriodEnd) &&
      billingPeriodEnd>Date.now()
    );
  const accessGranted=data.access?.granted!==false;
  const emailVerificationRequired=
    Boolean(data.access?.emailVerificationEnforced) &&
    data.access?.emailVerified===false;

  function updateBilling(nextBilling:any){
    const nextStatus=String(nextBilling?.status||'').toLowerCase();
    const paid=nextStatus==='active'||(
      nextStatus==='cancelled'&&
      nextBilling?.currentPeriodEnd&&
      Date.parse(String(nextBilling.currentPeriodEnd))>Date.now()
    );

    setData({
      ...data,
      billing:nextBilling,
      access:{
        ...(data.access||{}),
        paid,
        granted:Boolean(data.access?.adminBypass)||!Boolean(data.access?.billingEnforced)||paid,
      },
    });
  }

  if(emailVerificationRequired){
    return <EmailVerificationGate
      user={user}
      organization={data.organization}
      onLogout={logout}
    />;
  }

  if(!accessGranted){
    return <SubscriptionGate
      user={user}
      organization={data.organization}
      billing={data.billing}
      onBillingChange={updateBilling}
      onLogout={logout}
    />;
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>DM Sales AI</strong><span>AI Sales Agent</span></div></div>
      <button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button>
      <button
        type="button"
        className={`workspace workspace-link ${view==='billing'?'active':''}`}
        onClick={()=>{setView('billing');setMobileNav(false)}}
        aria-label="Plan und Billing öffnen"
        title="Plan & Billing öffnen"
      >
        <div className="workspace-icon">{workspaceInitial}</div>
        <div className="workspace-copy">
          <strong>{data.organization.name}</strong>
          <span>{String(data.organization.plan||'starter').toUpperCase()} PLAN</span>
        </div>
        <ChevronRight className="workspace-arrow" size={16}/>
      </button>
      <nav>{nav.map(([key,label,Icon]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => {setView(key as View); setMobileNav(false)}}><Icon size={18}/><span>{label}</span>{key==='inbox' && data.conversations.length>0 && <em>{data.conversations.length}</em>}</button>)}</nav>
      <div className="sidebar-bottom">
        <div className="usage"><div className="usage-head"><span>AI Konversationen</span><b>{Number(data.metrics.conversationsThisMonth||0)} / {String(data.organization.plan).toLowerCase()==='pro'?'5.000':'500'}</b></div><div className="usage-bar"><i style={{width:`${Math.min(100,(Number(data.metrics.conversationsThisMonth||0)/(String(data.organization.plan).toLowerCase()==='pro'?5000:500))*100)}%`}}/></div><small>{String(data.organization.plan||'starter').toUpperCase()} · {billingStatus==='cancelled'&&billingActive?`gekündigt · Zugang bis ${new Date(String(data.billing?.currentPeriodEnd)).toLocaleDateString('de-DE')}`:billingActive?'Abo aktiv':'Abo nicht aktiv'}</small></div>
        <div className="user"><div className="avatar dark">{initials}</div><div><strong>{user.name||'Account Owner'}</strong><span>{user.email}</span></div><button className="logout-mini" onClick={logout} title="Abmelden">↗</button></div>
      </div>
    </aside>
    {mobileNav && <div className="overlay" onClick={()=>setMobileNav(false)}/>} 
    <main className="main">
      <header className="topbar"><button className="menu-btn" onClick={()=>setMobileNav(true)}><Menu/></button><div className="top-title"><span>Workspace</span><b>/</b><strong>{labelFor(view)}</strong></div><div className="top-actions"><span className={`account-pill ${billingActive?'active':''}`}><span/> {billingActive?String(data.billing?.plan||data.organization.plan).toUpperCase():'SETUP'}</span><button className="connect-mini" onClick={()=>setView('integrations')}><Instagram size={16}/> Instagram verbinden</button></div></header>
      <div className={view === 'inbox' ? 'content content-inbox' : 'content'}>
        {view === 'dashboard' && <Dashboard data={data} onOpenInbox={()=>setView('inbox')} onConnect={()=>setView('integrations')}/>} 
        {view === 'inbox' && (selected
          ? <Inbox conversations={data.conversations} selected={selected} setSelected={setSelectedId} updateConversation={(conv)=>setData({...data, conversations:data.conversations.map(c=>c.id===conv.id?conv:c)})}/>
          : <EmptyInbox/>)} 
        {view === 'test' && <TestChat agent={data.agent}/>} 
        {view === 'leads' && <Leads conversations={data.conversations} onOpen={(id)=>{setSelectedId(id);setView('inbox')}}/>}
        {view === 'agent' && <Agent initial={data.agent}/>} 
        {view === 'analytics' && <Analytics data={data}/>} 
        {view === 'integrations' && <Integrations instagram={data.instagram}/>} 
        {view === 'billing' && <Billing initial={data.billing} onBillingChange={updateBilling}/>}  
        {view === 'settings' && <SettingsPage user={user} organization={data.organization} onLogout={logout}/>} 
      </div>
    </main>
  </div>;
}

function EmptyInbox(){
  return <div className="empty-workspace panel"><MessageCircle/><h3>Noch keine Gespräche</h3><p>Sobald ein Kanal verbunden ist und die erste Nachricht eingeht, erscheint sie hier in deinem privaten Workspace.</p></div>;
}

function labelFor(v: View){ return nav.find(x=>x[0]===v)?.[1] || 'Dashboard'; }

function PageHead({eyebrow,title,desc,action}:{eyebrow:string,title:string,desc:string,action?:React.ReactNode}){
  return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>{action}</div>
}

function dashboardGreeting(){
  const hour=new Date().getHours();
  if(hour<5)return 'Guten Abend';
  if(hour<12)return 'Guten Morgen';
  if(hour<18)return 'Guten Tag';
  return 'Guten Abend';
}

function Dashboard({data,onOpenInbox,onConnect}:{data:Bootstrap,onOpenInbox:()=>void,onConnect:()=>void}){
  const firstName=String(data.user?.name||'').trim().split(/\s+/)[0]||'';
  const greeting=`${dashboardGreeting()}${firstName?`, ${firstName}`:''} 👋`;

  const total=Number(data.metrics.conversationsTotal||0);
  const painPoints=Number(data.metrics.painPointsKnown||0);
  const qualified=Number(data.metrics.qualifiedLeads||0);
  const hot=Number(data.metrics.hotLeads||0);
  const checkouts=Number(data.metrics.checkoutSent||0);

  const cards = [
    ['Konversationen', total, `${Number(data.metrics.conversationsToday||0)} heute`, MessageCircle],
    ['Painpoints erkannt', painPoints, total?`${Math.round((painPoints/total)*100)}% der Gespräche`:'Noch keine Daten', BrainCircuit],
    ['Qualifizierte Leads', qualified, total?`${Math.round((qualified/total)*100)}% der Gespräche`:'Noch keine Daten', Target],
    ['Hot Leads', hot, total?`${Math.round((hot/total)*100)}% der Gespräche`:'Noch keine Daten', Zap],
  ] as const;

  const funnel = [
    ['Gespräche', total],
    ['Painpoint erkannt', painPoints],
    ['Qualifiziert', qualified],
    ['Hot Leads', hot],
    ['Checkout gesendet', checkouts],
  ] as const;

  const hotConversations=[...data.conversations]
    .filter(c=>c.temperature==='hot')
    .sort((a,b)=>b.score-a.score)
    .slice(0,3);

  function pct(value:number){
    return total>0?Math.min(100,Math.round((value/total)*100)):0;
  }

  return <>
    <PageHead
      eyebrow="ÜBERSICHT"
      title={greeting}
      desc={data.instagram.connected
        ? 'Hier siehst du die echten Daten aus deinem Workspace.'
        : 'Dein Workspace ist bereit. Verbinde Instagram, damit hier echte DM-Daten einlaufen.'}
      action={<button className="primary" onClick={onOpenInbox}><MessageCircle size={17}/> Inbox öffnen</button>}
    />

    {!data.instagram.connected && <div className="connect-banner"><div className="connect-icon"><Instagram/></div><div><b>Instagram noch nicht verbunden</b><p>Verbinde deinen Business- oder Creator-Account, damit der Agent echte DMs empfangen kann.</p></div><button onClick={onConnect}>Jetzt verbinden <ChevronRight size={16}/></button></div>}

    <section className="metrics">
      {cards.map(([label,value,note,Icon])=><div className="metric" key={label}>
        <div className="metric-top"><div className="metric-icon"><Icon size={18}/></div><span className="trend neutral">{note}</span></div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>)}
    </section>

    <div className="dashboard-grid">
      <section className="panel activity-panel">
        <div className="panel-head"><div><b>Sales Activity</b><span>Aktueller Stand deiner Gespräche</span></div></div>
        {total>0
          ? <div className="funnel">
              {funnel.map(([label,value])=>{
                const percent=pct(Number(value));
                return <div key={label} className="funnel-row">
                  <div><span>{label}</span><em>{percent}%</em></div>
                  <div className="bar"><i style={{width:`${percent}%`}}/></div>
                  <b>{value}</b>
                </div>;
              })}
            </div>
          : <div className="dashboard-empty">
              <Activity size={24}/>
              <b>Noch keine Sales-Aktivität</b>
              <span>Sobald echte Instagram-DMs eingehen, baut sich dieser Funnel automatisch aus deinen Workspace-Daten auf.</span>
            </div>
        }
      </section>

      <section className="panel">
        <div className="panel-head"><div><b>Hot Leads</b><span>Höchste aktuelle Kaufwahrscheinlichkeit</span></div><button className="text-btn" onClick={onOpenInbox}>Alle ansehen</button></div>
        {hotConversations.length
          ? <div className="hot-list">{hotConversations.map(c=><button key={c.id} onClick={onOpenInbox}><div className="avatar">{c.avatar}</div><div className="hot-info"><b>{c.name}</b><span>{c.painPoint}</span></div><div className={`score ${c.score>75?'hot':'warm'}`}><b>{c.score}%</b><span>Score</span></div></button>)}</div>
          : <div className="dashboard-empty compact">
              <Target size={22}/>
              <b>Noch keine Hot Leads</b>
              <span>Leads erscheinen hier erst, wenn die AI sie anhand echter Gespräche als hot einstuft.</span>
            </div>
        }
      </section>
    </div>

    <section className="panel agent-status">
      <div className="agent-orb"><Bot/></div>
      <div>
        <b>{data.agent?.active===false?'Sales Agent ist pausiert':'Sales Agent ist aktiv'}</b>
        <p>Strategie: verstehen → Painpoint konkretisieren → qualifizieren → passende Lösung erklären → Einwand behandeln → CTA.</p>
      </div>
      <div className="status-chips">
        <span><ShieldCheck size={14}/> Guardrails aktiv</span>
        <span><Activity size={14}/> Natürliche Antwortpausen</span>
      </div>
    </section>
  </>;
}

function waitMs(ms:number){return new Promise<void>(resolve=>setTimeout(resolve,ms))}
function clientHumanReplyDelayMs(text:string,style?:StyleProfile){
  const chars=Math.max(1,text.trim().length);
  let factor=1;
  const formality=(style?.formality||'').toLowerCase();
  const messageLength=(style?.messageLength||'').toLowerCase();
  const energy=(style?.energy||'').toLowerCase();
  if(messageLength.includes('kurz')) factor*=0.9;
  if(messageLength.includes('lang')||messageLength.includes('ausführ')) factor*=1.08;
  if(formality.includes('locker')) factor*=0.94;
  if(formality.includes('formell')||formality.includes('förmlich')) factor*=1.07;
  if(energy.includes('hoch')||energy.includes('schnell')||energy.includes('energet')) factor*=0.92;
  const base=1800+(chars*62);
  const jitter=0.9+(Math.random()*0.2);
  return Math.max(4200,Math.min(14000,Math.round(base*factor*jitter)));
}

function Inbox({conversations,selected,setSelected,updateConversation}:{conversations:Conversation[],selected:Conversation,setSelected:(id:string)=>void,updateConversation:(c:Conversation)=>void}){
  const [input,setInput]=useState('');
  const [drafting,setDrafting]=useState(false);
  const [mobileChatOpen,setMobileChatOpen]=useState(false);
  const [search,setSearch]=useState('');
  const messagesRef=useRef<HTMLDivElement|null>(null);
  const messages = selected.messages;
  const normalizedSearch=search.trim().toLowerCase();
  const visibleConversations=normalizedSearch
    ? conversations.filter(c =>
        [c.name,c.username,c.lastMessage,c.painPoint]
          .some(value=>String(value||'').toLowerCase().includes(normalizedSearch))
      )
    : conversations;
  useEffect(()=>{const el=messagesRef.current;if(!el)return;requestAnimationFrame(()=>{el.scrollTop=el.scrollHeight})},[selected.id,selected.messages.length,drafting]);
  async function toggleAI(){const mode=selected.aiMode==='active'?'paused':'active'; await fetch(`/api/conversations/${selected.id}/ai-mode`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode})}); updateConversation({...selected,aiMode:mode});}
  async function send(){if(!input.trim())return; const body=input.trim(); setInput(''); const r=await fetch(`/api/conversations/${selected.id}/reply`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:body})}); const j:any=await r.json(); if(!r.ok){setInput(body);return;} updateConversation({...selected,aiMode:'paused',messages:[...selected.messages,{id:j.id||crypto.randomUUID(),from:'human',body,time:'jetzt'}],lastMessage:body});}
  async function draft() {
    const startedAt=Date.now();
    setDrafting(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const r = await fetch('/api/agent/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          stage: selected.stage,
          painPoint: selected.painPoint,
          objection: selected.objection,
          leadMemory: {
            goal: selected.goal,
            painPoint: selected.painPoint,
            experience: selected.experience,
            budget: selected.budget,
            objection: selected.objection,
            summary: selected.summary || '',
            knownFacts: selected.knownFacts || '',
            openQuestions: selected.openQuestions || '',
            nextStep: selected.nextStep || '',
          },
          styleProfile: selected.styleProfile || {},
          history: selected.messages.slice(-10).map((message) => ({
            from: message.from,
            body: message.body,
            time: message.time,
          })),
        }),
      });

      const j: any = await r.json();

      if (!r.ok) {
        setInput(`KI-Fehler: ${j.error || 'Antwort konnte nicht erzeugt werden.'}`);
        return;
      }

      const draftText=j.draft || 'Keine Antwort erhalten.';
      const targetDelay=clientHumanReplyDelayMs(draftText,j.analysis?.styleProfile || selected.styleProfile);
      const remaining=Math.max(0,targetDelay-(Date.now()-startedAt));
      if(remaining>0) await waitMs(remaining);

      setInput(draftText);

      if (j.analysis) {
        updateConversation({
          ...selected,
          stage: j.analysis.stage || selected.stage,
          temperature: j.analysis.temperature || selected.temperature,
          score: typeof j.analysis.score === 'number' ? j.analysis.score : selected.score,
          goal: j.analysis.goal || selected.goal,
          painPoint: j.analysis.painPoint || selected.painPoint,
          experience: j.analysis.experience || selected.experience,
          budget: j.analysis.budget || selected.budget,
          objection: j.analysis.objection || selected.objection,
          summary: j.analysis.summary || selected.summary,
          knownFacts: j.analysis.knownFacts || selected.knownFacts,
          openQuestions: j.analysis.openQuestions || selected.openQuestions,
          nextStep: j.analysis.nextStep || selected.nextStep,
          styleProfile: j.analysis.styleProfile || selected.styleProfile,
        });
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setInput('KI-Anfrage hat zu lange gedauert. Bitte erneut versuchen.');
      } else {
        setInput('KI-Verbindung fehlgeschlagen. Bitte erneut versuchen.');
      }
    } finally {
      clearTimeout(timeout);
      setDrafting(false);
    }
  }
  return <div className={`inbox-wrap ${mobileChatOpen ? 'mobile-chat-open' : 'mobile-list-open'}`}>
    <section className="conversation-list">
      <div className="inbox-title"><div><span className="eyebrow">INBOX</span><h2>Konversationen</h2></div><span className="conversation-count">{conversations.length}</span></div>
      <div className="search"><Search size={16}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, @username oder Inhalt suchen"/></div>
      <div className="conv-items">
        {visibleConversations.length
          ? visibleConversations.map(c=><button className={selected.id===c.id?'selected':''} key={c.id} onClick={()=>{setSelected(c.id);setMobileChatOpen(true)}}><div className="avatar">{c.avatar}<i className={c.aiMode==='active'?'online':'paused'}/></div><div className="conv-copy"><div><b>{c.name}</b><time>{c.time}</time></div><span>{c.lastMessage}</span><div className="conv-meta"><em className={`temp ${c.temperature}`}>{c.temperature==='hot'?'🔥 HOT':c.temperature==='warm'?'WARM':'COLD'}</em><em>{stageLabel[c.stage]||c.stage}</em></div></div></button>)
          : <div className="list-empty"><Search size={18}/><b>Keine Treffer</b><span>Versuche einen anderen Suchbegriff.</span></div>}
      </div>
    </section>
    <section className="chat"><div className="chat-head"><button className="mobile-chat-back" onClick={()=>setMobileChatOpen(false)} aria-label="Zurück zu Konversationen"><ArrowLeft size={20}/></button><div className="avatar">{selected.avatar}</div><div><b>{selected.name}</b><span>{selected.username} · <i className={selected.aiMode==='active'?'green-dot':''}/> AI {selected.aiMode==='active'?'aktiv':'pausiert'}</span></div><div className="chat-actions"><button className={selected.aiMode==='active'?'pause':'play'} onClick={toggleAI}>{selected.aiMode==='active'?<Pause size={15}/>:<Play size={15}/>}<span>{selected.aiMode==='active'?'AI pausieren':'AI übernehmen lassen'}</span></button></div></div>
      <div className="stage-line"><span>Sales Stage</span><div>{['discovery','painpoint','goal','qualification','solution','objection','close'].map(s=><i key={s} className={s===selected.stage?'current':stageRank(s)<stageRank(selected.stage)?'done':''}>{s===selected.stage?<Zap size={11}/>:null}{stageLabel[s]}</i>)}</div></div>
      <div className="messages" ref={messagesRef}>
        {messages.length
          ? messages.map(m=><div key={m.id} className={`message-row ${m.from}`}><div className="bubble"><span className="speaker">{m.from==='lead'?selected.name:m.from==='ai'?'AI Agent':'Du'}</span>{m.body}{' '}<time>{m.time}</time></div></div>)
          : <div className="chat-empty"><MessageCircle size={22}/><b>Noch keine Nachrichten</b><span>Sobald Nachrichten in dieser Unterhaltung gespeichert sind, erscheinen sie hier.</span></div>}
        {drafting&&<div className="message-row ai typing-row"><div className="bubble typing-bubble"><span className="speaker">AI Agent</span><div className="typing-line"><span>Schreibt</span><span className="typing-dots"><i/><i/><i/></span></div></div></div>}
      </div>
      <div className="composer"><button className="ai-draft" onClick={draft} disabled={drafting}><Sparkles size={16}/>{drafting?'Antwort wird vorbereitet…':'AI Vorschlag'}</button><div className="compose-row"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Nachricht schreiben…" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}/><button onClick={send}><Send size={18}/></button></div><small>Wenn du selbst antwortest, empfehlen wir den AI Agent für diese Unterhaltung zu pausieren.</small></div>
    </section>
    <aside className="lead-card"><div className="lead-head"><span className="eyebrow">LEAD INTELLIGENCE</span><div className="score-ring" style={{background:`conic-gradient(#6d5dfc 0 ${Math.max(0,Math.min(100,selected.score))}%,#edf0f4 ${Math.max(0,Math.min(100,selected.score))}% 100%)`}}><strong>{selected.score}%</strong><span>Kaufsignal</span></div><h3>{selected.name}</h3><p>{selected.username}</p></div><div className="lead-section"><label>Aktueller Stage</label><span className="stage-pill"><Zap size={13}/>{stageLabel[selected.stage]}</span></div>{[['Ziel',selected.goal,Target],['Painpoint',selected.painPoint,BrainCircuit],['Erfahrung',selected.experience,Activity],['Budget',selected.budget,CircleDollarSign],['Einwand',selected.objection,ShieldCheck]].map(([l,v,I]:any)=><div className="intel" key={l}><I size={16}/><div><label>{l}</label><p>{v}</p></div></div>)}<div className="intel"><MessageCircle size={16}/><div><label>Sprachstil</label><p>{[selected.styleProfile?.language, selected.styleProfile?.address, selected.styleProfile?.formality, selected.styleProfile?.emojiUsage].filter(Boolean).join(' · ') || 'Wird aus den Lead-Nachrichten erkannt'}</p></div></div><div className="lead-note"><Sparkles size={15}/><p><b>Nächster sinnvoller Schritt:</b> {selected.nextStep || 'Weiter natürlich qualifizieren und nichts erneut fragen, was bereits geklärt wurde.'}</p></div></aside>
  </div>
}
function stageRank(s:string){return ['discovery','painpoint','goal','qualification','solution','objection','close'].indexOf(s)}


function TestChat({agent}:{agent:Record<string,any>}){
  const [messages,setMessages]=useState<Message[]>([]);
  const [input,setInput]=useState('');
  const [thinking,setThinking]=useState(false);
  const [error,setError]=useState('');
  const messagesRef=useRef<HTMLDivElement|null>(null);
  const [leadState,setLeadState]=useState<{
    stage:string;temperature:string;score:number;goal:string;painPoint:string;experience:string;budget:string;objection:string;
    summary:string;knownFacts:string;openQuestions:string;nextStep:string;styleProfile:StyleProfile;
  }>({
    stage:'discovery',temperature:'cold',score:0,goal:'Unklar',painPoint:'Unklar',experience:'Unklar',budget:'Unklar',objection:'Unklar',
    summary:'',knownFacts:'',openQuestions:'',nextStep:'Situation natürlich verstehen',styleProfile:{}
  });

  useEffect(()=>{
    const el=messagesRef.current;
    if(!el)return;
    requestAnimationFrame(()=>{el.scrollTop=el.scrollHeight});
  },[messages.length,thinking]);

  function resetTest(){
    setMessages([]);
    setInput('');
    setThinking(false);
    setError('');
    setLeadState({
      stage:'discovery',temperature:'cold',score:0,goal:'Unklar',painPoint:'Unklar',experience:'Unklar',budget:'Unklar',objection:'Unklar',
      summary:'',knownFacts:'',openQuestions:'',nextStep:'Situation natürlich verstehen',styleProfile:{}
    });
  }

  async function sendLead(){
    const body=input.trim();
    if(!body||thinking)return;

    const leadMessage:Message={id:crypto.randomUUID(),from:'lead',body,time:'jetzt'};
    const nextMessages=[...messages,leadMessage];

    setInput('');
    setError('');
    setMessages(nextMessages);
    setThinking(true);

    const startedAt=Date.now();
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),30000);

    try{
      const response=await fetch('/api/ai/test',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        signal:controller.signal,
        body:JSON.stringify({
          message:body,
          stage:leadState.stage,
          painPoint:leadState.painPoint,
          objection:leadState.objection,
          leadMemory:{
            goal:leadState.goal,
            painPoint:leadState.painPoint,
            experience:leadState.experience,
            budget:leadState.budget,
            objection:leadState.objection,
            summary:leadState.summary,
            knownFacts:leadState.knownFacts,
            openQuestions:leadState.openQuestions,
            nextStep:leadState.nextStep,
          },
          styleProfile:leadState.styleProfile,
          history:nextMessages.slice(-10).map(message=>({
            from:message.from,
            body:message.body,
            time:message.time,
          })),
        }),
      });

      const j:any=await response.json();

      if(!response.ok){
        setError(j.error||'Die KI konnte gerade nicht antworten.');
        return;
      }

      const styleProfile:StyleProfile={
        language:j.style_language,
        address:j.style_address,
        formality:j.style_formality,
        sentenceLength:j.style_sentence_length,
        messageLength:j.style_message_length,
        emojiUsage:j.style_emoji_usage,
        slang:j.style_slang,
        energy:j.style_energy,
        directness:j.style_directness,
        humor:j.style_humor,
        punctuation:j.style_punctuation,
        notes:j.style_notes,
      };

      setLeadState({
        stage:j.stage||leadState.stage,
        temperature:j.temperature||leadState.temperature,
        score:typeof j.score==='number'?j.score:leadState.score,
        goal:j.goal||leadState.goal,
        painPoint:j.pain_point||leadState.painPoint,
        experience:j.experience||leadState.experience,
        budget:j.budget||leadState.budget,
        objection:j.objection||leadState.objection,
        summary:j.summary||leadState.summary,
        knownFacts:j.known_facts||leadState.knownFacts,
        openQuestions:j.open_questions||leadState.openQuestions,
        nextStep:j.next_step||leadState.nextStep,
        styleProfile,
      });

      const reply=String(j.reply||'').trim();
      if(!reply){
        setError('Die KI hat keine Antwort zurückgegeben.');
        return;
      }

      const targetDelay=clientHumanReplyDelayMs(reply,styleProfile);
      const remaining=Math.max(0,targetDelay-(Date.now()-startedAt));
      if(remaining>0)await waitMs(remaining);

      setMessages(current=>[
        ...current,
        {id:crypto.randomUUID(),from:'ai',body:reply,time:'jetzt'}
      ]);
    }catch(err:any){
      setError(err?.name==='AbortError'?'Die KI braucht gerade zu lange. Bitte nochmal versuchen.':'Verbindung zur KI fehlgeschlagen.');
    }finally{
      clearTimeout(timeout);
      setThinking(false);
    }
  }

  const styleLine=[
    leadState.styleProfile.language,
    leadState.styleProfile.address,
    leadState.styleProfile.formality,
    leadState.styleProfile.messageLength,
    leadState.styleProfile.emojiUsage
  ].filter(Boolean).join(' · ');

  return <>
    <PageHead
      eyebrow="TEST LAB"
      title="Sales-Agent live testen"
      desc="Du spielst den Lead. Die KI übernimmt automatisch die Verkäuferrolle und aktualisiert Memory, Sprachstil, Stage und Kaufsignal bei jeder Nachricht."
      action={<button className="secondary" onClick={resetTest}><X size={16}/> Test zurücksetzen</button>}
    />

    <div className="test-chat-layout">
      <section className="panel test-chat-panel">
        <div className="test-chat-head">
          <div className="agent-orb"><Bot size={18}/></div>
          <div>
            <b>Live Test-Conversation</b>
            <span>Du = Lead · AI = Verkäufer</span>
          </div>
          <div className="test-offer"><span>Aktives Angebot</span><b>{agent.offerName||'Dein Hauptangebot'}</b></div>
        </div>

        <div className="test-messages messages" ref={messagesRef}>
          {messages.length===0&&<div className="test-empty">
            <div className="test-empty-icon"><MessageCircle size={22}/></div>
            <b>Starte wie ein echter Interessent.</b>
            <p>Zum Beispiel: „Hey, ich hab dein Reel gesehen. Wie funktioniert das?“</p>
          </div>}

          {messages.map(message=>
            <div key={message.id} className={`message-row ${message.from}`}>
              <div className="bubble">
                <span className="speaker">{message.from==='lead'?'Du als Lead':'AI Verkäufer'}</span>
                {message.body}{' '}
                <time>{message.time}</time>
              </div>
            </div>
          )}

          {thinking&&<div className="message-row ai typing-row">
            <div className="bubble typing-bubble">
              <span className="speaker">AI Verkäufer</span>
              <div className="typing-line"><span>Schreibt</span><span className="typing-dots"><i/><i/><i/></span></div>
            </div>
          </div>}
        </div>

        <div className="test-composer">
          {error&&<div className="test-error">{error}</div>}
          <div className="test-compose-row">
            <textarea
              value={input}
              disabled={thinking}
              onChange={e=>setInput(e.target.value)}
              placeholder="Schreib hier als Lead…"
              onKeyDown={e=>{
                if(e.key==='Enter'&&!e.shiftKey){
                  e.preventDefault();
                  sendLead();
                }
              }}
            />
            <button className="primary" onClick={sendLead} disabled={thinking||!input.trim()}>
              <Send size={17}/>
              <span>{thinking?'AI antwortet…':'Als Lead senden'}</span>
            </button>
          </div>
          <small>Teste hier, wie dein AI Sales Agent auf echte Lead-Nachrichten reagieren würde.</small>
        </div>
      </section>

      <aside className="panel test-intelligence">
        <div className="test-intel-head">
          <span className="eyebrow">LIVE LEAD INTELLIGENCE</span>
          <div className={`test-temp ${leadState.temperature}`}>{leadState.temperature==='hot'?'🔥 HOT':leadState.temperature==='warm'?'WARM':'COLD'}</div>
          <div className="test-score"><strong>{leadState.score}%</strong><span>Kaufsignal</span></div>
        </div>

        <div className="test-intel-row"><label>Stage</label><span className="stage-pill"><Zap size={13}/>{stageLabel[leadState.stage]||leadState.stage}</span></div>
        <div className="test-intel-row"><label>Ziel</label><p>{leadState.goal}</p></div>
        <div className="test-intel-row"><label>Painpoint</label><p>{leadState.painPoint}</p></div>
        <div className="test-intel-row"><label>Erfahrung</label><p>{leadState.experience}</p></div>
        <div className="test-intel-row"><label>Budget</label><p>{leadState.budget}</p></div>
        <div className="test-intel-row"><label>Einwand</label><p>{leadState.objection}</p></div>
        <div className="test-intel-row"><label>Sprachstil</label><p>{styleLine||'Wird aus deinen Nachrichten erkannt'}</p></div>
        <div className="test-intel-row"><label>Memory</label><p className="preline">{leadState.knownFacts||'Noch keine belastbaren Fakten gespeichert.'}</p></div>
        <div className="test-intel-row"><label>Noch offen</label><p className="preline">{leadState.openQuestions||'Noch keine offenen Punkte erkannt.'}</p></div>
        <div className="test-next-step"><Sparkles size={16}/><div><b>Nächster sinnvoller Schritt</b><p>{leadState.nextStep}</p></div></div>
      </aside>
    </div>
  </>
}

function Leads({conversations,onOpen}:{conversations:Conversation[],onOpen:(id:string)=>void}){
 return <>
   <PageHead eyebrow="CRM" title="Leads" desc="Kontakte werden aus echten Gesprächen qualifiziert, zusammengefasst und nach Kaufsignal priorisiert."/>
   {conversations.length
     ? <div className="panel table-panel"><table><thead><tr><th>Lead</th><th>Stage</th><th>Painpoint</th><th>Score</th><th>AI</th><th/></tr></thead><tbody>{conversations.map(c=><tr key={c.id}><td><div className="person"><div className="avatar">{c.avatar}</div><div><b>{c.name}</b><span>{c.username}</span></div></div></td><td><span className="stage-pill">{stageLabel[c.stage]||c.stage}</span></td><td>{c.painPoint}</td><td><div className="score-cell"><div className="mini-score"><i style={{width:`${Math.max(0,Math.min(100,c.score))}%`}}/></div><b>{c.score}%</b></div></td><td><span className={`ai-state ${c.aiMode}`}>{c.aiMode==='active'?'Aktiv':'Pausiert'}</span></td><td><button className="text-btn" onClick={()=>onOpen(c.id)}>Öffnen →</button></td></tr>)}</tbody></table></div>
     : <div className="panel empty-workspace"><Users/><h3>Noch keine Leads</h3><p>Sobald echte Instagram-Gespräche eingehen, erscheinen qualifizierte Kontakte hier automatisch.</p></div>}
 </>
}

const agentFieldHelp = {
  offerName: {
    info: 'Der Name des Angebots, das dein AI Agent in DMs erklären und verkaufen darf.',
    example: 'RCC Complete Creator Bundle',
  },
  audience: {
    info: 'Beschreibe möglichst konkret, für wen dein Angebot gedacht ist. Das hilft der KI dabei, den Fit eines Leads besser einzuschätzen.',
    example: 'Anfänger, die sich ein digitales Online-Business aufbauen möchten.',
  },
  productKnowledge: {
    info: 'Hier stehen die verbindlichen Produktfakten. Bei konkreten Produktfragen darf die KI nur Informationen verwenden, die hier oder in den anderen Angebotsfeldern hinterlegt sind.',
    example: 'Enthaltene Module, Ablauf, Leistungen, Voraussetzungen, Besonderheiten und wichtige Grenzen des Angebots.',
  },
  painPoints: {
    info: 'Typische Probleme, Unsicherheiten oder Situationen deiner Zielgruppe. Die KI nutzt sie zur Einordnung – nicht um Druck aufzubauen.',
    example: 'Kein klarer Startpunkt\nTechnik-Überforderung\nFehlende Strategie',
  },
  outcomes: {
    info: 'Welche realistischen Ergebnisse oder Veränderungen soll dein Angebot ermöglichen? Keine Garantien eintragen.',
    example: 'Klarer Startweg\nEigenes digitales Angebot entwickeln\nVerkaufsprozess verstehen',
  },
  objections: {
    info: 'Häufige Einwände, Fragen oder Bedenken, die Interessenten vor dem Kauf äußern.',
    example: 'Zu teuer\nKeine Zeit\nZu technisch\nAngst vor einer Fehlinvestition',
  },
  tone: {
    info: 'Definiert den grundsätzlichen Ton deiner Antworten. Der Agent passt sich zusätzlich dem Schreibstil des Leads an.',
    example: 'Locker, direkt, freundlich, kurze Nachrichten, kein unnötiger Druck.',
  },
  voiceExamples: {
    info: 'Füge echte Beispielnachrichten ein, die so klingen, wie du selbst in Instagram-DMs schreiben würdest. Die KI übernimmt daraus Stil und Rhythmus – keine Produktfakten.',
    example: 'Lead: „Ich bin noch ganz am Anfang.“\nAntwort: „Okay. Hast du online schon irgendwas ausprobiert oder wirklich noch gar nichts?“',
  },
  salesRules: {
    info: 'Eigene Regeln für deinen Verkaufsprozess. Damit bestimmst du, wie der Agent Gespräche führen soll.',
    example: 'Direkte Produktfragen immer zuerst beantworten. Nicht nach jeder Nachricht eine Frage stellen.',
  },
  guardrails: {
    info: 'Klare Grenzen, die dein Agent niemals überschreiten darf.',
    example: 'Keine Garantien. Keine erfundenen Leistungen. Keine künstliche Verknappung. Kein aggressiver Verkaufsdruck.',
  },
  price: {
    info: 'Der reguläre Hauptpreis deines Angebots.',
    example: '1.197 € einmalig',
  },
  paymentPlan: {
    info: 'Alternative Preis- oder Ratenoptionen. Nur eintragen, was tatsächlich angeboten wird.',
    example: 'oder 12 × 119 €.',
  },
  paymentMethods: {
    info: 'Zahlungsarten, die für dieses Angebot verfügbar sein können.',
    example: 'Klarna\nPayPal\nKreditkarte',
  },
  paymentHint: {
    info: 'Ein zusätzlicher Hinweis, den die KI bei passenden Zahlungsfragen verwenden darf.',
    example: 'Über Klarna können dir – je nach persönlicher Klarna-Auswahl – auch niedrigere Monatsraten angezeigt werden. :)',
  },
  showPaymentHintWithPrice: {
    info: 'Wenn aktiviert, wird dein Zahlungshinweis bereits bei einer allgemeinen Preisfrage direkt mitgenannt.',
    example: 'Lead: „Was kostet das?“ → Preis + Raten + hinterlegter Klarna-Hinweis.',
  },
  checkoutCta: {
    info: 'Der kurze Text direkt vor dem Checkout-Link, wenn ein Lead klar starten oder kaufen möchte.',
    example: 'Klar, hier kannst du direkt starten:',
  },
  checkoutUrl: {
    info: 'Der direkte Link zum Checkout deines Angebots. Bei klarer Kaufabsicht kann der Agent diesen Link senden.',
    example: 'https://deine-domain.de/checkout',
  },
  bookingUrl: {
    info: 'Optionaler Link zu einem Gespräch oder Termin. Leer lassen, wenn dein Funnel keinen Termin benötigt.',
    example: 'https://deine-domain.de/termin',
  },
} as const;

function FieldInfo({label,info,example}:{label:string,info:string,example:string}){
  return <span
    className="field-info-wrap"
    tabIndex={0}
    role="button"
    aria-label={`Info zu ${label}`}
    onClick={(e)=>e.preventDefault()}
    onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();}}}
  >
    <span className="field-info-icon"><Info size={12}/></span>
    <span className="field-info-popover" role="tooltip">
      <b>{label}</b>
      <span>{info}</span>
      <em><strong>Beispiel:</strong> {example}</em>
    </span>
  </span>
}

function FieldLabel({label,help}:{label:string,help:{info:string,example:string}}){
  return <div className="field-label-row">
    <span className="field-label-text">{label}</span>
    <FieldInfo label={label} info={help.info} example={help.example}/>
  </div>
}

function Agent({initial}:{initial:Record<string,any>}){
 const [form,setForm]=useState(initial); const [saved,setSaved]=useState(false); const change=(k:string,v:any)=>setForm({...form,[k]:v});
 async function save(){await fetch('/api/agent/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});setSaved(true);setTimeout(()=>setSaved(false),1800)}
 return <><PageHead eyebrow="AI SALES BRAIN" title="Dein Sales Agent" desc="Hier bekommt die KI alles, was sie braucht, um natürlich zu qualifizieren und passend zu verkaufen." action={<button className="primary" onClick={save}>{saved?<Check size={17}/>:<Sparkles size={17}/>} {saved?'Gespeichert':'Agent speichern'}</button>}/><div className="agent-layout"><div className="panel form-panel">

 <div className="form-section"><div className="section-num">01</div><div><h3>Angebot</h3><p>Was darf dein Agent verkaufen?</p></div></div>
 <div className="form-grid">
   <Field label="Angebotsname" help={agentFieldHelp.offerName} value={form.offerName} onChange={(v)=>change('offerName',v)}/>
   <Field wide label="Zielgruppe" help={agentFieldHelp.audience} value={form.audience} onChange={(v)=>change('audience',v)}/>
 </div>

 <div className="form-section split"><div className="section-num">02</div><div><h3>Produktwissen / Knowledge Base</h3><p>Hier hinterlegt jeder Kunde die verbindlichen Fakten zu seinem eigenen Angebot.</p></div></div>
 <div className="form-grid">
   <Area wide label="Produktwissen" help={agentFieldHelp.productKnowledge} value={form.productKnowledge} onChange={(v)=>change('productKnowledge',v)}/>
 </div>

 <div className="form-section split"><div className="section-num">03</div><div><h3>Sales Wissen</h3><p>Damit der Agent nicht generisch antwortet.</p></div></div>
 <div className="form-grid">
   <Area label="Typische Painpoints" help={agentFieldHelp.painPoints} value={form.painPoints} onChange={(v)=>change('painPoints',v)}/>
   <Area label="Gewünschte Ergebnisse" help={agentFieldHelp.outcomes} value={form.outcomes} onChange={(v)=>change('outcomes',v)}/>
   <Area label="Einwände" help={agentFieldHelp.objections} value={form.objections} onChange={(v)=>change('objections',v)}/>
   <Area label="Tonalität" help={agentFieldHelp.tone} value={form.tone} onChange={(v)=>change('tone',v)}/>
 </div>

 <div className="form-section split"><div className="section-num">04</div><div><h3>Persönlichkeit & Gesprächsstil</h3><p>Je echter die Beispiele, desto näher schreibt die KI wie der Account-Inhaber.</p></div></div>
 <div className="form-grid">
   <Area wide label="Echte Nachrichten-Beispiele" help={agentFieldHelp.voiceExamples} value={form.voiceExamples} onChange={(v)=>change('voiceExamples',v)}/>
   <Area label="Zusätzliche Sales-Regeln" help={agentFieldHelp.salesRules} value={form.salesRules} onChange={(v)=>change('salesRules',v)}/>
   <Area label="Zusätzliche Guardrails" help={agentFieldHelp.guardrails} value={form.guardrails} onChange={(v)=>change('guardrails',v)}/>
 </div>

 <div className="form-section split"><div className="section-num">05</div><div><h3>Zahlung & Checkout</h3><p>Alle Zahlungsinformationen gehören zum jeweiligen Angebot und sind frei konfigurierbar.</p></div></div>
 <div className="form-grid">
   <Field label="Preis" help={agentFieldHelp.price} value={form.price} onChange={(v)=>change('price',v)}/>
   <Field label="Raten / Preisoptionen" help={agentFieldHelp.paymentPlan} value={form.paymentPlan} onChange={(v)=>change('paymentPlan',v)}/>
   <Area label="Zahlungsarten" help={agentFieldHelp.paymentMethods} value={form.paymentMethods} onChange={(v)=>change('paymentMethods',v)}/>
   <Area label="Zahlungshinweis" help={agentFieldHelp.paymentHint} value={form.paymentHint} onChange={(v)=>change('paymentHint',v)}/>
   <div className="field-wrap wide checkbox-field">
     <FieldLabel label="Zahlungshinweis bei Preisfrage direkt mitsenden" help={agentFieldHelp.showPaymentHintWithPrice}/>
     <label className="checkbox-control">
       <input type="checkbox" checked={Boolean(form.showPaymentHintWithPrice)} onChange={e=>change('showPaymentHintWithPrice',e.target.checked)}/>
       <span>{form.showPaymentHintWithPrice?'Aktiviert':'Deaktiviert'}</span>
     </label>
   </div>
   <Field wide label="Checkout CTA" help={agentFieldHelp.checkoutCta} value={form.checkoutCta} onChange={(v)=>change('checkoutCta',v)}/>
 </div>

 <div className="form-section split"><div className="section-num">06</div><div><h3>Conversion</h3><p>Wohin soll ein qualifizierter Lead geführt werden?</p></div></div>
 <div className="form-grid">
   <Field label="Checkout URL" help={agentFieldHelp.checkoutUrl} value={form.checkoutUrl} onChange={(v)=>change('checkoutUrl',v)}/>
   <Field label="Termin URL" help={agentFieldHelp.bookingUrl} value={form.bookingUrl} onChange={(v)=>change('bookingUrl',v)}/>
 </div>

 </div><aside className="agent-preview"><div className="agent-orb large"><BrainCircuit/></div><span className="eyebrow">VERHALTEN</span><h3>Sales-Logik</h3><p>Der Agent versteht zuerst den aktuellen Gesprächszug, plant die passende Reaktion und schreibt erst danach die sichtbare DM.</p>{['Situation verstehen','Painpoint konkretisieren','Ziel erkennen','Qualifizieren','Passende Lösung erklären','Einwand behandeln','CTA auslösen'].map((x,i)=><div className="logic" key={x}><i>{i+1}</i><span>{x}</span>{i<6&&<div/>}</div>)}<div className="guardrail"><ShieldCheck/><div><b>Guardrails</b><span>Produktfragen nur aus Knowledge Base · keine erfundenen Fakten · kein Spam · kein unnötiger Druck · Human Takeover respektieren</span></div></div></aside></div></>
}

function Field({label,value,onChange,wide,help}:{label:string,value:string,onChange:(v:string)=>void,wide?:boolean,help:{info:string,example:string}}){
 return <div className={`field-wrap ${wide?'wide':''}`}>
   <FieldLabel label={label} help={help}/>
   <input value={value||''} onChange={e=>onChange(e.target.value)}/>
 </div>
}

function Area({label,value,onChange,wide,help}:{label:string,value:string,onChange:(v:string)=>void,wide?:boolean,help:{info:string,example:string}}){
 return <div className={`field-wrap ${wide?'wide':''}`}>
   <FieldLabel label={label} help={help}/>
   <textarea value={value||''} onChange={e=>onChange(e.target.value)}/>
 </div>
}

function Analytics({data}:{data:Bootstrap}){
  const total=Number(data.metrics.conversationsTotal||0);
  const pain=Number(data.metrics.painPointsKnown||0);
  const qualified=Number(data.metrics.qualifiedLeads||0);
  const hot=Number(data.metrics.hotLeads||0);
  const checkout=Number(data.metrics.checkoutSent||0);
  const avgScore=data.conversations.length
    ? Math.round(data.conversations.reduce((sum,c)=>sum+Number(c.score||0),0)/data.conversations.length)
    : 0;
  const aiActive=data.conversations.length
    ? Math.round((data.conversations.filter(c=>c.aiMode==='active').length/data.conversations.length)*100)
    : 0;
  const funnel=[
    ['Gespräche',total],
    ['Painpoint erkannt',pain],
    ['Qualifiziert',qualified],
    ['Hot Lead',hot],
    ['Checkout gesendet',checkout],
  ] as const;
  const pct=(value:number)=>total?Math.min(100,Math.round((value/total)*100)):0;

  return <>
    <PageHead eyebrow="PERFORMANCE" title="Analytics" desc="Echte Kennzahlen aus deinem aktuellen Workspace – ohne Hochrechnungen oder Beispieldaten."/>
    <section className="metrics">
      {[
        ['Gespräche',String(total)],
        ['Ø Lead Score',`${avgScore}%`],
        ['AI aktiv',`${aiActive}%`],
        ['Checkouts gesendet',String(checkout)],
      ].map(([a,b])=><div className="metric" key={a}><strong>{b}</strong><span>{a}</span></div>)}
    </section>
    <div className="panel chart-panel">
      <div className="panel-head"><div><b>Sales Funnel</b><span>Aktueller Workspace</span></div></div>
      {total
        ? <div className="big-bars">{funnel.map(([label,value])=><div key={label}><span>{label}</span><div><i style={{width:`${pct(Number(value))}%`}}/></div><b>{value}</b></div>)}</div>
        : <div className="dashboard-empty"><BarChart3 size={24}/><b>Noch keine Analytics-Daten</b><span>Sobald echte Gespräche eingehen, wird der Funnel automatisch aufgebaut.</span></div>}
    </div>
  </>
}

function Integrations({instagram}:{instagram:Bootstrap['instagram'] & {ready?:boolean}}){
  const [msg,setMsg]=useState('');
  const [busy,setBusy]=useState(false);

  async function connect(){
    setBusy(true);
    setMsg('');
    try{
      const r=await fetch('/api/meta/oauth/start',{method:'POST'});
      const j:any=await r.json();
      if(j.url){window.location.href=j.url;return;}
      setMsg(j.error||'Instagram-Verbindung konnte nicht gestartet werden.');
    }catch{
      setMsg('Instagram-Verbindung konnte nicht gestartet werden.');
    }finally{
      setBusy(false);
    }
  }

  return <>
    <PageHead eyebrow="INTEGRATIONEN" title="Instagram verbinden" desc="Verbinde deinen professionellen Instagram-Account mit DM Sales AI."/>
    <div className="integration-card">
      <div className="instagram-logo"><Instagram/></div>
      <div className="integration-info">
        <div><h3>Instagram</h3></div>
        <p>Empfange Instagram-DMs und beantworte Gespräche direkt mit deinem AI Sales Agent oder selbst.</p>
        <div className="feature-chips"><span><Check/> DMs</span><span><Check/> AI Antworten</span><span><Check/> Eigene Antworten</span></div>
      </div>
      <div className="integration-action">
        <span className={instagram.connected?'connected':'disconnected'}>{instagram.connected?`Verbunden${instagram.username?` · ${instagram.username}`:''}`:'Nicht verbunden'}</span>
        <button className="primary" onClick={connect} disabled={busy||instagram.ready===false}>
          <Instagram size={17}/> {busy?'Verbindung startet…':instagram.connected?'Neu verbinden':'Instagram verbinden'}
        </button>
      </div>
    </div>
    {instagram.ready===false&&<div className="notice warning-notice"><Instagram/><div><b>Instagram-Verbindung derzeit nicht verfügbar</b><p>Diese Funktion wird gerade freigeschaltet. Bitte versuche es später erneut.</p></div></div>}
    {msg&&<div className="notice"><ShieldCheck/><div><b>Instagram</b><p>{msg}</p></div></div>}
  </>
}


function EmailVerificationGate({
  user,
  organization,
  onLogout,
}:{
  user:any,
  organization:any,
  onLogout:()=>void,
}){
  const [sending,setSending]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');

  async function resend(){
    setSending(true);
    setMessage('');
    setError('');
    try{
      const r=await fetch('/api/auth/resend-verification',{method:'POST'});
      const j:any=await r.json();
      if(!r.ok){
        setError(j.error||'E-Mail konnte nicht gesendet werden.');
        return;
      }
      setMessage(j.alreadyVerified
        ? 'Deine E-Mail-Adresse ist bereits bestätigt. Lade die Seite neu.'
        : 'Bestätigungs-E-Mail wurde erneut gesendet.');
    }catch{
      setError('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    }finally{
      setSending(false);
    }
  }

  return <div className="verification-gate-page">
    <header className="subscription-gate-top">
      <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>DM Sales AI</strong><span>{organization.name}</span></div></div>
      <div className="subscription-account">
        <div><b>{user.name}</b><span>{user.email}</span></div>
        <button className="secondary" onClick={onLogout}>Abmelden</button>
      </div>
    </header>

    <main className="verification-gate-main">
      <div className="verification-card">
        <div className="verification-icon"><ShieldCheck size={26}/></div>
        <span className="eyebrow">E-MAIL BESTÄTIGEN</span>
        <h1>Fast geschafft.</h1>
        <p>Wir haben einen Bestätigungslink an <b>{user.email}</b> gesendet. Öffne die E-Mail und bestätige deine Adresse. Danach kannst du mit deinem Workspace weitermachen.</p>

        {message&&<div className="auth-success">{message}</div>}
        {error&&<div className="auth-error">{error}</div>}

        <div className="verification-actions">
          <button className="primary" onClick={()=>window.location.reload()}>Status prüfen</button>
          <button className="secondary" onClick={resend} disabled={sending}>{sending?'Wird gesendet…':'E-Mail erneut senden'}</button>
        </div>
        <small>Der Bestätigungslink ist 24 Stunden gültig.</small>
      </div>
    </main>
  </div>;
}

function SubscriptionGate({
  user,
  organization,
  billing,
  onBillingChange,
  onLogout,
}:{
  user:any,
  organization:any,
  billing?:Bootstrap['billing'],
  onBillingChange:(billing:any)=>void,
  onLogout:()=>void,
}){
  return <div className="subscription-gate-page">
    <header className="subscription-gate-top">
      <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>DM Sales AI</strong><span>{organization.name}</span></div></div>
      <div className="subscription-account">
        <div><b>{user.name}</b><span>{user.email}</span></div>
        <button className="secondary" onClick={onLogout}>Abmelden</button>
      </div>
    </header>

    <main className="subscription-gate-main">
      <div className="subscription-gate-intro">
        <span className="eyebrow">WORKSPACE AKTIVIEREN</span>
        <h1>Wähle deinen Plan.</h1>
        <p>Dein Account ist erstellt. Sobald dein PayPal-Abo aktiv ist, wird dein privater Workspace automatisch freigeschaltet.</p>
      </div>
      <Billing initial={billing} onBillingChange={onBillingChange}/>
    </main>
  </div>;
}

function Billing({initial,onBillingChange}:{initial?:Bootstrap['billing'],onBillingChange?:(billing:any)=>void}){
  const [billing,setBilling]=useState(initial||{});
  const [loading,setLoading]=useState('');
  const [message,setMessage]=useState('');

  const status=String(billing?.status||'inactive').toLowerCase();
  const currentPlan=String(billing?.plan||'starter');
  const active=status==='active';
  const periodEndMs=Date.parse(String(billing?.currentPeriodEnd||''));
  const cancelledWithAccess=
    status==='cancelled' &&
    Number.isFinite(periodEndMs) &&
    periodEndMs>Date.now();
  const hasAccess=active||cancelledWithAccess;
  const paidThroughLabel=cancelledWithAccess
    ? new Date(periodEndMs).toLocaleDateString('de-DE',{
        day:'2-digit',
        month:'2-digit',
        year:'numeric',
      })
    : '';

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const returned=params.get('billing');
    const shouldSync=returned==='success'||Boolean(initial?.subscriptionId);

    fetch(`/api/paypal/status${shouldSync?'?sync=1':''}`)
      .then(async r=>{
        const j:any=await r.json();
        if(j.billing){setBilling(j.billing);onBillingChange?.(j.billing);}
        if(!r.ok&&j.error)setMessage(j.error);
        if(returned==='success')setMessage('Dein Abo ist jetzt aktiv.');
        if(returned==='cancelled')setMessage('PayPal-Checkout wurde abgebrochen.');
      })
      .catch(()=>setMessage('Dein Abo-Status konnte gerade nicht geladen werden.'))
      .finally(()=>{
        if(returned){
          params.delete('billing');
          const query=params.toString();
          window.history.replaceState({},'',`${window.location.pathname}${query?`?${query}`:''}`);
        }
      });
  },[]);

  async function start(plan:'starter'|'pro'){
    setLoading(plan);
    setMessage('');
    try{
      const r=await fetch('/api/paypal/subscription',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({plan}),
      });
      const j:any=await r.json();
      if(!r.ok){setMessage(j.error||'Die Zahlung konnte nicht gestartet werden.');return;}
      if(j.alreadyActive){
        const next=j.billing||billing;
        setBilling(next);
        onBillingChange?.(next);
        setMessage('Dieser Plan ist bereits aktiv.');
        return;
      }
      if(j.approveUrl){
        window.location.href=j.approveUrl;
        return;
      }
      setMessage('Die Zahlung konnte nicht geöffnet werden. Bitte versuche es erneut.');
    }catch{
      setMessage('Die Zahlung konnte gerade nicht verarbeitet werden. Bitte versuche es erneut.');
    }finally{
      setLoading('');
    }
  }

  async function cancel(){
    if(!window.confirm('PayPal-Abo wirklich kündigen?'))return;
    setLoading('cancel');
    setMessage('');
    try{
      const r=await fetch('/api/paypal/cancel',{method:'POST'});
      const j:any=await r.json();
      if(!r.ok){setMessage(j.error||'Kündigung fehlgeschlagen.');return;}
      const next=j.billing||{...billing,status:'cancelled'};
      setBilling(next);
      onBillingChange?.(next);
      const end=Date.parse(String(next?.currentPeriodEnd||''));
      const until=Number.isFinite(end)&&end>Date.now()
        ? new Date(end).toLocaleDateString('de-DE',{
            day:'2-digit',
            month:'2-digit',
            year:'numeric',
          })
        : '';
      setMessage(
        until
          ? `Das Abo ist gekündigt. Dein Zugang bleibt bis ${until} vollständig aktiv. Danach erfolgt keine weitere Abbuchung.`
          : 'Das PayPal-Abo wurde gekündigt.'
      );
    }catch{
      setMessage('Die Zahlung konnte gerade nicht verarbeitet werden. Bitte versuche es erneut.');
    }finally{
      setLoading('');
    }
  }

  function planButton(plan:'starter'|'pro'){
    if(!billing?.configured)return <button className="secondary" disabled>Zahlung derzeit nicht verfügbar</button>;
    if(active&&currentPlan===plan)return <button className="secondary" disabled>Aktueller Plan</button>;
    if(cancelledWithAccess&&currentPlan===plan)return <button className="secondary" disabled>{`Aktiv bis ${paidThroughLabel}`}</button>;
    const changing=active&&currentPlan!==plan;
    return <button className="primary" onClick={()=>start(plan)} disabled={Boolean(loading)}>
      {loading===plan?'PayPal öffnet…':changing?`Zu ${plan==='pro'?'PRO':'STARTER'} wechseln`:'Mit PayPal abonnieren'}
    </button>;
  }

  return <>
    <PageHead eyebrow="ABONNEMENT" title="Pläne & Nutzung" desc="Verwalte hier deinen Plan und deine monatliche Nutzung."/>

    <div className="billing-status panel">
      <div>
        <span className="eyebrow">ABO-STATUS</span>
        <h3>{active
          ? `${currentPlan.toUpperCase()} aktiv`
          : cancelledWithAccess
            ? `${currentPlan.toUpperCase()} gekündigt`
            : 'Kein aktives Abo'}</h3>
        <p>{cancelledWithAccess
          ? `Bereits bezahlt · voller Zugang bis ${paidThroughLabel} · danach keine weitere Abbuchung`
          : active
            ? 'Dein Abonnement ist aktiv.'
            : billing?.configured
              ? 'Wähle unten einen Plan, um deinen Workspace zu aktivieren.'
              : 'Zahlung ist derzeit nicht verfügbar.'}</p>
      </div>
      <div className="billing-status-actions">
        <span className={`billing-state ${hasAccess?'active':status}`}>
          {active
            ? 'AKTIV'
            : cancelledWithAccess
              ? `AKTIV BIS ${paidThroughLabel}`
              : status==='cancelled'
                ? 'GEKÜNDIGT'
                : status==='suspended'
                  ? 'PAUSIERT'
                  : status==='expired'
                    ? 'ABGELAUFEN'
                    : 'INAKTIV'}
        </span>
        {active&&<button className="text-btn danger-text" onClick={cancel} disabled={loading==='cancel'}>{loading==='cancel'?'Wird gekündigt…':'Abo kündigen'}</button>}
      </div>
    </div>

    {message&&<div className="notice billing-notice"><CreditCard/><div><b>PayPal</b><p>{message}</p></div></div>}

    <div className="plans">
      <div className={`plan-card ${hasAccess&&currentPlan==='starter'?'current-plan':''}`}>
        <span>STARTER</span>
        <h3>39 €<small>/ Monat</small></h3>
        <p>Für Solo Creator und kleine Businesses.</p>
        {['1 Instagram Account','500 AI-Konversationen / Monat','AI Sales Agent','Inbox & Lead Intelligence','Test-Chat & Analytics'].map(x=><div key={x}><Check/>{x}</div>)}
        {planButton('starter')}
      </div>

      <div className={`plan-card featured ${hasAccess&&currentPlan==='pro'?'current-plan':''}`}>
        <span>PRO</span>
        <h3>99 €<small>/ Monat</small></h3>
        <p>Für Creator und Teams mit mehr Volumen.</p>
        {['3 Instagram Accounts','5.000 AI-Konversationen / Monat','AI Sales Agent','Inbox & Lead Intelligence','Test-Chat & Analytics'].map(x=><div key={x}><Check/>{x}</div>)}
        {planButton('pro')}
      </div>
    </div>

  </>
}
function SettingsPage({user,organization,onLogout}:{user:any,organization:any,onLogout:()=>void}){
  return <>
    <PageHead eyebrow="WORKSPACE" title="Einstellungen" desc="Kontoinformationen und Workspace."/>
    <div className="panel account-settings">
      <div className="account-setting-row">
        <div><span>KONTO</span><b>{user.name}</b><small>{user.email}</small></div>
        <span className="role-badge">{user.emailVerified===false?'E-MAIL OFFEN':'VERIFIZIERT'}</span>
      </div>
      <div className="account-setting-row">
        <div><span>WORKSPACE</span><b>{organization.name}</b><small>Workspace-ID: {organization.id||'—'}</small></div>
        <span className="role-badge">{String(organization.plan||'starter').toUpperCase()}</span>
      </div>
      <button className="secondary logout-button" onClick={onLogout}>Abmelden</button>
    </div>
  </>
}
