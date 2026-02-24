# Monitoring Dashboards (PB-202.4)

This document describes how to get **error rate**, **response time (p95)**, **requests per second**, and **uptime** for the Ilé Àṣẹ platform.

---

## 1. Prometheus metrics endpoint

The backend exposes a **Prometheus** scrape target at:

- **URL:** `GET /api/metrics`
- **Format:** Prometheus text exposition
- **Rate limit:** Skipped for this endpoint (so scrapers are not throttled)

### Metrics exposed

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `route`, `status_code` | Total HTTP requests (route is normalized: IDs → `:id`) |
| `http_request_duration_seconds` | Histogram | `method`, `route`, `status_code` | Request duration; buckets 5ms–5s |
| `ile_ase_*` | Various | — | Default Node.js metrics (heap, event loop, etc.) |

### Example scrape config (Prometheus)

```yaml
scrape_configs:
  - job_name: 'ile-ase-backend'
    metrics_path: /api/metrics
    static_configs:
      - targets: ['localhost:3000']
    scheme: http
```

From this you can derive:

- **Error rate by endpoint:** `rate(http_requests_total{status_code=~"5.."}[5m])` or by route
- **Response time (p95):** `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
- **Requests per second:** `sum(rate(http_requests_total[1m]))`

---

## 2. Sentry (errors and performance)

Sentry is already integrated (PB-202.1). Use it for:

- **Error rate:** Sentry Issues and Alerts (errors per minute, by endpoint if you tag requests)
- **Response time / throughput:** Sentry Performance (transactions); ensure `tracesSampleRate` is set in `backend/src/sentry.ts` (e.g. 0.1 in production)
- **Alerts:** Configure Sentry Alerts (e.g. error spike, slow transactions) and send to Slack/email

Retention depends on your Sentry plan (e.g. 30 days on Team plan).

---

## 3. Health checks and uptime

- **GET /api/health** — 200 when operational, 503 when unhealthy (use for uptime checks).
- **GET /api/health/detailed** — Per-service status (DB, Paystack, Flutterwave, S3, SendGrid).

Use **UptimeRobot**, **Pingdom**, or **Sentry Cron/Uptime** to poll `/api/health` and compute **uptime %**. Retain history according to the tool (e.g. 30+ days).

---

## 4. Dashboards (Grafana or Sentry)

### Option A: Grafana + Prometheus

1. Run Prometheus with the scrape config above (and 30+ days retention if desired).
2. Create a Grafana dashboard with panels such as:
   - **Error rate by endpoint:** query `rate(http_requests_total{status_code=~"5.."}[5m])` by `route`
   - **p95 latency by route:** `histogram_quantile(0.95, sum by (le, route) (rate(http_request_duration_seconds_bucket[5m])))`
   - **Requests per second:** `sum(rate(http_requests_total[1m]))`
3. Optionally add **uptime %** from a separate data source (e.g. Blackbox exporter or your uptime tool’s API).

### Option B: Sentry only

- Use **Sentry Performance** for response time and throughput.
- Use **Sentry Issues / Alerts** for error rate and alerting.
- Use an external uptime checker for **uptime %**.

---

## 5. Alert rules

- **Error rate:** e.g. >20 errors/minute for 5+ minutes → Slack/email (Sentry or Prometheus Alertmanager).
- **Response time:** e.g. p95 >2s for 10+ minutes → investigate (Sentry Performance or Grafana).
- **Uptime:** e.g. /api/health non-200 → page on-call (UptimeRobot/Pingdom).
- **Requests per second:** optional; alert on sudden drop (e.g. traffic stopped).

Configure in Sentry (Alerts) and/or Prometheus (Alertmanager) and retain history per your ops policy (e.g. 30 days).

---

## Summary

| Requirement | How |
|-------------|-----|
| Dashboard: error rate by endpoint | Prometheus `http_requests_total` by `route` + status 5xx, or Sentry Issues |
| Dashboard: response time (p95) | Prometheus `http_request_duration_seconds` histogram, or Sentry Performance |
| Dashboard: requests per second | Prometheus `rate(http_requests_total[1m])`, or Sentry Performance |
| Dashboard: service uptime % | UptimeRobot/Pingdom (or similar) polling `/api/health` |
| Alert rules | Sentry Alerts and/or Prometheus Alertmanager → Slack/email |
| Historical data (e.g. 30 days) | Prometheus retention / Sentry plan / uptime tool retention |
