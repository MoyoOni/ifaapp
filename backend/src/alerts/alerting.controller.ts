import { Controller, Get, Post, Put, Delete, Param, Body, ParseUUIDPipe } from '@nestjs/common';
import { AlertingService, AlertRule, Alert } from './alerting.service';

@Controller('alerts')
export class AlertingController {
  constructor(private readonly alertingService: AlertingService) {}

  @Get('rules')
  getAlertRules(): AlertRule[] {
    return this.alertingService.getAlertRules();
  }

  @Get('rules/:id')
  getAlertRule(@Param('id', ParseUUIDPipe) id: string): AlertRule | undefined {
    // Find alert rule by ID (in a real implementation we'd have a specific method)
    return this.alertingService.getAlertRules().find(rule => rule.id === id);
  }

  @Post('rules')
  createAlertRule(
    @Body() rule: Omit<AlertRule, 'id'>
  ): AlertRule {
    return this.alertingService.createAlertRule(rule);
  }

  @Put('rules/:id')
  updateAlertRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<AlertRule>
  ): AlertRule | undefined {
    return this.alertingService.updateAlertRule(id, updates);
  }

  @Delete('rules/:id')
  deleteAlertRule(@Param('id', ParseUUIDPipe) id: string): boolean {
    return this.alertingService.deleteAlertRule(id);
  }

  @Get('active')
  getActiveAlerts(): Alert[] {
    return this.alertingService.getActiveAlerts();
  }

  @Post(':id/resolve')
  resolveAlert(@Param('id', ParseUUIDPipe) id: string): void {
    this.alertingService.resolveAlert(id);
  }
}