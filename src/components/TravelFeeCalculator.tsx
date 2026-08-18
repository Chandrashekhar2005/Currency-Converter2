import React, { useState } from 'react';
import { Calculator, Percent, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { Currency } from '../types/currency';
import { formatCurrencyAmount } from '../services/exchangeRates';

interface TravelFeeCalculatorProps {
  fromCurrency: Currency;
  toCurrency: Currency;
  baseAmount: number;
  currentRate: number;
}

const FEE_PRESETS = [
  { name: 'Mid-Market (Interbank)', percent: 0, desc: 'Zero markup baseline' },
  { name: 'Bank Transfer', percent: 1.5, desc: 'Standard international wire' },
  { name: 'Credit Card FX', percent: 3.0, desc: 'Foreign transaction fee' },
  { name: 'Airport / Currency Kiosk', percent: 5.0, desc: 'Typical tourist exchange booth' },
];

export const TravelFeeCalculator: React.FC<TravelFeeCalculatorProps> = ({
  fromCurrency,
  toCurrency,
  baseAmount,
  currentRate,
}) => {
  const [selectedFeePercent, setSelectedFeePercent] = useState<number>(3.0);
  const [customPercent, setCustomPercent] = useState<string>('3.0');
  const [fixedFee, setFixedFee] = useState<string>('0');

  const effectiveRate = currentRate * (1 - selectedFeePercent / 100);
  const fixedFeeNum = parseFloat(fixedFee) || 0;
  const netFromAmount = Math.max(0, baseAmount - fixedFeeNum);
  const totalReceivedWithFee = netFromAmount * effectiveRate;
  const totalReceivedNoFee = baseAmount * currentRate;
  const totalLostInFees = Math.max(0, totalReceivedNoFee - totalReceivedWithFee);

  const handleCustomChange = (val: string) => {
    setCustomPercent(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setSelectedFeePercent(parsed);
    }
  };

  return (
    <div
      id="travel-fee-calculator-panel"
      className="bg-white rounded-3xl p-5 sm:p-7 shadow-xl shadow-slate-200/50 border border-slate-200/80"
    >
      <div className="flex items-center justify-between pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Exchange Fee & Markup Analyzer
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculate hidden bank fees, credit card markups, and net funds received
          </p>
        </div>
      </div>

      {/* Preset Fee Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
        {FEE_PRESETS.map((preset) => {
          const isSelected = selectedFeePercent === preset.percent;
          return (
            <button
              key={preset.name}
              onClick={() => {
                setSelectedFeePercent(preset.percent);
                setCustomPercent(preset.percent.toString());
              }}
              className={`p-3 rounded-2xl text-left border transition-all ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500/80 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                <span className="text-xs font-extrabold font-mono text-emerald-700 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  {preset.percent}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{preset.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Custom Markup Slider & Fixed Fee Input */}
      <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[200px] space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-slate-700">
            <span>Custom Provider Markup</span>
            <span className="font-bold text-emerald-700 font-mono">{selectedFeePercent}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.1"
            value={selectedFeePercent}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setSelectedFeePercent(val);
              setCustomPercent(val.toString());
            }}
            className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600">Fixed Provider Fee ({fromCurrency.symbol}):</span>
          <input
            type="number"
            min="0"
            value={fixedFee}
            onChange={(e) => setFixedFee(e.target.value)}
            className="w-20 px-2.5 py-1 text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg outline-none focus:border-emerald-500 text-slate-900"
          />
        </div>
      </div>

      {/* Comparison Result Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mt-5">
        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Mid-Market Fair Value
          </div>
          <div className="my-2">
            <div className="text-xl font-extrabold text-emerald-950 font-mono">
              {formatCurrencyAmount(totalReceivedNoFee, toCurrency.decimals)} {toCurrency.code}
            </div>
            <span className="text-[11px] text-emerald-700">At exact interbank rate (0% fee)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-100/90 border border-slate-200 flex flex-col justify-between">
          <div className="text-xs font-bold text-slate-800">
            Net Received with {selectedFeePercent}% Fee
          </div>
          <div className="my-2">
            <div className="text-xl font-extrabold text-slate-900 font-mono">
              {formatCurrencyAmount(totalReceivedWithFee, toCurrency.decimals)} {toCurrency.code}
            </div>
            <span className="text-[11px] text-slate-500">
              Effective rate: 1 {fromCurrency.code} = {formatCurrencyAmount(effectiveRate, 4)} {toCurrency.code}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            Estimated Fee Cost
          </div>
          <div className="my-2">
            <div className="text-xl font-extrabold text-rose-700 font-mono">
              -{formatCurrencyAmount(totalLostInFees, toCurrency.decimals)} {toCurrency.code}
            </div>
            <span className="text-[11px] text-rose-600">
              Money retained by the exchange provider
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
