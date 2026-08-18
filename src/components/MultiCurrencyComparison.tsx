import React, { useState } from 'react';
import { Plus, Trash2, Globe, TrendingUp, Sparkles } from 'lucide-react';
import { Currency, ExchangeRatesData } from '../types/currency';
import { UNIQUE_CURRENCIES } from '../data/currencies';
import { CurrencyFlag } from './CurrencyFlag';
import { calculateRate, formatCurrencyAmount } from '../services/exchangeRates';
import { CurrencySelectorModal } from './CurrencySelectorModal';

interface MultiCurrencyComparisonProps {
  baseCurrency: Currency;
  baseAmount: number;
  ratesData: ExchangeRatesData | null;
  onSelectAsTarget: (currency: Currency) => void;
}

const DEFAULT_WATCHLIST_CODES = ['EUR', 'GBP', 'JPY', 'INR', 'CAD', 'AUD', 'CHF', 'CNY', 'AED', 'SGD'];

export const MultiCurrencyComparison: React.FC<MultiCurrencyComparisonProps> = ({
  baseCurrency,
  baseAmount,
  ratesData,
  onSelectAsTarget,
}) => {
  const [watchlistCodes, setWatchlistCodes] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('fx_watchlist_codes');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WATCHLIST_CODES;
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const saveWatchlist = (codes: string[]) => {
    setWatchlistCodes(codes);
    try {
      localStorage.setItem('fx_watchlist_codes', JSON.stringify(codes));
    } catch {}
  };

  const handleAddCurrency = (currency: Currency) => {
    if (!watchlistCodes.includes(currency.code)) {
      saveWatchlist([...watchlistCodes, currency.code]);
    }
  };

  const handleRemoveCurrency = (code: string) => {
    saveWatchlist(watchlistCodes.filter((c) => c !== code));
  };

  const watchlistCurrencies = watchlistCodes
    .filter((code) => code !== baseCurrency.code)
    .map((code) => UNIQUE_CURRENCIES.find((c) => c.code === code))
    .filter((c): c is Currency => Boolean(c));

  return (
    <div
      id="multi-currency-comparison-board"
      className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Multi-Currency Conversion Watchlist
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Converting{' '}
            <span className="font-semibold text-slate-800">
              {formatCurrencyAmount(baseAmount, baseCurrency.decimals)} {baseCurrency.code}
            </span>{' '}
            simultaneously across global markets
          </p>
        </div>

        <button
          id="add-currency-to-watchlist-btn"
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all border border-emerald-200/80 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          Add Currency
        </button>
      </div>

      {/* Grid of Compare Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
        {watchlistCurrencies.map((curr) => {
          const rate = calculateRate(baseCurrency.code, curr.code, ratesData);
          const converted = baseAmount * rate;

          return (
            <div
              key={curr.code}
              id={`watchlist-card-${curr.code}`}
              className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 hover:border-slate-300 flex flex-col justify-between transition-all group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <CurrencyFlag
                    countryCode={curr.countryCode}
                    flagEmoji={curr.flagEmoji}
                    size="md"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-sm text-slate-900 leading-none">
                        {curr.code}
                      </span>
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-200/70 text-slate-600">
                        {curr.symbol}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium truncate block mt-0.5">
                      {curr.countryName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleRemoveCurrency(curr.code)}
                    title={`Remove ${curr.code} from watchlist`}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rate and Converted Value */}
              <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-baseline justify-between gap-2">
                <div>
                  <span className="text-[11px] text-slate-400 block">Rate</span>
                  <span className="text-xs font-semibold text-slate-600 font-mono">
                    1 {baseCurrency.code} = {formatCurrencyAmount(rate, curr.decimals ?? 4)}
                  </span>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono tracking-tight">
                    {formatCurrencyAmount(converted, curr.decimals)}
                  </div>
                  <button
                    onClick={() => onSelectAsTarget(curr)}
                    className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 hover:underline inline-block mt-0.5"
                  >
                    Set as Target →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Currency Modal */}
      <CurrencySelectorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        selectedCode=""
        onSelect={handleAddCurrency}
        title="Add Currency to Watchlist"
      />
    </div>
  );
};
