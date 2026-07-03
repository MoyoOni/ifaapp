# Monitoring Dashboard Setup for Ìlú Àṣẹ

## Overview

This document describes the setup and configuration of monitoring dashboards for the Ìlú Àṣẹ platform. It covers metrics collection, visualization tools, alert configurations, and dashboard layouts.

## Monitoring Stack

### Primary Tools
- **Application Metrics**: OpenTelemetry SDK with tracing and metrics
- **Error Tracking**: Sentry for exception monitoring
- **Infrastructure Monitoring**: Prometheus + Grafana (hosted or self-hosted)
- **Log Aggregation**: Winston structured logging with JSON output
- **APM**: Node.js built-in performance hooks + custom metrics

### Data Sources
- Application logs with structured metadata
- Database query performance metrics
- API response time distributions
- Resource utilization (CPU, memory, disk, network)
- Business metrics (user registrations, transactions, etc.)

## Metrics Collection

### Application Metrics
The application collects the following custom metrics:

#### Performance Metrics
- `api_response_time` - Histogram of API response times by endpoint
- `database_query_time` - Histogram of database query execution times
- `cache_hit_ratio` - Ratio of cache hits to total requests
- `websocket_connections` - Current active WebSocket connections
- `active_users` - Number of currently active users by role

#### Business Metrics
- `user_registrations` - Count of new user registrations by source
- `successful_payments` - Count of successful payment transactions
- `booking_requests` - Count of booking requests by type
- `message_sent` - Count of messages sent by type and delivery status
- `content_views` - Count of content views by type

#### Error Metrics
- `error_rate` - Rate of errors by type and severity
- `failed_jobs` - Count of failed background jobs
- `external_api_errors` - Count of external API errors by provider
- `validation_errors` - Count of validation errors by type

### Infrastructure Metrics
- `nodejs_process_cpu_usage` - CPU usage of Node.js process
- `nodejs_process_memory_rss` - Memory usage of Node.js process
- `nodejs_eventloop_lag` - Event loop lag of Node.js process
- `http_request_duration_seconds` - HTTP request duration histogram
- `http_requests_total` - Total HTTP requests by status code

## Grafana Dashboard Configuration

### Dashboard 1: Application Health
**Purpose**: Overall application health and performance overview

#### Panels:
1. **System Health** (Top Row)
   - Uptime percentage gauge
   - Active users by role (bar chart)
   - Error rate over time (graph panel)

2. **Performance Metrics** (Middle Row)
   - API response time percentiles (heatmap/graph)
   - Database query performance (graph panel)
   - Cache hit ratio (gauge)

3. **Business Metrics** (Bottom Row)
   - User registrations over time (time series)
   - Successful payments over time (time series)
   - Booking requests by type (pie chart)

### Dashboard 2: Error Monitoring
**Purpose**: Detailed error tracking and analysis

#### Panels:
1. **Error Overview**
   - Error count by type (table)
   - Error rate by service (graph panel)
   - Top error messages (logs panel)

2. **Error Details**
   - Error distribution by severity (bar chart)
   - Error timeline with annotations (graph panel)
   - Recent error traces from Sentry (logs panel)

### Dashboard 3: Infrastructure
**Purpose**: System resource utilization and infrastructure health

#### Panels:
1. **Resource Utilization**
   - CPU usage by process (graph panel)
   - Memory usage by process (graph panel)
   - Disk I/O operations (graph panel)

2. **Database Health**
   - Connection pool usage (graph panel)
   - Query throughput (graph panel)
   - Slow query count (graph panel)

3. **Network Metrics**
   - Network traffic (graph panel)
   - Active WebSocket connections (single stat)
   - Request throughput (graph panel)

## Alert Configuration

### Critical Alerts (P0 - Immediate Response Required)

#### Application Down
- **Metric**: `up == 0`
- **Condition**: Application is down for >1 minute
- **Severity**: Critical
- **Notification**: SMS, phone call, Slack
- **Owner**: On-call engineer

