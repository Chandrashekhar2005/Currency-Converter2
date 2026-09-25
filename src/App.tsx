import React, { useState, useEffect, useCallback } from 'react';
import {
  Coins,
  ArrowLeftRight,
  TrendingUp,
  Globe,
  Calculator,
  Table,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { Currency, ExchangeRatesData, ConversionRecord } from './types/currency';
import { UNIQUE_CURRENCIES } from './data/currencies';
import { fetchLiveRates, calculateRate } from './services/exchangeRates';
import { Header } from './components/Header';
import { ConverterCard } from './components/ConverterCard';
import { MultiCurrencyComparison } from './components/MultiCurrencyComparison';
import { ExchangeRateTrend } from './components/ExchangeRateTrend';
import { TravelFeeCalculator } from './components/TravelFeeCalculator';
import { DenominationCheatSheet } from './components/DenominationCheatSheet';
import { CurrencySelectorModal } from './components/CurrencySelectorModal';
import { ConversionHistoryDrawer } from './components/ConversionHistoryDrawer';
import { Toast } from './components/Toast';

const POPULAR_PAIRS = [
  { from: 'USD', to: 'EUR' },
  { from: 'USD', to: 'GBP' },
  { from: 'USD', to: 'JPY' },
  { from: 'USD', to: 'INR' },
  { from: 'EUR', to: 'GBP' },
  { from: 'USD', to: 'CAD' },
  { from: 'USD', to: 'AUD' },
  { from: 'USD', to: 'AED' },
  { from: 'USD', to: 'CNY' },
  { from: 'USD', to: 'BRL' },
];

export default function App() {
  const [fromCurrency, setFromCurrency] = useState<Currency>(() => {
    return (
      UNIQUE_CURRENCIES.find((c) => c.code === 'USD') ||
      UNIQUE_CURRENCIES[0]
    );
  });

  const [toCurrency, setToCurrency] = useState<Currency>(() => {
    return (
      UNIQUE_CURRENCIES.find((c) => c.code === 'EUR') ||
      UNIQUE_CURRENCIES[1]
    );
  });

  const [baseAmount, setBaseAmount] = useState<number>(100);
  const [ratesData, setRatesData] = useState<ExchangeRatesData | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState<boolean>(true);

  // Modals state
  const [isFromModalOpen, setIsFromModalOpen] = useState(false);
  const [isToModalOpen, setIsToModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Active sub-view tab
  const [activeTab, setActiveTab] = useState<
    'calculator' | 'watchlist' | 'trends' | 'fees' | 'matrix'
  >('calculator');

  // History & Toast
  const [history, setHistory] = useState<ConversionRecord[]>(() => {
    try {
      const saved = localStorage.getItem('fx_conversion_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage((current) =>
        current === msg ? null : current
      );
    }, 3500);
  }, []);

  // Fetch exchange rates
  const loadRates = useCallback(async (base: string = 'USD') => {
    setIsLoadingRates(true);

    try {
      const data = await fetchLiveRates(base);
      setRatesData(data);
    } catch (e) {
      console.error('Failed to load rates', e);
    } finally {
      setIsLoadingRates(false);
    }
  }, []);

  useEffect(() => {
    loadRates(fromCurrency.code);
  }, [fromCurrency.code, loadRates]);

  const handleSwap = () => {
    const prevFrom = fromCurrency;
    const prevTo = toCurrency;

    setFromCurrency(prevTo);
    setToCurrency(prevFrom);

    showToast(`Swapped ${prevTo.code} ⇄ ${prevFrom.code}`);
  };

  const handleAddToHistory = (
    from: Currency,
    to: Currency,
    fromAmt: number,
    toAmt: number,
    rate: number
  ) => {
    const record: ConversionRecord = {
      id: `${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 4)}`,
      fromCode: from.code,
      toCode: to.code,
      fromAmount: fromAmt,
      toAmount: toAmt,
      rate,
      timestamp: Date.now(),
    };

    setHistory((prev) => {
      // Don't add identical duplicate consecutive records
      if (
        prev[0] &&
        prev[0].fromCode === record.fromCode &&
        prev[0].toCode === record.toCode &&
        Math.abs(prev[0].fromAmount - record.fromAmount) < 0.01
      ) {
        return prev;
      }

      const updated = [record, ...prev.slice(0, 19)];

      try {
        localStorage.setItem(
          'fx_conversion_history',
          JSON.stringify(updated)
        );
      } catch {}

      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);

    try {
      localStorage.removeItem('fx_conversion_history');
    } catch {}

    showToast('Conversion history cleared');
  };

  const handleApplyHistory = (record: ConversionRecord) => {
    const foundFrom = UNIQUE_CURRENCIES.find(
      (c) => c.code === record.fromCode
    );

    const foundTo = UNIQUE_CURRENCIES.find(
      (c) => c.code === record.toCode
    );

    if (foundFrom && foundTo) {
      setFromCurrency(foundFrom);
      setToCurrency(foundTo);
      setBaseAmount(record.fromAmount);

      showToast(
        `Loaded ${record.fromCode} to ${record.toCode} conversion`
      );
    }
  };

  const currentRate = calculateRate(
    fromCurrency.code,
    toCurrency.code,
    ratesData
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">

      {/* Header */}
      <Header
        ratesData={ratesData}
        isLoading={isLoadingRates}
        onRefresh={() => loadRates(fromCurrency.code)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">

        {/* Popular Pairs Strip */}
        <section aria-label="Popular currency pairs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs font-semibold">
            <span className="text-slate-600 font-bold shrink-0">
              Popular Pairs:
            </span>

            {POPULAR_PAIRS.map((pair) => {
              const isActive =
                fromCurrency.code === pair.from &&
                toCurrency.code === pair.to;

              return (
                <button
                  key={`${pair.from}-${pair.to}`}
                  onClick={() => {
                    const f = UNIQUE_CURRENCIES.find(
                      (c) => c.code === pair.from
                    );

                    const t = UNIQUE_CURRENCIES.find(
                      (c) => c.code === pair.to
                    );

                    if (f && t) {
                      setFromCurrency(f);
                      setToCurrency(t);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl border shrink-0 transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {pair.from} / {pair.to}
                </button>
              );
            })}
          </div>
        </section>

        {/* Primary Converter Card */}
        <ConverterCard
          fromCurrency={fromCurrency}
          toCurrency={toCurrency}
          onOpenFromModal={() => setIsFromModalOpen(true)}
          onOpenToModal={() => setIsToModalOpen(true)}
          onSwapCurrencies={handleSwap}
          ratesData={ratesData}
          isLoading={isLoadingRates}
          onRefresh={() => loadRates(fromCurrency.code)}
          onShowToast={showToast}
          onAddToHistory={handleAddToHistory}
        />

        {/* Feature Navigation Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-x-auto">

          <button
            id="tab-watchlist"
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'watchlist'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>Multi-Currency Board</span>
          </button>

          <button
            id="tab-trends"
            onClick={() => setActiveTab('trends')}
            className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'trends'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Rate Trends (Chart)</span>
          </button>

          <button
            id="tab-fees"
            onClick={() => setActiveTab('fees')}
            className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'fees'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calculator className="w-4 h-4 text-emerald-400" />
            <span>Fee & Markup Analyzer</span>
          </button>

          <button
            id="tab-matrix"
            onClick={() => setActiveTab('matrix')}
            className={`flex-1 min-w-[140px] px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'matrix'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-4 h-4 text-emerald-400" />
            <span>Cheat Sheet Matrix</span>
          </button>
        </div>

        {/* Active Tab View Panels */}
        <div className="transition-all">

          {activeTab === 'watchlist' && (
            <MultiCurrencyComparison
              baseCurrency={fromCurrency}
              baseAmount={baseAmount}
              ratesData={ratesData}
              onSelectAsTarget={(target) => {
                setToCurrency(target);
                showToast(
                  `Set ${target.code} (${target.countryName}) as target`
                );
              }}
            />
          )}

          {activeTab === 'trends' && (
            <ExchangeRateTrend
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              currentRate={currentRate}
            />
          )}

          {activeTab === 'fees' && (
            <TravelFeeCalculator
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              baseAmount={baseAmount}
              currentRate={currentRate}
            />
          )}

          {activeTab === 'matrix' && (
            <DenominationCheatSheet
              fromCurrency={fromCurrency}
              toCurrency={toCurrency}
              currentRate={currentRate}
            />
          )}
        </div>

        {/* SEO / Information Section */}
        <section
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs"
          aria-labelledby="currency-information"
        >
          <h2
            id="currency-information"
            className="text-xl sm:text-2xl font-bold text-slate-900 mb-3"
          >
            Live Currency Converter
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-7 mb-5">
            Convert currencies quickly and easily with our free live currency
            converter. Choose your base currency, select the currency you want
            to convert to, and enter the amount to calculate the exchange rate.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            Convert 170+ Currencies
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-7 mb-5">
            Our currency converter supports more than 170 currencies from
            around the world, including USD, EUR, GBP, INR, JPY, AUD, CAD and
            many more.
          </p>

          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
            How to Use the Currency Converter
          </h2>

          <ol className="list-decimal list-inside text-sm sm:text-base text-slate-600 space-y-1">
            <li>Select the currency you want to convert from.</li>
            <li>Select the currency you want to convert to.</li>
            <li>Enter the amount.</li>
            <li>Click the convert button to see the result.</li>
          </ol>
        </section>

        {/* FAQ Section */}
          <div className="mt-8">
            <h2 className="text-xl font-bold text-slate-900 mb-5">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  What is a currency converter?
                </h3>
                <p className="text-slate-600 leading-7 mt-1">
                  A currency converter helps you calculate the value of one
                  currency in another currency using an exchange rate.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  How many currencies does Global FX support?
                </h3>
                <p className="text-slate-600 leading-7 mt-1">
                  Global FX supports more than 170 currencies from countries
                  and regions around the world.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Can I convert USD to INR?
                </h3>
                <p className="text-slate-600 leading-7 mt-1">
                  Yes. Select USD as the base currency and INR as the target
                  currency to calculate the conversion.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Can I convert EUR to USD?
                </h3>
                <p className="text-slate-600 leading-7 mt-1">
                  Yes. Select EUR as the base currency and USD as the target
                  currency to calculate the conversion.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Is Global FX free to use?
                </h3>
                <p className="text-slate-600 leading-7 mt-1">
                  Yes. The Global FX currency converter is available to use
                  without a conversion fee from the website.
                </p>
              </div>
            </div>
          </div>

        {/* Popular Currency Conversions */}
        <section
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs"
          aria-labelledby="popular-conversions"
        >
          <h2
            id="popular-conversions"
            className="text-xl sm:text-2xl font-bold text-slate-900 mb-3"
          >
            Popular Currency Conversions
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-7 mb-5">
            Explore some of the most commonly used currency pairs and use the
            converter above to calculate their current exchange values.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                USD to INR Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert US Dollars to Indian Rupees.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                USD to EUR Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert US Dollars to Euros.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                USD to GBP Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert US Dollars to British Pounds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                USD to JPY Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert US Dollars to Japanese Yen.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                EUR to GBP Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert Euros to British Pounds.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h3 className="font-bold text-slate-900">
                USD to AED Converter
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Convert US Dollars to UAE Dirhams.
              </p>
            </div>

          </div>
        </section>

        {/* International Travel Information */}
        <section
          className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs"
          aria-labelledby="travel-converter"
        >
          <h2
            id="travel-converter"
            className="text-lg sm:text-xl font-bold text-slate-900 mb-2"
          >
            Currency Converter for International Travel
          </h2>

          <p className="text-sm sm:text-base text-slate-600 leading-7">
            Use the Global FX currency converter to check exchange rates before
            travelling, shopping internationally, sending money abroad, or
            comparing prices in different currencies. The converter supports
            170+ currencies and provides a simple way to calculate currency
            values.
          </p>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">

          <p>
            Supports 170+ sovereign currencies, national flags & real-time
            global FX rates.
          </p>

          <p className="font-mono text-[11px] text-slate-400">
            Real-time interbank reference feeds
          </p>

        </div>
      </footer>

      {/* Currency Picker Modal for FROM */}
      <CurrencySelectorModal
        isOpen={isFromModalOpen}
        onClose={() => setIsFromModalOpen(false)}
        selectedCode={fromCurrency.code}
        onSelect={(selected) => {
          setFromCurrency(selected);
          showToast(
            `Selected ${selected.code} (${selected.countryName}) as base`
          );
        }}
        title="Select Base Currency (From)"
      />

      {/* Currency Picker Modal for TO */}
      <CurrencySelectorModal
        isOpen={isToModalOpen}
        onClose={() => setIsToModalOpen(false)}
        selectedCode={toCurrency.code}
        onSelect={(selected) => {
          setToCurrency(selected);
          showToast(
            `Selected ${selected.code} (${selected.countryName}) as target`
          );
        }}
        title="Select Target Currency (To)"
      />

      {/* Conversion History Drawer */}
      <ConversionHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={handleClearHistory}
        onApplyHistory={handleApplyHistory}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
      />
    </div>
  );
}
