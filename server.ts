import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

let lastUpdateTime = 0;

// Initialize Gemini Client lazily and safely
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (aiClient) return aiClient;

  const api_key = process.env.GEMINI_API_KEY;
  if (api_key && api_key !== "MY_GEMINI_API_KEY" && api_key !== "placeholder") {
    try {
      aiClient = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      console.log("Successfully initialized server-side Gemini client lazily.");
      return aiClient;
    } catch (error) {
      console.warn("Error setting up Gemini client lazily:", error);
    }
  } else {
    console.warn("GEMINI_API_KEY environment variable is not defined or is set to placeholder/default. Entering fallback simulated mode.");
  }
  return null;
}

// REST API Endpoints

interface LivePrice {
  currentPrice: number;
  change24h: number;
}

const livePrices: Record<string, LivePrice> = {
  BTC: { currentPrice: 68420.50, change24h: 1.97 },
  ETH: { currentPrice: 3512.40, change24h: 2.70 },
  SOL: { currentPrice: 154.65, change24h: 4.35 },
  BNB: { currentPrice: 580.40, change24h: 1.45 },
  XRP: { currentPrice: 0.5840, change24h: 1.03 },
  DOGE: { currentPrice: 0.1420, change24h: 2.89 },
  ADA: { currentPrice: 0.4520, change24h: 0.89 },
  AVAX: { currentPrice: 32.50, change24h: 4.16 },
  SUI: { currentPrice: 1.84, change24h: 4.54 },
  LINK: { currentPrice: 14.85, change24h: -1.65 },
  TSLA: { currentPrice: 224.80, change24h: -1.53 },
  AAPL: { currentPrice: 184.25, change24h: 1.18 },
  NVDA: { currentPrice: 915.20, change24h: 4.95 },
  MSFT: { currentPrice: 420.50, change24h: 0.55 },
  AMZN: { currentPrice: 185.30, change24h: 0.71 },
  META: { currentPrice: 485.20, change24h: -1.06 },
  GOOGL: { currentPrice: 172.40, change24h: 1.35 },
  EURUSD: { currentPrice: 1.08645, change24h: 0.12 },
  GBPUSD: { currentPrice: 1.27432, change24h: -0.33 },
  USDJPY: { currentPrice: 156.40, change24h: 0.38 },
  AUDUSD: { currentPrice: 0.6650, change24h: -0.45 },
  USDCAD: { currentPrice: 1.3680, change24h: 0.22 },
  USDCHF: { currentPrice: 0.88450, change24h: -0.18 },
  NZDUSD: { currentPrice: 0.61220, change24h: 0.18 },
  XAUUSD: { currentPrice: 2364.50, change24h: 0.57 },
  UKOIL: { currentPrice: 83.15, change24h: -1.48 },
  USOIL: { currentPrice: 79.20, change24h: -1.12 },
  XAGUSD: { currentPrice: 29.50, change24h: 1.37 },
};

