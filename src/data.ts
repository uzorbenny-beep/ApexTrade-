import { Asset, CopyTrader, ChatMessage, Candlestick } from './types';

// Helper to generate a sequence of realistic candlesticks
function generateHistoricalCandles(startingPrice: number, count: number, volatility: number): Candlestick[] {
  const candles: Candlestick[] = [];
  let currentPrice = startingPrice;
  const now = new Date();

  for (let i = count; i >= 1; i--) {
    const timeStr = new Date(now.getTime() - i * 60 * 1000).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const change = currentPrice * (Math.random() - 0.5) * volatility;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * (currentPrice * volatility * 0.4);
    const low = Math.min(open, close) - Math.random() * (currentPrice * volatility * 0.4);
    const volume = Math.floor(Math.random() * 5000) + 500;

    candles.push({
      time: timeStr,
      open: parseFloat(open.toFixed(5)),
      high: parseFloat(high.toFixed(5)),
      low: parseFloat(low.toFixed(5)),
      close: parseFloat(close.toFixed(5)),
      volume,
    });

    currentPrice = close;
  }

  return candles;
}

export const initialAssets: Asset[] = [
  {
    id: 'BTC',
    name: 'Bitcoin / USD',
    type: 'crypto',
    currentPrice: 68420.50,
    initialPrice: 67100.00,
    change24h: 1.97,
    leverageMax: 200,
    spread: 12.00,
    history: generateHistoricalCandles(68420.50, 40, 0.008),
  },
  {
    id: 'ETH',
    name: 'Ethereum / USD',
    type: 'crypto',
    currentPrice: 3512.40,
    initialPrice: 3420.00,
    change24h: 2.70,
    leverageMax: 200,
    spread: 0.85,
    history: generateHistoricalCandles(3512.40, 40, 0.01),
  },
  {
    id: 'SOL',
    name: 'Solana / USD',
    type: 'crypto',
    currentPrice: 154.65,
    initialPrice: 148.20,
    change24h: 4.35,
    leverageMax: 100,
    spread: 0.15,
    history: generateHistoricalCandles(154.65, 40, 0.015),
  },
  {
    id: 'TSLA',
    name: 'Tesla Inc.',
    type: 'stock',
    currentPrice: 224.80,
    initialPrice: 228.30,
    change24h: -1.53,
    leverageMax: 50,
    spread: 0.08,
    history: generateHistoricalCandles(224.80, 40, 0.006),
  },
  {
    id: 'AAPL',
    name: 'Apple Inc.',
    type: 'stock',
    currentPrice: 184.25,
    initialPrice: 182.10,
    change24h: 1.18,
    leverageMax: 50,
    spread: 0.05,
    history: generateHistoricalCandles(184.25, 40, 0.004),
  },
  {
    id: 'NVDA',
    name: 'NVIDIA Corp.',
    type: 'stock',
    currentPrice: 915.20,
    initialPrice: 872.00,
    change24h: 4.95,
    leverageMax: 50,
    spread: 0.40,
    history: generateHistoricalCandles(915.20, 40, 0.012),
  },
  {
    id: 'EURUSD',
    name: 'EUR / USD',
    type: 'forex',
    currentPrice: 1.08645,
    initialPrice: 1.08510,
    change24h: 0.12,
    leverageMax: 500,
    spread: 0.00008,
    history: generateHistoricalCandles(1.08645, 40, 0.001),
  },
  {
    id: 'GBPUSD',
    name: 'GBP / USD',
    type: 'forex',
    currentPrice: 1.27432,
    initialPrice: 1.27850,
    change24h: -0.33,
    leverageMax: 500,
    spread: 0.00012,
    history: generateHistoricalCandles(1.27432, 40, 0.0012),
  },
  {
    id: 'XAUUSD',
    name: 'Gold Spot / USD',
    type: 'commodity',
    currentPrice: 2364.50,
    initialPrice: 2351.00,
    change24h: 0.57,
    leverageMax: 200,
    spread: 0.35,
    history: generateHistoricalCandles(2364.50, 40, 0.0025),
  },
  {
    id: 'UKOIL',
    name: 'Brent Crude Oil Spot',
    type: 'commodity',
    currentPrice: 83.15,
    initialPrice: 84.40,
    change24h: -1.48,
    leverageMax: 100,
    spread: 0.03,
    history: generateHistoricalCandles(83.15, 40, 0.004),
  },
];

