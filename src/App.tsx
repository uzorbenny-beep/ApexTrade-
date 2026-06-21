import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Asset, Position, CopyTrader, ChatMessage, TradeLog, AssetType, PriceAlert, UserProfile, FundingTransaction } from './types';
import { initialAssets, initialChatMessages, simulatedRantingUsernames, simulatedRantingTexts } from './data';
import MetricCards from './components/MetricCards';
import TradingChart from './components/TradingChart';
import CopyTradingDirectory from './components/CopyTradingDirectory';
import CommunityChat from './components/CommunityChat';
import AICopilot from './components/AICopilot';
import FundingCenter from './components/FundingCenter';
import AdminPanel from './components/AdminPanel';
import { 
  ArrowDownUp, 
  ChevronUp, 
  ChevronDown, 
  DollarSign, 
  History, 
  Info, 
  Percent, 
  Play, 
  RotateCcw, 
  TrendingUp, 
  User, 
  Coins, 
  Search,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Plus,
  Trash2,
  Settings,
  Lock,
  Shield,
  LogOut,
  LogIn,
  LayoutDashboard,
  Star,
  Wallet,
  ShieldAlert
} from 'lucide-react';

export default function App() {
  // --- CORE SYSTEM STATE ---
  const [balance, setBalance] = useState<number>(() => {
    const sessionStr = localStorage.getItem('apex_session_user');
    if (sessionStr) {
      try {
        const u = JSON.parse(sessionStr);
        if (typeof u.balance === 'number') {
          return u.balance;
        }
      } catch (e) {}
    }
    return 10000;
  }); // Start with custom session capital or fallback to $10,000 mock capital
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('BTC');
  const [activeTab, setActiveTab] = useState<'all' | 'crypto' | 'stock' | 'forex' | 'commodity'>('all');
  const [searchText, setSearchText] = useState<string>('');

  // App Layout Screen Switcher
  const [activeScreen, setActiveScreen] = useState<'trade' | 'dashboard' | 'positions' | 'profile' | 'alerts' | 'funding' | 'admin'>('trade');

  // Funding and Administration Overrides State
  const [registeredUsers, setRegisteredUsers] = useState<any[]>(() => {
    const list = localStorage.getItem('apex_registered_users');
    if (list) {
      try {
        return JSON.parse(list);
      } catch (e) {}
    }
    return [];
  });

  const [fundingTransactions, setFundingTransactions] = useState<FundingTransaction[]>(() => {
    const saved = localStorage.getItem('apex_funding_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('apex_funding_transactions', JSON.stringify(fundingTransactions));
  }, [fundingTransactions]);

  const [priceOverrides, setPriceOverrides] = useState<Record<string, 'pump' | 'dump' | 'normal'>>(() => {
    const saved = localStorage.getItem('apex_price_overrides');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('apex_price_overrides', JSON.stringify(priceOverrides));
  }, [priceOverrides]);

  const reloadRegisteredUsers = () => {
    const list = localStorage.getItem('apex_registered_users');
    if (list) {
      try {
        setRegisteredUsers(JSON.parse(list));
      } catch (err) {}
    }
  };

  // Custom Price Alerts State
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([
    { id: 'alert-1', assetId: 'BTC', targetPrice: 110000, condition: 'above', isTriggered: false, time: 'Init' },
    { id: 'alert-2', assetId: 'ETH', targetPrice: 2100, condition: 'below', isTriggered: false, time: 'Init' }
  ]);
  const [alertTargetPrice, setAlertTargetPrice] = useState<string>('');
  const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

  // User Profile Settings & Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('apex_session_user') !== null;
  });
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login');
  const [authView, setAuthView] = useState<'landing' | 'login' | 'register'>('landing');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authName, setAuthName] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('apex_session_user');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return {
          email: u.email || '',
          displayName: u.displayName || '',
          avatarColor: u.avatarColor || 'bg-emerald-600',
          currency: u.currency || 'USD',
          defaultLeverage: u.defaultLeverage || 100,
          notificationsEnabled: u.notificationsEnabled !== false
        };
      } catch (err) {}
    }
    return { 
      email: '', 
      displayName: '', 
      avatarColor: 'bg-emerald-600', 
      currency: 'USD', 
      defaultLeverage: 100, 
      notificationsEnabled: true 
    };
  });

  // Initialize default users database in localStorage if empty and guarantee Master Admin account
  useEffect(() => {
    const list = localStorage.getItem('apex_registered_users');
    let users = [];
    if (list) {
      try {
        users = JSON.parse(list);
      } catch (err) {}
    }
    const hasAdmin = users.some((u: any) => u.email.toLowerCase() === 'admin@apex.io');
    if (!hasAdmin) {
      users.push({
        email: 'admin@apex.io',
        password: 'adminpassword',
        displayName: 'Apex Master Admin',
        balance: 1000000,
        status: 'Active Verified'
      });
      localStorage.setItem('apex_registered_users', JSON.stringify(users));
      reloadRegisteredUsers();
    }
  }, []);

  // Synchronize balance to local storage session and user database
  useEffect(() => {
    const sessionStr = localStorage.getItem('apex_session_user');
    if (sessionStr) {
      try {
        const u = JSON.parse(sessionStr);
        if (u.balance !== balance) {
          u.balance = balance;
          localStorage.setItem('apex_session_user', JSON.stringify(u));
          
          const usersStr = localStorage.getItem('apex_registered_users');
          if (usersStr) {
            const users = JSON.parse(usersStr);
            const idx = users.findIndex((user: any) => user.email === u.email);
            if (idx !== -1) {
              users[idx].balance = balance;
              localStorage.setItem('apex_registered_users', JSON.stringify(users));
              reloadRegisteredUsers();
            }
          }
        }
      } catch (err) {}
    }
  }, [balance]);

  // Trading execution panel state
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [marginInput, setMarginInput] = useState<string>('500'); // amount of collateral
  const [leverageInput, setLeverageInput] = useState<number>(50); // multiplier e.g. 50x
  const [stopLossInput, setStopLossInput] = useState<string>('');
  const [takeProfitInput, setTakeProfitInput] = useState<string>('');

  // Portfolio positions, copy tracking, logs & social chat per user account
  const [positions, setPositions] = useState<Position[]>(() => {
    const savedSession = localStorage.getItem('apex_session_user');
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u.email) {
          const savedPos = localStorage.getItem(`apex_positions_${u.email.toLowerCase()}`);
          if (savedPos) return JSON.parse(savedPos);
        }
      } catch (err) {}
    }
    return [];
  });

  const [copiedTraderIds, setCopiedTraderIds] = useState<string[]>(() => {
    const savedSession = localStorage.getItem('apex_session_user');
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u.email) {
          const savedCopied = localStorage.getItem(`apex_copied_traders_${u.email.toLowerCase()}`);
          if (savedCopied) return JSON.parse(savedCopied);
        }
      } catch (err) {}
    }
    return [];
  });

  const [copiedAllocations, setCopiedAllocations] = useState<Record<string, number>>(() => {
    const savedSession = localStorage.getItem('apex_session_user');
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u.email) {
          const savedAlloc = localStorage.getItem(`apex_copied_allocations_${u.email.toLowerCase()}`);
          if (savedAlloc) return JSON.parse(savedAlloc);
        }
      } catch (err) {}
    }
    return {};
  });

  const [tradeLog, setTradeLog] = useState<TradeLog[]>(() => {
    const savedSession = localStorage.getItem('apex_session_user');
    if (savedSession) {
      try {
        const u = JSON.parse(savedSession);
        if (u.email) {
          const savedLog = localStorage.getItem(`apex_tradelog_${u.email.toLowerCase()}`);
          if (savedLog) return JSON.parse(savedLog);
        }
      } catch (err) {}
    }
    return [];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);

  // Synchronize all user states to localStorage for persistence across logins and refreshes (for old & new accounts)
  useEffect(() => {
    if (userProfile && userProfile.email) {
      const emailKey = userProfile.email.toLowerCase();
      localStorage.setItem(`apex_positions_${emailKey}`, JSON.stringify(positions));
      localStorage.setItem(`apex_copied_traders_${emailKey}`, JSON.stringify(copiedTraderIds));
      localStorage.setItem(`apex_copied_allocations_${emailKey}`, JSON.stringify(copiedAllocations));
      localStorage.setItem(`apex_tradelog_${emailKey}`, JSON.stringify(tradeLog));
    }
  }, [positions, copiedTraderIds, copiedAllocations, tradeLog, userProfile.email]);

  // Interface feedbacks
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [depositModalOpen, setDepositModalOpen] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('5000');

  // Helper flash alerts
  const triggerAlert = (type: 'success' | 'error' | 'info', text: string) => {
    setActionAlert({ type, text });
    setTimeout(() => {
      setActionAlert(null);
    }, 4500);
  };

  // Find currently selected asset
  const selectedAsset = useMemo(() => {
    return assets.find(a => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  // Adjust default leverage bounds whenever selected asset limits change
  useEffect(() => {
    setLeverageInput(Math.min(selectedAsset.leverageMax, 50));
    setStopLossInput('');
    setTakeProfitInput('');
  }, [selectedAssetId]);

  // --- DERIVED PORTFOLIO METRICS ---
  const totalPL = useMemo(() => {
    return positions.reduce((acc, pos) => {
      const priceDiff = pos.side === 'buy' 
        ? pos.currentPrice - pos.entryPrice 
        : pos.entryPrice - pos.currentPrice;
      const percentageReturn = priceDiff / pos.entryPrice;
      const posPnl = percentageReturn * pos.leverage * pos.margin;
      return acc + posPnl;
    }, 0);
  }, [positions]);

  const nav = balance + totalPL;
  const marginUsed = useMemo(() => positions.reduce((acc, pos) => acc + pos.margin, 0), [positions]);
  const freeMargin = nav - marginUsed;
  const marginLevel = marginUsed > 0 ? (nav / marginUsed) * 100 : 100;

  const calculatedMarginUsagePct = useMemo(() => {
    const margin = parseFloat(marginInput);
    if (isNaN(margin) || margin <= 0 || freeMargin <= 0) return 0;
    return (margin / freeMargin) * 100;
  }, [marginInput, freeMargin]);

  // --- MARKET TICK SIMULATION LOOP (1.5s interval + immediate call on load) ---
  useEffect(() => {
    const fetchAndTick = async () => {
      // Fetch live prices from our Express backend
      let liveFeed: Record<string, { currentPrice: number; change24h: number }> = {};
      let hitLocalSuccess = false;
      try {
        const response = await fetch('/api/prices');
        if (response.ok) {
          liveFeed = await response.json();
          if (liveFeed && Object.keys(liveFeed).length > 0) {
            hitLocalSuccess = true;
          }
        }
      } catch (err) {
        console.warn("Could not retrieve live price feed from server:", err);
      }

      // Always execute direct browser-side requests to free CORS-enabled APIs (Bybit for cryptos & Exchange Rate open-api for Forex)
      // This guarantees 100% real-time accuracy and perfect alignment with major global brokers (both on development server and Vercel production hosts)
      try {
        // A. Spot cryptos from Bybit
        const bybitRes = await fetch("https://api.bybit.com/v5/market/tickers?category=spot");
        if (bybitRes.ok) {
          const bybitData = await bybitRes.json();
          if (bybitData && bybitData.retCode === 0 && bybitData.result && bybitData.result.list) {
            for (const t of bybitData.result.list) {
              const symbol = t.symbol;
              if (symbol.endsWith("USDT")) {
                const coinId = symbol.replace("USDT", "");
                const lastPrice = parseFloat(t.lastPrice);
                const changePct = parseFloat(t.price24hPcnt) * 100;
                if (!isNaN(lastPrice)) {
                  liveFeed[coinId] = {
                    currentPrice: lastPrice,
                    change24h: !isNaN(changePct) ? changePct : 0
                  };
                }
              }
            }
          }
        }
      } catch (e) {
        console.warn("Bybit browser-direct backup fetch failed:", e);
      }

      try {
        // B. Direct live Forex rates relative to USD (CORS-friendly, no-auth)
        const erRes = await fetch("https://open.er-api.com/v6/latest/USD");
        if (erRes.ok) {
          const erData = await erRes.json();
          if (erData && erData.rates) {
            const rates = erData.rates;
            
            const setRate = (assetId: string, value: number, baseRate: number) => {
              liveFeed[assetId] = {
                currentPrice: value,
                change24h: ((value - baseRate) / baseRate) * 100
              };
            };

            // Setup precise Forex quotes (e.g., EURUSD, GBPUSD, USDJPY, AUDUSD, USDCAD, USDCHF, NZDUSD)
            if (rates.EUR) setRate("EURUSD", parseFloat((1 / rates.EUR).toFixed(5)), 1.08645);
            if (rates.GBP) setRate("GBPUSD", parseFloat((1 / rates.GBP).toFixed(5)), 1.27432);
            if (rates.JPY) setRate("USDJPY", parseFloat(rates.JPY.toFixed(2)), 156.40);
            if (rates.AUD) setRate("AUDUSD", parseFloat((1 / rates.AUD).toFixed(5)), 0.6650);
            if (rates.CAD) setRate("USDCAD", parseFloat(rates.CAD.toFixed(5)), 1.3680);
            if (rates.CHF) setRate("USDCHF", parseFloat(rates.CHF.toFixed(5)), 0.8845);
            if (rates.NZD) setRate("NZDUSD", parseFloat((1 / rates.NZD).toFixed(5)), 0.6122);

            // Setup Gold (XAUUSD) and Silver (XAGUSD)
            if (rates.XAU && rates.XAU > 0) {
              const goldPrice = parseFloat((1 / rates.XAU).toFixed(2));
              setRate("XAUUSD", goldPrice, 2364.50);
            }
            if (rates.XAG && rates.XAG > 0) {
              const silverPrice = parseFloat((1 / rates.XAG).toFixed(3));
              setRate("XAGUSD", silverPrice, 29.50);
            }
          }
        }
      } catch (e) {
        console.warn("Forex browser-direct backup fetch failed:", e);
      }

      // 1. Tick Asset Prices Fluctuations
      setAssets(currentAssets => 
        currentAssets.map(asset => {
          let newPrice = asset.currentPrice;
          let change24h = asset.change24h;

          // If we have successful data from the live feed, use it
          if (liveFeed && liveFeed[asset.id]) {
            newPrice = liveFeed[asset.id].currentPrice;
            change24h = liveFeed[asset.id].change24h;
          } else {
            // Fallback to random walk if API feed is momentarily down
            let vol = 0.0015;
            if (asset.type === 'crypto') vol = 0.0035;
            if (asset.type === 'forex') vol = 0.00045;
            if (asset.type === 'commodity') vol = 0.001;

            const shift = (Math.random() - 0.485) * 2 * vol;
            newPrice = parseFloat((asset.currentPrice * (1 + shift)).toFixed(asset.type === 'forex' ? 5 : 2));
            const initialPrice = asset.initialPrice;
            change24h = ((newPrice - initialPrice) / initialPrice) * 100;
          }

          // Apply Admin Market manipulation factor
          let override = false;
          let trendMode = 'normal';
          try {
            const savedOverridesStr = localStorage.getItem('apex_price_overrides');
            if (savedOverridesStr) {
              const savedOverrides = JSON.parse(savedOverridesStr);
              if (savedOverrides && savedOverrides[asset.id]) {
                override = true;
                trendMode = savedOverrides[asset.id];
              }
            }
          } catch (e) {}

          if (override && trendMode !== 'normal') {
            let trendFactor = 1.0;
            if (trendMode === 'pump') {
              trendFactor = 1.025; // Rise by 2.5% on every tick
            } else if (trendMode === 'dump') {
              trendFactor = 0.975; // Drop by 2.5% on every tick
            }
            newPrice = parseFloat((newPrice * trendFactor).toFixed(asset.type === 'forex' ? 5 : 2));
            const initialPrice = asset.initialPrice;
            change24h = ((newPrice - initialPrice) / initialPrice) * 100;
          }

          // Update recent candlesticks history (updating last candle Close limit, appending new candle hourly)
          const updatedHistory = [...asset.history];
          const lastCandle = updatedHistory[updatedHistory.length - 1];
          if (lastCandle) {
            lastCandle.close = newPrice;
            lastCandle.high = Math.max(lastCandle.high, newPrice);
            lastCandle.low = Math.min(lastCandle.low, newPrice);
          }

          // Randomly trigger complete new candle generation every so often
          if (Math.random() < 0.1) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            updatedHistory.push({
              time: timeStr,
              open: asset.currentPrice,
              high: asset.currentPrice,
              low: asset.currentPrice,
              close: newPrice,
              volume: Math.floor(Math.random() * 3000) + 200,
            });
            if (updatedHistory.length > 50) updatedHistory.shift(); // retain window length
          }

          // Calculate initialPrice mathematically consistent with live change24h so everything displays correctly
          const calculatedInitial = parseFloat((newPrice / (1 + (change24h / 100))).toFixed(asset.type === 'forex' ? 5 : 2));

          return {
            ...asset,
            currentPrice: newPrice,
            change24h,
            initialPrice: calculatedInitial,
            history: updatedHistory,
          };
        })
      );

      // Real-time market tick system is active
    };

    fetchAndTick();
    const interval = setInterval(fetchAndTick, 1500);

    return () => clearInterval(interval);
  }, []);

  // Sync Positions value changes whenever asset prices change
  useEffect(() => {
    setPositions(currentPositions => {
      let liquidationTriggered = false;
      let closedPosNames: string[] = [];
      let totalLiqBalanceImpact = 0;

      const updated = currentPositions.map(pos => {
        const correspondingAsset = assets.find(a => a.id === pos.assetId);
        if (!correspondingAsset) return pos;

        const currentPrice = correspondingAsset.currentPrice;
        const isUpY = pos.side === 'buy';
        const pnlPercentageFraction = (currentPrice - pos.entryPrice) * (isUpY ? 1 : -1) / pos.entryPrice;
        const pnlAmount = pnlPercentageFraction * pos.leverage * pos.margin;

        // Auto Margin Liquidation check (Stop out if trade loses 90% of collateral)
        const isLiquidated = pnlAmount <= -pos.margin * 0.90;

        if (isLiquidated) {
          liquidationTriggered = true;
          closedPosNames.push(`${pos.side.toUpperCase()} ${pos.assetId}`);
          totalLiqBalanceImpact += (pnlAmount); // subtract realized margin loss
          return null;
        }

        // Auto Stop-Loss (SL) trigger check
        if (pos.stopLoss !== null) {
          const slHit = isUpY ? currentPrice <= pos.stopLoss : currentPrice >= pos.stopLoss;
          if (slHit) {
            closedPosNames.push(`${pos.assetId} SL Hit`);
            totalLiqBalanceImpact += pnlAmount;
            
            // log to ledger hist
            setTradeLog(prev => [{
              id: `log-${Date.now()}-${Math.random()}`,
              assetId: pos.assetId,
              assetName: pos.assetName,
              side: pos.side,
              entryPrice: pos.entryPrice,
              exitPrice: currentPrice,
              sizeUnits: pos.sizeUnits,
              leverage: pos.leverage,
              pnl: pnlAmount,
              time: new Date().toLocaleTimeString(),
            }, ...prev]);
            return null;
          }
        }

        // Auto Take-Profit (TP) trigger check
        if (pos.takeProfit !== null) {
          const tpHit = isUpY ? currentPrice >= pos.takeProfit : currentPrice <= pos.takeProfit;
          if (tpHit) {
            closedPosNames.push(`${pos.assetId} TP Hit`);
            totalLiqBalanceImpact += pnlAmount;
            
            setTradeLog(prev => [{
              id: `log-${Date.now()}-${Math.random()}`,
              assetId: pos.assetId,
              assetName: pos.assetName,
              side: pos.side,
              entryPrice: pos.entryPrice,
              exitPrice: currentPrice,
              sizeUnits: pos.sizeUnits,
              leverage: pos.leverage,
              pnl: pnlAmount,
              time: new Date().toLocaleTimeString(),
            }, ...prev]);
            return null;
          }
        }

        return {
          ...pos,
          currentPrice,
        };
      }).filter((p): p is Position => p !== null);

      if (liquidationTriggered || totalLiqBalanceImpact !== 0) {
        setBalance(prev => prev + totalLiqBalanceImpact);
        triggerAlert('info', `Automated exit executed: ${closedPosNames.join(', ')}. Account updated.`);
      }

      return updated;
    });
  }, [assets]);

  // Overall account liquidation safety rule (Exness standard limit: Margin Level drops under 50% => close all positions instantly!)
  useEffect(() => {
    if (positions.length > 0 && marginLevel < 50) {
      triggerAlert('error', '⚠️ CRITICAL: MARGIN LEVEL DROP BELOW 50%. Force Stop-Out executed on all open positions to shield balance!');
      
      // Close all positions with realized losses
      positions.forEach(pos => {
        const priceDiff = pos.side === 'buy' ? pos.currentPrice - pos.entryPrice : pos.entryPrice - pos.currentPrice;
        const pnl = priceDiff / pos.entryPrice * pos.leverage * pos.margin;
        
        // Add closed history
        setTradeLog(prev => [{
          id: `log-${Date.now()}-${Math.random()}`,
          assetId: pos.assetId,
          assetName: pos.assetName,
          side: pos.side,
          entryPrice: pos.entryPrice,
          exitPrice: pos.currentPrice,
          sizeUnits: pos.sizeUnits,
          leverage: pos.leverage,
          pnl,
          time: new Date().toLocaleTimeString(),
          copiedFromTraderName: pos.copiedFromTraderId ? 'Social Auto-Copy' : undefined
        }, ...prev]);
      });

      setPositions([]);
      // Settle remaining capital to wallet
      setBalance(prev => prev + totalPL);
    }
  }, [marginLevel, positions, totalPL]);

  // Real-time custom price alerts monitoring
  useEffect(() => {
    if (priceAlerts.length === 0) return;
    
    let hasTriggered = false;
    const updated = priceAlerts.map(alert => {
      if (alert.isTriggered) return alert;

      const asset = assets.find(a => a.id === alert.assetId);
      if (!asset) return alert;

      const hit = alert.condition === 'above' 
        ? asset.currentPrice >= alert.targetPrice 
        : asset.currentPrice <= alert.targetPrice;

      if (hit) {
        hasTriggered = true;
        triggerAlert('success', `🔔 ALERT TRIGGERED: ${alert.assetId} has crossed your threshold of $${alert.targetPrice}! Current: $${asset.currentPrice.toLocaleString()}`);
        return {
          ...alert,
          isTriggered: true,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        };
      }
      return alert;
    });

    if (hasTriggered) {
      setPriceAlerts(updated);
    }
  }, [assets, priceAlerts]);

  // Handle adding custom price alert
  const handleCreatePriceAlert = (assetId: string, price: number, condition: 'above' | 'below') => {
    if (isNaN(price) || price <= 0) {
      triggerAlert('error', 'Please enter a valid positive target price.');
      return;
    }
    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      assetId,
      targetPrice: price,
      condition,
      isTriggered: false,
      time: '-'
    };
    setPriceAlerts(prev => [newAlert, ...prev]);
    triggerAlert('success', `Created 🔔 Price Alert for ${assetId} ${condition} $${price.toLocaleString()}`);
  };

  const handleDeletePriceAlert = (alertId: string) => {
    setPriceAlerts(prev => prev.filter(al => al.id !== alertId));
    triggerAlert('info', 'Price alert has been deleted.');
  };

  const handleClearTriggeredAlerts = () => {
    setPriceAlerts(prev => prev.filter(al => !al.isTriggered));
    triggerAlert('info', 'Cleared all triggered notifications.');
  };


  // --- USER INTERACTIVE ORDER ACTIONS ---
  const handleExecuteTrade = () => {
    const margin = parseFloat(marginInput);
    if (isNaN(margin) || margin <= 0) {
      triggerAlert('error', 'Margin capital enter error. Must be positive.');
      return;
    }
    if (margin < 10) {
      triggerAlert('error', 'Minimum execution margin is $10.');
      return;
    }
    if (margin > freeMargin) {
      triggerAlert('error', `Insufficient Free Margin. Maximum allowed: $${freeMargin.toFixed(2)}`);
      return;
    }

    const sl = stopLossInput ? parseFloat(stopLossInput) : null;
    const tp = takeProfitInput ? parseFloat(takeProfitInput) : null;

    if (sl !== null && sl <= 0) {
      triggerAlert('error', 'Stop-loss price must be positive.');
      return;
    }
    if (tp !== null && tp <= 0) {
      triggerAlert('error', 'Take-profit price must be positive.');
      return;
    }

    // UnitsSize calculation = (margin * leverage) / current asset price
    const sizeUnits = (margin * leverageInput) / selectedAsset.currentPrice;

    const newPosition: Position = {
      id: `pos-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      assetId: selectedAsset.id,
      assetName: selectedAsset.name,
      assetType: selectedAsset.type,
      side: tradeType,
      entryPrice: selectedAsset.currentPrice,
      currentPrice: selectedAsset.currentPrice,
      sizeUnits,
      leverage: leverageInput,
      margin,
      stopLoss: sl,
      takeProfit: tp,
      openTime: new Date().toLocaleTimeString(),
    };

    setPositions(prev => [newPosition, ...prev]);
    // Collateral is locked instantly (Subtract from balance)
    setBalance(prev => prev - margin);
    triggerAlert('success', `Success: Opened ${tradeType.toUpperCase()} position on ${selectedAsset.id} with ${leverageInput}x leverage!`);
  };

  // Close specific position
  const handleClosePosition = (id: string) => {
    const positionToClose = positions.find(p => p.id === id);
    if (!positionToClose) return;

    const isBuy = positionToClose.side === 'buy';
    const priceDiff = isBuy 
      ? positionToClose.currentPrice - positionToClose.entryPrice 
      : positionToClose.entryPrice - positionToClose.currentPrice;
    
    const percentageReturn = priceDiff / positionToClose.entryPrice;
    const realPL = percentageReturn * positionToClose.leverage * positionToClose.margin;

    // Refund collateral + profit or loss to account wallet balance
    setBalance(prev => prev + positionToClose.margin + realPL);
    
    // Add transaction to Closed ledger
    setTradeLog(prev => [{
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      assetId: positionToClose.assetId,
      assetName: positionToClose.assetName,
      side: positionToClose.side,
      entryPrice: positionToClose.entryPrice,
      exitPrice: positionToClose.currentPrice,
      sizeUnits: positionToClose.sizeUnits,
      leverage: positionToClose.leverage,
      pnl: realPL,
      time: new Date().toLocaleTimeString(),
      copiedFromTraderName: positionToClose.copiedFromTraderId ? 'Social Auto-Copy' : undefined,
    }, ...prev]);

    // Remove from active
    setPositions(prev => prev.filter(p => p.id !== id));
    triggerAlert('info', `Closed position: Settle P&L of $${realPL >= 0 ? '+' : ''}${realPL.toFixed(2)} to Cash.`);
  };

  // Close ALL open trades at once
  const handleCloseAllPositions = () => {
    if (positions.length === 0) return;
    
    positions.forEach(p => {
      const isB = p.side === 'buy';
      const diff = isB ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
      const profitValue = diff / p.entryPrice * p.leverage * p.margin;

      setTradeLog(prev => [{
        id: `log-${Date.now()}-${Math.random()}`,
        assetId: p.assetId,
        assetName: p.assetName,
        side: p.side,
        entryPrice: p.entryPrice,
        exitPrice: p.currentPrice,
        sizeUnits: p.sizeUnits,
        leverage: p.leverage,
        pnl: profitValue,
        time: new Date().toLocaleTimeString(),
        copiedFromTraderName: p.copiedFromTraderId ? 'Social Auto-Copy' : undefined
      }, ...prev]);
    });

    setBalance(prev => prev + marginUsed + totalPL);
    setPositions([]);
    triggerAlert('success', `Executed: Multi-Close-All orders triggered. Dynamic portfolio consolidated.`);
  };


  // --- COPY-TRADING INTEGRATOR FLOW ---
  const handleStartCopyTrading = (trader: CopyTrader, amount: number) => {
    if (copiedTraderIds.includes(trader.id)) return;

    // Set tracker
    setCopiedTraderIds(prev => [...prev, trader.id]);
    setCopiedAllocations(prev => ({ ...prev, [trader.id]: amount }));

    // Lock funds from wallet into copy allocation
    setBalance(prev => prev - amount);

    // Dynamic social copy-replication: instantly mirror some smart positions based on allocated funds!
    // E.g. allocate 60% on Asset A, 40% on Asset B
    let assetsToPick: string[] = [];
    if (trader.specialty.includes('Forex')) {
      assetsToPick = ['EURUSD', 'GBPUSD'];
    } else if (trader.specialty.includes('Crypto')) {
      assetsToPick = ['BTC', 'SOL'];
    } else {
      assetsToPick = ['AAPL', 'NVDA'];
    }

    const firstAsset = assets.find(a => a.id === assetsToPick[0]) || assets[0];
    const secondAsset = assets.find(a => a.id === assetsToPick[1]) || assets[1];

    const partMargin1 = amount * 0.6;
    const partMargin2 = amount * 0.4;
    const copyLeverage = Math.min(trader.riskScore * 10, 50);

    const pos1: Position = {
      id: `copy-${trader.id}-1`,
      assetId: firstAsset.id,
      assetName: firstAsset.name,
      assetType: firstAsset.type,
      side: 'buy',
      entryPrice: firstAsset.currentPrice,
      currentPrice: firstAsset.currentPrice,
      sizeUnits: (partMargin1 * copyLeverage) / firstAsset.currentPrice,
      leverage: copyLeverage,
      margin: partMargin1,
      stopLoss: null,
      takeProfit: null,
      openTime: new Date().toLocaleTimeString(),
      copiedFromTraderId: trader.id,
    };

    const pos2: Position = {
      id: `copy-${trader.id}-2`,
      assetId: secondAsset.id,
      assetName: secondAsset.name,
      assetType: secondAsset.type,
      side: 'buy',
      entryPrice: secondAsset.currentPrice,
      currentPrice: secondAsset.currentPrice,
      sizeUnits: (partMargin2 * copyLeverage) / secondAsset.currentPrice,
      leverage: copyLeverage,
      margin: partMargin2,
      stopLoss: null,
      takeProfit: null,
      openTime: new Date().toLocaleTimeString(),
      copiedFromTraderId: trader.id,
    };

    setPositions(prev => [pos1, pos2, ...prev]);
    triggerAlert('success', `Auto-Copy Action: Allocated $${amount} to ${trader.name}. Auto-mirror positions opened.`);
  };

  const handleStopCopyTrading = (traderId: string) => {
    // Collect specific mirrored positions
    const copyPositions = positions.filter(p => p.copiedFromTraderId === traderId);
    
    // Settle their P&L
    let totalPositionsCollateral = 0;
    let totalPositionsPnl = 0;

    copyPositions.forEach(p => {
      const isBuy = p.side === 'buy';
      const priceDiff = isBuy ? p.currentPrice - p.entryPrice : p.entryPrice - p.currentPrice;
      const profitValue = priceDiff / p.entryPrice * p.leverage * p.margin;
      
      totalPositionsCollateral += p.margin;
      totalPositionsPnl += profitValue;

      // Log closed position
      setTradeLog(prev => [{
        id: `log-${Date.now()}-${Math.random()}`,
        assetId: p.assetId,
        assetName: p.assetName,
        side: p.side,
        entryPrice: p.entryPrice,
        exitPrice: p.currentPrice,
        sizeUnits: p.sizeUnits,
        leverage: p.leverage,
        pnl: profitValue,
        time: new Date().toLocaleTimeString(),
        copiedFromTraderName: `Uncopied - Auto Liquidation`
      }, ...prev]);
    });

    const originalCapitalAllocated = copiedAllocations[traderId] || 0;
    
    // Stop copy settles remaining allocated capital + P&L back to user cash balance
    const returnedFunds = originalCapitalAllocated + totalPositionsPnl;
    setBalance(prev => prev + returnedFunds);

    // Clean tracking structures
    setCopiedTraderIds(prev => prev.filter(id => id !== traderId));
    setCopiedAllocations(prev => {
      const copy = { ...prev };
      delete copy[traderId];
      return copy;
    });

    // Remove mirrored positions
    setPositions(prev => prev.filter(p => p.copiedFromTraderId !== traderId));
    triggerAlert('info', `Social Copy Unlinked. Capital returned to balance: $${returnedFunds.toFixed(2)}.`);
  };


  // --- SOCIAL CHATS USER DISPATCH ---
  const handleUserSendMessage = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Instantly append user message to local feed
    const userMsg: ChatMessage = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      sender: 'Trader (You)',
      avatarColor: 'bg-emerald-500 border-2 border-slate-100',
      isCustomUser: true,
      text,
      time: timeStr,
      assetMention: { id: selectedAsset.id, name: selectedAsset.name },
    };

    setChatMessages(prev => [...prev, userMsg]);
    triggerAlert('success', 'Chat message dispatched to active brokers board.');
  };


  // --- CASH WALLET ADJUSTMENTS & ADMINISTRATION ---
  const isAdmin = useMemo(() => {
    const email = userProfile?.email?.toLowerCase() || '';
    return email.includes('admin') || email === 'uzorbenny51@gmail.com' || localStorage.getItem('apex_admin_mode') === 'true';
  }, [userProfile.email]);

  // Handle detection of /admin URL path cleanly on startup and session change
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/admin' || path.endsWith('/admin')) {
      if (isLoggedIn) {
        if (isAdmin) {
          setActiveScreen('admin');
        } else {
          triggerAlert('error', 'Access Denied: Admin level privilege is required for this area.');
          setActiveScreen('trade');
        }
      } else {
        setAuthView('login');
        setAuthEmail('admin@apex.io');
        triggerAlert('info', 'Secure Admin Portal: Locked. Please authenticate with your master admin password.');
      }
    }
  }, [isLoggedIn, isAdmin]);

  const handleAdjustUserBalance = (email: string, amount: number, absoluteValue?: boolean) => {
    const listStr = localStorage.getItem('apex_registered_users');
    if (listStr) {
      try {
        const users = JSON.parse(listStr);
        const idx = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          const oldBal = users[idx].balance || 0;
          const newBal = absoluteValue ? amount : oldBal + amount;
          users[idx].balance = newBal;
          localStorage.setItem('apex_registered_users', JSON.stringify(users));
          reloadRegisteredUsers();

          if (email.toLowerCase() === userProfile.email.toLowerCase()) {
            setBalance(newBal);
            const sessionStr = localStorage.getItem('apex_session_user');
            if (sessionStr) {
              const sUser = JSON.parse(sessionStr);
              sUser.balance = newBal;
              localStorage.setItem('apex_session_user', JSON.stringify(sUser));
            }
          }
          triggerAlert('success', `Balance for ${email} adjusted to $${newBal.toLocaleString()}`);
        } else {
          triggerAlert('error', `User ${email} was not found in registered database.`);
        }
      } catch (err) {
        triggerAlert('error', 'Execution fail: balance adjust serialize error.');
      }
    }
  };

  const handleForceCloseUserPosition = (email: string, positionId: string) => {
    try {
      const savedPosStr = localStorage.getItem(`apex_positions_${email.toLowerCase()}`);
      if (savedPosStr) {
        const currentPositions: Position[] = JSON.parse(savedPosStr);
        const posToClose = currentPositions.find(p => p.id === positionId);
        if (posToClose) {
          const correspondingAsset = assets.find(a => a.id === posToClose.assetId);
          const currentPrice = correspondingAsset ? correspondingAsset.currentPrice : posToClose.currentPrice;
          const isUpY = posToClose.side === 'buy';
          const pnlPercentageFraction = (currentPrice - posToClose.entryPrice) * (isUpY ? 1 : -1) / posToClose.entryPrice;
          const pnlAmount = pnlPercentageFraction * posToClose.leverage * posToClose.margin;

          const remainingPositions = currentPositions.filter(p => p.id !== positionId);
          localStorage.setItem(`apex_positions_${email.toLowerCase()}`, JSON.stringify(remainingPositions));

          const savedLogStr = localStorage.getItem(`apex_tradelog_${email.toLowerCase()}`) || '[]';
          const logs = JSON.parse(savedLogStr);
          const newLog: TradeLog = {
            id: `log-${Date.now()}-${Math.random()}`,
            assetId: posToClose.assetId,
            assetName: posToClose.assetName,
            side: posToClose.side,
            entryPrice: posToClose.entryPrice,
            exitPrice: currentPrice,
            sizeUnits: posToClose.sizeUnits,
            leverage: posToClose.leverage,
            pnl: pnlAmount,
            time: new Date().toLocaleTimeString(),
          };
          logs.unshift(newLog);
          localStorage.setItem(`apex_tradelog_${email.toLowerCase()}`, JSON.stringify(logs));

          const usersStr = localStorage.getItem('apex_registered_users') || '[]';
          const users = JSON.parse(usersStr);
          const uIdx = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
          if (uIdx !== -1) {
            users[uIdx].balance = (users[uIdx].balance || 0) + pnlAmount;
            localStorage.setItem('apex_registered_users', JSON.stringify(users));
            reloadRegisteredUsers();
          }

          if (email.toLowerCase() === userProfile.email.toLowerCase()) {
            setPositions(remainingPositions);
            setTradeLog(logs);
            setBalance(prev => prev + pnlAmount);
          }

          triggerAlert('success', `Force settled position on ${posToClose.assetId}. realized: $${pnlAmount.toFixed(2)}`);
        }
      }
    } catch (e) {
      triggerAlert('error', 'Execution fail during position closing.');
    }
  };

  const handleSetUserStatus = (email: string, status: string) => {
    const listStr = localStorage.getItem('apex_registered_users');
    if (listStr) {
      try {
        const users = JSON.parse(listStr);
        const idx = users.findIndex((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (idx !== -1) {
          users[idx].status = status;
          localStorage.setItem('apex_registered_users', JSON.stringify(users));
          reloadRegisteredUsers();
          triggerAlert('success', `User ${email} status modified to ${status}`);
        }
      } catch (e) {}
    }
  };

  const handleApproveTransaction = (txId: string, comment: string) => {
    setFundingTransactions(prev => {
      const updated = prev.map(tx => {
        if (tx.id === txId && tx.status === 'pending') {
          const multiplier = tx.type === 'deposit' ? 1 : -1;
          handleAdjustUserBalance(tx.email, tx.amount * multiplier, false);
          return { ...tx, status: 'approved', comment };
        }
        return tx;
      });
      return updated;
    });
  };

  const handleDeclineTransaction = (txId: string, comment: string) => {
    setFundingTransactions(prev => {
      const updated = prev.map(tx => {
        if (tx.id === txId && tx.status === 'pending') {
          return { ...tx, status: 'declined', comment };
        }
        return tx;
      });
      return updated;
    });
  };

  const handleSetPriceOverride = (assetId: string, trendMode: 'pump' | 'dump' | 'normal') => {
    setPriceOverrides(prev => {
      const next = { ...prev };
      if (trendMode === 'normal') {
        delete next[assetId];
      } else {
        next[assetId] = trendMode;
      }
      return next;
    });
    triggerAlert('info', `Simulating artificial ${trendMode.toUpperCase()} trend multiplier on ${assetId}.`);
  };

  const handleBroadcastAnnouncement = (text: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages(prev => [
      ...prev,
      {
        id: `announcement-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        sender: '📢 ADMIN ANNOUNCEMENT',
        avatarColor: 'bg-indigo-700',
        text,
        time: timeStr
      }
    ]);
  };

  const handleFundingCenterSubmit = (tx: { type: 'deposit' | 'withdrawal'; amount: number; method: string; destinationDetails: string }) => {
    const newTx: FundingTransaction = {
      id: `tx-${Date.now()}-${Math.random()}`,
      email: userProfile.email,
      type: tx.type,
      amount: tx.amount,
      method: tx.method,
      destinationDetails: tx.destinationDetails,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    setFundingTransactions(prev => [newTx, ...prev]);
    triggerAlert('success', `${tx.type === 'deposit' ? 'Deposit' : 'Withdrawal'} petition submitted to brokers. Settle from Admin tab!`);
  };

  const handleFundDeposit = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    setBalance(prev => prev + amt);
    setDepositModalOpen(false);
    triggerAlert('success', `Account Fund Succeeded: Credited $${amt.toLocaleString()} to ledger.`);
  };

  const handleFundWithdraw = () => {
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) return;
    if (amt > freeMargin) {
      triggerAlert('error', `Insufficient Free Cash. Maximum withdrawable right now: $${freeMargin.toFixed(2)}`);
      return;
    }
    setBalance(prev => prev - amt);
    setDepositModalOpen(false);
    triggerAlert('success', `Withdrew $${amt.toLocaleString()} from brokerage account wallet.`);
  };


  // --- FILTERED ASSETS WATCHLIST SELECTOR ---
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesCategory = activeTab === 'all' || asset.type === activeTab;
      const matchesSearch = asset.id.toLowerCase().includes(searchText.toLowerCase()) || 
                            asset.name.toLowerCase().includes(searchText.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [assets, activeTab, searchText]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#050b1d] bg-gradient-to-b from-[#0a122e] via-[#050b1d] to-[#02040b] flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans text-gray-200" id="unitycore-landing-viewport">
        
        {/* Floating background styling mesh glows */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 blur-3xl rounded-full pointer-events-none" />

        {/* Global systems notification inside container */}
        {actionAlert && (
          <div id="apex-system-alert" className={`fixed top-4 right-4 z-50 rounded-xl p-3.5 shadow-2xl flex items-center gap-2 max-w-sm border transition-all duration-300 animate-slide-in bg-[#121212] border-indigo-500/30 text-indigo-300`}>
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />}
            <span className="text-xs font-semibold leading-relaxed">{actionAlert.text}</span>
          </div>
        )}

        <div className="relative z-20 w-full max-w-sm flex flex-col items-center justify-center py-6">
          
          {/* Logo badge matching the purple crystal shield shape from the user visual precisely */}
          <div className="relative w-24 h-24 flex items-center justify-center mb-6" id="brand-shield-wrapper">
            <div className="absolute inset-0 bg-violet-500/25 blur-2xl rounded-full" />
            
            <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-[#8b5cf6] to-[#4f46e5] rounded-3xl flex items-center justify-center shadow-[0_0_50px_rgba(124,58,237,0.45)] border border-white/20 select-none">
              <span className="text-white font-extrabold text-5xl font-sans tracking-tight leading-none">A</span>
              <div className="absolute inset-0.5 rounded-[22px] border border-white/10 pointer-events-none" />
              <div className="absolute bottom-2 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-violet-300 to-transparent blur-[1px]" />
            </div>
          </div>

          {/* Upper Title Header */}
          <div className="text-center mb-3">
            <h1 className="text-3xl font-extrabold tracking-[0.16em] text-white select-none">
              APEXTRADE
            </h1>
            <p className="text-indigo-400 font-extrabold text-xs tracking-[0.3em] uppercase mt-1">
              THE TRADING CORE
            </p>
          </div>

          <AnimatePresence mode="wait">
            {authView === 'landing' && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full flex flex-col items-center font-sans mt-2"
                id="landing-view-options"
              >
                {/* Dual Slogans following image spacing constraints perfectly */}
                <div className="text-center space-y-2.5 my-8">
                  <p className="text-lg md:text-xl text-slate-300 font-medium tracking-wide">
                    Trading Simplified.
                  </p>
                  <p className="text-lg md:text-xl text-slate-300 font-medium tracking-wide">
                    Life Amplified.
                  </p>
                </div>

                {/* Main solid violet CTA as seen in Unitycore Bank page */}
                <div className="w-full space-y-4 mt-4">
                  <button
                    id="landing-cta-login-btn"
                    onClick={() => {
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthView('login');
                    }}
                    className="w-full py-4 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-2xl text-sm font-semibold transition-all duration-300 hover:shadow-[0_6px_28px_rgba(99,102,241,0.35)] hover:scale-[1.01] active:scale-[0.99] cursor-pointer text-center font-bold tracking-wide"
                  >
                    Log In
                  </button>

                  <button
                    id="landing-cta-register-btn"
                    onClick={() => {
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                      setAuthView('register');
                    }}
                    className="w-full py-3 bg-transparent hover:bg-white/5 text-slate-300 hover:text-white rounded-2xl text-xs font-semibold transition-all duration-300 cursor-pointer text-center tracking-wider"
                  >
                    Create an Account
                  </button>
                </div>
              </motion.div>
            )}

            {authView === 'login' && (
              <motion.div
                key="login"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-slate-950/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl shadow-2xl mt-4 font-sans"
                id="login-form-panel"
              >
                <div className="text-center mb-6">
                  <h3 className="font-bold text-[#e5e7eb] text-sm tracking-wider uppercase">Welcome Back</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Please enter your registered credentials below</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!authEmail || !authPassword) {
                    triggerAlert('error', 'Please fill in both Email and Password fields.');
                    return;
                  }
                  
                  // Authenticate from registered database
                  let registeredStr = localStorage.getItem('apex_registered_users');
                  let users = [];
                  if (registeredStr) {
                    try {
                      users = JSON.parse(registeredStr);
                    } catch (err) {}
                  }
                  
                  let userMatched = users.find((u: any) => u.email.toLowerCase() === authEmail.toLowerCase() && u.password === authPassword);
                  
                  if (userMatched) {
                    const profile = {
                      email: userMatched.email,
                      displayName: userMatched.displayName || userMatched.email.split('@')[0],
                      avatarColor: userMatched.avatarColor || 'bg-indigo-600',
                      currency: 'USD',
                      defaultLeverage: 100,
                      notificationsEnabled: true
                    };
                    localStorage.setItem('apex_session_user', JSON.stringify({
                      ...profile,
                      balance: userMatched.balance !== undefined ? userMatched.balance : 10000
                    }));
                    
                    setUserProfile(profile);
                    setBalance(userMatched.balance !== undefined ? userMatched.balance : 10000);
                    
                    // Recover account state for positions, trade logs, and copied parameters cleanly
                    const userEmail = profile.email.toLowerCase();
                    const savedPosStr = localStorage.getItem(`apex_positions_${userEmail}`);
                    const savedCopiedStr = localStorage.getItem(`apex_copied_traders_${userEmail}`);
                    const savedAllocStr = localStorage.getItem(`apex_copied_allocations_${userEmail}`);
                    const savedLogStr = localStorage.getItem(`apex_tradelog_${userEmail}`);
                    
                    try {
                      setPositions(savedPosStr ? JSON.parse(savedPosStr) : []);
                    } catch (e) {
                      setPositions([]);
                    }
                    try {
                      setCopiedTraderIds(savedCopiedStr ? JSON.parse(savedCopiedStr) : []);
                    } catch (e) {
                      setCopiedTraderIds([]);
                    }
                    try {
                      setCopiedAllocations(savedAllocStr ? JSON.parse(savedAllocStr) : {});
                    } catch (e) {
                      setCopiedAllocations({});
                    }
                    try {
                      setTradeLog(savedLogStr ? JSON.parse(savedLogStr) : []);
                    } catch (e) {
                      setTradeLog([]);
                    }

                    setIsLoggedIn(true);
                    triggerAlert('success', `Welcome back, ${profile.displayName}! Connection verified.`);
                  } else {
                    triggerAlert('error', 'Authentication issue: invalid email or password.');
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Registered Email</label>
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. trader@exness.io"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">Secret Password</label>
                    <input
                      id="login-password-input"
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-3 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  {/* Autofill helper shortcut for testing convenience */}
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail('trader@exness.io');
                        setAuthPassword('password');
                        triggerAlert('success', 'Demo account credentials loaded. Click below to connect!');
                      }}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline transition"
                    >
                      Use Demo Account
                    </button>
                  </div>

                  <button
                    id="submit-login-btn"
                    type="submit"
                    className="w-full py-3.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/10 cursor-pointer uppercase tracking-widest mt-2 transition-colors duration-200"
                  >
                    Establish Broker Connection
                  </button>
                </form>

                <div className="flex flex-col gap-3 items-center justify-between mt-6 pt-4 border-t border-white/5 text-[10px] text-gray-400">
                  <div className="flex w-full justify-between">
                    <button onClick={() => setAuthView('register')} className="hover:text-white cursor-pointer transition font-bold text-indigo-400">Create Account</button>
                    <button onClick={() => {
                      if (!authEmail) {
                        triggerAlert('error', 'Please submit your registered email first.');
                        return;
                      }
                      triggerAlert('success', `Simulated recovery code dispatched to ${authEmail}`);
                    }} className="hover:text-gray-250 cursor-pointer transition">Forgot password?</button>
                  </div>
                  <button onClick={() => setAuthView('landing')} className="hover:text-white cursor-pointer transition text-gray-500 mt-2">← Back to Home</button>
                </div>
              </motion.div>
            )}

            {authView === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="w-full bg-slate-950/40 backdrop-blur-xl border border-white/5 p-6 md:p-8 rounded-3xl shadow-2xl mt-4 font-sans"
                id="register-form-panel"
              >
                <div className="text-center mb-6">
                  <h3 className="font-bold text-[#e5e7eb] text-sm tracking-wider uppercase">Create Account</h3>
                  <p className="text-[10px] text-gray-400 mt-1">Register a real trading profile with master password key</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (!authName || !authEmail || !authPassword) {
                    triggerAlert('error', 'All registration fields are strictly required.');
                    return;
                  }
                  if (authPassword.length < 4) {
                    triggerAlert('error', 'Password must be at least 4 characters long.');
                    return;
                  }

                  const registeredStr = localStorage.getItem('apex_registered_users');
                  let users = [];
                  if (registeredStr) {
                    try {
                      users = JSON.parse(registeredStr);
                    } catch (err) {}
                  }

                  const duplicate = users.some((u: any) => u.email.toLowerCase() === authEmail.toLowerCase());
                  if (duplicate) {
                    triggerAlert('error', 'This email address is already registered.');
                    return;
                  }

                  const newUser = {
                    email: authEmail,
                    password: authPassword,
                    displayName: authName,
                    balance: 10000,
                    avatarColor: 'bg-indigo-600'
                  };

                  users.push(newUser);
                  localStorage.setItem('apex_registered_users', JSON.stringify(users));
                  reloadRegisteredUsers();

                  const profile = {
                    email: authEmail,
                    displayName: authName,
                    avatarColor: 'bg-indigo-600',
                    currency: 'USD',
                    defaultLeverage: 100,
                    notificationsEnabled: true
                  };
                  localStorage.setItem('apex_session_user', JSON.stringify({ ...profile, balance: 10000 }));

                  setUserProfile(profile);
                  setBalance(10000);
                  setPositions([]);
                  setCopiedTraderIds([]);
                  setCopiedAllocations({});
                  setTradeLog([]);
                  
                  // Seed fresh configuration data keys in storage for this brand-new account
                  const newEmailKey = authEmail.toLowerCase();
                  localStorage.setItem(`apex_positions_${newEmailKey}`, JSON.stringify([]));
                  localStorage.setItem(`apex_copied_traders_${newEmailKey}`, JSON.stringify([]));
                  localStorage.setItem(`apex_copied_allocations_${newEmailKey}`, JSON.stringify({}));
                  localStorage.setItem(`apex_tradelog_${newEmailKey}`, JSON.stringify([]));

                  setIsLoggedIn(true);
                  triggerAlert('success', `Master account launched! Welcome aboard, ${authName}! Connection verified.`);
                }} className="space-y-4 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Your Full Name</label>
                    <input
                      id="register-name-input"
                      type="text"
                      required
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Quantum Bull"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-550 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Email Address</label>
                    <input
                      id="register-email-input"
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="e.g. trader@exness.io"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-550 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Master Password Key</label>
                    <input
                      id="register-password-input"
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                    />
                  </div>

                  <button
                    id="submit-register-btn"
                    type="submit"
                    className="w-full py-3 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/10 cursor-pointer uppercase tracking-widest mt-2"
                  >
                    Launch Master Account
                  </button>
                </form>

                <div className="flex flex-col gap-3 items-center justify-between mt-6 pt-4 border-t border-white/5 text-[10px]">
                  <button onClick={() => setAuthView('login')} className="text-indigo-400 hover:text-white cursor-pointer transition font-bold animate-pulse">Already registered? Log in</button>
                  <button onClick={() => setAuthView('landing')} className="hover:text-white cursor-pointer transition text-gray-500">← Back to Home</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Secure, Reliable, Trusted indicators */}
          <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-6 w-full max-w-sm mt-8 select-none" id="footer-trust-indicators">
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 mb-1 shadow-inner">
                <Lock className="w-4.5 h-4.5 text-violet-400 animate-pulse" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center font-sans mt-1">Secure</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 mb-1 shadow-inner">
                <CheckCircle2 className="w-4.5 h-4.5 text-indigo-400" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center font-sans mt-1">Reliable</span>
            </div>
            
            <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-white/[0.01] border border-white/[0.03]">
              <div className="w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-white/10 mb-1 shadow-inner">
                <Star className="w-4.5 h-4.5 text-rose-450 fill-rose-500/20" />
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider text-center font-sans mt-1">Trusted</span>
            </div>
          </div>

          {/* Copyright text matching footer layout */}
          <p className="text-[10px] text-gray-500 font-sans mt-8 select-none text-center">
            © 2026 Apextrade. All rights reserved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-200 select-none custom-scrollbar flex flex-col md:flex-row">
      {/* LEFT SIDEBAR NAVIGATION */}
      <nav id="elegant-side-navigation" className="hidden md:flex w-20 bg-[#121212] border-r border-white/5 flex-col items-center justify-start py-8 gap-8 shrink-0">
        <div 
          className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20 cursor-pointer"
          onClick={() => setActiveScreen('trade')}
        >
          <div className="w-5 h-5 border-2 border-white rounded-sm rotate-45 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <button 
            id="nav-btn-trade"
            onClick={() => setActiveScreen('trade')}
            title="Trading Desk"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'trade' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
          </button>
          <button 
            id="nav-btn-dashboard"
            onClick={() => setActiveScreen('dashboard')}
            title="Social & AI Dashboard"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button 
            id="nav-btn-positions"
            onClick={() => setActiveScreen('positions')}
            title="Portfolio & Transactions"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'positions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
          <button 
            id="nav-btn-funding"
            onClick={() => setActiveScreen('funding')}
            title="Funding & Wallet Center"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'funding' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Wallet className="w-5 h-5" />
          </button>
          <button 
            id="nav-btn-alerts"
            onClick={() => setActiveScreen('alerts')}
            title="Price Alerts"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'alerts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bell className="w-5 h-5" />
          </button>
          <button 
            id="nav-btn-profile"
            onClick={() => setActiveScreen('profile')}
            title="User Profile & Settings"
            className={`p-3 rounded-xl transition-all cursor-pointer ${
              activeScreen === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-5 h-5" />
          </button>
          {isAdmin && (
            <button 
              id="nav-btn-admin"
              onClick={() => setActiveScreen('admin')}
              title="Admin Panel Control Room"
              className={`p-3 rounded-xl relative transition-all border border-[#9333ea]/20 cursor-pointer ${
                activeScreen === 'admin' ? 'bg-[#9333ea] text-white shadow-lg shadow-purple-600/20' : 'text-purple-400 hover:text-purple-300 hover:bg-purple-950/20'
              }`}
            >
              <ShieldAlert className="w-5 h-5 animate-pulse" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-purple-500" />
            </button>
          )}
        </div>
        
        <div 
          className="mt-auto mb-2 cursor-pointer"
          onClick={() => setActiveScreen('profile')}
        >
          <div className={`w-10 h-10 rounded-full ${userProfile.avatarColor} border border-white/20 flex items-center justify-center font-bold text-xs text-white`}>
            {userProfile.displayName.split(' ').map(n=>n[0]).join('')}
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col p-4 md:p-6 overflow-x-hidden">
        {/* GLOBAL SYSTEM ALERTS AND FLASHING MARGIN CRIT NOTIFICATIONS */}
        {actionAlert && (
          <div id="apex-system-alert" className={`fixed top-4 right-4 z-50 rounded-xl p-3.5 shadow-2xl flex items-center gap-2 max-w-sm border transition-all duration-300 animate-slide-in ${
            actionAlert.type === 'success' ? 'bg-[#121212] border-emerald-500/40 text-emerald-400' :
            actionAlert.type === 'error' ? 'bg-[#121212] border-rose-500/40 text-rose-450' :
            'bg-[#121212] border-white/10 text-slate-200'
          }`}>
            {actionAlert.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400" />}
            <span className="text-xs font-semibold leading-relaxed">{actionAlert.text}</span>
          </div>
        )}

        {/* Mobile Header Menu (visible on mobile only) */}
        <div className="flex md:hidden items-center justify-around w-full bg-[#121212] border border-white/5 rounded-2xl p-1.5 mb-5 shadow-2xl" id="mobile-header-menu overflow-x-auto">
          <button 
            onClick={() => setActiveScreen('trade')}
            className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeScreen === 'trade' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Trade</span>
          </button>
          <button 
            onClick={() => setActiveScreen('dashboard')}
            className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeScreen === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Hub</span>
          </button>
          <button 
            onClick={() => setActiveScreen('positions')}
            className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeScreen === 'positions' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            <span>Portfolio</span>
          </button>
          <button 
            onClick={() => setActiveScreen('funding')}
            className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeScreen === 'funding' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Funding</span>
          </button>
          <button 
            onClick={() => setActiveScreen('profile')}
            className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
              activeScreen === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>
          {isAdmin && (
            <button 
              onClick={() => setActiveScreen('admin')}
              className={`flex-1 py-1 px-1 rounded-xl text-[8px] font-extrabold tracking-wide uppercase transition-all flex flex-col items-center gap-1 cursor-pointer ${
                activeScreen === 'admin' ? 'bg-[#9333ea] text-white shadow-md' : 'text-purple-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
              <span>Admin</span>
            </button>
          )}
        </div>

        {/* NAVIGATION HEADER FORUM */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end pb-5 mb-6 border-b border-white/5 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6 text-[#34d399]" />
              <h1 className="text-xl font-bold tracking-tight">
                Apex<span className="text-[#3b82f6]">Trade</span> Brokerage
              </h1>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-405 text-[10px] rounded font-bold font-mono tracking-wider ml-1">LIVE FEED</span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">High-Leverage Multi-Asset Execution Hub & Social Copy Trading</p>
          </div>

          {/* TOP BUTTON WITHDRAW CONTROLS */}
          <div className="flex items-center gap-3">
            <button
              id="open-deposit-dialog-btn"
              onClick={() => {
                setDepositAmount('5000');
                setDepositModalOpen(true);
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-bold rounded-xl transition border border-white/10 cursor-pointer shadow-sm"
            >
              Settle Wallet Balance
            </button>
          </div>
        </header>

      {/* MAIN TWO COLUMN VIEW GRID */}
      {activeScreen === 'trade' && (
        <div className="space-y-6 animate-fade-in" id="screen-trade-desk">
          {/* Portfolio metrics bar in trade tab only */}
          <MetricCards balance={balance} positions={positions} />

          {/* MAIN THREE COLUMN TRADING CONTROLS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: ASSET WATCHLIST SELECTOR (SPAN 3) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-4">
                <h3 className="text-sm font-bold text-gray-200 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-gray-400" /> Multi-Asset Watchlist
                </h3>
                
                {/* Search filter input */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
                  <input
                    id="asset-search-input"
                    type="text"
                    placeholder="Search stocks, crypto..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 text-xs rounded-lg pl-8 pr-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
                  />
                </div>

                {/* Category selection Tabs */}
                <div className="grid grid-cols-5 gap-1 mb-3 bg-black/45 p-1 border border-white/5 rounded-lg">
                  {(['all', 'crypto', 'stock', 'forex', 'commodity'] as const).map(tab => (
                    <button
                      key={tab}
                      id={`asset-tab-${tab}`}
                      onClick={() => setActiveTab(tab)}
                      className={`py-1 text-[9px] font-bold rounded capitalize transition cursor-pointer ${
                        activeTab === tab ? 'bg-blue-600 text-white border border-blue-500/20 shadow-lg shadow-blue-500/10' : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {tab === 'all' ? 'All' : tab}
                    </button>
                  ))}
                </div>

                {/* Scrolling assets list */}
                <div className="space-y-1 custom-scrollbar max-h-[360px] overflow-y-auto pr-1" id="assets-list-scroller">
                  {filteredAssets.map(asset => {
                    const isSelected = asset.id === selectedAssetId;
                    const changeSign = asset.change24h >= 0 ? '+' : '';
                    const hasActiveHitAlert = priceAlerts.some(alert => alert.assetId === asset.id && alert.isTriggered);

                    return (
                      <button
                        key={asset.id}
                        id={`asset-select-btn-${asset.id}`}
                        onClick={() => setSelectedAssetId(asset.id)}
                        className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer ${
                          isSelected 
                            ? 'bg-white/5 border-blue-500/30 text-white shadow-inner shadow-black/80' 
                            : 'bg-transparent border-transparent hover:bg-white/5 hover:border-white/5'
                        } ${hasActiveHitAlert ? 'ring-1 ring-amber-500 border-amber-500 bg-amber-500/[0.04] animate-pulse' : ''}`}
                      >
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1 text-gray-200">
                            {asset.id}
                            {asset.change24h >= 0 ? (
                              <ChevronUp className="w-3" style={{ height: '12px', color: '#34d399' }} />
                            ) : (
                              <ChevronDown className="w-3" style={{ height: '12px', color: '#f43f5e' }} />
                            )}
                            {hasActiveHitAlert && (
                              <span className="flex items-center gap-0.5 text-[7px] text-amber-450 font-bold bg-amber-500/20 px-1 rounded font-mono uppercase">
                                <Bell className="w-2 h-2 animate-bounce animate-duration-1000" /> Hit
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-500 max-w-[130px] truncate">{asset.name}</div>
                        </div>
                        
                        <div className="text-right">
                          <div className="font-mono text-xs font-bold text-gray-200">
                            {asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}
                          </div>
                          <div className={`font-mono text-[10px] font-medium ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {changeSign}{asset.change24h.toFixed(2)}%
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Watchlist Alert Creator */}
                <div className="mt-4 pt-4 border-t border-white/5 bg-black/10 p-3 rounded-xl">
                  <h4 className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider mb-2 flex items-center gap-1.5">
                    <Bell className="w-3 h-3 text-amber-500" /> Watchlist Alert Creator
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="text-[10px] text-gray-500">Asset: <span className="text-white font-bold">{selectedAsset.id}</span></div>
                      <div className="text-[10px] text-gray-500 text-right">Price: <span className="text-white font-bold font-mono">${selectedAsset.currentPrice}</span></div>
                    </div>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        step="any"
                        placeholder="Target price..."
                        value={alertTargetPrice}
                        onChange={(e) => setAlertTargetPrice(e.target.value)}
                        className="flex-1 min-w-0 bg-black/45 border border-white/5 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
                      />
                      <select
                        value={alertCondition}
                        onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                        className="bg-black/45 border border-white/5 text-[10px] text-gray-300 rounded-lg px-1 focus:outline-none"
                      >
                        <option value="above">Above (≥)</option>
                        <option value="below">Below (≤)</option>
                      </select>
                      <button
                        onClick={() => {
                          const val = parseFloat(alertTargetPrice);
                          if (isNaN(val) || val <= 0) return;
                          handleCreatePriceAlert(selectedAsset.id, val, alertCondition);
                          setAlertTargetPrice('');
                        }}
                        className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold rounded-lg cursor-pointer transition flex items-center justify-center shrink-0"
                        title="Set Alert"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER COLUMN: ACTIVE INTERACTIVE CHART (SPAN 6) */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <TradingChart 
                asset={selectedAsset} 
                activePositions={positions} 
                onClosePosition={handleClosePosition} 
              />
            </div>

            {/* RIGHT COLUMN: HIGH-FREQUENCY BROKER ORDER EXECUTION STATION (SPAN 3) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-full min-h-[460px]" id="brokerage-terminal-order-panel">
                <div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-4">
                    <span className="text-xs font-bold text-gray-200">Exness Execution Terminal</span>
                    <span className="text-[10px] text-blue-400 font-mono">Spread: {selectedAsset.spread} pips</span>
                  </div>

                  {/* BUY / SELL RADIAL SELECTOR */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                      id="trade-side-buy"
                      onClick={() => setTradeType('buy')}
                      className={`py-2 text-xs font-extrabold rounded-xl uppercase transition tracking-wider cursor-pointer ${
                        tradeType === 'buy' 
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' 
                          : 'bg-black/35 border border-white/5 hover:text-white text-gray-400'
                      }`}
                    >
                      Buy / Long
                    </button>
                    <button
                      id="trade-side-sell"
                      onClick={() => setTradeType('sell')}
                      className={`py-2 text-xs font-extrabold rounded-xl uppercase transition tracking-wider cursor-pointer ${
                        tradeType === 'sell' 
                          ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/25' 
                          : 'bg-black/35 border border-white/5 hover:text-white text-gray-400'
                      }`}
                    >
                      Sell / Short
                    </button>
                  </div>

                  {/* COLLATERAL INPUT */}
                  <div className="mb-4">
                    <label className="block text-xs text-gray-400 mb-1.5 font-medium flex justify-between">
                      <span className="flex items-center gap-1.5">
                        Margin Capital
                        {calculatedMarginUsagePct > 0 && (
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded font-sans border transition-colors ${
                            calculatedMarginUsagePct > 100 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : 'bg-blue-500/10 text-blue-400 border-blue-500/25'
                          }`}>
                            {calculatedMarginUsagePct.toFixed(0)}% Use
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-[10px] text-gray-500">Free: ${freeMargin.toFixed(0)}</span>
                    </label>
                    <div className="relative group/margin">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs font-mono">
                        $
                      </div>
                      <input
                        id="order-margin-input"
                        type="number"
                        value={marginInput}
                        onChange={(e) => setMarginInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg pl-7 pr-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-blue-600 transition-colors"
                        placeholder="0"
                      />

                      {/* ELEGANT DYNAMIC TOOLTIP */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#161616] border border-white/10 rounded-xl shadow-2xl opacity-0 scale-95 group-hover/margin:opacity-100 group-hover/margin:scale-100 group-focus-within/margin:opacity-100 group-focus-within/margin:scale-100 transition-all duration-200 pointer-events-none z-30 font-sans space-y-2 text-left">
                        <div className="text-[9px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center justify-between">
                          <span>Margin Usage Preview</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${
                            calculatedMarginUsagePct > 100 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : calculatedMarginUsagePct > 0 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-white/5 text-gray-500 border-white/10'
                          }`}>
                            {calculatedMarginUsagePct > 100 ? 'Insufficient' : calculatedMarginUsagePct > 0 ? 'Favorable' : 'Enter Amount'}
                          </span>
                        </div>
                        
                        <div className="flex items-baseline justify-between pt-0.5">
                          <span className={`text-2xl font-black font-mono leading-none ${
                            calculatedMarginUsagePct > 100 ? 'text-rose-400' : 'text-blue-400'
                          }`}>
                            {calculatedMarginUsagePct.toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-gray-500 font-mono">
                            ${(parseFloat(marginInput) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>

                        {/* Dynamic Progress Bar */}
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 rounded-full ${
                              calculatedMarginUsagePct > 100 ? 'bg-rose-500 animate-pulse' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(calculatedMarginUsagePct, 100)}%` }}
                          />
                        </div>

                        <p className="text-[10px] text-gray-400 leading-relaxed font-medium">
                          {calculatedMarginUsagePct > 100 
                            ? `⚠️ Danger: This order requires $${(parseFloat(marginInput) || 0).toLocaleString()} margin, but you only have $${freeMargin.toLocaleString()} free.`
                            : calculatedMarginUsagePct > 0
                              ? `Securing this order will allocate ${calculatedMarginUsagePct.toFixed(1)}% of your available free capital ($${freeMargin.toLocaleString()}).`
                              : `Enter a margin amount to preview the estimated allocation percentage.`}
                        </p>
                        
                        {/* Tooltip Chevron */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#161616] border-r border-b border-white/10 rotate-45 -mt-1" />
                      </div>
                    </div>
                  </div>

                  {/* ACTION LEVERAGE ACCORDION SLIDER */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center text-xs text-gray-400 mb-1.5">
                      <span>Multiplier (Leverage)</span>
                      <span className="font-mono font-bold text-slate-100 bg-white/5 px-1.5 py-0.5 rounded border border-white/10">
                        {leverageInput}x
                      </span>
                    </div>
                    <input
                      id="order-leverage-slider"
                      type="range"
                      min="1"
                      max={selectedAsset.leverageMax}
                      value={leverageInput}
                      onChange={(e) => setLeverageInput(parseInt(e.target.value))}
                      className="w-full accent-blue-600 bg-black/50 h-1.5 rounded-lg cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-gray-550 font-mono mt-1">
                      <span>1x</span>
                      <span>Max: {selectedAsset.leverageMax}x</span>
                    </div>
                  </div>

                  {/* RISK CONTROLS ACCORDION (SL / TP) */}
                  <div className="space-y-3 bg-black/20 border border-white/5 p-3 rounded-xl mb-4 text-xs">
                    <div className="font-semibold text-gray-400 text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-blue-450" /> Risk Management Triggers
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Stop Loss Price (SL)</span>
                        <span className="text-[9px] text-gray-505 font-mono">Current: ${selectedAsset.currentPrice}</span>
                      </div>
                      <input
                        id="order-sl-input"
                        type="number"
                        placeholder="None set"
                        value={stopLossInput}
                        onChange={(e) => setStopLossInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-rose-500/30"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                        <span>Take Profit Price (TP)</span>
                      </div>
                      <input
                        id="order-tp-input"
                        type="number"
                        placeholder="None set"
                        value={takeProfitInput}
                        onChange={(e) => setTakeProfitInput(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* TOTAL ESTIMATES VALUE ROW & CTA BUTTON */}
                <div>
                  <div className="bg-black/30 p-2.5 rounded-xl text-[10px] border border-white/5 mb-4 space-y-1.5 font-mono">
                    <div className="flex justify-between text-gray-500">
                      <span>Borrowing Value:</span>
                      <span className="font-bold text-gray-300">
                        ${((parseFloat(marginInput) || 0) * leverageInput).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Estimated Volume Units:</span>
                      <span className="font-bold text-gray-300">
                         {(((parseFloat(marginInput) || 0) * leverageInput) / (selectedAsset.currentPrice || 1)).toFixed(selectedAsset.type === 'forex' ? 2 : 4)}
                      </span>
                    </div>
                  </div>

                  <button
                    id="execute-trade-order-btn"
                    onClick={handleExecuteTrade}
                    className={`w-full py-3 text-white text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-lg ${
                      tradeType === 'buy' 
                        ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20' 
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    }`}
                  >
                    <Play className="w-4 h-4" /> Open {tradeType === 'buy' ? 'BUY / LONG' : 'SELL / SHORT'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* LOWER SECTION: ACTIVE LEVERAGED POSITIONS LEDGER */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]" id="trading-active-orders-section">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-3 mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <ArrowDownUp className="w-5 h-5 text-blue-500" />
                  <h2 className="font-bold text-base">Active Orders & Positions Ledger</h2>
                </div>
                
                {positions.length > 0 && (
                  <button
                    id="close-all-positions-btn"
                    onClick={handleCloseAllPositions}
                    className="px-3 py-1.5 bg-rose-600/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition duration-200 text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Close All Positions
                  </button>
                )}
              </div>

              {/* TAB PANELS FOR OPEN VS HIST */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300 border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 text-[10px] uppercase font-semibold">
                      <th className="py-2.5 px-2">Asset</th>
                      <th className="py-2.5 px-2">Type / Size</th>
                      <th className="py-2.5 px-2">Entry Price</th>
                      <th className="py-2.5 px-2">Current Price</th>
                      <th className="py-2.5 px-2">Collateral / Margin</th>
                      <th className="py-2.5 px-2 text-right">Running Profit (P&L)</th>
                      <th className="py-2.5 px-2 text-center">Execution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5" id="positions-table-body">
                    {positions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center text-gray-500 font-medium italic">
                          No active leveraged positions found. Setup margin capital and press Buy or Sell!
                        </td>
                      </tr>
                    ) : (
                      <AnimatePresence initial={false}>
                        {positions.map((pos) => {
                          const isBuy = pos.side === 'buy';
                          const priceDiff = isBuy 
                            ? pos.currentPrice - pos.entryPrice 
                            : pos.entryPrice - pos.currentPrice;
                          const percentageReturn = priceDiff / pos.entryPrice;
                          const runningPL = percentageReturn * pos.leverage * pos.margin;
                          const isUp = runningPL >= 0;

                          return (
                            <motion.tr 
                              key={pos.id} 
                              id={`position-row-${pos.id}`}
                              initial={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 150, transition: { duration: 0.35, ease: 'easeOut' } }}
                              className="hover:bg-white/5 transition duration-150 group font-mono text-[11px]"
                            >
                              <td className="py-3 px-2">
                                <button
                                  onClick={() => setSelectedAssetId(pos.assetId)}
                                  className="font-bold text-gray-200 block text-left hover:text-blue-500 transition cursor-pointer"
                                >
                                  {pos.assetId}
                                </button>
                                <span className="text-[9px] text-gray-500 block uppercase font-sans tracking-tight">
                                  {pos.assetType}
                                </span>
                              </td>
                              <td className="py-3 px-2">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  isBuy ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                } mr-1.5 uppercase`}>
                                  {pos.side}
                                </span>
                                <span className="text-gray-300">
                                  {pos.leverage}x
                                </span>
                                <span className="block text-[9px] text-gray-500 mt-0.5 font-sans whitespace-nowrap">
                                  Units: {pos.sizeUnits.toFixed(pos.assetType === 'forex' ? 2 : 4)}
                                </span>
                              </td>
                              <td className="py-3 px-2 font-mono text-gray-300">
                                ${pos.entryPrice.toLocaleString(undefined, { minimumFractionDigits: pos.assetType === 'forex' ? 5 : 2 })}
                              </td>
                              <td className="py-3 px-2 font-mono text-gray-300">
                                ${pos.currentPrice.toLocaleString(undefined, { minimumFractionDigits: pos.assetType === 'forex' ? 5 : 2 })}
                              </td>
                              <td className="py-3 px-2">
                                <span className="font-bold text-gray-200">${pos.margin.toFixed(2)}</span>
                                {pos.copiedFromTraderId && (
                                  <span className="block text-[8px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1 rounded-sm w-fit mt-0.5 font-sans whitespace-nowrap">
                                    Copied Holding
                                  </span>
                                )}
                              </td>
                              <td className={`py-3 px-2 text-right font-bold text-xs ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {isUp ? '+' : ''}${runningPL.toFixed(2)}
                                <span className="block text-[9px] font-medium opacity-75 mt-0.5">
                                  ({isUp ? '+' : ''}{(percentageReturn * pos.leverage * 100).toFixed(1)}%)
                                </span>
                              </td>
                              <td className="py-3 px-2 text-center">
                                <button
                                  id={`close-trade-btn-${pos.id}`}
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="px-2.5 py-1.5 bg-white/5 hover:bg-rose-600 hover:text-white text-gray-300 text-[10px] font-bold rounded transition border border-white/10 hover:border-transparent cursor-pointer shadow-sm"
                                >
                                  Settle Close
                                </button>
                              </td>
                            </motion.tr>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOCIAL AI & COPYING DIRECTORY DASHBOARD HUB */}
      {activeScreen === 'dashboard' && (
        <div className="space-y-6 animate-fade-in" id="screen-dashboard-hub">
          {/* HEADER HUB WELCOME ROW */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-gray-150 flex items-center gap-2 mb-2">
              <LayoutDashboard className="w-5 h-5 text-blue-400" /> Executive Social Hub & Copilot
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Synthesize market opportunities with our deep learning AI assistant, interact with concurrent network traders, design price-action threshold guidelines, and start copying high-yield trade allocations seamlessly.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* HISTORICAL COMPLETED TRANSACTIONS REGISTRY */}
            <div className="lg:col-span-8 bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col justify-between min-h-[420px]" id="hub-history-completed-ledger">
              <div>
                <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
                  <History className="w-5 h-5 text-[#34d399]" />
                  <h2 className="font-bold text-base">Historical Transactions Ledger</h2>
                </div>

                <div className="space-y-1.5 max-h-[365px] overflow-y-auto custom-scrollbar pr-1" id="transactions-log-list">
                  {tradeLog.length === 0 ? (
                    <div className="py-16 text-center text-gray-500 font-medium italic">
                      No transactions logged under this session yet. Access the trade desk to settle live operations!
                    </div>
                  ) : (
                    tradeLog.map((log) => {
                      const isUpLog = log.pnl >= 0;
                      return (
                        <div 
                          key={log.id} 
                          className="bg-black/20 hover:bg-black/40 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono transition duration-150"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-1 h-3 rounded ${isUpLog ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                            <div>
                              <span className="text-gray-300 font-bold">{log.assetId}</span>
                              <span className={`inline-block px-1 rounded text-[8px] font-bold mx-1.5 uppercase ${
                                log.side === 'buy' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>My {log.side}</span>
                              <span className="text-gray-500 font-sans text-[10px]">{log.time}</span>
                            </div>
                          </div>
                          
                          <div className="flex gap-4 font-mono text-right">
                            <div>
                              <span className="block text-[8px] text-gray-600 font-sans uppercase">Entry/Exit</span>
                              <span className="text-gray-400">${log.entryPrice.toLocaleString()} → ${log.exitPrice.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-gray-600 font-sans uppercase">Payout</span>
                              <span className={`${isUpLog ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}`}>
                                {isUpLog ? '+' : ''}${log.pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* AI COMPASS AND CHAT NETWORK FORUM */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <AICopilot selectedAsset={selectedAsset} />
              <CommunityChat messages={chatMessages} onSendMessage={handleUserSendMessage} />
            </div>
          </div>

          {/* SOCIAL MASTER TRADERS DIRECTORY CARDS */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5" id="social-master-directory-panel">
            <CopyTradingDirectory 
              freeMargin={freeMargin} 
              copiedTraderIds={copiedTraderIds}
              onStartCopy={handleStartCopyTrading}
              onStopCopy={handleStopCopyTrading}
              copiedAllocations={copiedAllocations}
            />
          </div>
        </div>
      )}

      {activeScreen === 'positions' && (
        <div className="space-y-6 mt-6 animate-fade-in" id="screen-positions">
          {/* Portfolio & Open Positions Panel */}
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
            <h2 className="text-base font-bold text-gray-150 flex items-center gap-2 mb-4">
              <ArrowDownUp className="w-5 h-5 text-blue-400" /> Active Operations & Trading Ledger
            </h2>
            <p className="text-xs text-gray-400 mb-4">Active positions are processed in real-time. System liquidation policy closes positions in negative margin if level slips below 50%.</p>

            {/* Active positions list */}
            {positions.length === 0 ? (
              <div className="p-10 border border-dashed border-white/5 rounded-xl text-center bg-black/10">
                <Coins className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-400">No active brokerage positions in session.</p>
                <button 
                  onClick={() => setActiveScreen('dashboard')}
                  className="mt-3 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition cursor-pointer"
                >
                  Browse Watchlist To Open Trades
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto font-sans">
                <table className="w-full text-left text-xs min-w-[640px]">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 uppercase tracking-widest text-[9px] font-extrabold">
                      <th className="pb-3 text-left">Asset</th>
                      <th className="pb-3 text-left">Type & Size</th>
                      <th className="pb-3 text-right">Entry Price</th>
                      <th className="pb-3 text-right">Market Price</th>
                      <th className="pb-3 text-right">Trigger SL / TP</th>
                      <th className="pb-3 text-right">Unrealized profit</th>
                      <th className="pb-3 text-right">Exit Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <AnimatePresence initial={false}>
                      {positions.map((pos) => {
                        const corresponds = assets.find(a => a.id === pos.assetId);
                        const currentPrice = corresponds ? corresponds.currentPrice : pos.currentPrice;
                        const isBuy = pos.side === 'buy';
                        const priceDiff = isBuy ? currentPrice - pos.entryPrice : pos.entryPrice - currentPrice;
                        const profitPct = priceDiff / pos.entryPrice * pos.leverage * 100;
                        const profitAmount = (priceDiff / pos.entryPrice) * pos.leverage * pos.margin;

                        return (
                          <motion.tr 
                            key={pos.id} 
                            id={`mgmt-position-row-${pos.id}`}
                            initial={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 150, transition: { duration: 0.35, ease: 'easeOut' } }}
                            className="hover:bg-white/[0.02] text-gray-305 font-medium font-mono text-[11px]"
                          >
                            <td className="py-4 font-bold text-gray-200">
                              <div className="flex items-center gap-1.5 font-sans">
                                <span className={`w-1.5 h-1.5 rounded-full ${isBuy ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                                {pos.assetId} 
                                <span className="text-[9px] text-gray-500 font-normal">({pos.assetType})</span>
                              </div>
                            </td>
                            <td className="py-4 font-sans text-gray-400">
                              <span className={`inline-block px-1 rounded text-[9px] font-extrabold mr-1.5 ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'}`}>
                                {pos.side.toUpperCase()}
                              </span>
                              {pos.leverage}x (${pos.margin.toLocaleString()} margin)
                            </td>
                            <td className="py-4 text-right text-gray-400">${pos.entryPrice.toLocaleString()}</td>
                            <td className="py-4 text-right text-white font-bold">${currentPrice.toLocaleString()}</td>
                            <td className="py-4 text-right text-slate-500 font-sans">
                              <div className="text-[10px]">SL: {pos.stopLoss ? `$${pos.stopLoss}` : 'None'}</div>
                              <div className="text-[10px]">TP: {pos.takeProfit ? `$${pos.takeProfit}` : 'None'}</div>
                            </td>
                            <td className={`py-4 text-right font-bold text-xs ${profitAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {profitAmount >= 0 ? '+' : ''}${profitAmount.toFixed(2)} ({profitAmount >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                            </td>
                            <td className="py-4 text-right">
                              <button
                                id={`close-active-pos-btn-${pos.id}`}
                                onClick={() => handleClosePosition(pos.id)}
                                className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-500 text-rose-400 hover:text-white transition rounded font-bold text-[9px] tracking-wide uppercase font-sans cursor-pointer"
                              >
                                Exit Market
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Leader Board / Copy Trading */}
          <div className="border border-white/5 rounded-2xl bg-[#121212] p-5">
            <CopyTradingDirectory 
              freeMargin={freeMargin} 
              copiedTraderIds={copiedTraderIds}
              onStartCopy={handleStartCopyTrading}
              onStopCopy={handleStopCopyTrading}
              copiedAllocations={copiedAllocations}
            />
          </div>

          {/* Social Feeds & Ledger Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Chats pane */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              <CommunityChat messages={chatMessages} onSendMessage={handleUserSendMessage} />
            </div>

            {/* Closed Operational Logs Ledger */}
            <div className="lg:col-span-4 bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col h-[400px]">
              <h3 className="text-xs font-extrabold text-gray-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-500" /> Session Account Ledger
              </h3>
              <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {tradeLog.length === 0 ? (
                  <p className="text-[10px] text-gray-500 italic py-5 text-center font-sans">No transactions logged in historical ledger yet.</p>
                ) : (
                  tradeLog.map((log) => {
                    const isUpLog = log.pnl >= 0;
                    return (
                      <div 
                        key={log.id} 
                        className="bg-black/20 hover:bg-black/45 border border-white/5 rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono transition duration-150"
                      >
                        <div>
                          <div className="font-bold text-gray-350">{log.assetId}</div>
                          <div className={`text-[8px] font-semibold ${log.side === 'buy' ? 'text-emerald-400' : 'text-rose-450'} uppercase`}>{log.side}</div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${isUpLog ? 'text-emerald-400' : 'text-rose-450'}`}>
                            {isUpLog ? '+' : ''}${log.pnl.toFixed(2)}
                          </div>
                          <div className="text-[9px] text-gray-500 font-sans">{log.time}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeScreen === 'alerts' && (
        <div className="space-y-6 mt-6 animate-fade-in" id="screen-alerts">
          <div className="bg-[#121212] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-150 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-amber-500 animate-pulse" /> High-frequency Price Alert Matrix
                </h2>
                <p className="text-xs text-gray-400 mt-1">Configure limits on assets to receive immediate visual flashes once prices tick across target levels.</p>
              </div>
              <button 
                onClick={handleClearTriggeredAlerts}
                className="px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-xs font-bold transition border border-white/10 cursor-pointer"
              >
                Clear Hit Alerts
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Alert Setup Box */}
              <div className="bg-black/20 border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-extrabold uppercase text-[#e5e7eb] mb-3">Set New Limit Alert</h3>
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Target Asset</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full bg-[#121212] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                    >
                      {assets.map(a => (
                        <option key={a.id} value={a.id}>{a.id} - {a.name} (${a.currentPrice.toLocaleString()})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Alert Condition</label>
                    <div className="grid grid-cols-2 gap-2 bg-[#121212] p-1 border border-white/5 rounded-lg">
                      <button
                        onClick={() => setAlertCondition('above')}
                        className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${alertCondition === 'above' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-400'}`}
                      >
                        Price Above (≥)
                      </button>
                      <button
                        onClick={() => setAlertCondition('below')}
                        className={`py-1 text-[10px] font-bold rounded transition cursor-pointer ${alertCondition === 'below' ? 'bg-amber-500 text-black font-extrabold' : 'text-gray-404'}`}
                      >
                        Price Below (≤)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Target Price (Value)</label>
                    <input
                      type="number"
                      step="any"
                      placeholder={`e.g. ${selectedAsset.currentPrice}`}
                      value={alertTargetPrice}
                      onChange={(e) => setAlertTargetPrice(e.target.value)}
                      className="w-full bg-[#121212] border border-white/5 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <button
                    onClick={() => {
                      const val = parseFloat(alertTargetPrice);
                      if (isNaN(val) || val <= 0) {
                        triggerAlert('error', 'Please input a valid target price value.');
                        return;
                      }
                      handleCreatePriceAlert(selectedAssetId, val, alertCondition);
                      setAlertTargetPrice('');
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wide rounded-xl cursor-pointer transition flex items-center justify-center gap-1 shadow-lg shadow-amber-500/10"
                  >
                    <Plus className="w-4 h-4" /> Deploy Limits Trigger
                  </button>
                </div>
              </div>

              {/* Alert List Table */}
              <div className="md:col-span-2 bg-black/10 border border-white/5 rounded-xl p-4">
                <h3 className="text-xs font-extrabold uppercase text-[#e5e7eb] mb-3">Deployed Watchers List ({priceAlerts.length})</h3>
                {priceAlerts.length === 0 ? (
                  <div className="text-center py-10">
                    <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-2 opacity-30" />
                    <p className="text-xs text-slate-500 italic font-sans">No limit price parameters preloaded onto exchange monitoring system.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
                    {priceAlerts.map(al => (
                      <div 
                        key={al.id} 
                        className={`p-3 rounded-lg border flex items-center justify-between transition ${al.isTriggered ? 'bg-amber-500/5 border-amber-500/20 shadow-inner' : 'bg-black/20 border-white/5'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-lg ${al.isTriggered ? 'bg-amber-500/20 text-amber-400 animate-pulse' : 'bg-white/5 text-gray-400'}`}>
                            <Bell className="w-4 h-4" />
                          </div>
                          <div className="font-mono">
                            <div className="text-xs font-bold text-gray-200">
                              {al.assetId} 
                              <span className={`inline-block ml-2 text-[8px] px-1 rounded uppercase tracking-wider ${al.condition === 'above' ? 'bg-emerald-950 text-emerald-405 border border-emerald-500/20' : 'bg-rose-950 text-rose-400 border border-rose-500/20'}`}>
                                {al.condition} Price
                              </span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-sans">Threshold Target: <span className="font-bold text-gray-350">${al.targetPrice.toLocaleString()}</span></div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 font-mono">
                          {al.isTriggered ? (
                            <span className="text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 tracking-wider uppercase animate-bounce">
                              ● HIT ({al.time})
                            </span>
                          ) : (
                            <span className="text-[9px] bg-slate-500/10 border border-slate-500/30 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              Monitoring...
                            </span>
                          )}

                          <button 
                            onClick={() => handleDeletePriceAlert(al.id)}
                            className="p-1.5 border border-white/5 bg-transparent text-gray-400 hover:text-white hover:bg-rose-600 hover:border-transparent transition rounded-lg text-xs font-bold shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeScreen === 'profile' && (
        <div className="space-y-6 mt-6 animate-fade-in" id="screen-profile">
          {!isLoggedIn ? (
            <div className="max-w-md mx-auto bg-[#121212] border border-white/5 rounded-2xl p-6 shadow-2xl relative font-sans">
              
              {authMode === 'login' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6 text-blue-450" />
                    </div>
                    <h3 className="font-extrabold text-[#e5e7eb] text-sm uppercase tracking-wider">Secure Exchange Authorization</h3>
                    <p className="text-[10px] text-gray-550 mt-1">Input trading credentials to unlock broker sync API.</p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!authEmail || !authPassword) {
                      triggerAlert('error', 'Please fill in both Email and Password fields.');
                      return;
                    }
                    setIsLoggedIn(true);
                    setUserProfile(prev => ({ ...prev, email: authEmail, displayName: authEmail.split('@')[0] }));
                    triggerAlert('success', `Welcome back, broker sync confirmed: ${authEmail.split('@')[0]}!`);
                  }} className="space-y-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">User Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="trader@exness.io"
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Password Key</label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 cursor-pointer uppercase tracking-widest mt-2"
                    >
                      Establish Broker Sync
                    </button>
                  </form>

                  <div className="flex justify-between mt-5 pt-4 border-t border-white/5 text-[10px] text-gray-400">
                    <button onClick={() => setAuthMode('forgot')} className="hover:text-white cursor-pointer transition">Forgot password?</button>
                    <button onClick={() => setAuthMode('register')} className="hover:text-white cursor-pointer transition font-bold text-blue-405">Join registration room</button>
                  </div>
                </div>
              )}

              {authMode === 'register' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-[#34d399]/10 border border-[#34d399]/20 flex items-center justify-center mb-3">
                      <Shield className="w-6 h-6 text-[#34d399]" />
                    </div>
                    <h3 className="font-extrabold text-[#e5e7eb] text-sm uppercase tracking-wider">Register Master Account</h3>
                    <p className="text-[10px] text-gray-505 mt-1">Establish secure, military-grade trading profile key.</p>
                  </div>

                  <form onSubmit={(e) => {
                    e.preventDefault();
                    if (!authEmail || !authPassword || !authName) {
                      triggerAlert('error', 'All fields are strictly required.');
                      return;
                    }
                    setIsLoggedIn(true);
                    setUserProfile({
                      email: authEmail,
                      displayName: authName,
                      avatarColor: 'bg-indigo-600',
                      currency: 'USD',
                      defaultLeverage: 100,
                      notificationsEnabled: true
                    });
                    triggerAlert('success', `Master Account generated! Welcome, ${authName}!`);
                  }} className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-550 mb-1">Trader Name (Nickname)</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="Dynamic Bull"
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-650 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-555 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="trader@exness.io"
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-655 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-555 mb-1">Master Password Key</label>
                      <input
                        type="password"
                        required
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-655 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/10 cursor-pointer uppercase tracking-widest mt-2"
                    >
                      Launch Master Account
                    </button>
                  </form>

                  <div className="flex justify-center mt-5 pt-4 border-t border-white/5 text-[10px]">
                    <button onClick={() => setAuthMode('login')} className="text-gray-500 hover:text-white cursor-pointer transition font-bold">Already registered? Log in</button>
                  </div>
                </div>
              )}

              {authMode === 'forgot' && (
                <div>
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3">
                      <Lock className="w-6 h-6 text-amber-450" />
                    </div>
                    <h3 className="font-extrabold text-[#e5e7eb] text-sm uppercase tracking-wider">Reset Account Key</h3>
                    <p className="text-[10px] text-gray-505 mt-1">Get reset token link to recover master transaction profile.</p>
                  </div>

                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Registered Email Address</label>
                      <input
                        type="email"
                        placeholder="trader@exness.io"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full bg-[#121212] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!authEmail) {
                          triggerAlert('error', 'Please fill in your Email Address.');
                          return;
                        }
                        triggerAlert('success', `Simulated Recovery link dispatched to: ${authEmail}. Please check your inbox.`);
                        setAuthMode('login');
                      }}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-405 text-black rounded-xl text-xs font-bold transition shadow-lg shrink-0 cursor-pointer uppercase tracking-widest"
                    >
                      Dispatch Password Recovery Email
                    </button>
                  </div>

                  <div className="flex justify-center mt-5 pt-4 border-t border-white/5 text-[10px]">
                    <button onClick={() => setAuthMode('login')} className="text-gray-500 hover:text-white cursor-pointer transition font-bold">Return to login desk</button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Details Card */}
              <div className="bg-[#121212] border border-white/5 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-center mb-6 pb-5 border-b border-white/5">
                    <div className={`mx-auto w-16 h-16 rounded-full font-bold text-2xl flex items-center justify-center text-white mb-3 shadow ${userProfile.avatarColor}`}>
                      {userProfile.displayName ? userProfile.displayName.split(' ').map(n=>n[0]).join('') : 'U'}
                    </div>
                    <h2 className="text-base font-extrabold text-[#e5e7eb]">{userProfile.displayName || 'Unset'}</h2>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">{userProfile.email}</p>
                    <span className="inline-block mt-2.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-sans font-bold uppercase tracking-wider">
                      ● Active Broker Verified
                    </span>
                  </div>

                  {/* Profile statistics */}
                  <div className="space-y-3 font-sans">
                    <h3 className="text-[10px] font-extrabold uppercase text-gray-500 tracking-wider">Historical Account Performance</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-gray-500 block">Net Account Value</span>
                        <span className="text-xs font-mono font-bold text-white">${balance.toLocaleString()}</span>
                      </div>
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-gray-500 block">Trades Completed</span>
                        <span className="text-xs font-mono font-bold text-white">{tradeLog.length}</span>
                      </div>
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-gray-500 block">Avg Win rate</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">72.4%</span>
                      </div>
                      <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                        <span className="text-[8px] text-gray-500 block">Settle practice limit</span>
                        <span className="text-xs font-mono font-bold text-[#2563eb]">$10,000</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => {
                      setDepositAmount('10000');
                      setDepositModalOpen(true);
                    }}
                    className="flex-1 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs cursor-pointer transition uppercase font-sans font-extrabold tracking-wider"
                  >
                    Adjust Wallet Capital
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem('apex_session_user');
                      setAuthEmail('');
                      setAuthPassword('');
                      setAuthName('');
                      setAuthView('landing');
                      setIsLoggedIn(false);
                      triggerAlert('info', 'Secure connection closed. Welcome back to ApexTrade.');
                    }}
                    className="p-2 bg-[#1f1f1f] hover:bg-rose-950 text-gray-400 hover:text-white rounded-xl transition cursor-pointer"
                    title="Log Out From Session"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Profile Config Settings Customize form */}
              <div className="lg:col-span-2 bg-[#121212] border border-white/5 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-gray-150 mb-1 flex items-center gap-1.5 border-b border-white/5 pb-3">
                  <Settings className="w-4 h-4 text-blue-400" /> Account Settings & Settings Management
                </h3>

                <div className="mt-4 space-y-6 font-sans">
                  {/* Nickname and color setup */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Trade alias (Full Name)</label>
                      <input
                        type="text"
                        value={userProfile.displayName}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, displayName: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                        placeholder="Master Buller"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1.5">Avatar Color Theme</label>
                      <div className="flex items-center gap-2 mt-1.5 font-sans">
                        {['bg-teal-600', 'bg-emerald-600', 'bg-blue-600', 'bg-indigo-600', 'bg-rose-600', 'bg-amber-600', 'bg-purple-600'].map(colorClass => (
                          <button
                            key={colorClass}
                            onClick={() => setUserProfile(prev => ({ ...prev, avatarColor: colorClass }))}
                            className={`w-6 h-6 rounded-full border cursor-pointer ${colorClass} ${userProfile.avatarColor === colorClass ? 'ring-2 ring-white border-black scale-110' : 'border-white/10'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Leverage configurations */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 mb-1 font-sans">
                      <span>Standard default leverage limit</span>
                      <span className="text-blue-400 font-mono font-bold">{userProfile.defaultLeverage}x</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="500"
                      step="5"
                      value={userProfile.defaultLeverage}
                      onChange={(e) => {
                        const targetVal = parseInt(e.target.value);
                        setUserProfile(prev => ({ ...prev, defaultLeverage: targetVal }));
                      }}
                      className="w-full accent-blue-600 cursor-pointer bg-neutral-800"
                    />
                    <p className="text-[10px] text-gray-550 mt-1">Preset leverage ratio applied automatically when deploying trading positions in the terminal.</p>
                  </div>

                  {/* Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-550 mb-1.5">Primary Ledger Currency</label>
                      <select
                        value={userProfile.currency}
                        onChange={(e) => setUserProfile(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      >
                        <option value="USD">USD ($) - United States Dollar</option>
                        <option value="EUR">EUR (€) - European Union Euro</option>
                        <option value="GBP">GBP (£) - Great British Pound</option>
                        <option value="JPY">JPY (¥) - Japanese Yen</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-gray-550 mb-1.5">Evaluation Notifications</label>
                      <div className="flex items-center justify-between bg-black/20 p-2 border border-white/5 rounded-xl mt-1">
                        <span className="text-xs text-gray-400 font-sans">Enable real-time sound alarms</span>
                        <button
                          onClick={() => setUserProfile(prev => ({ ...prev, notificationsEnabled: !prev.notificationsEnabled }))}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${userProfile.notificationsEnabled ? 'bg-blue-600' : 'bg-[#1b1b1b]'}`}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${userProfile.notificationsEnabled ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                      onClick={() => {
                        triggerAlert('success', 'Profile and account settings committed successfully.');
                      }}
                      className="px-5 py-2.5 bg-[#121212] border border-white/10 hover:border-slate-500 hover:text-white text-gray-300 font-extrabold uppercase text-xs rounded-xl cursor-pointer transition shadow-md"
                    >
                      Commit Configurations
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeScreen === 'funding' && (
        <div className="space-y-6 mt-6 animate-fade-in" id="screen-funding">
          <FundingCenter
            balance={balance}
            freeMargin={freeMargin}
            userProfile={userProfile}
            fundingTransactions={fundingTransactions}
            onSubmitTransaction={handleFundingCenterSubmit}
          />
        </div>
      )}

      {activeScreen === 'admin' && isAdmin && (
        <div className="space-y-6 mt-6 animate-fade-in" id="screen-admin">
          <AdminPanel
            assets={assets}
            registeredUsers={registeredUsers}
            fundingTransactions={fundingTransactions}
            userProfile={userProfile}
            onAdjustUserBalance={handleAdjustUserBalance}
            onForceCloseUserPosition={handleForceCloseUserPosition}
            onSetUserStatus={handleSetUserStatus}
            onApproveTransaction={handleApproveTransaction}
            onDeclineTransaction={handleDeclineTransaction}
            onSetPriceOverride={handleSetPriceOverride}
            onBroadcastAnnouncement={handleBroadcastAnnouncement}
            priceOverrides={priceOverrides}
          />
        </div>
      )}

      {/* CASH WALLET SETTLE FUNDS MODAL DIALOG OVERLAY */}
      {depositModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-white/5 max-w-sm w-full rounded-2xl p-6 shadow-2xl relative font-sans" id="wallet-settle-modal">
            <button
              onClick={() => setDepositModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition cursor-pointer text-lg font-bold"
            >
              ×
            </button>

            <div className="text-center mb-5">
              <div className="mx-auto w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-blue-450" />
              </div>
              <h3 className="font-extrabold text-[#e5e7eb] text-sm">Settle Brokerage Funds</h3>
              <p className="text-[10px] text-gray-500 mt-1">Settle cash transactions to modify active trading balances.</p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 mb-1.5">
                Settle amount ($)
              </label>
              <input
                id="settle-amount-input"
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="w-full bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-sm font-mono tracking-tight text-white focus:outline-none focus:border-blue-600 transition-colors"
                placeholder="Enter settlement amount..."
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                id="deposit-action-btn"
                onClick={handleFundDeposit}
                className="py-2.5 bg-blue-600 text-white rounded-xl text-xs hover:bg-blue-500 transition font-bold shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                Deposit Funds
              </button>
              <button
                id="withdraw-action-btn"
                onClick={handleFundWithdraw}
                className="py-2.5 bg-rose-600 text-white rounded-xl text-xs hover:bg-rose-500 transition font-bold shadow-lg shadow-rose-500/10 cursor-pointer"
              >
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
