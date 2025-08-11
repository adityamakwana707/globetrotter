"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowRightLeft, TrendingUp, TrendingDown, RefreshCw, Calculator } from "lucide-react"
import { 
  getCurrencyConversion,
  getExchangeRates,
  SUPPORTED_CURRENCIES,
  formatCurrency,
  type CurrencyInfo,
  type ExchangeRates
} from "@/lib/currency"
import { toast } from "@/hooks/use-toast"

interface CurrencyConverterProps {
  defaultFromCurrency?: string
  defaultToCurrency?: string
  onConversionChange?: (result: any) => void
  className?: string
}

export default function CurrencyConverter({
  defaultFromCurrency = 'USD',
  defaultToCurrency = 'EUR',
  onConversionChange,
  className = ""
}: CurrencyConverterProps) {
  const [amount, setAmount] = useState<string>('100')
  const [fromCurrency, setFromCurrency] = useState(defaultFromCurrency)
  const [toCurrency, setToCurrency] = useState(defaultToCurrency)
  const [conversionResult, setConversionResult] = useState<any>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      performConversion()
    }
  }, [amount, fromCurrency, toCurrency])

  useEffect(() => {
    fetchExchangeRates()
  }, [fromCurrency])

  const fetchExchangeRates = async () => {
    try {
      const rates = await getExchangeRates(fromCurrency)
      setExchangeRates(rates)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Failed to fetch exchange rates:', error)
    }
  }

  const performConversion = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setConversionResult(null)
      return
    }

    setIsLoading(true)
    try {
      const result = await getCurrencyConversion(
        parseFloat(amount),
        fromCurrency,
        toCurrency
      )
      
      setConversionResult(result)
      
      if (onConversionChange) {
        onConversionChange(result)
      }
    } catch (error) {
      console.error('Conversion failed:', error)
      toast({
        title: "Conversion Error",
        description: "Failed to convert currency. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }

  const getCurrencyFlag = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code)
    return currency?.flag || '💱'
  }

  const getPopularAmounts = () => {
    const popular = [100, 500, 1000, 5000]
    return popular.map(amt => ({
      amount: amt,
      converted: conversionResult ? (amt * conversionResult.exchangeRate).toFixed(2) : null
    }))
  }

  const getExchangeRateInfo = () => {
    if (!exchangeRates || !conversionResult) return null

    const rate = conversionResult.exchangeRate
    const inverse = 1 / rate

    return {
      direct: `1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}`,
      inverse: `1 ${toCurrency} = ${inverse.toFixed(4)} ${fromCurrency}`
    }
  }

  const popularAmounts = getPopularAmounts()
  const rateInfo = getExchangeRateInfo()

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="bg-white border-gray-200 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Currency Converter
            </CardTitle>
            <Button
              onClick={fetchExchangeRates}
              size="sm"
              variant="outline"
              className="border-gray-300 text-slate-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          {lastUpdated && (
            <p className="text-slate-600 text-sm">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Amount Input */}
          <div className="space-y-2">
            <Label className="text-slate-800">Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="bg-white border-gray-300 text-slate-900 text-lg"
              min="0"
              step="0.01"
            />
          </div>

          {/* Currency Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-slate-800">From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="text-slate-900 hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-slate-600">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={swapCurrencies}
                variant="outline"
                size="sm"
                className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-800">To</Label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code} className="text-slate-900 hover:bg-gray-50">
                      <div className="flex items-center space-x-2">
                        <span>{currency.flag}</span>
                        <span>{currency.code}</span>
                        <span className="text-slate-600">- {currency.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversion Result */}
          {conversionResult && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center space-x-3">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      {conversionResult.formatted.original}
                    </p>
                    <p className="text-slate-600 text-sm">{getCurrencyFlag(fromCurrency)} {fromCurrency}</p>
                  </div>
                  <ArrowRightLeft className="w-6 h-6 text-slate-500" />
                  <div className="text-left">
                    <p className="text-2xl font-bold text-emerald-600">
                      {conversionResult.formatted.converted}
                    </p>
                    <p className="text-slate-600 text-sm">{getCurrencyFlag(toCurrency)} {toCurrency}</p>
                  </div>
                </div>
                
                {isLoading && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-emerald-500"></div>
                    <span className="text-slate-600 text-sm">Converting...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Exchange Rate Info */}
          {rateInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-slate-900 font-semibold">{rateInfo.direct}</p>
                <p className="text-slate-600 text-sm">Direct Rate</p>
              </div>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-slate-900 font-semibold">{rateInfo.inverse}</p>
                <p className="text-slate-600 text-sm">Inverse Rate</p>
              </div>
            </div>
          )}

          {/* Popular Amounts */}
          <div>
            <Label className="text-slate-800 text-sm mb-3 block">Quick Convert</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {popularAmounts.map(({ amount: popularAmount, converted }) => (
                <Button
                  key={popularAmount}
                  onClick={() => setAmount(popularAmount.toString())}
                  variant="outline"
                  size="sm"
                  className="border-gray-300 text-slate-700 hover:bg-gray-50 flex flex-col h-auto py-2"
                >
                  <span className="font-semibold">{formatCurrency(popularAmount, fromCurrency)}</span>
                  {converted && (
                    <span className="text-xs text-slate-600">
                      ≈ {formatCurrency(parseFloat(converted), toCurrency)}
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rate Trends (Mock) */}
      <Card className="bg-white border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900 text-sm">Exchange Rate Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">24h Change</span>
            <div className="flex items-center space-x-1 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span>+0.23%</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-slate-600">7d Change</span>
            <div className="flex items-center space-x-1 text-red-500">
              <TrendingDown className="w-4 h-4" />
              <span>-1.45%</span>
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Historical data and trends coming soon
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
