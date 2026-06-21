export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity';

export interface Candlestick {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Asset {
  id: string; // e.g. 'AAPL'
  name: string; // e.g. 'Apple Inc.'
  type: AssetType;
  currentPrice: number;
  initialPrice: number;
  change24h: number; // percentage e.g. +1.45
  leverageMax: number; // e.g. 50 (Stock), 200 (Crypto), 500 (Forex)
  spread: number; // in pips/cents
  history: Candlestick[];
}

export interface Position {
  id: string;
  assetId: string;
  assetName: string;
  assetType: AssetType;
  side: 'buy' | 'sell';
  entryPrice: number;
  currentPrice: number;
  sizeUnits: number; // volume quantity
  leverage: number; // e.g., 100x
  margin: number;   // capital committed
  stopLoss: number | null;
  takeProfit: number | null;
  openTime: string;
  copiedFromTraderId?: string; // ID of copy trader if duplicated from copy trading
}

export interface CopyTrader {
  id: string;
  name: string;
  avatarColor: string;
  bio: string;
  roi30d: number; // percentage
  winRate: number; // percentage
  riskScore: number; // 1 to 10
  copiersCount: number;
  aum: number; // assets under management
  specialty: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatarColor: string;
  isCustomUser?: boolean;
  text: string;
  time: string;
  assetMention?: { id: string; name: string };
  pnlPercentage?: number;
}

export interface TradeLog {
  id: string;
  assetId: string;
  assetName: string;
  side: 'buy' | 'sell';
  entryPrice: number;
  exitPrice: number;
  sizeUnits: number;
  leverage: number;
  pnl: number;
  time: string;
  copiedFromTraderName?: string;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isTriggered: boolean;
  time: string;
}

export interface UserProfile {
  email: string;
  displayName: string;
  avatarColor: string;
  currency: string;
  defaultLeverage: number;
  notificationsEnabled: boolean;
}

export interface FundingTransaction {
  id: string;
  email: string;
  type: 'deposit' | 'withdrawal';
  amount: number;
  method: string;
  destinationDetails?: string;
  status: 'pending' | 'approved' | 'declined';
  comment?: string;
  timestamp: string;
}


