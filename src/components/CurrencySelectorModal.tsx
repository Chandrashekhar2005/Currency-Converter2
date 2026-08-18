import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, X, Check, Star, Globe2 } from 'lucide-react';
import { Currency } from '../types/currency';
import { UNIQUE_CURRENCIES } from '../data/currencies';
import { CurrencyFlag } from './CurrencyFlag';

interface CurrencySelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCode: string;
  onSelect: (currency: Currency) => void;
  title?: string;
}

type TabType = 'all' | 'popular' | 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Africa';

export const CurrencySelectorModal: React.FC<CurrencySelectorModalProps> = ({
  isOpen,
  onClose,
  selectedCode,
  onSelect,
  title = 'Select Currency',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setActiveTab('all');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredCurrencies = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return UNIQUE_CURRENCIES.filter((currency) => {
      // Tab filter
      if (activeTab === 'popular' && !currency.isPopular) return false;
      if (activeTab !== 'all' && activeTab !== 'popular' && currency.region !== activeTab) {
        return false;
      }

      // Search filter
      if (!query) return true;

      const codeMatch = currency.code.toLowerCase().includes(query);
      const nameMatch = currency.name.toLowerCase().includes(query);
      const countryMatch = currency.countryName.toLowerCase().includes(query);
      const symbolMatch = currency.symbol.toLowerCase().includes(query);

      return codeMatch || nameMatch || countryMatch || symbolMatch;
    });
  }, [searchQuery, activeTab]);

  if (!isOpen) return null;

  return (
    <div
      id="currency-selector-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="currency-selector-modal"
        className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <Globe2 className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight leading-none">
                {title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Choose from {UNIQUE_CURRENCIES.length}+ world currencies
              </p>
            </div>
          </div>
          <button
            id="close-currency-modal-btn"
            onClick={onClose}
            aria-label="Close currency picker"
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 flex items-center justify-center transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="currency-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by currency, country, or code (e.g., EUR, Japan, ₹)..."
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-sm text-slate-900 placeholder:text-slate-400 rounded-xl border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              All ({UNIQUE_CURRENCIES.length})
            </button>
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-colors ${
                activeTab === 'popular'
                  ? 'bg-amber-500 text-white font-semibold shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
              }`}
            >
              <Star className="w-3 h-3 fill-current" />
              Popular
            </button>
            {(['Americas', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'] as const).map((region) => (
              <button
                key={region}
                onClick={() => setActiveTab(region)}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition-colors ${
                  activeTab === region
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Currency List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-50 max-h-[420px]">
          {filteredCurrencies.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-medium text-slate-600">No currency found for "{searchQuery}"</p>
              <p className="text-xs">Try searching by country name, 3-letter ISO code, or currency symbol</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-1">
              {filteredCurrencies.map((currency) => {
                const isSelected = currency.code === selectedCode;
                return (
                  <button
                    key={`${currency.code}-${currency.countryCode}`}
                    id={`currency-option-${currency.code}`}
                    onClick={() => {
                      onSelect(currency);
                      onClose();
                    }}
                    className={`w-full px-3.5 py-2.5 rounded-xl flex items-center justify-between text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50/90 border border-emerald-300/80 shadow-xs'
                        : 'hover:bg-slate-50 active:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <CurrencyFlag
                        countryCode={currency.countryCode}
                        flagEmoji={currency.flagEmoji}
                        size="md"
                        className="shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm tracking-tight text-slate-900">
                            {currency.code}
                          </span>
                          <span className="text-xs font-mono font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {currency.symbol}
                          </span>
                          {currency.isPopular && (
                            <span className="text-[10px] uppercase font-semibold tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60">
                              Top
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 font-medium truncate mt-0.5">
                          {currency.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {currency.countryName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {isSelected ? (
                        <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-mono">
                          {currency.region}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
          Showing {filteredCurrencies.length} of {UNIQUE_CURRENCIES.length} currencies with flags & country codes
        </div>
      </div>
    </div>
  );
};
