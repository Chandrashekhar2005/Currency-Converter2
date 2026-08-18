import React from 'react';
import { X, Trash2, Clock, ArrowRight, History } from 'lucide-react';
import { ConversionRecord } from '../types/currency';
import { formatCurrencyAmount } from '../services/exchangeRates';

interface ConversionHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ConversionRecord[];
  onClearHistory: () => void;
  onApplyHistory: (record: ConversionRecord) => void;
}

export const ConversionHistoryDrawer: React.FC<ConversionHistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onApplyHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="history-drawer-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="history-drawer"
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Recent Conversions</h2>
          </div>
          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs flex items-center gap-1 transition-colors"
                title="Clear all history"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {history.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Clock className="w-8 h-8 mx-auto stroke-[1.5] text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No conversions recorded yet</p>
              <p className="text-xs">Your recent currency conversions will show up here automatically</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onApplyHistory(item);
                  onClose();
                }}
                className="w-full text-left p-3.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition-all group flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                    <span>
                      {formatCurrencyAmount(item.fromAmount, 2)} {item.fromCode}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span className="text-emerald-700">
                      {formatCurrencyAmount(item.toAmount, 2)} {item.toCode}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2 font-mono">
                    <span>1 {item.fromCode} = {formatCurrencyAmount(item.rate, 4)} {item.toCode}</span>
                    <span>•</span>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <span className="text-xs text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Use
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
