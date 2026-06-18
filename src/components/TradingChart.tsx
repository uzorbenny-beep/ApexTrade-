import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Asset, Candlestick, Position } from '../types';
import { Activity, CandlestickChart, Eye, Settings, TrendingUp, ZoomIn, ZoomOut } from 'lucide-react';

interface TradingChartProps {
  asset: Asset;
  activePositions: Position[];
  onClosePosition: (id: string) => void;
}

export default function TradingChart({ asset, activePositions, onClosePosition }: TradingChartProps) {
  const [chartMode, setChartMode] = useState<'candle' | 'line'>('candle');
  const [timeframe, setTimeframe] = useState<'1m' | '5m' | '15m'>('1m');
  const [showSMA, setShowSMA] = useState<boolean>(true);
  const [showBB, setShowBB] = useState<boolean>(true);
  const [showRSI, setShowRSI] = useState<boolean>(true);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  
  // Interactive coordinates & indices for precise OHLCV Tooltips
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Resize observer to keep chart beautifully fluid
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(Math.max(300, entry.contentRect.width));
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const data = asset.history;

  // Sizing helpers for calculations
  const rsiChartHeight = showRSI ? 80 : 0;
  const gap = showRSI ? 20 : 0;
  const totalHeight = 280 + rsiChartHeight + gap + 20 + 20; // mainChartHeight + rsiChartHeight + gap + paddingTop + paddingBottom
  const drawableWidth = containerWidth - 10 - 75; // containerWidth - paddingLeft - paddingRight
  const paddingLeft = 10;
  const paddingRight = 75;
  const paddingTop = 20;
  const mainChartHeight = 280;

  // Mouse move handlers resolving the precise hovered candlestick
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    if (!containerRef.current || data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Solve back from screen posX to data index i
    const relativeX = x - paddingLeft;
    let index = Math.round((relativeX / drawableWidth) * (data.length - 1));
    index = Math.max(0, Math.min(data.length - 1, index));
    setHoveredIndex(index);
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  // Let's calculate Indicators dynamically
  // 1. Simple Moving Average (SMA 10)
  const smaValues = useMemo(() => {
    const period = 10;
    const values: (number | null)[] = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        values.push(null);
      } else {
        const sum = data.slice(i - period + 1, i + 1).reduce((acc, c) => acc + c.close, 0);
        values.push(parseFloat((sum / period).toFixed(5)));
      }
    }
    return values;
  }, [data]);

  // 2. Bollinger Bands (Period 14, Multipier 2)
  const bollingerBands = useMemo(() => {
    const period = 14;
    const multiplier = 2;
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];
    const middle: (number | null)[] = [];

    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(null);
        lower.push(null);
        middle.push(null);
      } else {
        const subset = data.slice(i - period + 1, i + 1);
        const mean = subset.reduce((acc, c) => acc + c.close, 0) / period;
        
        const variance = subset.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        upper.push(parseFloat((mean + multiplier * stdDev).toFixed(5)));
        lower.push(parseFloat((mean - multiplier * stdDev).toFixed(5)));
        middle.push(parseFloat(mean.toFixed(5)));
      }
    }
    return { upper, lower, middle };
  }, [data]);

  // 3. RSI (Period 14)
  const rsiValues = useMemo(() => {
    const period = 14;
    const values: (number | null)[] = [];
    
    let gains = 0;
    let losses = 0;

    // Initial gains/losses
    for (let i = 1; i < Math.min(period, data.length); i++) {
      const diff = data[i].close - data[i - 1].close;
      if (diff > 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        values.push(null);
      } else {
        const diff = data[i].close - data[i - 1].close;
        const currentGain = diff > 0 ? diff : 0;
        const currentLoss = diff < 0 ? -diff : 0;

        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;

        if (avgLoss === 0) {
          values.push(100);
        } else {
          const rs = avgGain / avgLoss;
          const rsi = 100 - 100 / (1 + rs);
          values.push(parseFloat(rsi.toFixed(2)));
        }
      }
    }
    return values;
  }, [data]);

  // Min and Max prices loaded to scale the chart dynamically
  const { minPrice, maxPrice } = useMemo(() => {
    const prices = data.flatMap(c => [c.low, c.high]);
    
    // Account for indicators
    if (showSMA) {
      smaValues.forEach(v => v && prices.push(v));
    }
    if (showBB) {
      bollingerBands.upper.forEach(v => v && prices.push(v));
      bollingerBands.lower.forEach(v => v && prices.push(v));
    }

    let min = Math.min(...prices);
    let max = Math.max(...prices);

    // Padding
    const range = max - min || 1;
    min -= range * 0.08;
    max += range * 0.08;

    return { minPrice: min, maxPrice: max };
  }, [data, showSMA, showBB, smaValues, bollingerBands]);

  // Scalings helpers
  const svgWidth = containerWidth;

  const getX = (index: number) => {
    return paddingLeft + (index / (data.length - 1)) * drawableWidth;
  };

  const getY = (price: number) => {
    const ratio = (price - minPrice) / (maxPrice - minPrice);
    return paddingTop + mainChartHeight - ratio * mainChartHeight;
  };

  const getRsiY = (rsi: number) => {
    const ratio = rsi / 100;
    const localTop = paddingTop + mainChartHeight + gap;
    return localTop + rsiChartHeight - ratio * rsiChartHeight;
  };

  // Build Candles path / lines
  const upColor = '#34d399';
  const downColor = '#f43f5e';

  // SMA Path SVG definition
  const smaPathD = useMemo(() => {
    let path = '';
    smaValues.forEach((val, i) => {
      if (val !== null) {
        const x = getX(i);
        const y = getY(val);
        if (path === '') path = `M ${x} ${y}`;
        else path += ` L ${x} ${y}`;
      }
    });
    return path;
  }, [smaValues, minPrice, maxPrice, drawableWidth, containerWidth]);

  // Bollinger Bands path generators
  const bbAreaPathD = useMemo(() => {
    let upperPath = '';
    let lowerPath = '';
    
    for (let i = 0; i < data.length; i++) {
      const uVal = bollingerBands.upper[i];
      if (uVal !== null) {
        const x = getX(i);
        const y = getY(uVal);
        if (upperPath === '') upperPath = `M ${x} ${y}`;
        else upperPath += ` L ${x} ${y}`;
      }
    }

    for (let i = data.length - 1; i >= 0; i--) {
      const lVal = bollingerBands.lower[i];
      if (lVal !== null) {
        const x = getX(i);
        const y = getY(lVal);
        if (lowerPath === '') lowerPath = `L ${x} ${y}`;
        else lowerPath += ` L ${x} ${y}`;
      }
    }

    if (upperPath && lowerPath) return `${upperPath} ${lowerPath} Z`;
    return '';
  }, [bollingerBands, minPrice, maxPrice, drawableWidth, containerWidth]);

  // Pricing Line Path
  const priceLineD = useMemo(() => {
    let path = '';
    data.forEach((c, i) => {
      const x = getX(i);
      const y = getY(c.close);
      if (path === '') path = `M ${x} ${y}`;
      else path += ` L ${x} ${y}`;
    });
    return path;
  }, [data, minPrice, maxPrice, drawableWidth, containerWidth]);

  const priceAreaD = useMemo(() => {
    if (data.length === 0) return '';
    const startX = getX(0);
    const endX = getX(data.length - 1);
    const baseY = paddingTop + mainChartHeight;
    return `${priceLineD} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  }, [data, priceLineD, minPrice, maxPrice, drawableWidth, containerWidth]);

  // RSI Line Path
  const rsiPathD = useMemo(() => {
    let path = '';
    rsiValues.forEach((val, i) => {
      if (val !== null) {
        const x = getX(i);
        const y = getRsiY(val);
        if (path === '') path = `M ${x} ${y}`;
        else path += ` L ${x} ${y}`;
      }
    });
    return path;
  }, [rsiValues, containerWidth]);

  // Render prices milestones on Y-Axis
  const yAxisTicks = useMemo(() => {
    const ticks = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      const price = minPrice + (i / (count - 1)) * (maxPrice - minPrice);
      ticks.push(parseFloat(price.toFixed(asset.type === 'forex' ? 5 : 2)));
    }
    return ticks;
  }, [minPrice, maxPrice, asset]);

  // Filter positions specifically open for this asset
  const filteredPositions = useMemo(() => {
    return activePositions.filter(p => p.assetId === asset.id);
  }, [activePositions, asset]);

  return (
    <div className="bg-[#121212] border border-white/5 rounded-2xl p-4 flex flex-col" id="chart-panel-container">
      {/* Chart Headers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        {/* Asset summary */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center font-bold text-sm tracking-widest text-blue-400 border border-blue-500/20">
            {asset.id.slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-gray-200">{asset.name}</span>
              <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${
                asset.type === 'crypto' ? 'bg-indigo-950/40 text-indigo-400' :
                asset.type === 'stock' ? 'bg-amber-950/40 text-amber-400' :
                asset.type === 'forex' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-800/40 text-slate-400'
              }`}>
                {asset.type.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-mono font-bold text-white">
                ${asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}
              </span>
              <span className={`text-xs font-semibold font-mono ${asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}% (24h)
              </span>
            </div>
          </div>
        </div>

        {/* Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2" id="chart-controls-toolbar">
          <div className="bg-black/40 border border-white/5 rounded-lg p-1 flex">
            <button
              id="chart-mode-candle"
              onClick={() => setChartMode('candle')}
              className={`p-1.5 rounded-md transition text-xs flex items-center gap-1 ${chartMode === 'candle' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/15' : 'text-gray-400 hover:text-white'}`}
              title="Candlestick Chart"
            >
              <CandlestickChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Candles</span>
            </button>
            <button
              id="chart-mode-line"
              onClick={() => setChartMode('line')}
              className={`p-1.5 rounded-md transition text-xs flex items-center gap-1 ${chartMode === 'line' ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/15' : 'text-gray-400 hover:text-white'}`}
              title="Line Chart"
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Line</span>
            </button>
          </div>

          <div className="bg-black/40 border border-white/5 rounded-lg p-1 flex">
            {(['1m', '5m', '15m'] as const).map(tf => (
              <button
                key={tf}
                id={`chart-timeframe-${tf}`}
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition ${timeframe === tf ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/15' : 'text-gray-450 hover:text-white'}`}
              >
                {tf.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg p-1">
            <button
              id="toggle-bb-indicator"
              onClick={() => setShowBB(!showBB)}
              className={`px-2 py-1 text-[10px] rounded-md transition font-medium ${showBB ? 'bg-indigo-950 text-indigo-400 border border-white/10' : 'text-gray-500 hover:text-gray-450'}`}
              title="Bollinger Bands"
            >
              BB
            </button>
            <button
              id="toggle-sma-indicator"
              onClick={() => setShowSMA(!showSMA)}
              className={`px-2 py-1 text-[10px] rounded-md transition font-medium ${showSMA ? 'bg-amber-950 text-amber-550 border border-white/10' : 'text-gray-500 hover:text-gray-450'}`}
              title="Moving Average"
            >
              SMA
            </button>
            <button
              id="toggle-rsi-indicator"
              onClick={() => setShowRSI(!showRSI)}
              className={`px-2 py-1 text-[10px] rounded-md transition font-medium ${showRSI ? 'bg-violet-950 text-violet-400 border border-white/10' : 'text-gray-500 hover:text-gray-450'}`}
              title="RSI Oscillator"
            >
              RSI
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic OHLCV Tick Metadata Strip */}
      <div className="bg-black/40 border border-white/5 py-2 px-3 mb-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-mono rounded-xl items-center">
        {hoveredIndex !== null ? (
          <>
            <span className="text-indigo-400 font-extrabold shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              HOVER TICK:
            </span>
            <span className="text-gray-400">O: <strong className="text-white">${data[hoveredIndex].open.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">H: <strong className="text-emerald-400">${data[hoveredIndex].high.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">L: <strong className="text-rose-450">${data[hoveredIndex].low.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">C: <strong className="text-white">${data[hoveredIndex].close.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">V: <strong className="text-indigo-300">{(data[hoveredIndex].volume || 0).toLocaleString()}</strong></span>
            <span className="text-gray-500 text-[10px] ml-auto font-sans font-semibold shrink-0">{data[hoveredIndex].time}</span>
          </>
        ) : (
          <>
            <span className="text-emerald-400 font-extrabold shrink-0 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              LIVE TICK:
            </span>
            <span className="text-gray-400">O: <strong className="text-white">${(data[data.length - 1]?.open || asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">H: <strong className="text-emerald-400">${(data[data.length - 1]?.high || asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">L: <strong className="text-rose-450">${(data[data.length - 1]?.low || asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-400">C: <strong className="text-white">${(data[data.length - 1]?.close || asset.currentPrice).toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</strong></span>
            <span className="text-gray-500 text-[10px] ml-auto font-sans">Hover chart for historical ticks</span>
          </>
        )}
      </div>

      {/* SVG Interactive Chart Box */}
      <div className="relative bg-black/45 border border-white/5 rounded-xl overflow-hidden p-1 custom-scrollbar" ref={containerRef} id="trading-chart-canvas">
        <svg 
          width="100%" 
          height={totalHeight} 
          viewBox={`0 0 ${containerWidth} ${totalHeight}`}
          className="select-none overflow-visible cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            {/* Emerald Green Gradient */}
            <linearGradient id="greenFade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#34d399" stopOpacity="0.0" />
            </linearGradient>
            
            {/* Bollinger shaded field */}
            <linearGradient id="bbShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* GRID LINES & LABELS */}
          {yAxisTicks.map((price, i) => {
            const y = getY(price);
            return (
              <g key={`grid-line-${i}`} className="opacity-40">
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke="#1E293B" 
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <text 
                  x={svgWidth - paddingRight + 6} 
                  y={y + 3} 
                  fill="#94A3B8" 
                  fontSize={9} 
                  fontFamily="monospace"
                  textAnchor="start"
                >
                  {price.toFixed(asset.type === 'forex' ? 5 : 2)}
                </text>
              </g>
            );
          })}

          {/* Time scale Labels at Bottom */}
          {data.map((c, i) => {
            if (i % 8 === 0) {
              const x = getX(i);
              return (
                <text
                  key={`time-label-${i}`}
                  x={x}
                  y={paddingTop + mainChartHeight + 14}
                  fill="#64748B"
                  fontSize={8}
                  fontFamily="monospace"
                  textAnchor="middle"
                  className="opacity-80"
                >
                  {c.time}
                </text>
              );
            }
            return null;
          })}

          {/* BOLLINGER BANDS (SHADER AND UPPER/LOWER LINES) */}
          {showBB && bbAreaPathD && (
            <g className="transition-all duration-300">
              <path d={bbAreaPathD} fill="url(#bbShade)" />
              <path 
                d={useMemo(() => {
                  let path = '';
                  bollingerBands.upper.forEach((v, i) => {
                    if (v !== null) {
                      const x = getX(i);
                      const y = getY(v);
                      if (path === '') path = `M ${x} ${y}`;
                      else path += ` L ${x} ${y}`;
                    }
                  });
                  return path;
                }, [bollingerBands, minPrice, maxPrice, drawableWidth, containerWidth])} 
                stroke="#6366F1" 
                strokeWidth={1} 
                strokeOpacity={0.4}
                fill="none" 
              />
              <path 
                d={useMemo(() => {
                  let path = '';
                  bollingerBands.lower.forEach((v, i) => {
                    if (v !== null) {
                      const x = getX(i);
                      const y = getY(v);
                      if (path === '') path = `M ${x} ${y}`;
                      else path += ` L ${x} ${y}`;
                    }
                  });
                  return path;
                }, [bollingerBands, minPrice, maxPrice, drawableWidth, containerWidth])} 
                stroke="#6366F1" 
                strokeWidth={1} 
                strokeOpacity={0.4}
                fill="none" 
              />
            </g>
          )}

          {/* SMA 10 (Orange run line) */}
          {showSMA && smaPathD && (
            <path 
              d={smaPathD} 
              stroke="#F59E0B" 
              strokeWidth={1.5} 
              fill="none" 
              strokeOpacity={0.7}
              className="transition-all duration-300" 
            />
          )}

          {/* LINE CHART MODE (Robinhood styled elegant flow) */}
          {chartMode === 'line' && (
            <g>
              <path fill="url(#greenFade)" d={priceAreaD} />
              <path 
                d={priceLineD} 
                stroke={asset.change24h >= 0 ? upColor : downColor} 
                strokeWidth={2} 
                fill="none" 
              />
            </g>
          )}

          {/* CANDLESTICK CHART MODE (High-performance broker bars) */}
          {chartMode === 'candle' && data.map((c, i) => {
            const x = getX(i);
            const isUp = c.close >= c.open;
            
            const lowY = getY(c.low);
            const highY = getY(c.high);
            const openY = getY(c.open);
            const closeY = getY(c.close);
            
            const bodyY = Math.min(openY, closeY);
            const bodyHeight = Math.max(1, Math.abs(openY - closeY));
            const candleWidth = Math.max(2, Math.floor(drawableWidth / data.length) - 2);

            return (
              <g key={`candle-${i}`} className="hover:opacity-85 cursor-pointer">
                {/* Wick shadow */}
                <line 
                  x1={x} 
                  y1={lowY} 
                  x2={x} 
                  y2={highY} 
                  stroke={isUp ? upColor : downColor} 
                  strokeWidth={1.2}
                />
                {/* Candle body rectangle */}
                <rect 
                  x={x - candleWidth / 2} 
                  y={bodyY} 
                  width={candleWidth} 
                  height={bodyHeight} 
                  fill={isUp ? upColor : downColor}
                  rx={0.5}
                />
              </g>
            );
          })}

          {/* RSI CHART PANEL (Bottom Relative Strength) */}
          {showRSI && (
            <g className="transition-all duration-300">
              <rect 
                x={paddingLeft} 
                y={paddingTop + mainChartHeight + gap} 
                width={drawableWidth} 
                height={rsiChartHeight} 
                fill="#020617" 
                stroke="#1E293B" 
                strokeWidth={0.5} 
                rx={4}
              />
              {/* Overbought 70 bound line */}
              <line 
                x1={paddingLeft} 
                y1={getRsiY(70)} 
                x2={svgWidth - paddingRight} 
                y2={getRsiY(70)} 
                stroke="#EF4444" 
                strokeWidth={0.5} 
                strokeDasharray="4 4"
              />
              <text x={svgWidth - paddingRight + 5} y={getRsiY(70) + 3} fill="#EF4444" fontSize={7} fontFamily="monospace">70</text>

              {/* Oversold 30 bound line */}
              <line 
                x1={paddingLeft} 
                y1={getRsiY(30)} 
                x2={svgWidth - paddingRight} 
                y2={getRsiY(30)} 
                stroke="#10B981" 
                strokeWidth={0.5} 
                strokeDasharray="4 4"
              />
              <text x={svgWidth - paddingRight + 5} y={getRsiY(30) + 3} fill="#10B981" fontSize={7} fontFamily="monospace">30</text>
              
              <text x={paddingLeft + 10} y={paddingTop + mainChartHeight + gap + 12} fill="#64748B" fontSize={8} fontWeight="600">
                RSI (14)
              </text>

              {/* RSI Curve Path */}
              {rsiPathD && (
                <path d={rsiPathD} stroke="#818CF8" strokeWidth={1} fill="none" />
              )}
            </g>
          )}

          {/* ACTIVE ORDER LINES OVERLAID RIGHT ON THE CHART CANVAS (Pro-Exness broker visualizer!) */}
          {filteredPositions.map((pos) => {
            const y = getY(pos.entryPrice);
            // Check if price is within bounds
            if (y < paddingTop || y > paddingTop + mainChartHeight) return null;

            const isBuy = pos.side === 'buy';
            const posPL = (pos.currentPrice - pos.entryPrice) * (isBuy ? 1 : -1) / pos.entryPrice * pos.leverage * pos.margin;

            return (
              <g key={`chart-position-${pos.id}`}>
                {/* Horizontal line for execution price */}
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={svgWidth - paddingRight} 
                  y2={y} 
                  stroke={isBuy ? '#00D395' : '#FE475E'} 
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                
                {/* Floating position tag */}
                <foreignObject
                  x={paddingLeft + 15}
                  y={y - 10}
                  width={240}
                  height={22}
                >
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[9px] font-semibold text-white shadow-md border ${
                    isBuy ? 'bg-emerald-950/90 border-[#00D395]/40 text-emerald-400' : 'bg-rose-950/90 border-[#FE475E]/40 text-rose-400'
                  }`}>
                    <span>{pos.side.toUpperCase()} : {pos.sizeUnits.toFixed(asset.type === 'forex' ? 1 : 3)} units</span>
                    <span className="opacity-40">|</span>
                    <span className="font-mono">P&L: ${posPL >= 0 ? '+' : ''}{posPL.toFixed(2)}</span>
                    <button
                      id={`close-chartpos-${pos.id}`}
                      onClick={() => onClosePosition(pos.id)}
                      className="ml-auto w-3.5 h-3.5 bg-slate-900 rounded-full hover:bg-slate-800 flex items-center justify-center text-white text-[8px] font-bold border border-slate-700 transition"
                      title="Instant Close Order"
                    >
                      ×
                    </button>
                  </div>
                </foreignObject>
              </g>
            );
          })}

          {/* LIVE TICK PRICE HORIZONTAL RUNNER POINTER */}
          {(() => {
            const currentY = getY(asset.currentPrice);
            return (
              <g>
                <line 
                  x1={paddingLeft} 
                  y1={currentY} 
                  x2={svgWidth - paddingRight} 
                  y2={currentY} 
                  stroke="#F8FAFC" 
                  strokeWidth={1.5}
                  strokeOpacity={0.8}
                />
                {/* Pulsing indicator anchor dot */}
                <circle 
                  cx={svgWidth - paddingRight} 
                  cy={currentY} 
                  r={3.5} 
                  fill="#F8FAFC"
                  className="animate-ping"
                />
                {/* Price block pill */}
                <foreignObject
                  x={svgWidth - paddingRight}
                  y={currentY - 9}
                  width={paddingRight}
                  height={18}
                >
                  <div className="bg-slate-100 text-slate-950 text-[10px] font-bold font-mono px-1 py-0.5 rounded-l flex items-center justify-center h-full border border-slate-300 shadow">
                    {asset.currentPrice.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}
                  </div>
                </foreignObject>
              </g>
            );
          })()}

          {/* INTERACTIVE HOVER CROSSHAIRS */}
          {hoveredIndex !== null && (
            <g pointerEvents="none" id="hover-crosshairs-group">
              {/* Vertical line crosshair */}
              <line
                x1={getX(hoveredIndex)}
                y1={paddingTop}
                x2={getX(hoveredIndex)}
                y2={paddingTop + mainChartHeight}
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="2 3"
                opacity={0.7}
              />
              
              {/* Horizontal line crosshair at mouse Y position */}
              {mousePos.y >= paddingTop && mousePos.y <= paddingTop + mainChartHeight && (
                <line
                  x1={paddingLeft}
                  y1={mousePos.y}
                  x2={svgWidth - paddingRight}
                  y2={mousePos.y}
                  stroke="#6366f1"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                  opacity={0.7}
                />
              )}

              {/* Glowing anchor dot at close price of hovered ticker */}
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(data[hoveredIndex].close)}
                r={4.5}
                fill={data[hoveredIndex].close >= data[hoveredIndex].open ? '#34d399' : '#f43f5e'}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            </g>
          )}
        </svg>

        {/* INTERACTIVE HOVER OHLCV TOOLTIP OVERLAY */}
        {hoveredIndex !== null && (
          <div 
            className="absolute z-40 pointer-events-none bg-slate-950/95 border border-indigo-500/30 rounded-xl p-3 shadow-2xl flex flex-col gap-1 text-[11px] font-mono min-w-[200px]"
            style={{
              left: `${Math.min(containerWidth - 215, Math.max(10, mousePos.x + 15))}px`,
              top: `${Math.min(totalHeight - 142, Math.max(10, mousePos.y - 120))}px`
            }}
            id="chart-hover-tooltip"
          >
            <div className="text-gray-400 font-bold border-b border-white/10 pb-1 mb-1 flex justify-between items-center">
              <span>{data[hoveredIndex].time}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-sans font-bold ${
                data[hoveredIndex].close >= data[hoveredIndex].open ? 'bg-emerald-950/80 text-emerald-400' : 'bg-rose-950/80 text-rose-450'
              }`}>
                {data[hoveredIndex].close >= data[hoveredIndex].open ? '▲ BULLISH' : '▼ BEARISH'}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">OPEN:</span>
              <span className="text-white font-bold">${data[hoveredIndex].open.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">HIGH:</span>
              <span className="text-emerald-400 font-bold">${data[hoveredIndex].high.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">LOW:</span>
              <span className="text-rose-450 font-bold">${data[hoveredIndex].low.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-500">CLOSE:</span>
              <span className="text-white font-bold">${data[hoveredIndex].close.toLocaleString(undefined, { minimumFractionDigits: asset.type === 'forex' ? 5 : 2 })}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-white/5 pt-1 mt-0.5">
              <span className="text-gray-500 font-medium">VOLUME:</span>
              <span className="text-slate-300 font-bold">{(data[hoveredIndex].volume || 0).toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Legend overlays */}
        <div className="absolute top-3 left-3 flex gap-2 pointer-events-none" id="chart-legend-labels">
          <div className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono border border-slate-800 flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded bg-[#00D395]" /> Open Price
          </div>
          {showSMA && (
            <div className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono border border-slate-800 flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-0.5 bg-[#F59E0B]" /> SMA-10
            </div>
          )}
          {showBB && (
            <div className="bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[10px] font-mono border border-slate-800 flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded bg-indigo-500/30 border border-indigo-400" /> BB (14, 2)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
