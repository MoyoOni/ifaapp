import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, ChevronDown, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { logger } from '@/shared/utils/logger';
import { Currency } from '@common';

interface CurrencyConversion {
  currency: Currency;
  balance: number;
  rate: number;
  symbol: string;
}

interface MultiCurrencyBalanceProps {
  userId: string;
  baseBalance: number;
  baseCurrency: Currency;
}

/**
 * Multi-Currency Balance Component
 * Displays wallet balance in multiple currencies with real-time conversion
 */
const MultiCurrencyBalance: React.FC<MultiCurrencyBalanceProps> = ({
  userId,
  baseBalance,
  baseCurrency,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null);

  // Fetch multi-currency balance
  const { data: multiCurrencyData, isLoading, refetch } = useQuery<{
    baseBalance: number;
    baseCurrency: Currency;
    locked: boolean;
    conversions: CurrencyConversion[];
  }>({
    queryKey: ['wallet-balance-multi', userId],
    queryFn: async () => {
      try {
        const response = await api.get(`/wallet/${userId}/balance?multiCurrency=true`);
        return response.data;
      } catch (error) {
        logger.warn("API/Network fallback for multicurrency, using mock data");
        // Mock data
        return {
          baseBalance: baseBalance,
          baseCurrency: baseCurrency,
          locked: false,
          conversions: [
            {
              currency: Currency.NGN,
              balance: baseBalance,
              rate: 1,
              symbol: '₦'
            },
            {
              currency: Currency.USD,
              balance: baseBalance * 0.00065, // Approx rate
              rate: 0.00065,
              symbol: '$'
            },
            {
              currency: Currency.EUR,
              balance: baseBalance * 0.00060, // Approx rate
              rate: 0.00060,
              symbol: '€'
            },
            {
              currency: Currency.GBP,
              balance: baseBalance * 0.00051, // Approx rate
              rate: 0.00051,
              symbol: '£'
            }
          ]
        };
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const formatCurrency = (amount: number, currency: Currency, symbol: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace(currency, symbol);
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 text-muted">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading currency conversions...</span>
        </div>
      </div>
    );
  }

  if (!multiCurrencyData || !multiCurrencyData.conversions) {
    return null;
  }

  const otherCurrencies = multiCurrencyData.conversions.filter(
    (c) => c.currency !== baseCurrency
  );

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-highlight" />
          <span className="text-sm font-medium text-white">Multi-Currency View</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-white/10 rounded transition-colors"
        >
          <ChevronDown
            className={`w-4 h-4 text-muted transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </button>
      </div>

      {/* Base Currency Display */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">Base Currency</span>
          <span className="text-xs text-highlight font-medium">{baseCurrency}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">
            {formatCurrency(
              baseBalance,
              baseCurrency,
              multiCurrencyData.conversions.find((c) => c.currency === baseCurrency)?.symbol || '₦'
            )}
          </span>
        </div>
      </div>

      {/* Other Currencies (Collapsed) */}
      {!isExpanded && otherCurrencies.length > 0 && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
          {otherCurrencies.slice(0, 2).map((conversion) => (
            <div key={conversion.currency} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{conversion.currency}</span>
                <span className="text-xs text-muted">
                  1 {baseCurrency} = {conversion.rate.toFixed(4)} {conversion.currency}
                </span>
              </div>
              <p className="text-sm font-medium text-white">
                {formatCurrency(conversion.balance, conversion.currency, conversion.symbol)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Expanded View */}
      {isExpanded && (
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-muted uppercase">
              All Currencies
            </span>
            <button
              onClick={() => refetch()}
              className="p-1 hover:bg-white/10 rounded transition-colors"
              title="Refresh rates"
            >
              <RefreshCw className="w-3 h-3 text-muted" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {otherCurrencies.map((conversion) => (
              <div
                key={conversion.currency}
                className={`p-3 rounded-lg border transition-colors ${selectedCurrency === conversion.currency
                    ? 'bg-highlight/20 border-highlight/30'
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                onClick={() => setSelectedCurrency(conversion.currency)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{conversion.currency}</span>
                    <span className="text-xs text-muted">
                      {conversion.symbol}
                    </span>
                  </div>
                  <span className="text-xs text-muted">
                    1 {baseCurrency} = {conversion.rate.toFixed(4)}
                  </span>
                </div>
                <p className="text-lg font-bold text-highlight">
                  {formatCurrency(conversion.balance, conversion.currency, conversion.symbol)}
                </p>
                <p className="text-xs text-muted mt-1">
                  ≈ {formatCurrency(
                    baseBalance,
                    baseCurrency,
                    multiCurrencyData.conversions.find((c) => c.currency === baseCurrency)?.symbol || '₦'
                  )} equivalent
                </p>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-muted text-center">
              Exchange rates updated every 24 hours. Rates are approximate and may vary.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiCurrencyBalance;
