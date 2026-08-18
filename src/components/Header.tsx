import React from 'react';
import { Coins, RefreshCw, History, Globe2, Sparkles, CheckCircle2 } from 'lucide-react';
import { ExchangeRatesData } from '../types/currency';
import { UNIQUE_CURRENCIES } from '../data/currencies';

interface HeaderProps {
  ratesData: ExchangeRatesData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  ratesData,
  isLoading,
  onRefresh,
  onOpenHistory,
  historyCount,
}) => {
  const isLive = ratesData?.source === 'live';
  const lastUpdated = ratesData?.timeLastUpdateUtc
    ? new Date(ratesData.timeLastUpdateUtc).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Just now';

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">
                Global FX
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                170+ Currencies
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium hidden sm:block mt-0.5">
              Live foreign exchange rates & country currency converter
            </p>
          </div>
        </div>

        {/* Live Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Indicator Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span
              className={`w-2 h-2 rounded-full ${
                isLive ? 'bg-emerald-500 shadow-xs shadow-emerald-500' : 'bg-amber-500'
              }`}
            />
            <span className="font-semibold text-[11px] hidden md:inline">
              {isLive ? 'Live FX Stream' : 'Cached Rates'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">({lastUpdated})</span>
          </div>

          {/* History Button */}
          <button
            id="open-history-btn"
            onClick={onOpenHistory}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            title="Conversion History"
          >
            <History className="w-4.5 h-4.5" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {historyCount > 9 ? '9+' : historyCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
