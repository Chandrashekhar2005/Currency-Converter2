import React, { useState, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3 } from 'lucide-react';
import { Currency } from '../types/currency';
import { getHistoricalRates, formatCurrencyAmount } from '../services/exchangeRates';

interface ExchangeRateTrendProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  currentRate: number;
}

type Timeframe = '7D' | '1M' | '3M' | '1Y';

export const ExchangeRateTrend: React.FC<ExchangeRateTrendProps> = ({
  fromCurrency,
  toCurrency,
  currentRate,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');

  const { points, stats } = useMemo(() => {
    return getHistoricalRates(fromCurrency.code, toCurrency.code, currentRate, timeframe);
  }, [fromCurrency.code, toCurrency.code, currentRate, timeframe]);

  const isPositive = stats.change >= 0;

  // Format Y-axis ticks cleanly
  const minDomain = Math.floor(stats.low * 0.995 * 1000) / 1000;
  const maxDomain = Math.ceil(stats.high * 1.005 * 1000) / 1000;

  return (
    <div
      id="exchange-rate-trends-panel"
      className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Historical Exchange Rate Trends
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {fromCurrency.code} to {toCurrency.code} price action & performance
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          {(['7D', '1M', '3M', '1Y'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                timeframe === tf
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">Period Change</span>
          <div className={`flex items-center gap-1 text-sm font-bold mt-0.5 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            <span>
              {isPositive ? '+' : ''}
              {stats.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">Period High</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
            {formatCurrencyAmount(stats.high, toCurrency.decimals ?? 4)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">Period Low</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
            {formatCurrencyAmount(stats.low, toCurrency.decimals ?? 4)}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium block">Period Average</span>
          <span className="text-sm font-bold text-slate-900 mt-0.5 block font-mono">
            {formatCurrencyAmount(stats.average, toCurrency.decimals ?? 4)}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 sm:h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="formattedDate"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              domain={[minDomain, maxDomain]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => Number(val).toFixed(val < 1 ? 4 : val > 100 ? 1 : 2)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-800">
                      <p className="text-slate-400 font-medium">{data.date}</p>
                      <p className="font-bold text-sm text-emerald-400 font-mono mt-0.5">
                        1 {fromCurrency.code} = {data.rate} {toCurrency.code}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#rateGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
