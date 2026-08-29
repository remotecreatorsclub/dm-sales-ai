import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowLeft, Bot, BrainCircuit, Check, ChevronRight, CircleDollarSign, Clock3, Camera as Instagram,
  LayoutDashboard, ListFilter, MessageCircle, Pause, Play, PlugZap, Search, Send, Settings,
  Sparkles, Target, Users, Workflow, Zap, ShieldCheck, BarChart3, CreditCard, Menu, X
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
  organization: { name: string; plan: string };
  instagram: { connected: boolean; username: string; status: string };
  metrics: Record<string, number>;
  conversations: Conversation[];
  agent: Record<string, any>;
};

type View = 'dashboard' | 'inbox' | 'test' | 'leads' | 'automations' | 'agent' | 'analytics' | 'integrations' | 'billing' | 'settings';

const nav = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['inbox', 'Inbox', MessageCircle], ['test', 'Test-Chat', Bot], ['leads', 'Leads', Users],
  ['automations', 'Automationen', Workflow], ['agent', 'AI Agent', BrainCircuit], ['analytics', 'Analytics', BarChart3],
  ['integrations', 'Integrationen', PlugZap], ['billing', 'Billing', CreditCard], ['settings', 'Einstellungen', Settings],
] as const;

const stageLabel: Record<string, string> = {
  discovery: 'Discovery', painpoint: 'Painpoint', goal: 'Ziel', qualification: 'Qualifizierung', solution: 'Lösung', objection: 'Einwand', close: 'Close'
};

export function App() {
  const [authenticated, setAuthenticated] = useState(() => localStorage.getItem('dm-sales-ai-demo-auth') === '1');
  if (!authenticated) return <Login onEnter={() => { localStorage.setItem('dm-sales-ai-demo-auth','1'); setAuthenticated(true); }} />;
  return <ProductApp />;
}

function Login({onEnter}:{onEnter:()=>void}) {
  const [email,setEmail]=useState('');
  return <div className="login-page"><div className="login-visual"><div className="login-brand"><div className="brand-mark"><Sparkles size={18}/></div><strong>DM Sales AI</strong></div><div className="login-copy"><span className="eyebrow light">AI SALES AGENT FOR INSTAGRAM</span><h1>Aus DMs werden<br/><em>Verkaufsgespräche.</em></h1><p>Deine KI versteht Interessenten, findet Painpoints, qualifiziert Leads und führt sie natürlich zum nächsten sinnvollen Schritt.</p><div className="login-flow"><span><MessageCircle/> Nachricht</span><ChevronRight/><span><BrainCircuit/> Verstehen</span><ChevronRight/><span><Target/> Qualifizieren</span><ChevronRight/><span><CircleDollarSign/> Verkaufen</span></div></div><small>Demo v0.1 · Offizielle Meta-Integration vorbereitet</small></div><div className="login-form-wrap"><div className="login-form"><span className="eyebrow">WORKSPACE LOGIN</span><h2>Willkommen zurück</h2><p>Öffne die aktuelle Produkt-Demo. Echte Authentifizierung wird mit dem Produktions-D1 aktiviert.</p><label><span>E-Mail</span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@unternehmen.de"/></label><label><span>Passwort</span><input type="password" defaultValue="demodemo"/></label><button className="primary login-submit" onClick={onEnter}>Demo Workspace öffnen <ChevronRight size={16}/></button><div className="login-divider"><span>oder</span></div><button className="meta-login" onClick={onEnter}><Instagram size={17}/> Mit Instagram starten</button><small>Im Demo-Modus werden keine echten Instagram-Daten übertragen.</small></div></div></div>;
}

