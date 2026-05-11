import { useState, useRef, useEffect } from "react";

const VIO_VERSIONS = [
  {
    id:"K1", label:"K1", desc:"Chat & Q&A", icon:"◈", badge:"BASIC", color:"#00f5a0",
    system:`Kamu adalah VIO K1. AI santai untuk pertanyaan sehari-hari. Bahasa santai, singkat, friendly. Kalau ada foto, deskripsikan dan bantu sesuai konteks.`,
  },
  {
    id:"K1.5", label:"K1.5", desc:"Coding & Sekolah", icon:"⟨⟩", badge:"EDU", color:"#38bdf8",
    system:`Kamu adalah VIO K1.5. AI coding dan pendidikan. Bantu kode, matematika, pelajaran. Foto soal PR? Baca dan selesaikan step by step. Selalu format kode dalam blok kode yang rapi dengan bahasa yang benar.`,
  },
  {
    id:"K2", label:"K2", desc:"Developer & Game", icon:"◉", badge:"DEV", color:"#a78bfa",
    system:`Kamu adalah VIO K2. AI developer dan game creator. Bantu aplikasi, game, script, debug. Format semua kode dalam blok kode proper dengan komentar. Jelaskan singkat sebelum kode.`,
  },
  {
    id:"K2.5", label:"K2.5", desc:"Bisnis + Dev", icon:"⬡", badge:"BIZ", color:"#fb923c",
    system:`Kamu adalah VIO K2.5. AI bisnis dan developer. Bantu startup, PRD, strategi, marketplace. Foto dokumen? Analisis dan berikan insight. Format kode dengan rapi dan lengkap.`,
  },
  {
    id:"K3", label:"K3", desc:"Super Assistant", icon:"✦", badge:"SUPER", color:"#f43f5e",
    system:`Kamu adalah VIO K3. AI super assistant. Coding, bisnis, game, analisis mendalam. Format kode dengan blok proper, penjelasan detail. Solusi modern dan efisien.`,
  },
  {
    id:"K3.5", label:"K3.5", desc:"Pro Creator", icon:"⬟", badge:"PRO", color:"#e879f9",
    isPro: true,
    system:`Kamu adalah VIO K3.5 PRO. AI kreatif canggih dengan kemampuan:
• DESKRIPSI & KONTEN: Produk, jasa, portfolio, app, copywriting marketing, konten sosmed, script video/podcast, narasi presentasi — semua profesional dan persuasif
• CODING PRO: Fullstack level senior, kode bersih, terdokumentasi JSDoc, arsitektur solid, design patterns, multiple solusi
• DOKUMENTASI: Teknis, API docs, README, user guide
• ANALISIS: Business intelligence, competitive analysis, market research
Untuk DESKRIPSI: buat menarik, padat, emosional, dan action-driven.
Untuk KODE: sertakan komentar, error handling, dan contoh penggunaan.`,
  },
  {
    id:"K4", label:"K4", desc:"AI ULTRA", icon:"◆", badge:"ULTRA", color:"#ffffff",
    isUltra: true,
    system:`Kamu adalah VIO K4 ULTRA — AI paling canggih di ekosistem VIO. Kemampuanmu melampaui semua versi:
• CODING ULTRA: Production-ready level principal engineer. Arsitektur solid, SOLID principles, design patterns, error handling komprehensif, testing, TypeScript strict, dokumentasi TSDoc/JSDoc lengkap
• ANALISIS ULTRA: Multi-dimensi, mendalam, dengan data, framework, dan rekomendasi konkret
• KREASI ULTRA: Konten, copywriting, narasi — level agensi profesional terbaik
• OTOMASI ULTRA: Workflow AI, pipeline data, sistem microservices, CI/CD
• MULTI-MODAL ULTRA: Analisis gambar, diagram, flowchart, wireframe dengan presisi tinggi
Selalu berikan output terlengkap: kode ultra bersih + komentar + multiple opsi + penjelasan mendalam. Kamu AI masa depan.`,
  },
];

const MODES = [
  { icon:"💬", label:"Chat" },
  { icon:"⚙️", label:"Kode" },
  { icon:"🎮", label:"Game" },
  { icon:"💼", label:"Bisnis" },
  { icon:"📚", label:"Sekolah" },
];

// ── Code beautifier ──────────────────────────────────────────────────────────
function beautifyCode(code) {
  const lines = code.split("\n");
  let indent = 0;
  return lines.map(raw => {
    const line = raw.trim();
    if (!line) return "";
    const closeCount = (line.match(/^[}\])]/) || []).length;
    indent = Math.max(0, indent - closeCount);
    const result = "  ".repeat(indent) + line;
    const openCount = (line.match(/[{[(](?![^{[]*[}\])])/g) || []).length;
    indent += openCount;
    return result;
  }).join("\n");
}

