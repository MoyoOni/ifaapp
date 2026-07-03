import { Injectable, Logger } from '@nestjs/common';
import { EnhancedMetricsService } from '../metrics/enhanced-metrics.service';
import { NotificationService } from '../notifications/notification.service';
import * as os from 'os';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string; // e.g. "response_time > 1000ms", "error_rate > 5%"
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  lastTriggered?: Date;
}

export interface Alert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
}

@Injectable()
export class AlertingService {
  private readonly logger = new Logger(AlertingService.name);
  private alertRules: AlertRule[] = [];
  private activeAlerts: Alert[] = [];

  constructor(
    private readonly metricsService: EnhancedMetricsService,
    private readonly notificationService: NotificationService,
  ) {
    this.initializeDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'rule-high-error-rate',
        name: 'High Error Rate',
        description: 'Triggers when error rate exceeds 5%',
        condition: 'error_rate > 0.05',
        threshold: 0.05,
        severity: 'high',
        enabled: true,
      },
      {
        id: 'rule-slow-response',
        name: 'Slow Response Time',
        description: 'Triggers when average response time exceeds 1 second',
        condition: 'response_time > 1000ms',
        threshold: 1000,
        severity: 'medium',
        enabled: true,
      },
      {
        id: 'rule-high-cpu',
        name: 'High CPU Usage',
        description: 'Triggers when CPU usage exceeds 80%',
        condition: 'cpu_usage > 80%',
        threshold: 80,
        severity: 'high',
        enabled: true,
      },
      {
        id: 'rule-low-disk-space',
        name: 'Low Disk Space',
        description: 'Triggers when disk space falls below 10%',
        condition: 'disk_space < 10%',
        threshold: 10,
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'rule-low-memory',
        name: 'Low Memory',
        description: 'Triggers when available memory falls below 20%',
        condition: 'memory_available < 20%',
        threshold: 20,
        severity: 'high',
        enabled: true,
      },
    ];

    this.logger.log(`Initialized ${this.alertRules.length} default alert rules`);
  }

  /**
   * Start monitoring based on configured rules
   */
  private startMonitoring(): void {
    // Check for alerts every 30 seconds
    setInterval(() => {
      this.evaluateAlertRules();
    }, 30000); // 30 seconds

    this.logger.log('Started alert monitoring service');
  }

  /**
   * Evaluate all active alert rules
   */
  private evaluateAlertRules(): void {
    this.alertRules
      .filter(rule => rule.enabled)
      .forEach(rule => {
        switch (rule.id) {
          case 'rule-high-error-rate':
            this.checkErrorRate(rule);
            break;
          case 'rule-slow-response':
            this.checkResponseTime(rule);
            break;
          case 'rule-high-cpu':
            this.checkCpuUsage(rule);
            break;
          case 'rule-low-disk-space':
            this.checkDiskSpace(rule);
            break;
          case 'rule-low-memory':
            this.checkMemoryAvailable(rule);
            break;
          default:
            this.logger.warn(`Unknown alert rule ID: ${rule.id}`);
        }
      });
  }

  /**
   * Check for high error rate
   */
  private checkErrorRate(rule: AlertRule): void {
    // In a real implementation, this would fetch error rate from metrics
    // For now, we'll simulate by checking recent logs or metrics
    
    // This is a simplified approach - in reality you'd calculate from metrics
    const recentErrors = 5; // This would come from actual metrics
    const totalRequests = 100; // This would come from actual metrics
    const errorRate = recentErrors / totalRequests;

    if (errorRate > rule.threshold) {
      this.triggerAlert({
        id: `alert-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        message: `High error rate detected: ${(errorRate * 100).toFixed(2)}%`,
        severity: rule.severity,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check for slow response times
   */
  private checkResponseTime(rule: AlertRule): void {
    // In a real implementation, this would fetch avg response time from metrics
    // For now, simulating with a fixed value
    
    // This would actually come from metrics service
    const avgResponseTime = 1200; // ms - simulated value
    
    if (avgResponseTime > rule.threshold) {
      this.triggerAlert({
        id: `alert-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        message: `Slow response time detected: ${avgResponseTime}ms average`,
        severity: rule.severity,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check CPU usage
   */
  private checkCpuUsage(rule: AlertRule): void {
    const cpuInfo = process.cpuUsage();
    // Simplified check - in reality you'd monitor this continuously
    const cpuPercent = (cpuInfo.system + cpuInfo.user) / (process.uptime() * 1000 * 1000) * 100;
    
    if (cpuPercent > rule.threshold) {
      this.triggerAlert({
        id: `alert-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        message: `High CPU usage detected: ${cpuPercent.toFixed(2)}%`,
        severity: rule.severity,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check disk space
   */
  private checkDiskSpace(rule: AlertRule): void {
    // Simplified check - in reality you'd check actual disk space
    const diskUsagePercent = 85; // Simulated value
    
    if (100 - diskUsagePercent < rule.threshold) {
      this.triggerAlert({
        id: `alert-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        message: `Low disk space detected: ${(100 - diskUsagePercent).toFixed(2)}% available`,
        severity: rule.severity,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Check memory availability
   */
  private checkMemoryAvailable(rule: AlertRule): void {
    const freeMem = os.freemem();
    const totalMem = os.totalmem();
    const availablePercent = (freeMem / totalMem) * 100;
    
    if (availablePercent < rule.threshold) {
      this.triggerAlert({
        id: `alert-${Date.now()}-${rule.id}`,
        ruleId: rule.id,
        message: `Low memory detected: ${availablePercent.toFixed(2)}% available`,
        severity: rule.severity,
        timestamp: new Date(),
        resolved: false,
      });
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: Alert): void {
    // Check if this alert is already active to avoid duplicates
    const existingAlert = this.activeAlerts.find(a => 
      a.ruleId === alert.ruleId && !a.resolved
    );
    
    if (existingAlert) {
      // Update the last triggered time but don't create duplicate
      existingAlert.lastTriggered = new Date();
      return;
    }

    this.activeAlerts.push(alert);
    this.logger.warn(`Alert triggered: ${alert.message} (Severity: ${alert.severity})`);

    // Send notification about the alert
    this.notificationService.sendSystemNotification({
      title: `Alert: ${alert.severity.toUpperCase()} - ${alert.message}`,
      message: `An alert has been triggered based on rule: ${alert.ruleId}`,
      recipients: ['admin'], // In reality, this would be configurable
      priority: alert.severity === 'critical' ? 'high' : 'normal',
    });
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return this.activeAlerts.filter(alert => !alert.resolved);
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.activeAlerts.find(a => a.id === alertId && !a.resolved);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      this.logger.log(`Alert resolved: ${alertId}`);
    }
  }

  /**
   * Create a new alert rule
   */
  createAlertRule(rule: Omit<AlertRule, 'id'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    };

    this.alertRules.push(newRule);
    this.logger.log(`Created new alert rule: ${newRule.name}`);

    return newRule;
  }

  /**
   * Update an existing alert rule
   */
  updateAlertRule(id: string, updates: Partial<AlertRule>): AlertRule | undefined {
    const index = this.alertRules.findIndex(rule => rule.id === id);
    if (index !== -1) {
      this.alertRules[index] = { ...this.alertRules[index], ...updates };
      this.logger.log(`Updated alert rule: ${id}`);
      return this.alertRules[index];
    }
    return undefined;
  }

  /**
   * Delete an alert rule
   */
  deleteAlertRule(id: string): boolean {
    const initialLength = this.alertRules.length;
    this.alertRules = this.alertRules.filter(rule => rule.id !== id);
    const deleted = this.alertRules.length < initialLength;

    if (deleted) {
      this.logger.log(`Deleted alert rule: ${id}`);
      // Also resolve any active alerts for this rule
      this.activeAlerts
        .filter(alert => alert.ruleId === id && !alert.resolved)
        .forEach(alert => this.resolveAlert(alert.id));
    }

    return deleted;
  }
}