import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
const api_key = process.env.GEMINI_API_KEY;

if (api_key && api_key !== "MY_GEMINI_API_KEY") {
  try {
    ai = new GoogleGenAI({
      apiKey: api_key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Successfully initialized server-side Gemini client.");
  } catch (error) {
    console.warn("Error setting up Gemini client:", error);
  }
} else {
  console.warn("GEMINI_API_KEY environment variable is not defined or is set to placeholder. Operating in simulated fallback mode.");
}

// REST API Endpoints

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!ai });
});

// 2. Co-pilot Chat Route
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, selectedAsset } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format." });
  }

  // Fallback system response if API key is not yet set
  if (!ai) {
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let responseText = `Hi there! I'm your ApexTrade Co-pilot. I noticed your **GEMINI_API_KEY** is not configured. 

To unlock full institutional-grade analysis using Gemini 3.5:
1. Open the **Secrets / Settings** panel in AI Studio.
2. Add a new variable called \`GEMINI_API_KEY\` with your credential.

In the meantime, here is a simulated trading signal:
- **Selected Asset**: ${selectedAsset || "None selected"}
- **Technical Indicator Recommendation**: MACD shows dynamic buy divergence. 
- **Risk management**: Trade with tight stop-losses when leverage is high!

Have another trading question? I'll do my best to simulate a expert answer for: "${lastUserMessage.slice(0, 60)}..."`;
    return res.json({ text: responseText, isMock: true });
  }

  try {
    // Collect message conversation format for Gemini
    const systemPrompt = `You are "ApexTrade AI Co-pilot", an elite server-side quantitative analyst, institutional broker trader, and financial advisor.
Your persona is incredibly smart, professional, highly technical (similar to experienced Exness and Robinhood users), and concise.
You understand leverage (up to 500x), spreads, margins, Bollinger Bands, RSI, MACD, and order books.
Address the user specifically about their asset of interest if specified: "${selectedAsset || 'None specified'}".
Review their trading concerns and provide highly actionable broker advice: entry zone, target P&L, stop-loss triggers, and leverage caution.
Format your output with clean typography, bullet points, and dynamic structural headings.`;

    const chatContent = messages.map(msg => {
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        { role: "user", parts: [{ text: systemPrompt }] },
        ...chatContent
      ],
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text || "I was unable to formulate a response. Please try another query.", isMock: false });
  } catch (err: any) {
    console.warn("Gemini API Chat failure (falling back to simulation):", err);
    const lastUserMessage = messages[messages.length - 1]?.content || "";
    let responseText = `🤖 **ApexTrade AI Co-pilot (Simulated Analyser)**

*Notice: A Gemini API access condition was detected (${err.message || "PERMISSION_DENIED"}). Standard simulation mode has been activated to resolve queries on this device.*

Here is my high-precision analysis for **${selectedAsset || "your selected asset"}**:
*   **Trend Indicator**: Strong base formation near local historical consensus levels.
*   **Volatiles Metric**: RSI is stable, suggesting gradual buy accumulation.
*   **Advice**: Utilize moderate leverage (10x-20x) and place stop-losses dynamically.

In response to your query ("*${lastUserMessage.slice(0, 60)}...*"), I recommend monitoring local chart divergences and waiting for confirm signals.`;
    res.json({ text: responseText, isMock: true, apiError: err.message });
  }
});

// 3. Technical Asset Analysis
app.post("/api/gemini/analyze", async (req, res) => {
  const { assetId, assetName, currentPrice, change24h, historyClosePrices } = req.body;

  if (!assetId) {
    return res.status(400).json({ error: "Asset ID is required." });
  }

  const prompt = `Perform a high-precision technical chart analysis on ${assetName} (${assetId}).
  The asset is currently trading at $${currentPrice} with a 24-hour performance of ${change24h}%.
  Recent price trend: [${(historyClosePrices || []).join(", ")}].
  
  Generate an institutional quant intelligence report styled for robinhood & exness traders. Include:
  1. **Trend Sentiment** (e.g. Bullish Outbreak, Bearish Retracement, Consolidation Zone)
  2. **Key Bollinger Band Levels** and RSI momentum estimate
  3. **Structured Trade Action Plan**:
     - Buy Limit / Long entry target range
     - Sell Limit / Short entry target range
     - Projected Stop Loss (SL) and Take Profit (TP) levels for 10x-50x leverage.
  4. Keep it highly concise, structured, with distinct headings, and elegant markdown formatting!`;

  const isUp = change24h >= 0;
  const computedRsi = isUp ? 68 : 38;
  const getFallbackReport = (errorMessage?: string) => {
    return `### 📊 ApexTrade Quantitative Intelligence Report: **${assetId}** ${errorMessage ? '(Simulated fallback)' : ''}

${errorMessage ? `*Notice: Gemini API status is inactive on this project (${errorMessage}). Our local algorithmic matrix has simulated the technicals.*` : `*Unlock direct Gemini AI cloud insights by configuring your \`GEMINI_API_KEY\` in your AI Studio secrets panel!*`}

*   **Market Sentiment**: ${isUp ? '📈 BULLISH BOUNCE' : '📉 BEARISH PRESSURE'} (Consolidating near key structural support)
*   **Momentum Matrix**: RSI(14) is at **${computedRsi}**, MACD shows a signal line golden crossover.
*   **Estimated Moving Averages**: SMA-20 stands comfortable at $${(currentPrice * 0.995).toFixed(2)}.

#### 🛠️ Professional Action Plan (Simulated)
*   **Recommended Long Entry Area**: $${(currentPrice * 0.99).toFixed(2)} - $${(currentPrice * 0.995).toFixed(2)}
*   **Take Profit Targets (TP)**: $${(currentPrice * 1.05).toFixed(2)} (Target 1) | $${(currentPrice * 1.12).toFixed(2)} (Target 2)
*   **Dynamic Stop Loss (SL)**: $${(currentPrice * 0.965).toFixed(2)}
*   **Recommended Leverage Limit**: Limit to maximum **20x** to shield from standard volatility.`;
  };

  if (!ai) {
    return res.json({ report: getFallbackReport(), isMock: true });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.5,
      }
    });

    res.json({ report: response.text || "Analysis generated unsuccessfully.", isMock: false });
  } catch (err: any) {
    console.warn("Gemini Analyze failure (falling back to simulation):", err);
    res.json({ report: getFallbackReport(err.message), isMock: true, apiError: err.message });
  }
});

// Vite & Static file handles
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated successfully.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ApexTrade running on port ${PORT}`);
  });
}

setupServer();
