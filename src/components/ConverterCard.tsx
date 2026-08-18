import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Copy, Check, TrendingUp, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { Currency, ExchangeRatesData } from '../types/currency';
import { CurrencyFlag } from './CurrencyFlag';
import { formatCurrencyAmount, calculateRate } from '../services/exchangeRates';

interface ConverterCardProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  onOpenFromModal: () => void;
  onOpenToModal: () => void;
  onSwapCurrencies: () => void;
  ratesData: ExchangeRatesData | null;
  isLoading: boolean;
  onRefresh: () => void;
  onShowToast: (msg: string) => void;
  onAddToHistory?: (from: Currency, to: Currency, fromAmt: number, toAmt: number, rate: number) => void;
}

const PRESET_AMOUNTS = [1, 10, 50, 100, 500, 1000, 5000];

export const ConverterCard: React.FC<ConverterCardProps> = ({
  fromCurrency,
  toCurrency,
  onOpenFromModal,
  onOpenToModal,
  onSwapCurrencies,
  ratesData,
  isLoading,
  onRefresh,
  onShowToast,
  onAddToHistory,
}) => {
  const [amountStr, setAmountStr] = useState('100');
  const [isCopied, setIsCopied] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  const numericAmount = parseFloat(amountStr.replace(/,/g, '')) || 0;
  const currentRate = calculateRate(fromCurrency.code, toCurrency.code, ratesData);
  const inverseRate = currentRate > 0 ? 1 / currentRate : 0;
  const convertedAmount = numericAmount * currentRate;

  // Track conversion for history
  useEffect(() => {
    if (numericAmount > 0 && currentRate > 0 && onAddToHistory) {
      const timer = setTimeout(() => {
        onAddToHistory(fromCurrency, toCurrency, numericAmount, convertedAmount, currentRate);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fromCurrency.code, toCurrency.code, numericAmount, currentRate]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers, single decimal point
    if (/^[0-9]*\.?[0-9]*$/.test(val)) {
      setAmountStr(val);
    }
  };

  const handleSwap = () => {
    setIsSwapping(true);
    onSwapCurrencies();
    setTimeout(() => setIsSwapping(false), 300);
  };

  const handleCopyResult = () => {
    const textToCopy = `${formatCurrencyAmount(numericAmount, fromCurrency.decimals)} ${fromCurrency.code} = ${formatCurrencyAmount(convertedAmount, toCurrency.decimals)} ${toCurrency.code}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    onShowToast(`Copied ${fromCurrency.code} to ${toCurrency.code} result to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div
      id="main-converter-card"
      className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80 relative overflow-hidden"
    >
      {/* Header Info Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
              Live Currency Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time interbank foreign exchange rates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="refresh-rates-btn"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh exchange rates"
            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Conversion Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] items-center gap-3 sm:gap-4 mt-6">
        {/* FROM Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Amount & Base Currency
          </label>
          <div className="p-3.5 sm:p-4 bg-slate-50/90 rounded-2xl border border-slate-200 hover:border-slate-300 focus-within:border-emerald-500 focus-within:ring-3 focus-within:ring-emerald-500/15 transition-all">
            <div className="flex items-center justify-between gap-3">
              <input
                id="from-amount-input"
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder="0.00"
                className="w-full bg-transparent text-xl sm:text-2xl font-bold text-slate-900 outline-none font-mono placeholder:text-slate-300"
              />
              <button
                id="select-from-currency-btn"
                type="button"
                onClick={onOpenFromModal}
                className="shrink-0 flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-slate-100/80 rounded-xl border border-slate-200 shadow-xs transition-all text-slate-800"
              >
                <CurrencyFlag
                  countryCode={fromCurrency.countryCode}
                  flagEmoji={fromCurrency.flagEmoji}
                  size="md"
                />
                <div className="text-left">
                  <span className="text-sm font-bold block leading-none text-slate-900">
                    {fromCurrency.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none truncate max-w-[80px] block mt-0.5">
                    {fromCurrency.countryName}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">▼</span>
              </button>
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center -my-2 lg:my-0 z-10">
          <button
            id="swap-currencies-btn"
            type="button"
            onClick={handleSwap}
            aria-label="Swap currencies"
            title="Swap From and To currencies"
            className={`w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all duration-300 ${
              isSwapping ? 'rotate-180 scale-110' : ''
            }`}
          >
            <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>

        {/* TO Section */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Converted To
          </label>
          <div className="p-3.5 sm:p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/90 hover:border-emerald-300 transition-all">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-950 truncate font-mono">
                  {formatCurrencyAmount(convertedAmount, toCurrency.decimals)}
                </div>
                <div className="text-xs text-emerald-700 font-medium truncate mt-0.5">
                  {toCurrency.symbol} • {toCurrency.name}
                </div>
              </div>
              <button
                id="select-to-currency-btn"
                type="button"
                onClick={onOpenToModal}
                className="shrink-0 flex items-center gap-2.5 px-3 py-2 bg-white hover:bg-slate-50 rounded-xl border border-emerald-200 shadow-xs transition-all text-slate-800"
              >
                <CurrencyFlag
                  countryCode={toCurrency.countryCode}
                  flagEmoji={toCurrency.flagEmoji}
                  size="md"
                />
                <div className="text-left">
                  <span className="text-sm font-bold block leading-none text-slate-900">
                    {toCurrency.code}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium leading-none truncate max-w-[80px] block mt-0.5">
                    {toCurrency.countryName}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono">▼</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Amount Presets Chips */}
      <div className="mt-5 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs text-slate-400 font-medium shrink-0 mr-1">
          Quick Amounts:
        </span>
        {PRESET_AMOUNTS.map((preset) => (
          <button
            key={preset}
            onClick={() => setAmountStr(preset.toString())}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 ${
              numericAmount === preset
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            {fromCurrency.symbol}{preset.toLocaleString()}
          </button>
        ))}
      </div>

      {/* Live Rate Summary & Actions Banner */}
      <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Exchange Rate Formula */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
            <span>
              1 {fromCurrency.code} ={' '}
              <span className="text-emerald-600 font-mono">
                {formatCurrencyAmount(currentRate, toCurrency.decimals ?? 4)} {toCurrency.code}
              </span>
            </span>
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>Inverse:</span>
            <span className="font-mono text-slate-600">
              1 {toCurrency.code} = {formatCurrencyAmount(inverseRate, fromCurrency.decimals ?? 4)} {fromCurrency.code}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="copy-conversion-btn"
            onClick={handleCopyResult}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Result</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
