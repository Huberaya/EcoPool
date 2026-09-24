import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// Initialize Gemini Client if API key is available
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI({ apiKey });
  } catch (err) {
    console.warn('Could not initialize GoogleGenAI client:', err);
  }
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    platform: 'EcoPool B2B Sourcing Platform',
    geminiEnabled: Boolean(aiClient)
  });
});

// Gemini Assistant API Endpoint
app.post('/api/gemini/assistant', async (req, res) => {
  const { mode, userMessage, context } = req.body;

  if (!aiClient) {
    return res.status(200).json({
      fallback: true,
      message: 'Gemini server client not configured with live key; using heuristic fallback.'
    });
  }

  try {
    const systemPrompt = `Tu es l'intelligence artificielle centrale d'EcoPool, une centrale d'achat collaborative B2B spécialisée dans les matières premières, composants et emballages écoresponsables.
Tu aides les PME, directeurs des achats, responsables RSE et industriels à agréger leurs commandes pour atteindre les Minimum Order Quantities (MOQ) des fabricants.

Mode actuel: ${mode}
(Modes possibles:
- 'achat': Assistant procurement pour PME, recherche et calcul de paliers et économies.
- 'sourcing': Analyse de la file d'attente d'agrégation et opportunités de nouvelles campagnes.
- 'conformite': Analyse rigoureuse des certificats (GRS, FSC, GOTS, C2C, Ecocert) et dates de validité.
- 'admin': Cockpit stratégique des volumes, du taux de remplissage des MOQ et risques logistiques).

Données de contexte de la plateforme:
Campagnes actives: ${JSON.stringify(context?.campaigns?.map((c: any) => ({
      id: c.id,
      title: c.title,
      moq: c.moq,
      reserved: c.reservedVolume,
      price: c.currentUnitPrice,
      status: c.status,
      certifications: c.certifications.map((ct: any) => ct.name + ' (' + ct.status + ')')
    })))}

Réponds de manière professionnelle, précise, chiffrée (calculs de paliers, économies en €, pourcentages), orientée procurement industriel B2B. En français. Utilise des puces et du markdown clair.`;

    const response = await aiClient.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nQuestion de l'utilisateur:\n${userMessage}`,
      config: {
        temperature: 0.2
      }
    });

    const reply = response.text || '';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error generating AI response:', error);
    return res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

async function start() {
  // Vite Dev Server middleware mode in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production serve dist
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoPool B2B Server running on port ${PORT}`);
  });
}

start();