#### High Error Rate
- **Metric**: `increase(error_count[5m]) / increase(request_total[5m]) > 0.01`
- **Condition**: Error rate exceeds 1% for 5+ minutes
- **Severity**: Critical
- **Notification**: Slack, email
- **Owner**: Backend team

#### Slow Response Times
- **Metric**: `histogram_quantile(0.95, api_response_time_bucket) > 1000`
- **Condition**: 95th percentile response time >1 second
- **Severity**: Warning initially, Critical after 10 minutes
- **Notification**: Slack
- **Owner**: Backend team

### Warning Alerts (P1 - Investigate Soon)

#### High Memory Usage
- **Metric**: `process_resident_memory_bytes / machine_memory_bytes > 0.8`
- **Condition**: Memory usage >80% for 10+ minutes
- **Severity**: Warning
- **Notification**: Slack
- **Owner**: DevOps team

#### Database Connection Pool Exhaustion
- **Metric**: `database_pool_active_connections / database_pool_max_connections > 0.85`
- **Condition**: Connection pool utilization >85% for 5+ minutes
- **Severity**: Warning
- **Notification**: Slack
- **Owner**: Backend team

#### Spike in External API Failures
- **Metric**: `increase(external_api_errors[10m]) > 10`
- **Condition**: More than 10 external API errors in 10 minutes
- **Severity**: Warning
- **Notification**: Slack
- **Owner**: Backend team

## Log Collection and Analysis

### Log Format
All application logs use structured JSON format:
```
{
  "timestamp": "2026-04-19T14:25:34.123Z",
  "level": "info",
  "service": "backend",
  "traceId": "abc123def456",
  "spanId": "xyz789",
  "userId": "user123",
  "endpoint": "/api/bookings",
  "method": "POST",
  "responseTime": 150,
  "statusCode": 200,
  "message": "Booking created successfully",
  "metadata": {
    "bookingId": "booking456",
    "babalawoId": "babalawo789"
  }
}
```

### Log Retention
- Application logs: 30 days in Elasticsearch
- Error logs: 90 days in Sentry
- Audit logs: 1 year for compliance

### Log Queries
Common log queries for troubleshooting:

1. **Find errors in last hour**:
   ```
   level:error timestamp:>now-1h
   ```

2. **Find slow requests**:
   ```
   service:backend responseTime:>1000
   ```

3. **Trace a specific user's activity**:
   ```
   userId:USER_ID_HERE timestamp:>TIMEFRAME
   ```

## Monitoring Best Practices

### Dashboard Design Principles
1. **Actionable**: Each panel should lead to a specific action
2. **Prioritized**: Critical metrics at the top
3. **Time-contextual**: Show relevant time ranges
4. **Minimal**: Avoid dashboard clutter, focus on essentials

### Alert Hygiene
1. **Meaningful**: Alerts should indicate real problems requiring action
2. **Specific**: Clear description of the issue and suggested action
3. **Timely**: Appropriate thresholds to avoid alert fatigue
4. **Reviewed**: Regular review and adjustment of alert conditions

### Performance Optimization
1. **Efficient queries**: Optimize Prometheus queries for performance
2. **Appropriate intervals**: Balance between granularity and storage
3. **Retention policies**: Set appropriate retention for different metrics
4. **Compression**: Use compression for log transmission

## Integration with Existing Tools

### Sentry Integration
- Errors automatically reported to Sentry with context
- Link from Grafana dashboard to relevant Sentry issues
- Correlate performance metrics with error occurrences

### Slack Notifications
- Configure webhook for each alert type
- Use appropriate channels for different severities
- Include relevant context and links to dashboards

### Email Alerts
- For non-critical alerts that don't require immediate action
- Include summary of metrics and suggested next steps
- Configured with appropriate filtering to avoid spam

## Maintenance and Evolution

### Regular Reviews
- Monthly review of dashboard effectiveness
- Quarterly update of metrics based on platform evolution
- Semi-annual review of alert thresholds
- Annual update of retention policies

### Adding New Metrics
1. Define the business purpose of the metric
2. Implement collection in application code
3. Create visualization in appropriate dashboard
4. Set up relevant alerts if needed
5. Document the metric in this document