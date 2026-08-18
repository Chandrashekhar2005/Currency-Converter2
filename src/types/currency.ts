export interface Currency {
  code: string;
  name: string;
  countryName: string;
  countryCode: string; // ISO 3166-1 alpha-2 for flag display
  symbol: string;
  flagEmoji: string;
  region: 'Americas' | 'Europe' | 'Asia-Pacific' | 'Middle East' | 'Africa';
  isPopular?: boolean;
  decimals?: number;
}

export interface ExchangeRatesData {
  base: string;
  date: string;
  timeLastUpdateUtc: string;
  timeNextUpdateUtc?: string;
  rates: Record<string, number>;
  source: 'live' | 'cache' | 'fallback';
}

export interface HistoricalRatePoint {
  date: string;
  rate: number;
  formattedDate: string;
}

export interface RateStatistics {
  current: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  average: number;
}

export interface ConversionRecord {
  id: string;
  fromCode: string;
  toCode: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  timestamp: number;
}

export interface FeePreset {
  id: string;
  name: string;
  percentage: number;
  fixedFee: number;
  description: string;
}
