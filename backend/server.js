import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================== AI ENGINE ========================
// Fallback AI lokal (tanpa API key)
function getLocalResponse(message, version) {
  const lower = message.toLowerCase();
  
  // Matematika
  const mathMatch = lower.match(/(\d+)\s*([\+\-\*\/])\s*(\d+)/);
  if (mathMatch) {
    const a = parseFloat(mathMatch[1]), b = parseFloat(mathMatch[3]);
    const op = mathMatch[2];
    let result;
    if (op === '+') result = a + b;
    else if (op === '-') result = a - b;
    else if (op === '*') result = a * b;
    else if (op === '/') result = b !== 0 ? a / b : 'Error (bagi nol)';
    return `🧮 Hasil: ${a} ${op} ${b} = ${result}`;
  }
  
  // Pengetahuan dasar
  const knowledge = {
    'halo': `Halo! Saya VIO ${version}. Ada yang bisa dibantu?`,
    'apa itu javascript': 'JavaScript adalah bahasa pemrograman untuk web, bisa bikin website interaktif.',
    'apa itu react': 'React adalah library JavaScript buat bikin UI dari Facebook.',
    'cara buat website': 'Belajar HTML, CSS, JS, lalu hosting di Vercel/Netlify.',
    'apa itu ai': 'AI adalah kecerdasan buatan. Contoh: ChatGPT, mobil otonom.',
  };
  
  for (const [key, answer] of Object.entries(knowledge)) {
    if (lower.includes(key)) return answer;
  }
  
  return `🤖 [VIO ${version}] Saya asisten AI. Coba tanyakan: "apa itu javascript", "hitung 5+3", atau "cara buat website".`;
}

// Endpoint chat
app.post('/api/chat', async (req, res) => {
  const { message, version } = req.body;
  if (!message) return res.status(400).json({ error: 'Pesan kosong' });
  
  // Jika ada API key (Anthropic atau OpenAI), panggil API asli
  // Untuk contoh ini, kita pakai AI lokal dulu (bisa diganti)
  const reply = getLocalResponse(message, version);
  res.json({ reply });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Backend VIO berjalan di port ${PORT}`));
