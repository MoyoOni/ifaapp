-- Create currency cache table for exchange rate caching
CREATE TABLE IF NOT EXISTS currency_cache (
  cache_key VARCHAR(20) PRIMARY KEY,
  rate DECIMAL(10, 6) NOT NULL,
  cached_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_currency_cache_cached_at ON currency_cache(cached_at);
