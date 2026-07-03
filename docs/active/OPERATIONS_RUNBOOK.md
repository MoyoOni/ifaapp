# Ìlú Àṣẹ Operations Runbook

## Overview

This runbook contains procedures for operating, monitoring, and maintaining the Ìlú Àṣẹ platform. It covers deployment procedures, incident response, maintenance tasks, and troubleshooting steps.

## Platform Architecture

### Components
- **Frontend**: React 18 + TypeScript + Vite + Tailwind (PWA)
- **Backend**: NestJS (Node.js/TypeScript) with PostgreSQL (via Prisma), Redis cache, Socket.IO
- **Common**: Shared Zod schemas, enums, DTOs
- **Infrastructure**: Docker, nginx reverse proxy, Firebase for push notifications

### Environments
- **Development**: Local setup with separate frontend/backend servers
- **Staging**: Docker Compose deployment for testing
- **Production**: Docker Compose deployment with SSL, monitoring, and backups

## Deployment Procedures

### Production Deployment

1. **Pre-deployment Checks**
   - Ensure all tests pass (`npm run test`)
   - Verify staging environment is stable
   - Confirm backup strategy is in place
   - Verify monitoring systems are operational

2. **Deployment Steps**
   ```bash
   # On deployment server
   cd ~/ifa_app
   git pull origin main
   docker-compose down
   docker-compose build
   docker-compose up -d
   
   # Verify health
   curl -f https://api.iluase.com/health || echo "Health check failed"
   ```

3. **Post-deployment Verification**
   - Check application logs for errors
   - Verify all services are running (`docker-compose ps`)
   - Test critical user flows manually
   - Confirm monitoring dashboards show healthy state

### Rollback Procedure

1. Identify the problematic release and last known good version
2. Stop current services: `docker-compose down`
3. Revert to previous version: `git checkout <good-commit>`
4. Rebuild and restart: `docker-compose build && docker-compose up -d`
5. Verify the rollback worked by checking logs and functionality

## Incident Response

### Critical Incidents (P0)

#### Application Down
1. **Immediate Actions (5 min)**
   - Verify if issue affects all users or specific regions
   - Check application logs: `docker-compose logs -f backend`
   - Check system resources: `docker stats`
   
2. **Troubleshooting (15 min)**
   - Restart services: `docker-compose restart backend`
   - Check database connectivity: `docker-compose exec backend npx prisma db pull`
   - Check Redis connectivity: `docker-compose exec backend redis-cli ping`

3. **Escalation Path**
   - If unresolved after 30 min, escalate to senior engineer
   - Notify stakeholders via Slack channel

#### Database Issues
1. **Immediate Actions (5 min)**
   - Check database logs: `docker-compose logs postgres`
   - Check database connectivity from application
   - Monitor database resource usage

2. **Recovery Steps**
   - If database is unresponsive, restart: `docker-compose restart postgres`
   - If corrupted, restore from latest backup
   - If performance issue, check for long-running queries

#### Payment Processing Failure
1. **Immediate Actions (5 min)**
   - Check Stripe webhook logs
   - Verify API keys in environment
   - Check payment processing queue

2. **Resolution Steps**
   - If API key issue, update in environment and restart
   - If webhook failure, retry failed webhooks manually

### Non-Critical Incidents (P1-P3)

#### Slow Performance
1. Check application logs for slow queries
2. Analyze database performance: `EXPLAIN ANALYZE` for slow queries
3. Check Redis cache hit rate
4. Review application resource usage

#### Feature Malfunction
1. Reproduce the issue in staging environment
2. Check application logs for errors
3. Verify recent deployments didn't introduce the issue
4. Create bug ticket with reproduction steps

## Maintenance Procedures

### Daily Tasks
- Monitor application health via dashboard
- Check for any failed background jobs
- Verify backup status
- Review error logs for new patterns

### Weekly Tasks
- Review performance metrics
- Clean up old log files
- Update dependencies (if security patches available)
- Review user feedback for recurring issues

### Monthly Tasks
- Perform full backup verification
- Review and update this runbook
- Analyze usage patterns and performance trends
- Plan capacity adjustments if needed

## Monitoring and Alerting

### Critical Metrics
- Application uptime (target: >99.9%)
- API response times (target: <200ms p95)
- Error rates (target: <0.1%)
- Database connection pool usage (<80%)
- Memory usage (<80%)

### Alert Conditions
- Application unavailable for >1 min
- Error rate >1% for >5 min
- Response time >1s for >5 min
- Disk space >85%
- Database CPU >80%

## Troubleshooting Common Issues

### Database Connection Errors
**Symptoms**: Application logs show "Database connection failed"
**Solution**: 
1. Check if PostgreSQL container is running: `docker-compose ps postgres`
2. Check database logs: `docker-compose logs postgres`
3. Restart database: `docker-compose restart postgres`
4. If persistent, increase connection pool size in config

### High Memory Usage
**Symptoms**: Server becoming unresponsive, OOM killer warnings
**Solution**:
1. Check memory usage: `docker stats`
2. Check for memory leaks in application logs
3. Restart application: `docker-compose restart backend`
4. Consider increasing server resources

### Slow API Responses
**Symptoms**: Users reporting slow page loads
**Solution**:
1. Check slow query logs in PostgreSQL
2. Verify Redis cache is working properly
3. Check for N+1 queries in application
4. Review third-party API dependencies (Stripe, Firebase)

### WebSocket Disconnections
**Symptoms**: Users losing real-time communication
**Solution**:
1. Check Socket.IO logs in application
2. Verify Redis adapter is configured for multiple instances
3. Check server resources and network connectivity
4. Increase WebSocket timeout values if needed

## Security Procedures

### Security Incident Response
1. Isolate affected systems to prevent spread
2. Preserve evidence for forensic analysis
3. Assess scope and impact
4. Implement immediate mitigation
5. Notify appropriate authorities if required
6. Conduct post-incident review

### Regular Security Checks
- Scan dependencies for vulnerabilities weekly
- Review access logs monthly
- Rotate API keys quarterly
- Perform penetration testing annually

## Backup and Recovery

### Backup Schedule
- Database dumps: Daily at 2 AM UTC
- Application files: Daily at 3 AM UTC
- Media files: Daily at 4 AM UTC

### Recovery Process
1. Identify point-in-time for recovery
2. Restore database from backup
3. Restore application files if needed
4. Verify data integrity
5. Update DNS if required