export const initialCopyTraders: CopyTrader[] = [
  {
    id: 'expert-alpha',
    name: 'Alpha FX Vanguard',
    avatarColor: 'from-emerald-400 to-teal-600',
    bio: 'Ex-hedge fund senior analyst specializing in high-leverage Forex swing trades and macro Commodity breakouts.',
    roi30d: 48.72,
    winRate: 74.2,
    riskScore: 4,
    copiersCount: 1420,
    aum: 2845000,
    specialty: 'Forex & Gold',
  },
  {
    id: 'expert-whale',
    name: 'Crypto Whale Rider',
    avatarColor: 'from-violet-500 to-indigo-700',
    bio: 'Algorithmic trend-following strategy on Bitcoin, Ether and selected layer 1 protocols. Employs 20x risk metrics.',
    roi30d: 112.45,
    winRate: 61.8,
    riskScore: 8,
    copiersCount: 3840,
    aum: 6120400,
    specialty: 'Crypto Scalper',
  },
  {
    id: 'expert-bonds',
    name: 'Bollinger King',
    avatarColor: 'from-amber-400 to-orange-600',
    bio: 'Low-drawdown statistical arbitrage on tech stocks (AAPL, TSLA, NVDA). Perfect for steady long-term copying.',
    roi30d: 22.15,
    winRate: 88.5,
    riskScore: 2,
    copiersCount: 920,
    aum: 1150000,
    specialty: 'S&P Arbitrage',
  },
  {
    id: 'expert-leverage',
    name: 'Exness Maverick',
    avatarColor: 'from-rose-500 to-red-700',
    bio: 'Hyper-frequency scalp setups with 500x leverage on FX majors during New York / London overlapping sessions.',
    roi30d: 195.30,
    winRate: 59.4,
    riskScore: 9,
    copiersCount: 2250,
    aum: 4890000,
    specialty: 'High Leverage FX',
  },
];

export const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'FX_Specter',
    avatarColor: 'bg-emerald-500',
    text: 'EUR/USD has beautiful double bottom at 1.0850. Added tight long with 100x leverage here.',
    time: '12:15',
    assetMention: { id: 'EURUSD', name: 'EUR / USD' },
  },
  {
    id: 'msg-2',
    sender: 'SatoshiLord',
    avatarColor: 'bg-indigo-500',
    text: 'SOL speed is insane. Breaking through 152 resistance means 160 is imminent.',
    time: '12:16',
    assetMention: { id: 'SOL', name: 'Solana / USD' },
    pnlPercentage: 45.2,
  },
  {
    id: 'msg-3',
    sender: 'MarginCall99',
    avatarColor: 'bg-red-500',
    text: 'Just got liquidated on UKOIL short. Volume spikes are cruel on Mondays.',
    time: '12:18',
    assetMention: { id: 'UKOIL', name: 'Brent Crude Oil Spot' },
  },
  {
    id: 'msg-4',
    sender: 'NikolaBull',
    avatarColor: 'bg-amber-500',
    text: 'TSLA has heavy oversold indicators. Building 10x long scale. Strong support zone.',
    time: '12:19',
    assetMention: { id: 'TSLA', name: 'Tesla Inc.' },
  },
];

export const simulatedRantingUsernames = [
  'ForexGump', 'GeminiHustler', 'Web3_Pioneer', 'PipsCrusher', 'BullMarketPro',
  'OptionsSlayer', 'HodlCommander', 'LeverageGod', 'ScalpQueen', 'WolfOfExness'
];

export const simulatedRantingTexts = [
  'Just closed dynamic buy order for nice profits! Chart patterns are perfectly tracking.',
  'Highly recommending tracking Alpha FX Vanguard. Copied holdings are green across the board.',
  'Will we see Gold breaking past 2370 this hour? Spread looks tight on gold, perfect entry.',
  'Leveraged position at 200x on SOL is printing money. Trailing stop-loss triggers active.',
  'The spread on EUR/USD is extremely favorable right now on ApexTrade! Exness who?!',
  'Is anyone holding TSLA short here? Buying some downside protection options as hedge.',
  'Leverage scaled to 100x on BTC is the raw adrenaline kick of the morning.',
  'AI portfolio assistant just alerted me on NVDA momentum! Excellent buy trigger.',
  'Copy Trade balance increased! This is passive investment dream indeed.',
  'Just doubled down on GBP/USD longs. Trend is my friend until the end.'
];