// ── Syntax highlight (basic) ─────────────────────────────────────────────────
function highlightCode(code, lang) {
  const esc = code.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const jsLangs = ["js","javascript","jsx","ts","typescript","tsx"];
  if (!jsLangs.includes(lang?.toLowerCase())) return esc;
  return esc
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#6b7a99;font-style:italic">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g,'<span style="color:#6b7a99;font-style:italic">$1</span>')
    .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|default|from|async|await|new|this|typeof|instanceof|try|catch|throw|switch|case|break|continue|of|in)\b/g,'<span style="color:#c678dd">$1</span>')
    .replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g,'<span style="color:#d19a66">$1</span>')
    .replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g,'<span style="color:#98c379">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#d19a66">$1</span>');
}

// ── Code Block ───────────────────────────────────────────────────────────────
function CodeBlock({ lang, code, accentColor }) {
  const [currentCode, setCurrentCode] = useState(code);
  const [copied, setCopied] = useState(false);
  const [beautified, setBeautified] = useState(false);

  const LANG_DOT = {
    js:"#f7df1e",javascript:"#f7df1e",jsx:"#61dafb",tsx:"#61dafb",
    ts:"#3178c6",typescript:"#3178c6",python:"#3572A5",py:"#3572A5",
    html:"#e34c26",css:"#264de4",json:"#a8b820",bash:"#00f5a0",
    sh:"#00f5a0",sql:"#e38c00",go:"#00add8",rust:"#dea584",code:"#888"
  };
  const dot = LANG_DOT[lang?.toLowerCase()] || "#888";

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true); setTimeout(()=>setCopied(false), 2200);
  };
  const handleBeautify = () => {
    setCurrentCode(beautifyCode(currentCode));
    setBeautified(true); setTimeout(()=>setBeautified(false), 2200);
  };

  return (
    <div style={{
      margin:"10px 0", borderRadius:11,
      border:"1px solid rgba(255,255,255,0.09)",
      background:"#0d1117", overflow:"hidden",
      fontFamily:"'JetBrains Mono','Fira Code',monospace"
    }}>
      {/* Header */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"7px 13px",
        background:"rgba(255,255,255,0.035)",
        borderBottom:"1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <div style={{ width:9, height:9, borderRadius:"50%", background:dot }}/>
          <span style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:"0.12em", textTransform:"uppercase" }}>
            {lang||"code"}
          </span>
        </div>
        <div style={{ display:"flex", gap:5 }}>
          {/* Beautify */}
          <button onClick={handleBeautify}
            style={{
              padding:"3px 10px", borderRadius:5, fontSize:10, cursor:"pointer",
              border:`1px solid ${beautified?"#10b98150":"rgba(255,255,255,0.1)"}`,
              background:beautified?"#10b98115":"rgba(255,255,255,0.04)",
              color:beautified?"#10b981":"rgba(255,255,255,0.45)",
              transition:"all .2s", display:"flex", alignItems:"center", gap:3
            }}>
            {beautified?"✓ Rapi!":"✨ Rapikan"}
          </button>
          {/* Copy code */}
          <button onClick={handleCopy}
            style={{
              padding:"3px 10px", borderRadius:5, fontSize:10, cursor:"pointer",
              border:`1px solid ${copied?accentColor+"55":"rgba(255,255,255,0.1)"}`,
              background:copied?`${accentColor}18`:"rgba(255,255,255,0.04)",
              color:copied?accentColor:"rgba(255,255,255,0.45)",
              transition:"all .2s", display:"flex", alignItems:"center", gap:3
            }}>
            {copied?"✓ Disalin!":"⎘ Salin Kode"}
          </button>
        </div>
      </div>
      {/* Code */}
      <pre style={{
        margin:0, padding:"13px 16px", overflowX:"auto",
        fontSize:12.5, lineHeight:1.72, background:"transparent"
      }}>
        <code
          dangerouslySetInnerHTML={{ __html: highlightCode(currentCode, lang) }}
        />
      </pre>
    </div>
  );
}

// ── Render message with code blocks ─────────────────────────────────────────
function RenderContent({ text, accentColor }) {
  const parts = [];
  const re = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ t:"text", v:text.slice(last, m.index) });
    parts.push({ t:"code", lang:m[1]||"code", v:m[2].trim() });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ t:"text", v:text.slice(last) });

  return (
    <>
      {parts.map((p,i) =>
        p.t === "text"
          ? <span key={i} style={{ whiteSpace:"pre-wrap" }}>{p.v}</span>
          : <CodeBlock key={i} lang={p.lang} code={p.v} accentColor={accentColor}/>
      )}
    </>
  );
}

// ── Typing Dots ──────────────────────────────────────────────────────────────
function TypingDots({ color }) {
  return (
    <span style={{ display:"inline-flex", gap:5, alignItems:"center" }}>
      {[0,1,2].map(i=>(
        <span key={i} style={{
          width:6, height:6, borderRadius:"50%", background:color,
          display:"inline-block",
          animation:`vdot 1.1s ease-in-out ${i*0.18}s infinite`,
          boxShadow:`0 0 6px ${color}`
        }}/>
      ))}
    </span>
  );
}

