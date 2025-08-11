// Currency conversion and formatting utilities
// Using exchangerate-api.com for real-time exchange rates

const CURRENCY_API_BASE = 'https://api.exchangerate-api.com/v4/latest'
const FALLBACK_RATES: { [key: string]: number } = {
  'USD': 1.0,
  'EUR': 0.85,
  'GBP': 0.73,
  'JPY': 110.0,
  'CAD': 1.25,
  'AUD': 1.35,
  'CHF': 0.92,
  'CNY': 6.45,
  'INR': 74.5,
  'KRW': 1180.0
}

export interface ExchangeRates {
  base: string
  date: string
  rates: { [currency: string]: number }
}

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  flag: string
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', flag: '🇨🇳' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩', flag: '🇰🇷' }
]

// Cache for exchange rates (5 minute cache)
const rateCache = new Map<string, { rates: ExchangeRates; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Fetch current exchange rates
 */
export async function getExchangeRates(baseCurrency: string = 'USD'): Promise<ExchangeRates> {
  const cacheKey = baseCurrency.toUpperCase()
  const cached = rateCache.get(cacheKey)
  
  // Return cached data if still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.rates
  }

  try {
    const response = await fetch(`${CURRENCY_API_BASE}/${baseCurrency}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const rates: ExchangeRates = {
      base: data.base,
      date: data.date,
      rates: data.rates
    }

    // Cache the result
    rateCache.set(cacheKey, { rates, timestamp: Date.now() })
    
    return rates
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback:', error)
    
    // Return fallback rates
    const fallbackRates: ExchangeRates = {
      base: baseCurrency,
      date: new Date().toISOString().split('T')[0],
      rates: { ...FALLBACK_RATES }
    }

    // Adjust rates if base currency is not USD
    if (baseCurrency !== 'USD' && FALLBACK_RATES[baseCurrency]) {
      const baseRate = FALLBACK_RATES[baseCurrency]
      Object.keys(fallbackRates.rates).forEach(currency => {
        fallbackRates.rates[currency] = fallbackRates.rates[currency] / baseRate
      })
    }

    return fallbackRates
  }
}

/**
 * Convert amount from one currency to another
 */
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  try {
    const rates = await getExchangeRates(fromCurrency)
    const rate = rates.rates[toCurrency.toUpperCase()]
    
    if (!rate) {
      throw new Error(`Exchange rate not found for ${toCurrency}`)
    }

    return amount * rate
  } catch (error) {
    console.error('Currency conversion failed:', error)
    
    // Fallback conversion using static rates
    const fromRate = FALLBACK_RATES[fromCurrency.toUpperCase()] || 1
    const toRate = FALLBACK_RATES[toCurrency.toUpperCase()] || 1
    
    return (amount / fromRate) * toRate
  }
}

/**
 * Format amount with currency symbol and proper formatting
 */
export function formatCurrency(
  amount: number,
  currency: string,
  options: {
    showSymbol?: boolean
    showCode?: boolean
    decimals?: number
    locale?: string
  } = {}
): string {
  const {
    showSymbol = true,
    showCode = false,
    decimals = 2,
    locale = 'en-US'
  } = options

  const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency.toUpperCase())
  
  try {
    // Use Intl.NumberFormat for proper formatting
    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency: currency.toUpperCase(),
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })

    let formatted = formatter.format(amount)

    // Add currency code if requested
    if (showCode && currencyInfo) {
      formatted += ` ${currencyInfo.code}`
    }

    return formatted
  } catch (error) {
    // Fallback formatting
    const symbol = currencyInfo?.symbol || currency.toUpperCase()
    const formattedAmount = amount.toLocaleString(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
    
    return showSymbol ? `${symbol}${formattedAmount}` : formattedAmount
  }
}

/**
 * Get currency info by code
 */
export function getCurrencyInfo(code: string): CurrencyInfo | undefined {
  return SUPPORTED_CURRENCIES.find(c => c.code === code.toUpperCase())
}

/**
 * Get popular currencies for a region/country
 */
export function getRegionalCurrencies(region: string): CurrencyInfo[] {
  const regionalMap: { [key: string]: string[] } = {
    'north-america': ['USD', 'CAD'],
    'europe': ['EUR', 'GBP', 'CHF'],
    'asia': ['JPY', 'CNY', 'INR', 'KRW'],
    'oceania': ['AUD'],
    'global': ['USD', 'EUR', 'GBP', 'JPY']
  }

  const codes = regionalMap[region.toLowerCase()] || regionalMap['global']
  return codes.map(code => getCurrencyInfo(code)).filter(Boolean) as CurrencyInfo[]
}

/**
 * Calculate currency conversion with rate information
 */
export async function getCurrencyConversion(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<{
  originalAmount: number
  convertedAmount: number
  fromCurrency: string
  toCurrency: string
  exchangeRate: number
  lastUpdated: string
  formatted: {
    original: string
    converted: string
  }
}> {
  const convertedAmount = await convertCurrency(amount, fromCurrency, toCurrency)
  const rates = await getExchangeRates(fromCurrency)
  const exchangeRate = rates.rates[toCurrency.toUpperCase()] || 1

  return {
    originalAmount: amount,
    convertedAmount,
    fromCurrency: fromCurrency.toUpperCase(),
    toCurrency: toCurrency.toUpperCase(),
    exchangeRate,
    lastUpdated: rates.date,
    formatted: {
      original: formatCurrency(amount, fromCurrency),
      converted: formatCurrency(convertedAmount, toCurrency)
    }
  }
}

/**
 * Get exchange rate trend (mock implementation - would need historical data API)
 */
export function getExchangeRateTrend(
  fromCurrency: string,
  toCurrency: string,
  days: number = 30
): Promise<{
  trend: 'up' | 'down' | 'stable'
  change: number
  changePercent: number
}> {
  // Mock implementation - in real app would fetch historical data
  return Promise.resolve({
    trend: 'stable' as const,
    change: 0,
    changePercent: 0
  })
}

/**
 * Batch convert multiple amounts
 */
export async function batchConvertCurrency(
  conversions: Array<{
    amount: number
    fromCurrency: string
    toCurrency: string
  }>
): Promise<Array<{
  originalAmount: number
  convertedAmount: number
  fromCurrency: string
  toCurrency: string
  exchangeRate: number
}>> {
  // Group by base currency to minimize API calls
  const groupedByBase = conversions.reduce((groups, conversion) => {
    const base = conversion.fromCurrency
    if (!groups[base]) {
      groups[base] = []
    }
    groups[base].push(conversion)
    return groups
  }, {} as { [key: string]: typeof conversions })

  const results = []

  for (const [baseCurrency, conversionsGroup] of Object.entries(groupedByBase)) {
    const rates = await getExchangeRates(baseCurrency)
    
    for (const conversion of conversionsGroup) {
      const rate = rates.rates[conversion.toCurrency.toUpperCase()] || 1
      const convertedAmount = conversion.amount * rate

      results.push({
        originalAmount: conversion.amount,
        convertedAmount,
        fromCurrency: conversion.fromCurrency.toUpperCase(),
        toCurrency: conversion.toCurrency.toUpperCase(),
        exchangeRate: rate
      })
    }
  }

  return results
}

/**
 * Currency validation
 */
export function isValidCurrency(code: string): boolean {
  return SUPPORTED_CURRENCIES.some(c => c.code === code.toUpperCase())
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(code: string): string {
  const info = getCurrencyInfo(code)
  return info?.symbol || code.toUpperCase()
}
