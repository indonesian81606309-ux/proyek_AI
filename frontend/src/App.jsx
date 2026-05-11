import { useState, useRef, useEffect } from 'react';

// Versi AI
const VERSI = [
  { id: 'K1.5', nama: 'K1.5', warna: '#00f5a0', desc: 'Ringan & Cepat' },
  { id: 'K2', nama: 'K2', warna: '#3b82f6', desc: 'Standar Pintar' },
  { id: 'K2.5', nama: 'K2.5', warna: '#f59e0b', desc: 'Advanced + Bisnis' },
  { id: 'K3', nama: 'K3', warna: '#ef4444', desc: 'Super Pro' }
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [versiAktif, setVersiAktif] = useState(VERSI[1]);
  const [pesan, setPesan] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [pesan, loading]);

  const kirimPesan = async () => {
    if (!input.trim() || loading) return;
    const teksUser = input.trim();
    setPesan(prev => [...prev, { role: 'user', content: teksUser }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: teksUser, version: versiAktif.id })
      });
      const data = await res.json();
      setPesan(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setPesan(prev => [...prev, { role: 'assistant', content: '❌ Gagal terhubung ke server. Coba lagi nanti.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(15, 18, 31, 0.9)',
      backdropFilter: 'blur(12px)',
      borderRadius: '28px',
      overflow: 'hidden',
      boxShadow: '0 25px 45px rgba(0,0,0,0.5)',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      {/* Header */}
      <div style={{
        background: '#0b0e18',
        padding: '16px 20px',
        textAlign: 'center',
        borderBottom: `2px solid ${versiAktif.warna}`
      }}>
        <h1 style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, #00f5a0, #3b82f6)', backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent' }}>
          VIO AI
        </h1>
        <p style={{ color: '#a0aec0', fontSize: '0.8rem' }}>{versiAktif.desc} — {versiAktif.id}</p>
      </div>

      {/* Pilih Versi */}
      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', background: '#0b0e18', justifyContent: 'center', flexWrap: 'wrap' }}>
        {VERSI.map(v => (
          <button
            key={v.id}
            onClick={() => setVersiAktif(v)}
            style={{
              background: versiAktif.id === v.id ? v.warna : '#1e293b',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '40px',
              color: versiAktif.id === v.id ? '#0b0e18' : '#e2e8f0',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: '0.2s',
              boxShadow: versiAktif.id === v.id ? `0 0 12px ${v.warna}` : 'none'
            }}
          >
            {v.nama}
          </button>
        ))}
      </div>

      {/* Area Chat */}
      <div ref={chatRef} style={{
        height: '420px',
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        background: '#0b0e18'
      }}>
        {pesan.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '100px', color: '#7c8ba0' }}>
            Kirim pesan ke VIO...<br />
            Contoh: "apa itu JavaScript", "hitung 15*7"
          </div>
        )}
        {pesan.map((msg, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
          }}>
            <div style={{
              maxWidth: '75%',
              padding: '10px 14px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.role === 'user' ? `linear-gradient(135deg, ${versiAktif.warna}, ${versiAktif.warna}cc)` : '#1e293b',
              color: 'white',
              fontSize: '0.9rem',
              lineHeight: '1.45',
              wordBreak: 'break-word'
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ background: '#1e293b', padding: '10px 16px', borderRadius: '20px' }}>
              <div className="typing"><span></span><span></span><span></span></div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px', background: '#0b0e18', borderTop: '1px solid #2a2f3f' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && kirimPesan()}
          placeholder="Tanya VIO..."
          style={{
            flex: 1,
            background: '#1a1f2e',
            border: 'none',
            padding: '12px 16px',
            borderRadius: '40px',
            color: 'white',
            outline: 'none'
          }}
        />
        <button
          onClick={kirimPesan}
          disabled={loading}
          style={{
            background: versiAktif.warna,
            border: 'none',
            padding: '12px 20px',
            borderRadius: '40px',
            color: '#0b0e18',
            fontWeight: 'bold',
            cursor: 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          Kirim
        </button>
      </div>

      {/* Animasi titik-titik (CSS) */}
      <style>{`
        .typing {
          display: flex;
          gap: 5px;
          align-items: center;
        }
        .typing span {
          width: 7px;
          height: 7px;
          background: #a5b4fc;
          border-radius: 50%;
          animation: blink 1.2s infinite;
        }
        .typing span:nth-child(2) { animation-delay: 0.2s; }
        .typing span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes blink {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0);}
          30% { opacity: 1; transform: translateY(-3px);}
        }
      `}</style>
    </div>
  );
}

export default App;