// ── Chat Bubble ──────────────────────────────────────────────────────────────
function ChatBubble({ msg, version }) {
  const c = version.color;
  const isUser = msg.role==="user";
  const [copiedAll, setCopiedAll] = useState(false);

  return (
    <div style={{
      display:"flex", justifyContent:isUser?"flex-end":"flex-start",
      marginBottom:16, animation:"vSlideIn 0.25s ease-out"
    }}>
      {!isUser && (
        <div style={{
          width:30, height:30, borderRadius:"50%", flexShrink:0,
          marginRight:9, marginTop:2,
          background: version.isUltra
            ? "linear-gradient(135deg,#f43f5e25,#a78bfa25)"
            : `${c}18`,
          border:`1.5px solid ${c}50`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:12, color:c, fontWeight:900,
          boxShadow:`0 0 12px ${c}30`
        }}>{version.icon}</div>
      )}
      <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", gap:4 }}>
        <div style={{
          borderRadius:isUser?"16px 16px 4px 16px":"16px 16px 16px 4px",
          padding:"11px 15px",
          background:isUser?`${c}1a`:"rgba(255,255,255,0.04)",
          border:isUser?`1px solid ${c}40`:"1px solid rgba(255,255,255,0.07)",
          boxShadow:isUser?`0 2px 18px ${c}15`:"none",
          fontSize:13.5, lineHeight:1.68, color:"#e2e8f0",
          fontFamily:"'DM Sans',sans-serif", wordBreak:"break-word"
        }}>
          {msg.image && (
            <img src={msg.image} alt="" style={{
              maxWidth:"100%", maxHeight:180, borderRadius:8,
              marginBottom:msg.content?8:0, display:"block"
            }}/>
          )}
          {!isUser
            ? <RenderContent text={msg.content} accentColor={c}/>
            : <span style={{ whiteSpace:"pre-wrap" }}>{msg.content}</span>
          }
        </div>
        {/* Salin semua teks — only assistant */}
        {!isUser && msg.content && (
          <button
            onClick={()=>{
              navigator.clipboard.writeText(msg.content);
              setCopiedAll(true);
              setTimeout(()=>setCopiedAll(false),2200);
            }}
            style={{
              alignSelf:"flex-start", padding:"3px 10px", borderRadius:5,
              border:`1px solid ${copiedAll?c+"50":"rgba(255,255,255,0.07)"}`,
              background:copiedAll?`${c}12`:"transparent",
              color:copiedAll?c:"rgba(255,255,255,0.28)",
              cursor:"pointer", fontSize:10, transition:"all .2s",
              display:"flex", alignItems:"center", gap:4
            }}>
            {copiedAll?"✓ Disalin!":"⎘ Salin semua teks"}
          </button>
        )}
      </div>
    </div>
  );
}

