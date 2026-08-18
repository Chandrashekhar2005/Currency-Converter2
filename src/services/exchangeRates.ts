import { ExchangeRatesData, HistoricalRatePoint, RateStatistics } from '../types/currency';
import { FALLBACK_USD_RATES } from '../data/currencies';

const CACHE_KEY_PREFIX = 'fx_rates_cache_';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache

export async function fetchLiveRates(baseCurrency: string = 'USD'): Promise<ExchangeRatesData> {
  const base = baseCurrency.toUpperCase();
  const cacheKey = `${CACHE_KEY_PREFIX}${base}`;

  // Check localStorage cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed: ExchangeRatesData = JSON.parse(cached);
      const lastUpdate = new Date(parsed.timeLastUpdateUtc).getTime();
      if (!isNaN(lastUpdate) && Date.now() - lastUpdate < CACHE_TTL_MS) {
        return { ...parsed, source: 'cache' };
      }
    }
  } catch (e) {
    console.warn('Could not read rates cache:', e);
  }

  // Attempt Primary Live API
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`, {
      signal: AbortSignal.timeout(6000),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.result === 'success' && data.rates) {
        const result: ExchangeRatesData = {
          base: data.base_code || base,
          date: data.time_last_update_utc?.substring(0, 16) || new Date().toISOString(),
          timeLastUpdateUtc: data.time_last_update_utc || new Date().toUTCString(),
          timeNextUpdateUtc: data.time_next_update_utc,
          rates: { ...FALLBACK_USD_RATES, ...data.rates },
          source: 'live',
        };

        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {
          // ignore localStorage write errors
        }

        return result;
      }
    }
  } catch (err) {
    console.warn(`Primary FX API failed for ${base}, trying backup...`, err);
  }

  // Attempt Backup Live API
  try {
    const backupRes = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (backupRes.ok) {
      const bData = await backupRes.json();
      if (bData.rates) {
        const result: ExchangeRatesData = {
          base: bData.base || base,
          date: bData.date || new Date().toISOString().split('T')[0],
          timeLastUpdateUtc: new Date().toUTCString(),
          rates: { ...FALLBACK_USD_RATES, ...bData.rates },
          source: 'live',
        };
        try {
          localStorage.setItem(cacheKey, JSON.stringify(result));
        } catch {}
        return result;
      }
    }
  } catch (backupErr) {
    console.warn('Backup FX API also failed, using computed fallback rates', backupErr);
  }

  // Offline / Fallback Calculation using FALLBACK_USD_RATES
  const baseToUsdRate = FALLBACK_USD_RATES[base] || 1;
  const computedRates: Record<string, number> = {};

  for (const [code, usdRate] of Object.entries(FALLBACK_USD_RATES)) {
    computedRates[code] = usdRate / baseToUsdRate;
  }

  return {
    base,
    date: new Date().toISOString().split('T')[0],
    timeLastUpdateUtc: new Date().toUTCString(),
    rates: computedRates,
    source: 'fallback',
  };
}

/**
 * Calculates conversion rate between any from and to currencies
 */
export function calculateRate(
  fromCode: string,
  toCode: string,
  ratesData: ExchangeRatesData | null
): number {
  if (fromCode === toCode) return 1;

  if (ratesData && ratesData.rates) {
    // If the ratesData base matches fromCode
    if (ratesData.base === fromCode && ratesData.rates[toCode]) {
      return ratesData.rates[toCode];
    }
    // If both rates are relative to ratesData.base
    const fromInBase = ratesData.rates[fromCode] || (fromCode === ratesData.base ? 1 : null);
    const toInBase = ratesData.rates[toCode] || (toCode === ratesData.base ? 1 : null);

    if (fromInBase && toInBase && fromInBase > 0) {
      return toInBase / fromInBase;
    }
  }

  // Static Fallback
  const fromUsd = FALLBACK_USD_RATES[fromCode] || 1;
  const toUsd = FALLBACK_USD_RATES[toCode] || 1;
  return toUsd / fromUsd;
}

/**
 * Format currency numbers with locale formatting and appropriate precision
 */
export function formatCurrencyAmount(
  amount: number,
  decimals?: number,
  includeGrouping: boolean = true
): string {
  if (isNaN(amount) || amount === 0) return '0';

  let precision = decimals ?? 2;
  if (amount < 0.0001 && amount > 0) {
    precision = 6;
  } else if (amount < 0.01 && amount > 0) {
    precision = 4;
  }

  if (!includeGrouping) {
    return amount.toFixed(precision);
  }

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: precision > 2 ? 2 : precision,
    maximumFractionDigits: precision,
  }).format(amount);
}

/**
 * Generate historical rate points and analytical statistics for charts
 */
export function getHistoricalRates(
  fromCode: string,
  toCode: string,
  currentRate: number,
  timeframe: '7D' | '1M' | '3M' | '1Y' = '1M'
): { points: HistoricalRatePoint[]; stats: RateStatistics } {
  const count = timeframe === '7D' ? 7 : timeframe === '1M' ? 30 : timeframe === '3M' ? 90 : 365;
  const stepDays = timeframe === '1Y' ? 3 : 1;
  const steps = Math.ceil(count / stepDays);

  const points: HistoricalRatePoint[] = [];
  const now = new Date();

  // Pseudo-random deterministic seed for consistent curve based on currency pair codes
  const seedString = `${fromCode}_${toCode}_${timeframe}`;
  let seed = 0;
  for (let i = 0; i < seedString.length; i++) {
    seed = (seed * 31 + seedString.charCodeAt(i)) & 0xffffffff;
  }
  const pseudoRand = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // Volatility amplitude based on currency pair (crypto/emerging vs stable)
  const isCrypto = ['BTC', 'ETH', 'SOL'].includes(fromCode) || ['BTC', 'ETH', 'SOL'].includes(toCode);
  const volatility = isCrypto ? 0.08 : 0.015;

  let simRate = currentRate * (1 - (pseudoRand(99) - 0.48) * volatility * (count / 10));
  if (simRate <= 0) simRate = currentRate * 0.95;

  let minRate = Number.MAX_VALUE;
  let maxRate = Number.MIN_VALUE;
  let sumRate = 0;

  for (let i = steps - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * stepDays * 24 * 60 * 60 * 1000);
    
    // Smooth random walk toward currentRate
    const progress = (steps - 1 - i) / (steps - 1 || 1);
    const noise = (pseudoRand(i * 3 + 7) - 0.5) * volatility * currentRate;
    const trendTowardCurrent = currentRate * progress + simRate * (1 - progress);
    const pointRate = i === 0 ? currentRate : Math.max(trendTowardCurrent + noise, currentRate * 0.5);

    minRate = Math.min(minRate, pointRate);
    maxRate = Math.max(maxRate, pointRate);
    sumRate += pointRate;

    const monthStr = date.toLocaleString('en-US', { month: 'short' });
    const dayStr = date.getDate();
    const formattedDate = timeframe === '1Y' ? `${monthStr} '${date.getFullYear().toString().slice(-2)}` : `${monthStr} ${dayStr}`;

    points.push({
      date: date.toISOString().split('T')[0],
      formattedDate,
      rate: Number(pointRate.toFixed(pointRate < 1 ? 5 : pointRate > 1000 ? 1 : 4)),
    });
  }

  const startRate = points[0]?.rate || currentRate;
  const change = currentRate - startRate;
  const changePercent = startRate !== 0 ? (change / startRate) * 100 : 0;
  const average = points.length > 0 ? sumRate / points.length : currentRate;

  return {
    points,
    stats: {
      current: currentRate,
      change,
      changePercent,
      high: maxRate,
      low: minRate,
      average,
    },
  };
}
