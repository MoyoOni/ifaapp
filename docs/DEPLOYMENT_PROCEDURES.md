# Ìlú Àṣẹ Deployment Procedures & Runbook

## Table of Contents
- [Overview](#overview)
- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Process](#deployment-process)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedure](#rollback-procedure)
- [Monitoring & Alerting](#monitoring--alerting)
- [Incident Response](#incident-response)
- [Security Procedures](#security-procedures)
- [Troubleshooting](#troubleshooting)

## Overview
This document provides step-by-step procedures for deploying Ìlú Àṣẹ to staging and production environments. It covers pre-deployment checks, deployment process, post-deployment verification, and incident response procedures.

## Pre-Deployment Checklist
- [ ] All tests pass (unit, integration, e2e)
- [ ] Code review completed and approved
- [ ] Security scan passed
- [ ] Performance tests completed
- [ ] Database migrations tested
- [ ] Backup of production database taken
- [ ] Stakeholders notified of maintenance window
- [ ] Rollback plan prepared and tested

## Deployment Process

### Staging Environment
1. Merge changes to `staging` branch
2. Trigger CI/CD pipeline for staging
3. Monitor deployment logs
4. Perform smoke tests on staging

### Production Environment
1. Merge `staging` to `main` branch
2. Tag release with semantic version (e.g., `v1.2.3`)
3. Trigger CI/CD pipeline for production
4. Monitor deployment logs
5. Perform smoke tests on production

## Post-Deployment Verification

### Health Checks
- [ ] `/health` endpoint returns 200 OK
- [ ] All services are running (backend, frontend, database, Redis)
- [ ] Database connectivity verified
- [ ] Email service connectivity verified
- [ ] Payment gateway connectivity verified
- [ ] Third-party integrations working

### Functional Checks
- [ ] User registration/login works
- [ ] Core features accessible
- [ ] Admin dashboard functional
- [ ] API endpoints responding
- [ ] Frontend assets loading correctly
- [ ] SSL certificates valid

## Rollback Procedure

### Immediate Rollback (During Deployment)
1. Stop the deployment process
2. If deployment already completed:
   - Revert to previous version using blue-green deployment
   - Or restore from backup if needed

### Post-Deployment Rollback
1. Identify the issue and confirm rollback is needed
2. Inform stakeholders about rollback
3. Deploy previous version
4. Verify previous version is working correctly
5. Document the issue and rollback process

## Monitoring & Alerting

### Key Metrics to Monitor
- Response time (p95 < 1s)
- Error rate (< 1%)
- Throughput (requests per second)
- Database connection pool usage
- Memory and CPU utilization
- Queue depth and processing time
- Disk space usage

### Alert Thresholds
- Error rate > 5% for 5 minutes
- Response time p95 > 2s for 5 minutes
- Database connection pool > 80% for 5 minutes
- Server memory usage > 85%
- Queue depth > 1000 for 10 minutes

## Incident Response

### On-Call Rotation
- Primary: [Primary Contact]
- Secondary: [Secondary Contact]
- Escalation: [Escalation Contact]

### Incident Severity Levels
- **Severity 1 (Critical)**: Complete service outage, data breach, security compromise
  - Response time: < 15 minutes
  - Notification: SMS + phone call
- **Severity 2 (High)**: Partial service degradation, elevated error rates
  - Response time: < 1 hour
  - Notification: Slack + email
- **Severity 3 (Medium)**: Minor functionality issues
  - Response time: < 4 hours
  - Notification: Slack
- **Severity 4 (Low)**: Minor issues, enhancement requests
  - Response time: < 24 hours
  - Notification: Ticket system

### Incident Response Steps
1. Acknowledge the incident
2. Assess the impact and assign severity
3. Notify appropriate teams
4. Begin mitigation efforts
5. Update stakeholders on progress
6. Resolve the incident
7. Conduct post-mortem analysis
8. Document lessons learned

## Security Procedures

### API Key Rotation
1. Generate new API keys in the secrets manager
2. Update environment variables in deployment configuration
3. Deploy with new keys
4. Wait for propagation (allow 5-10 minutes for all nodes to restart)
5. Revoke old keys
6. Verify all services are working with new keys

### Security Incident Response
1. Isolate affected systems
2. Preserve evidence
3. Assess scope of breach
4. Notify legal/compliance teams
5. Notify affected users if required
6. Remediate vulnerabilities
7. Conduct security audit
8. Update security procedures

### Regular Security Tasks
- [ ] Monthly: Review access logs for anomalies
- [ ] Quarterly: Penetration testing
- [ ] Monthly: Update security dependencies
- [ ] Annually: Security audit
- [ ] Bi-annually: Disaster recovery test

## Troubleshooting

### Common Issues & Solutions

#### Application Not Responding
1. Check if the application container/service is running
2. Check application logs for errors
3. Verify database connectivity
4. Check system resources (CPU, memory, disk)

#### High Response Times
1. Check application logs for slow queries
2. Monitor database performance metrics
3. Check for memory leaks
4. Scale application instances if needed

#### Database Connectivity Issues
1. Check database server status
2. Verify connection string and credentials
3. Check firewall rules
4. Monitor connection pool metrics
5. Review recent schema changes

#### Failed Background Jobs
1. Check queue depth and processing metrics
2. Review failed job logs
3. Check worker availability
4. Verify database connectivity for workers

### Diagnostic Commands
```bash
# Check application health
curl -s http://your-domain.com/api/health

# Check service status
docker ps  # If using Docker
kubectl get pods  # If using Kubernetes

# View application logs
docker logs <container-id>
kubectl logs <pod-name>

# Check database connectivity
psql -h <db-host> -U <db-user> -d <db-name>
```

---

## Appendix: Emergency Contacts
- **Technical Lead**: [Contact Info]
- **DevOps Engineer**: [Contact Info]
- **Security Officer**: [Contact Info]
- **Legal Contact**: [Contact Info]
- **Executive Sponsor**: [Contact Info]