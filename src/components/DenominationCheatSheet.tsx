import React from 'react';
import { Table, ArrowRightLeft } from 'lucide-react';
import { Currency } from '../types/currency';
import { formatCurrencyAmount } from '../services/exchangeRates';

interface DenominationCheatSheetProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  currentRate: number;
}

const COMMON_DENOMINATIONS = [1, 5, 10, 20, 50, 100, 250, 500, 1000];

export const DenominationCheatSheet: React.FC<DenominationCheatSheetProps> = ({
  fromCurrency,
  toCurrency,
  currentRate,
}) => {
  const inverseRate = currentRate > 0 ? 1 / currentRate : 0;

  return (
    <div
      id="denomination-cheat-sheet"
      className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80"
    >
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Traveler's Denomination Cheat Sheet
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick reference matrix for everyday cash and spending conversions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        {/* From -> To Matrix */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
          <div className="p-3 bg-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span>{fromCurrency.name} ({fromCurrency.code})</span>
            <span>→ {toCurrency.code}</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {COMMON_DENOMINATIONS.map((amt) => {
              const converted = amt * currentRate;
              return (
                <div
                  key={`from-${amt}`}
                  className="px-3.5 py-2 flex items-center justify-between hover:bg-white transition-colors"
                >
                  <span className="font-mono font-bold text-slate-800">
                    {fromCurrency.symbol}{amt.toLocaleString()} {fromCurrency.code}
                  </span>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {toCurrency.symbol}{formatCurrencyAmount(converted, toCurrency.decimals)} {toCurrency.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* To -> From Matrix (Inverse) */}
        <div className="rounded-2xl border border-slate-200/80 overflow-hidden bg-slate-50/50">
          <div className="p-3 bg-slate-100 font-bold text-xs text-slate-800 flex items-center justify-between">
            <span>{toCurrency.name} ({toCurrency.code})</span>
            <span>→ {fromCurrency.code}</span>
          </div>
          <div className="divide-y divide-slate-100 text-xs">
            {COMMON_DENOMINATIONS.map((amt) => {
              const converted = amt * inverseRate;
              return (
                <div
                  key={`to-${amt}`}
                  className="px-3.5 py-2 flex items-center justify-between hover:bg-white transition-colors"
                >
                  <span className="font-mono font-bold text-slate-800">
                    {toCurrency.symbol}{amt.toLocaleString()} {toCurrency.code}
                  </span>
                  <span className="font-mono font-extrabold text-slate-700">
                    {fromCurrency.symbol}{formatCurrencyAmount(converted, fromCurrency.decimals)} {fromCurrency.code}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