function ProductApp() {
  const [data, setData] = useState<Bootstrap | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selectedId, setSelectedId] = useState('conv_1');
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => { fetch('/api/bootstrap').then(r => r.json()).then(setData); }, []);
  if (!data) return <div className="loading"><div className="spinner"/><span>DM Sales AI wird geladen…</span></div>;

  const selected = data.conversations.find(c => c.id === selectedId) || data.conversations[0];

  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Sparkles size={18}/></div><div><strong>DM Sales AI</strong><span>AI Sales Agent</span></div></div>
      <button className="mobile-close" onClick={() => setMobileNav(false)}><X/></button>
      <div className="workspace"><div className="workspace-icon">D</div><div><strong>{data.organization.name}</strong><span>{data.organization.plan.toUpperCase()} PLAN</span></div><ChevronRight size={16}/></div>
      <nav>{nav.map(([key,label,Icon]) => <button key={key} className={view === key ? 'active' : ''} onClick={() => {setView(key as View); setMobileNav(false)}}><Icon size={18}/><span>{label}</span>{key==='inbox' && <em>3</em>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="usage"><div className="usage-head"><span>AI Konversationen</span><b>312 / 5.000</b></div><div className="usage-bar"><i style={{width:'6.2%'}}/></div><small>PRO · erneuert in 18 Tagen</small></div><div className="user"><div className="avatar dark">KD</div><div><strong>Account Owner</strong><span>owner@workspace</span></div><Settings size={16}/></div></div>
    </aside>
    {mobileNav && <div className="overlay" onClick={()=>setMobileNav(false)}/>} 
    <main className="main">
      <header className="topbar"><button className="menu-btn" onClick={()=>setMobileNav(true)}><Menu/></button><div className="top-title"><span>Workspace</span><b>/</b><strong>{labelFor(view)}</strong></div><div className="top-actions"><span className="demo-pill"><span/> DEMO</span><button className="connect-mini" onClick={()=>setView('integrations')}><Instagram size={16}/> Instagram verbinden</button></div></header>
      <div className={view === 'inbox' ? 'content content-inbox' : 'content'}>
        {view === 'dashboard' && <Dashboard data={data} onOpenInbox={()=>setView('inbox')} onConnect={()=>setView('integrations')}/>} 
        {view === 'inbox' && <Inbox conversations={data.conversations} selected={selected} setSelected={setSelectedId} updateConversation={(conv)=>setData({...data, conversations:data.conversations.map(c=>c.id===conv.id?conv:c)})}/>} 
        {view === 'test' && <TestChat agent={data.agent}/>} 
        {view === 'leads' && <Leads conversations={data.conversations} onOpen={(id)=>{setSelectedId(id);setView('inbox')}}/>}
        {view === 'automations' && <Automations/>}
        {view === 'agent' && <Agent initial={data.agent}/>} 
        {view === 'analytics' && <Analytics data={data}/>} 
        {view === 'integrations' && <Integrations instagram={data.instagram}/>} 
        {view === 'billing' && <Billing/>} 
        {view === 'settings' && <SettingsPage/>} 
      </div>
    </main>
  </div>;
}

function labelFor(v: View){ return nav.find(x=>x[0]===v)?.[1] || 'Dashboard'; }

function PageHead({eyebrow,title,desc,action}:{eyebrow:string,title:string,desc:string,action?:React.ReactNode}){
  return <div className="page-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{desc}</p></div>{action}</div>
}

function Dashboard({data,onOpenInbox,onConnect}:{data:Bootstrap,onOpenInbox:()=>void,onConnect:()=>void}){
  const cards = [
    ['Konversationen heute', data.metrics.conversationsToday, '+18%', MessageCircle], ['Qualifizierte Leads', data.metrics.qualifiedLeads, '+12%', Target],
    ['Hot Leads', data.metrics.hotLeads, '+3 heute', Zap], ['Checkouts gesendet', data.metrics.checkoutSent, '33% → Kauf', CircleDollarSign]
  ] as const;
  return <>
    <PageHead eyebrow="ÜBERSICHT" title="Guten Morgen 👋" desc="Dein AI Sales Agent arbeitet. Hier siehst du, was gerade in deinen DMs passiert." action={<button className="primary" onClick={onOpenInbox}><MessageCircle size={17}/> Inbox öffnen</button>}/>
    {!data.instagram.connected && <div className="connect-banner"><div className="connect-icon"><Instagram/></div><div><b>Instagram noch nicht verbunden</b><p>Verbinde deinen Business- oder Creator-Account, damit der Agent echte DMs empfangen kann.</p></div><button onClick={onConnect}>Jetzt verbinden <ChevronRight size={16}/></button></div>}
    <section className="metrics">{cards.map(([label,value,note,Icon])=><div className="metric" key={label}><div className="metric-top"><div className="metric-icon"><Icon size={18}/></div><span className="trend">{note}</span></div><strong>{value}</strong><span>{label}</span></div>)}</section>
    <div className="dashboard-grid">
      <section className="panel activity-panel"><div className="panel-head"><div><b>Live Sales Activity</b><span>Was dein Agent heute erkannt hat</span></div><span className="live"><i/> LIVE</span></div>
        <div className="funnel">
          {[['47','Gespräche','100%'],['31','Painpoint erkannt','66%'],['18','Qualifiziert','38%'],['9','Hot Leads','19%'],['6','Checkout','13%'],['2','Verkäufe','4%']].map((x,i)=><div key={x[1]} className="funnel-row"><div><span>{x[1]}</span><em>{x[2]}</em></div><div className="bar"><i style={{width:`${Math.max(12,100-i*16)}%`}}/></div><b>{x[0]}</b></div>)}
        </div>
      </section>
      <section className="panel"><div className="panel-head"><div><b>Hot Leads</b><span>Höchste Kaufwahrscheinlichkeit</span></div><button className="text-btn" onClick={onOpenInbox}>Alle ansehen</button></div>
        <div className="hot-list">{data.conversations.slice(0,3).map(c=><button key={c.id} onClick={onOpenInbox}><div className="avatar">{c.avatar}</div><div className="hot-info"><b>{c.name}</b><span>{c.painPoint}</span></div><div className={`score ${c.score>75?'hot':'warm'}`}><b>{c.score}%</b><span>Score</span></div></button>)}</div>
      </section>
    </div>
    <section className="panel agent-status"><div className="agent-orb"><Bot/></div><div><b>Sales Agent ist aktiv</b><p>Aktuelle Strategie: erst verstehen → Painpoint konkretisieren → qualifizieren → Lösung passend präsentieren → Einwand behandeln → CTA.</p></div><div className="status-chips"><span><ShieldCheck size={14}/> Guardrails aktiv</span><span><Activity size={14}/> Antwortzeit ~8s</span></div></section>
  </>
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
  const messagesRef=useRef<HTMLDivElement|null>(null);
  const messages = selected.messages.length ? selected.messages : [{id:'empty',from:'ai' as const,body:'Demo-Konversation: Nachrichtenverlauf wird hier angezeigt.',time:''}];
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
    <section className="conversation-list"><div className="inbox-title"><div><span className="eyebrow">INBOX</span><h2>Konversationen</h2></div><button className="filter"><ListFilter size={17}/></button></div><div className="search"><Search size={16}/><input placeholder="Name oder @username suchen"/></div><div className="tabs"><button className="active">Offen <span>3</span></button><button>Hot</button><button>Übernommen</button></div><div className="conv-items">{conversations.map(c=><button className={selected.id===c.id?'selected':''} key={c.id} onClick={()=>{setSelected(c.id);setMobileChatOpen(true)}}><div className="avatar">{c.avatar}<i className={c.aiMode==='active'?'online':'paused'}/></div><div className="conv-copy"><div><b>{c.name}</b><time>{c.time}</time></div><span>{c.lastMessage}</span><div className="conv-meta"><em className={`temp ${c.temperature}`}>{c.temperature==='hot'?'🔥 HOT':c.temperature==='warm'?'WARM':'COLD'}</em><em>{stageLabel[c.stage]}</em></div></div></button>)}</div></section>
    <section className="chat"><div className="chat-head"><button className="mobile-chat-back" onClick={()=>setMobileChatOpen(false)} aria-label="Zurück zu Konversationen"><ArrowLeft size={20}/></button><div className="avatar">{selected.avatar}</div><div><b>{selected.name}</b><span>{selected.username} · <i className={selected.aiMode==='active'?'green-dot':''}/> AI {selected.aiMode==='active'?'aktiv':'pausiert'}</span></div><div className="chat-actions"><button className={selected.aiMode==='active'?'pause':'play'} onClick={toggleAI}>{selected.aiMode==='active'?<Pause size={15}/>:<Play size={15}/>}<span>{selected.aiMode==='active'?'AI pausieren':'AI übernehmen lassen'}</span></button></div></div>
      <div className="stage-line"><span>Sales Stage</span><div>{['discovery','painpoint','goal','qualification','solution','objection','close'].map(s=><i key={s} className={s===selected.stage?'current':stageRank(s)<stageRank(selected.stage)?'done':''}>{s===selected.stage?<Zap size={11}/>:null}{stageLabel[s]}</i>)}</div></div>
      <div className="messages" ref={messagesRef}>{messages.map(m=><div key={m.id} className={`message-row ${m.from}`}><div className="bubble"><span className="speaker">{m.from==='lead'?selected.name:m.from==='ai'?'AI Agent':'Du'}</span>{m.body}<time>{m.time}</time></div></div>)}{drafting&&<div className="message-row ai typing-row"><div className="bubble typing-bubble"><span className="speaker">AI Agent</span><div className="typing-line"><span>Schreibt</span><span className="typing-dots"><i/><i/><i/></span></div></div></div>}</div>
      <div className="composer"><button className="ai-draft" onClick={draft} disabled={drafting}><Sparkles size={16}/>{drafting?'Antwort wird vorbereitet…':'AI Vorschlag'}</button><div className="compose-row"><textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Nachricht schreiben…" onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send()}}}/><button onClick={send}><Send size={18}/></button></div><small>Wenn du selbst antwortest, empfehlen wir den AI Agent für diese Unterhaltung zu pausieren.</small></div>
    </section>
    <aside className="lead-card"><div className="lead-head"><span className="eyebrow">LEAD INTELLIGENCE</span><div className="score-ring"><strong>{selected.score}%</strong><span>Kaufsignal</span></div><h3>{selected.name}</h3><p>{selected.username}</p></div><div className="lead-section"><label>Aktueller Stage</label><span className="stage-pill"><Zap size={13}/>{stageLabel[selected.stage]}</span></div>{[['Ziel',selected.goal,Target],['Painpoint',selected.painPoint,BrainCircuit],['Erfahrung',selected.experience,Activity],['Budget',selected.budget,CircleDollarSign],['Einwand',selected.objection,ShieldCheck]].map(([l,v,I]:any)=><div className="intel" key={l}><I size={16}/><div><label>{l}</label><p>{v}</p></div></div>)}<div className="intel"><MessageCircle size={16}/><div><label>Sprachstil</label><p>{[selected.styleProfile?.language, selected.styleProfile?.address, selected.styleProfile?.formality, selected.styleProfile?.emojiUsage].filter(Boolean).join(' · ') || 'Wird aus den Lead-Nachrichten erkannt'}</p></div></div><div className="lead-note"><Sparkles size={15}/><p><b>Nächster sinnvoller Schritt:</b> {selected.nextStep || 'Weiter natürlich qualifizieren und nichts erneut fragen, was bereits geklärt wurde.'}</p></div></aside>
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
                {message.body}
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
          <small>Die KI nutzt Lead Memory + Style Profile + die letzten 10 Nachrichten und wartet realistisch, bevor sie antwortet.</small>
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
 return <><PageHead eyebrow="CRM" title="Leads" desc="Jeder Kontakt wird automatisch qualifiziert, zusammengefasst und nach Kaufsignal priorisiert." action={<button className="secondary"><ListFilter size={17}/> Filter</button>}/><div className="panel table-panel"><table><thead><tr><th>Lead</th><th>Stage</th><th>Painpoint</th><th>Score</th><th>AI</th><th/></tr></thead><tbody>{conversations.map(c=><tr key={c.id}><td><div className="person"><div className="avatar">{c.avatar}</div><div><b>{c.name}</b><span>{c.username}</span></div></div></td><td><span className="stage-pill">{stageLabel[c.stage]}</span></td><td>{c.painPoint}</td><td><div className="score-cell"><div className="mini-score"><i style={{width:`${c.score}%`}}/></div><b>{c.score}%</b></div></td><td><span className={`ai-state ${c.aiMode}`}>{c.aiMode==='active'?'Aktiv':'Pausiert'}</span></td><td><button className="text-btn" onClick={()=>onOpen(c.id)}>Öffnen →</button></td></tr>)}</tbody></table></div></>
}

function Automations(){const items=[['Kommentar → DM','Wenn jemand ein Keyword kommentiert, startet automatisch eine private Unterhaltung.','Coming next'],['DM Keyword','START, PREIS oder INFO startet einen definierten AI Sales Flow.','Coming next'],['Story Reply','Antworten auf Stories werden erkannt und intelligent weitergeführt.','Planned']];return <><PageHead eyebrow="AUTOMATION" title="Trigger & Flows" desc="Die KI übernimmt das Gespräch – Automationen entscheiden, wann es startet." action={<button className="primary"><Zap size={17}/> Automation erstellen</button>}/><div className="automation-grid">{items.map(([t,d,s],i)=><div className="automation-card" key={t}><div className="automation-icon">{i===0?<MessageCircle/>:i===1?<Zap/>:<Instagram/>}</div><span className="coming">{s}</span><h3>{t}</h3><p>{d}</p><div className="flow-preview"><span>Trigger</span><ChevronRight/><span>Private DM</span><ChevronRight/><span className="ai-node"><Sparkles/> AI Agent</span></div><button className="secondary" disabled>Konfigurieren</button></div>)}</div></>}

function Agent({initial}:{initial:Record<string,any>}){
 const [form,setForm]=useState(initial); const [saved,setSaved]=useState(false); const change=(k:string,v:any)=>setForm({...form,[k]:v});
 async function save(){await fetch('/api/agent/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});setSaved(true);setTimeout(()=>setSaved(false),1800)}
 return <><PageHead eyebrow="AI SALES BRAIN" title="Dein Sales Agent" desc="Hier bekommt die KI alles, was sie braucht, um natürlich zu qualifizieren und passend zu verkaufen." action={<button className="primary" onClick={save}>{saved?<Check size={17}/>:<Sparkles size={17}/>} {saved?'Gespeichert':'Agent speichern'}</button>}/><div className="agent-layout"><div className="panel form-panel"><div className="form-section"><div className="section-num">01</div><div><h3>Angebot</h3><p>Was darf dein Agent verkaufen?</p></div></div><div className="form-grid"><Field label="Angebotsname" value={form.offerName} onChange={(v)=>change('offerName',v)}/><Field label="Preis" value={form.price} onChange={(v)=>change('price',v)}/><Field wide label="Zielgruppe" value={form.audience} onChange={(v)=>change('audience',v)}/></div><div className="form-section split"><div className="section-num">02</div><div><h3>Produktwissen / Knowledge Base</h3><p>Hier hinterlegt jeder Kunde die verbindlichen Fakten zu seinem eigenen Angebot.</p></div></div><div className="form-grid"><Area wide label="Produktwissen" value={form.productKnowledge} onChange={(v)=>change('productKnowledge',v)}/></div><div className="form-section split"><div className="section-num">03</div><div><h3>Sales Wissen</h3><p>Damit der Agent nicht generisch antwortet.</p></div></div><div className="form-grid"><Area label="Typische Painpoints" value={form.painPoints} onChange={(v)=>change('painPoints',v)}/><Area label="Gewünschte Ergebnisse" value={form.outcomes} onChange={(v)=>change('outcomes',v)}/><Area label="Einwände" value={form.objections} onChange={(v)=>change('objections',v)}/><Area label="Tonalität" value={form.tone} onChange={(v)=>change('tone',v)}/></div><div className="form-section split"><div className="section-num">04</div><div><h3>Persönlichkeit & Gesprächsstil</h3><p>Je echter die Beispiele, desto näher schreibt die KI wie der Account-Inhaber.</p></div></div><div className="form-grid"><Area wide label="Echte Nachrichten-Beispiele" value={form.voiceExamples} onChange={(v)=>change('voiceExamples',v)}/><Area label="Zusätzliche Sales-Regeln" value={form.salesRules} onChange={(v)=>change('salesRules',v)}/><Area label="Zusätzliche Guardrails" value={form.guardrails} onChange={(v)=>change('guardrails',v)}/></div><div className="form-section split"><div className="section-num">05</div><div><h3>Conversion</h3><p>Wohin soll ein qualifizierter Lead geführt werden?</p></div></div><div className="form-grid"><Field label="Checkout URL" value={form.checkoutUrl} onChange={(v)=>change('checkoutUrl',v)}/><Field label="Termin URL" value={form.bookingUrl} onChange={(v)=>change('bookingUrl',v)}/></div></div><aside className="agent-preview"><div className="agent-orb large"><BrainCircuit/></div><span className="eyebrow">VERHALTEN</span><h3>Sales-Logik</h3><p>Der Agent versteht zuerst den aktuellen Gesprächszug, plant die passende Reaktion und schreibt erst danach die sichtbare DM.</p>{['Situation verstehen','Painpoint konkretisieren','Ziel erkennen','Qualifizieren','Passende Lösung erklären','Einwand behandeln','CTA auslösen'].map((x,i)=><div className="logic" key={x}><i>{i+1}</i><span>{x}</span>{i<6&&<div/>}</div>)}<div className="guardrail"><ShieldCheck/><div><b>Guardrails</b><span>Produktfragen nur aus Knowledge Base · keine erfundenen Fakten · kein Spam · kein unnötiger Druck · Human Takeover respektieren</span></div></div></aside></div></>
}
function Field({label,value,onChange,wide}:{label:string,value:string,onChange:(v:string)=>void,wide?:boolean}){return <label className={wide?'wide':''}><span>{label}</span><input value={value||''} onChange={e=>onChange(e.target.value)}/></label>}
function Area({label,value,onChange,wide}:{label:string,value:string,onChange:(v:string)=>void,wide?:boolean}){return <label className={wide?'wide':''}><span>{label}</span><textarea value={value||''} onChange={e=>onChange(e.target.value)}/></label>}

function Analytics({data}:{data:Bootstrap}){return <><PageHead eyebrow="PERFORMANCE" title="Analytics" desc="Nicht nur Nachrichten zählen – sondern verstehen, wo Gespräche zu Käufen werden."/><section className="metrics">{[['Conversion Rate','4,3%'],['Ø Lead Score','63%'],['Antwortzeit','8 Sek.'],['AI Takeover','91%']].map(([a,b])=><div className="metric" key={a}><strong>{b}</strong><span>{a}</span></div>)}</section><div className="panel chart-panel"><div className="panel-head"><div><b>Sales Funnel</b><span>Demo-Daten · letzte 30 Tage</span></div></div><div className="big-bars">{[['Neue Gespräche',428,100],['Painpoint erkannt',286,67],['Qualifiziert',166,39],['Hot Lead',81,19],['Checkout',54,13],['Verkauf',18,4]].map(([l,n,w]:any)=><div key={l}><span>{l}</span><div><i style={{width:`${w}%`}}/></div><b>{n}</b></div>)}</div></div></>}

function Integrations({instagram}:{instagram:Bootstrap['instagram']}){const [msg,setMsg]=useState('');async function connect(){const r=await fetch('/api/meta/oauth/start',{method:'POST'});const j:any=await r.json();if(j.url){window.location.href=j.url;return;}setMsg(j.error||'Verbindung konnte nicht gestartet werden.')}return <><PageHead eyebrow="INTEGRATIONEN" title="Kanäle verbinden" desc="Hier verbinden deine Kunden später ihre eigenen Accounts."/><div className="integration-card"><div className="instagram-logo"><Instagram/></div><div className="integration-info"><div><h3>Instagram</h3><span className="official">META API</span></div><p>Business- oder Creator-Account verbinden, DMs per Webhook empfangen und Antworten über die offizielle API senden.</p><div className="feature-chips"><span><Check/> DMs</span><span><Check/> Webhooks</span><span><Check/> Kommentar → DM vorbereitet</span></div></div><div className="integration-action"><span className={instagram.connected?'connected':'disconnected'}>{instagram.connected?'Verbunden':'Nicht verbunden'}</span><button className="primary" onClick={connect}><Instagram size={17}/> Instagram verbinden</button></div></div>{msg&&<div className="notice"><ShieldCheck/><div><b>Integration vorbereitet</b><p>{msg}</p></div></div>}<div className="panel setup-steps"><div className="panel-head"><div><b>Was als Nächstes technisch aktiviert wird</b><span>Die App-Oberfläche und Webhook-Endpunkte sind bereits vorbereitet.</span></div></div>{[['1','Meta App anlegen','Instagram API + Webhooks aktivieren'],['2','OAuth konfigurieren','Kunden verbinden ihren Account selbst'],['3','Webhook abonnieren','Neue DMs landen in unserer Conversation Engine'],['4','Send API verbinden','AI-Antworten gehen zurück in Instagram']].map(([n,t,d])=><div className="setup-step" key={n}><i>{n}</i><div><b>{t}</b><span>{d}</span></div></div>)}</div></>}

function Billing(){return <><PageHead eyebrow="SAAS BILLING" title="Pläne & Nutzung" desc="Die spätere Monetarisierung ist bereits als eigener SaaS-Bereich vorgesehen."/><div className="plans"><div className="plan-card"><span>STARTER</span><h3>39 €<small>/ Monat</small></h3><p>Für Solo Creator und kleine Businesses.</p>{['1 Instagram Account','500 AI-Konversationen','AI Sales Agent','Inbox & Leads','Basis Automationen'].map(x=><div><Check/>{x}</div>)}<button className="secondary">Aktueller Entwurf</button></div><div className="plan-card featured"><span>PRO</span><h3>99 €<small>/ Monat</small></h3><p>Für Creator und Teams mit mehr Volumen.</p>{['3 Instagram Accounts','5.000 AI-Konversationen','Erweiterte Sales Flows','Lead Scoring & Analytics','Human Handoff'].map(x=><div><Check/>{x}</div>)}<button className="primary">PRO Entwurf</button></div></div></>}
function SettingsPage(){return <><PageHead eyebrow="WORKSPACE" title="Einstellungen" desc="Workspace, Team, Sicherheit und später die SaaS-Verwaltung."/><div className="panel settings-list">{[['Workspace','Name, Sprache und Standard-Zeitzone'],['Team','Mitarbeiter und Rollen'],['Sicherheit','Sessions, Webhooks und API Secrets'],['Datenschutz','Löschfristen und Datenexport']].map(([a,b])=><button key={a}><div><b>{a}</b><span>{b}</span></div><ChevronRight/></button>)}</div></>}