// ── Version Background Deco ──────────────────────────────────────────────────
function VersionBg({ version }) {
  const c = version.color;
  if (version.id==="K1") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      {[...Array(16)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",width:4+i%4*3,height:4+i%4*3,
          borderRadius:"50%",background:c,opacity:0.04+i%3*0.02,
          left:`${(i*13+7)%95}%`,top:`${(i*17+5)%90}%`,
          animation:`vFloat ${4+i%3}s ease-in-out ${i*0.3}s infinite alternate`
        }}/>
      ))}
    </div>
  );
  if (version.id==="K1.5") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0,opacity:.05 }}>
      {["</>","fn()","{}","[]","=>","//","const","let"].map((s,i)=>(
        <div key={i} style={{
          position:"absolute",color:c,fontSize:13+i%3*4,
          fontFamily:"monospace",fontWeight:700,
          left:`${8+i*12}%`,top:`${8+i*11}%`,
          animation:`vFloat ${5+i}s ease-in-out ${i*0.5}s infinite alternate`
        }}>{s}</div>
      ))}
    </div>
  );
  if (version.id==="K2") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      {[...Array(10)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",width:18+i*9,height:18+i*9,
          border:`1px solid ${c}12`,borderRadius:3,
          transform:`rotate(${i*18}deg)`,
          left:`${(i*19+5)%85}%`,top:`${(i*23+10)%85}%`,
          animation:`vSpin ${8+i*2}s linear infinite`
        }}/>
      ))}
    </div>
  );
  if (version.id==="K2.5") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      {[...Array(7)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",width:55+i*22,height:55+i*22,
          background:`${c}04`,border:`1px solid ${c}0e`,
          borderRadius:5,transform:`rotate(${i*25}deg)`,
          left:`${(i*20)%75}%`,top:`${(i*18+5)%75}%`,
        }}/>
      ))}
    </div>
  );
  if (version.id==="K3") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      {[...Array(18)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",fontSize:8+i%4*4,color:c,
          opacity:0.04+i%3*0.03,
          left:`${(i*13+3)%95}%`,top:`${(i*17+2)%92}%`,
          animation:`vPulse ${2+i%3}s ease-in-out ${i*0.2}s infinite`
        }}>✦</div>
      ))}
    </div>
  );
  if (version.id==="K3.5") return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      {[...Array(12)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",width:28+i*14,height:1,
          background:`linear-gradient(90deg,transparent,${c}18,transparent)`,
          left:`${(i*11)%80}%`,top:`${(i*14+5)%90}%`,
          transform:`rotate(${i*13-45}deg)`,
          animation:`vPulse ${3+i%3}s ease-in-out ${i*0.25}s infinite`
        }}/>
      ))}
    </div>
  );
  // K4 ULTRA
  return (
    <div style={{ position:"absolute",inset:0,pointerEvents:"none",overflow:"hidden",zIndex:0 }}>
      <div style={{
        position:"absolute",inset:0,
        background:"radial-gradient(ellipse at 20% 30%,#f43f5e07 0%,transparent 50%),radial-gradient(ellipse at 80% 70%,#a78bfa07 0%,transparent 50%),radial-gradient(ellipse at 50% 50%,#38bdf807 0%,transparent 60%)"
      }}/>
      {[...Array(20)].map((_,i)=>(
        <div key={i} style={{
          position:"absolute",fontSize:9+i%5*4,
          color:["#f43f5e","#e879f9","#a78bfa","#38bdf8","#00f5a0"][i%5],
          opacity:0.05+i%3*0.03,
          left:`${(i*11+2)%95}%`,top:`${(i*13+3)%92}%`,
          animation:`vPulse ${1.5+i%4}s ease-in-out ${i*0.15}s infinite`
        }}>◆</div>
      ))}
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function VioAI() {
  const [version, setVersion]   = useState(VIO_VERSIONS[4]);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [imgData, setImgData]   = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [stripeOpen, setStripeOpen] = useState(false);
  const [activeMode, setActiveMode] = useState("Chat");
  const [toast, setToast]       = useState(null);
  const chatRef  = useRef(null);
  const fileRef  = useRef(null);
  const textRef  = useRef(null);
  const c = version.color;

  useEffect(()=>{
    chatRef.current?.scrollTo({ top:chatRef.current.scrollHeight, behavior:"smooth" });
  },[messages,loading]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(()=>setToast(null),2200);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImgData({ data:ev.target.result.split(",")[1], type:file.type });
      setImgPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value="";
  };

  const buildSystem = () => {
    let sys = version.system;
    if (activeMode==="Kode") sys += `\n\nMODE KODE AKTIF: Selalu gunakan blok kode dengan bahasa yang tepat. Tambahkan komentar bermakna. Sertakan contoh penggunaan. Jelaskan logika singkat sebelum kode.`;
    if (version.isUltra) sys += `\n\nBerikan respons terlengkap dan terbaik. Untuk kode: sertakan semua detail, error handling, dan dokumentasi lengkap.`;
    return sys + `\n\nMode aktif: ${activeMode}.`;
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && !imgData)||loading) return;
    const userMsg = { role:"user", content:text||(imgData?"Tolong analisis gambar ini.":""), image:imgPreview };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    const cap = imgData;
    setImgData(null); setImgPreview(null);
    setLoading(true);
    try {
      const apiMsgs = newMsgs.map((m,idx)=>{
        if (idx===newMsgs.length-1 && cap) {
          return { role:"user", content:[
            { type:"image", source:{ type:"base64", media_type:cap.type, data:cap.data }},
            { type:"text", text:text||"Analisis gambar ini." }
          ]};
        }
        return { role:m.role, content:m.content };
      });
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          system:buildSystem(),
          messages:apiMsgs
        })
      });
      const data = await res.json();
      const reply = data.content?.map(b=>b.text||"").join("")||"Error.";
      setMessages(prev=>[...prev,{ role:"assistant", content:reply }]);
    } catch {
      setMessages(prev=>[...prev,{ role:"assistant", content:"❌ Koneksi gagal. Coba lagi." }]);
    } finally {
      setLoading(false);
      textRef.current?.focus();
    }
  };

  const suggestions = version.isUltra
    ?["Buat REST API fullstack TypeScript","Buat sistem auth JWT lengkap","Analisis strategi bisnis startup","Buat pipeline CI/CD"]
    :version.isPro
    ?["Buat deskripsi produk SaaS","Buat landing page React modern","Tulis konten LinkedIn viral","Buat arsitektur microservices"]
    :["Buat landing page keren","Buat game simulator","Jelaskan async/await","Ide startup digital"];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=DM+Sans:wght@300;400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        body{background:#06090f;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${c}40;border-radius:2px;}
        @keyframes vdot{0%,100%{opacity:.25;transform:scale(.7);}50%{opacity:1;transform:scale(1.3);}}
        @keyframes vSlideIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes vFloat{from{transform:translateY(0);}to{transform:translateY(-14px);}}
        @keyframes vSpin{to{transform:rotate(360deg);}}
        @keyframes vPulse{0%,100%{opacity:.05;}50%{opacity:.2;}}
        @keyframes vGlow{0%,100%{box-shadow:0 0 6px ${c}25;}50%{box-shadow:0 0 20px ${c}60;}}
        @keyframes sIn{from{opacity:0;transform:translateX(-8px);}to{opacity:1;transform:translateX(0);}}
        @keyframes tIn{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
        @keyframes ultraShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        .vstripebtn:hover{background:${c}18!important;color:${c}!important;}
        .vsend:hover{background:${c}!important;color:#06090f!important;transform:scale(1.07);}
        textarea:focus{outline:none!important;}
        pre::-webkit-scrollbar{height:3px;}
        pre::-webkit-scrollbar-thumb{background:#ffffff18;border-radius:2px;}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position:"fixed",bottom:28,left:"50%",transform:"translateX(-50%)",
          padding:"8px 20px",borderRadius:20,zIndex:9999,
          background:c,color:"#06090f",fontSize:12,fontWeight:600,
          animation:"tIn .25s ease-out",boxShadow:`0 4px 20px ${c}60`
        }}>{toast}</div>
      )}

      <div style={{
        display:"flex",height:"100vh",width:"100vw",
        background:"#06090f",fontFamily:"'DM Sans',sans-serif",overflow:"hidden"
      }}>

        {/* ═══ THREE STRIPES ═══ */}
        <div style={{ display:"flex",flexDirection:"row",zIndex:20,borderRight:`1px solid ${c}12` }}>

          {/* Stripe 1 — Version icons */}
          <div style={{
            width:52,background:"rgba(0,0,0,0.45)",
            borderRight:"1px solid rgba(255,255,255,0.04)",
            display:"flex",flexDirection:"column",alignItems:"center",
            paddingTop:14,gap:5
          }}>
            <div style={{
              fontFamily:"'Orbitron',monospace",fontSize:8,color:c,
              letterSpacing:"0.22em",writingMode:"vertical-rl",
              transform:"rotate(180deg)",marginBottom:12,opacity:.55
            }}>VIO</div>
            {VIO_VERSIONS.map(v=>{
              const act = version.id===v.id;
              return (
                <button key={v.id}
                  onClick={()=>{ setVersion(v); setMessages([]); }}
                  title={`VIO ${v.id} — ${v.desc}`}
                  style={{
                    width:36,height:36,borderRadius:10,flexShrink:0,
                    border:`1.5px solid ${act?v.color+"65":"rgba(255,255,255,0.06)"}`,
                    background: act&&v.isUltra?"linear-gradient(135deg,#f43f5e1a,#a78bfa1a)"
                              : act?`${v.color}1c`:"transparent",
                    color:act?v.color:"rgba(255,255,255,0.22)",
                    cursor:"pointer",fontSize:14,transition:"all .2s",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    animation:act?"vGlow 2s ease-in-out infinite":"none",
                    position:"relative"
                  }}>
                  {v.icon}
                  {(v.isPro||v.isUltra) && (
                    <div style={{
                      position:"absolute",bottom:-1,right:-1,
                      width:8,height:8,borderRadius:"50%",
                      background:v.isUltra?"linear-gradient(135deg,#f43f5e,#a78bfa)":"#e879f9",
                      border:"1px solid #06090f"
                    }}/>
                  )}
                </button>
              );
            })}
            <div style={{ flex:1 }}/>
            <div style={{
              width:6,height:6,borderRadius:"50%",
              background:"#00f5a0",boxShadow:"0 0 8px #00f5a0",
              marginBottom:14,animation:"vPulse 2s ease-in-out infinite",opacity:1
            }}/>
          </div>

          {/* Stripe 2 — Mode tabs */}
          <div style={{
            width:44,background:"rgba(0,0,0,0.28)",
            borderRight:"1px solid rgba(255,255,255,0.03)",
            display:"flex",flexDirection:"column",alignItems:"center",
            paddingTop:58,gap:3
          }}>
            {MODES.map(m=>(
              <button key={m.label} className="vstripebtn"
                title={m.label}
                onClick={()=>setActiveMode(m.label)}
                style={{
                  width:36,height:36,borderRadius:8,
                  border:`1px solid ${activeMode===m.label?c+"40":"transparent"}`,
                  background:activeMode===m.label?`${c}10`:"transparent",
                  cursor:"pointer",fontSize:16,transition:"all .2s",
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}>
                {m.icon}
              </button>
            ))}
          </div>

          {/* Stripe 3 — Collapsible feature panel */}
          <div style={{
            width:stripeOpen?188:36,transition:"width .3s cubic-bezier(.4,0,.2,1)",
            background:"rgba(0,0,0,0.2)",overflow:"hidden",
            display:"flex",flexDirection:"column"
          }}>
            <button onClick={()=>setStripeOpen(!stripeOpen)}
              style={{
                width:36,height:36,background:"none",border:"none",
                color:c,cursor:"pointer",fontSize:13,opacity:.5,
                transition:"all .2s",alignSelf:"flex-start",marginTop:13,flexShrink:0
              }}>
              {stripeOpen?"◀":"▶"}
            </button>

            {stripeOpen && (
              <div style={{ padding:"4px 11px 14px",animation:"sIn .2s ease-out",minWidth:177 }}>

                {/* Version info card */}
                <div style={{
                  padding:"10px 11px",borderRadius:9,marginBottom:11,
                  background:version.isUltra
                    ?"linear-gradient(135deg,#f43f5e0e,#a78bfa0e)"
                    :`${c}0d`,
                  border:`1px solid ${c}20`
                }}>
                  <div style={{
                    fontFamily:"'Orbitron',monospace",fontSize:11,marginBottom:2,
                    background: version.isUltra
                      ?"linear-gradient(135deg,#f43f5e,#e879f9,#a78bfa,#38bdf8)"
                      :"none",
                    color: version.isUltra?"transparent":c,
                    WebkitBackgroundClip:version.isUltra?"text":"unset",
                    WebkitTextFillColor:version.isUltra?"transparent":"unset",
                    backgroundSize:"300% 300%",
                    animation:version.isUltra?"ultraShift 3s linear infinite":"none"
                  }}>VIO {version.id}</div>
                  <div style={{ fontSize:10,color:"rgba(255,255,255,0.32)",marginBottom:5 }}>{version.desc}</div>
                  <div style={{
                    fontSize:9,padding:"2px 7px",borderRadius:20,display:"inline-block",
                    border:`1px solid ${c}28`,
                    background:version.isUltra
                      ?"linear-gradient(135deg,#f43f5e25,#a78bfa25)"
                      :`${c}18`,
                    color:c,letterSpacing:"0.1em"
                  }}>{version.badge}</div>
                </div>

                {/* Quick features */}
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.2)",letterSpacing:"0.12em",marginBottom:5,paddingLeft:2 }}>FITUR CEPAT</div>
                {[
                  { icon:"📷", label:"Kirim Foto",    fn:()=>fileRef.current?.click() },
                  { icon:"⚙️", label:"Mode Kode",     fn:()=>{ setActiveMode("Kode"); showToast("Mode Kode aktif!"); } },
                  { icon:"⎘",  label:"Salin Semua Chat", fn:()=>{
                    const t=messages.map(m=>`${m.role==="user"?"Kamu":"VIO"}: ${m.content}`).join("\n\n");
                    navigator.clipboard.writeText(t||"(belum ada chat)");
                    showToast("Chat disalin!");
                  }},
                  { icon:"🔄", label:"Reset Chat",    fn:()=>{ setMessages([]); showToast("Chat direset!"); } },
                ].map(f=>(
                  <button key={f.label} className="vstripebtn"
                    onClick={f.fn}
                    style={{
                      width:"100%",textAlign:"left",padding:"7px 9px",
                      borderRadius:7,border:"none",
                      background:"transparent",color:"rgba(255,255,255,0.4)",
                      cursor:"pointer",fontSize:12,transition:"all .2s",
                      display:"flex",gap:8,alignItems:"center",marginBottom:2
                    }}>
                    <span>{f.icon}</span><span>{f.label}</span>
                  </button>
                ))}

                <div style={{ margin:"11px 0 4px",fontSize:10,color:"rgba(255,255,255,0.18)",letterSpacing:"0.1em" }}>MODE</div>
                <div style={{ color:c,fontSize:12,fontFamily:"'Orbitron',monospace",marginBottom:11 }}>{activeMode}</div>

                {/* Version switcher */}
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",letterSpacing:"0.1em",marginBottom:5 }}>VERSI</div>
                {VIO_VERSIONS.map(v=>(
                  <button key={v.id} className="vstripebtn"
                    onClick={()=>{ setVersion(v); setMessages([]); setStripeOpen(false); }}
                    style={{
                      width:"100%",textAlign:"left",padding:"5px 9px",
                      borderRadius:6,
                      border:`1px solid ${version.id===v.id?v.color+"40":"transparent"}`,
                      background:version.id===v.id?`${v.color}0e`:"transparent",
                      color:version.id===v.id?v.color:"rgba(255,255,255,0.28)",
                      cursor:"pointer",fontSize:11,transition:"all .2s",
                      display:"flex",gap:7,alignItems:"center",marginBottom:2
                    }}>
                    <span>{v.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'Orbitron',monospace",fontSize:9 }}>VIO {v.id}</div>
                      {v.isPro && <div style={{ fontSize:8,color:"#e879f9",opacity:.7 }}>PRO</div>}
                      {v.isUltra && <div style={{ fontSize:8,color:"#f43f5e",opacity:.7 }}>ULTRA</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ═══ MAIN CHAT ═══ */}
        <div style={{ flex:1,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden" }}>
          <VersionBg version={version}/>

          {/* Header */}
          <div style={{
            padding:"12px 20px",borderBottom:`1px solid ${c}12`,
            background:"rgba(0,0,0,0.38)",backdropFilter:"blur(14px)",
            display:"flex",alignItems:"center",gap:10,zIndex:10,flexShrink:0
          }}>
            <div style={{
              fontFamily:"'Orbitron',monospace",fontSize:15,fontWeight:900,letterSpacing:"0.05em",
              background:version.isUltra
                ?"linear-gradient(135deg,#f43f5e,#e879f9,#a78bfa,#38bdf8)"
                :"none",
              color:version.isUltra?"transparent":c,
              WebkitBackgroundClip:version.isUltra?"text":"unset",
              WebkitTextFillColor:version.isUltra?"transparent":"unset",
              backgroundSize:"300% 300%",
              animation:version.isUltra?"ultraShift 3s linear infinite":"none",
              textShadow:!version.isUltra?`0 0 16px ${c}50`:"none"
            }}>VIO {version.id}</div>

            <div style={{
              fontSize:9,padding:"2px 8px",borderRadius:20,
              border:`1px solid ${c}30`,color:c+"80",letterSpacing:"0.12em"
            }}>{version.badge}</div>

            {(version.isPro||version.isUltra) && (
              <div style={{
                fontSize:9,padding:"2px 8px",borderRadius:20,
                background:version.isUltra
                  ?"linear-gradient(135deg,#f43f5e18,#a78bfa18)"
                  :"#e879f912",
                border:version.isUltra?"1px solid #a78bfa35":"1px solid #e879f935",
                color:version.isUltra?"#e879f9":"#e879f9",letterSpacing:"0.1em"
              }}>{version.isUltra?"◆ AI ULTRA":"⬟ PRO"}</div>
            )}

            <div style={{ flex:1 }}/>
            <div style={{ fontSize:10,color:"rgba(255,255,255,0.22)" }}>
              {version.desc} · <span style={{ color:c }}>{activeMode}</span>
            </div>
          </div>

          {/* Messages */}
          <div ref={chatRef} style={{
            flex:1,overflowY:"auto",padding:"20px 22px",
            position:"relative",zIndex:1
          }}>
            {messages.length===0 && (
              <div style={{ textAlign:"center",marginTop:"10vh" }}>
                <div style={{
                  fontFamily:"'Orbitron',monospace",fontSize:46,fontWeight:900,marginBottom:10,
                  background:version.isUltra
                    ?"linear-gradient(135deg,#f43f5e,#e879f9,#a78bfa,#38bdf8)"
                    :"none",
                  color:version.isUltra?"transparent":c,
                  WebkitBackgroundClip:version.isUltra?"text":"unset",
                  WebkitTextFillColor:version.isUltra?"transparent":"unset",
                  backgroundSize:"300% 300%",
                  animation:version.isUltra?"ultraShift 3s linear infinite":"none",
                  textShadow:!version.isUltra?`0 0 50px ${c}50`:"none"
                }}>{version.icon}</div>
                <div style={{
                  fontFamily:"'Orbitron',monospace",fontSize:20,fontWeight:700,marginBottom:6,
                  background:version.isUltra?"linear-gradient(135deg,#f43f5e,#a78bfa)":"none",
                  color:version.isUltra?"transparent":c,
                  WebkitBackgroundClip:version.isUltra?"text":"unset",
                  WebkitTextFillColor:version.isUltra?"transparent":"unset",
                  textShadow:!version.isUltra?`0 0 28px ${c}45`:"none"
                }}>VIO {version.id}</div>
                <div style={{ color:"rgba(255,255,255,0.25)",fontSize:12,marginBottom:16 }}>{version.desc}</div>
                {version.isUltra && <div style={{ fontSize:10,color:"rgba(255,255,255,0.18)",marginBottom:16,letterSpacing:"0.1em" }}>◆ AI ULTRA — Melampaui semua batas</div>}
                {version.isPro && <div style={{ fontSize:10,color:"#e879f970",marginBottom:16 }}>⬟ Coding + Deskripsi + Konten Profesional</div>}
                <div style={{
                  display:"inline-flex",gap:7,alignItems:"center",
                  padding:"7px 15px",borderRadius:20,marginBottom:16,cursor:"pointer",
                  border:`1px solid ${c}25`,background:`${c}07`,color:c+"65",fontSize:11
                }} onClick={()=>fileRef.current?.click()}>
                  📷 Kirim foto soal PR / kode / dokumen
                </div>
                <div style={{ display:"flex",gap:7,justifyContent:"center",flexWrap:"wrap",maxWidth:480,margin:"0 auto" }}>
                  {suggestions.map(s=>(
                    <button key={s} onClick={()=>setInput(s)} style={{
                      padding:"6px 13px",borderRadius:20,
                      border:`1px solid ${c}20`,background:`${c}07`,
                      color:"rgba(255,255,255,0.38)",cursor:"pointer",fontSize:11,transition:"all .2s"
                    }}
                    onMouseEnter={e=>{e.target.style.borderColor=c+"55";e.target.style.color=c;}}
                    onMouseLeave={e=>{e.target.style.borderColor=c+"20";e.target.style.color="rgba(255,255,255,0.38)";}}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m,i)=><ChatBubble key={i} msg={m} version={version}/>)}

            {loading && (
              <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                <div style={{
                  width:30,height:30,borderRadius:"50%",
                  background:version.isUltra?"linear-gradient(135deg,#f43f5e1e,#a78bfa1e)":`${c}15`,
                  border:`1.5px solid ${c}48`,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,color:c,fontWeight:900
                }}>{version.icon}</div>
                <div style={{
                  padding:"10px 14px",borderRadius:"16px 16px 16px 4px",
                  background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)"
                }}>
                  <TypingDots color={c}/>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{
            padding:"11px 20px 16px",zIndex:10,flexShrink:0,
            background:"rgba(0,0,0,0.42)",backdropFilter:"blur(18px)",
            borderTop:`1px solid ${c}0e`
          }}>
            {imgPreview && (
              <div style={{ marginBottom:8 }}>
                <div style={{ position:"relative",display:"inline-block" }}>
                  <img src={imgPreview} alt="" style={{
                    maxHeight:110,maxWidth:190,borderRadius:9,
                    border:"1.5px solid rgba(255,255,255,0.14)",display:"block"
                  }}/>
                  <button onClick={()=>{ setImgData(null); setImgPreview(null); }}
                    style={{
                      position:"absolute",top:-7,right:-7,width:21,height:21,
                      borderRadius:"50%",background:"#f43f5e",border:"none",
                      color:"#fff",cursor:"pointer",fontSize:13,fontWeight:900,
                      display:"flex",alignItems:"center",justifyContent:"center"
                    }}>×</button>
                </div>
                <div style={{ fontSize:10,color:c+"65",marginTop:3 }}>📷 Foto siap — AI akan membaca otomatis</div>
              </div>
            )}

            <div style={{
              display:"flex",gap:8,alignItems:"flex-end",
              background:"rgba(255,255,255,0.03)",
              border:`1px solid ${c}22`,borderRadius:13,padding:"9px 13px"
            }}>
              <button onClick={()=>fileRef.current?.click()}
                title="Kirim foto soal / kode"
                style={{
                  width:33,height:33,borderRadius:8,flexShrink:0,
                  border:`1px solid ${c}28`,background:`${c}0d`,
                  color:c,cursor:"pointer",fontSize:15,transition:"all .2s",
                  display:"flex",alignItems:"center",justifyContent:"center"
                }}
                onMouseEnter={e=>e.currentTarget.style.background=`${c}20`}
                onMouseLeave={e=>e.currentTarget.style.background=`${c}0d`}>
                📷
              </button>

              <textarea ref={textRef} value={input}
                onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); send(); } }}
                placeholder={
                  version.isUltra?"Tanya VIO K4 ULTRA — coding, bisnis, analisis, otomasi…":
                  version.isPro?"Tanya VIO K3.5 PRO — kode, deskripsi produk, konten…":
                  `Tanya VIO ${version.id}… atau kirim foto 📷`
                }
                rows={1}
                style={{
                  flex:1,background:"none",border:"none",color:"#e2e8f0",
                  fontSize:13,resize:"none",lineHeight:1.55,
                  fontFamily:"'DM Sans',sans-serif",maxHeight:110,overflowY:"auto"
                }}/>

              <button className="vsend" onClick={send} disabled={loading}
                style={{
                  width:34,height:34,borderRadius:9,flexShrink:0,
                  border:`1px solid ${c}45`,
                  background:version.isUltra
                    ?"linear-gradient(135deg,#f43f5e1a,#a78bfa1a)"
                    :`${c}12`,
                  color:c,cursor:"pointer",fontSize:15,transition:"all .2s",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  opacity:loading?.4:1,fontWeight:700
                }}>↑</button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:"none" }}/>
            <div style={{ textAlign:"center",marginTop:5,fontSize:10,color:"rgba(255,255,255,0.14)" }}>
              Enter kirim · Shift+Enter baris baru · 📷 foto dibaca AI · ⎘ salin tiap blok kode
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