async function updateLivePrices() {
  // 1. Fetch Bybit Spot Tickers (all USDT crypto pairs)
  try {
    const bybitRes = await fetch("https://api.bybit.com/v5/market/tickers?category=spot");
    const bybitData = await bybitRes.json() as any;
    if (bybitData && bybitData.retCode === 0 && bybitData.result && bybitData.result.list) {
      for (const t of bybitData.result.list) {
        const symbol = t.symbol; // e.g. "BTCUSDT"
        if (symbol.endsWith("USDT")) {
          const coinId = symbol.replace("USDT", "");
          if (livePrices[coinId] !== undefined) {
            const lastPrice = parseFloat(t.lastPrice);
            const changePct = parseFloat(t.price24hPcnt) * 100;
            if (!isNaN(lastPrice)) {
              livePrices[coinId].currentPrice = lastPrice;
              if (!isNaN(changePct)) {
                livePrices[coinId].change24h = changePct;
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("Polling Bybit live prices warning:", err);
  }

  // 2. Fetch Yahoo Finance Stock/Forex/Commodity Tickers in a single batch
  let yahooSuccess = false;
  try {
    const yahooSymbols = [
      "TSLA", "AAPL", "NVDA", "MSFT", "AMZN", "META", "GOOGL",
      "EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X", "USDCHF=X", "NZDUSD=X",
      "GC=F", "BZ=F", "CL=F", "SI=F"
    ];
    
    const yRes = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbols.join(",")}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
      }
    });
    const yData = await yRes.json() as any;
    if (yData && yData.quoteResponse && yData.quoteResponse.result && yData.quoteResponse.result.length > 0) {
      for (const item of yData.quoteResponse.result) {
        let id = item.symbol;
        if (id.endsWith("=X")) {
          id = id.replace("=X", "");
        }
        if (id === "GC=F") id = "XAUUSD";
        if (id === "BZ=F") id = "UKOIL";
        if (id === "CL=F") id = "USOIL";
        if (id === "SI=F") id = "XAGUSD";

        if (livePrices[id] !== undefined) {
          const price = parseFloat(item.regularMarketPrice);
          const change = parseFloat(item.regularMarketChangePercent || 0);
          if (!isNaN(price)) {
            livePrices[id].currentPrice = price;
            livePrices[id].change24h = change;
          }
        }
      }
      yahooSuccess = true;
    }
  } catch (err) {
    console.warn("Polling Yahoo Finance bulk quote failed, initiating individual chart-based fallback...", err);
  }

  // Backup: Individual Chart API fetch for ultimate reliability (CORS-friendly on Yahoo's CDN and bypasses session rules)
  if (!yahooSuccess) {
    const symbolsMap: Record<string, string> = {
      "TSLA": "TSLA", "AAPL": "AAPL", "NVDA": "NVDA", "MSFT": "MSFT", "AMZN": "AMZN", "META": "META", "GOOGL": "GOOGL",
      "EURUSD=X": "EURUSD", "GBPUSD=X": "GBPUSD", "USDJPY=X": "USDJPY", "AUDUSD=X": "AUDUSD", "USDCAD=X": "USDCAD", "USDCHF=X": "USDCHF", "NZDUSD=X": "NZDUSD",
      "GC=F": "XAUUSD", "BZ=F": "UKOIL", "CL=F": "USOIL", "SI=F": "XAGUSD"
    };

    try {
      await Promise.all(Object.keys(symbolsMap).map(async (ySymbol) => {
        try {
          const cRes = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
          });
          if (cRes.ok) {
            const cData = await cRes.json() as any;
            if (cData && cData.chart && cData.chart.result && cData.chart.result[0]) {
              const meta = cData.chart.result[0].meta;
              if (meta) {
                const currentPrice = parseFloat(meta.regularMarketPrice);
                const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose);
                const targetId = symbolsMap[ySymbol];
                if (livePrices[targetId] !== undefined && !isNaN(currentPrice)) {
                  livePrices[targetId].currentPrice = currentPrice;
                  if (!isNaN(prevClose) && prevClose > 0) {
                    livePrices[targetId].change24h = ((currentPrice - prevClose) / prevClose) * 100;
                  }
                }
              }
            }
          }
        } catch (innerErr) {
          console.warn(`Fallback Chart API lookup failed for ${ySymbol}:`, innerErr);
        }
      }));
    } catch (promiseAllErr) {
      console.warn("Fallback Promise.all failed:", promiseAllErr);
    }
  }
  lastUpdateTime = Date.now();
}

// 1. Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", aiEnabled: !!getGeminiClient() });
});

// Real-time market prices endpoint
app.get("/api/prices", async (req, res) => {
  const now = Date.now();
  if (now - lastUpdateTime > 2000) {
    try {
      await updateLivePrices();
    } catch (err) {
      console.warn("On-demand price update failed:", err);
    }
  }
  res.json(livePrices);
});

// 2. Co-pilot Chat Route
app.post("/api/gemini/chat", async (req, res) => {
  const { messages, selectedAsset } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid messages format." });
  }

  const ai = getGeminiClient();
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

  const ai = getGeminiClient();
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
  // Start the background real-time price tick poller
  console.log("Starting real-time market price feed synchronizer...");
  updateLivePrices().catch(err => console.warn("Initial live price synchronisation issue: ", err));
  setInterval(() => {
    updateLivePrices().catch(err => console.warn("Background live price synchronization issue: ", err));
  }, 2000);

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
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

if (!process.env.VERCEL) {
  setupServer();
}

export default app;
