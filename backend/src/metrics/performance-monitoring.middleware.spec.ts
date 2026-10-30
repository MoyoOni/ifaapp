import { EventEmitter } from 'events';
import { PerformanceMonitoringMiddleware } from './performance-monitoring.middleware';

describe('PerformanceMonitoringMiddleware', () => {
  const metrics = {
    recordRequestStart: jest.fn(),
    recordHttpRequest: jest.fn(),
    recordRequestEnd: jest.fn(),
  };
  const middleware = new PerformanceMonitoringMiddleware(metrics as any);

  // Mounted on a catch-all, req.url is "/" for every request, so all
  // traffic was recorded under one route.
  it('labels the request with its full path, not the mount-relative one', () => {
    const res = Object.assign(new EventEmitter(), { statusCode: 200 });
    const next = jest.fn();
    middleware.use({ method: 'GET', url: '/', originalUrl: '/api/temples?limit=5' } as any, res as any, next);
    res.emit('finish');

    expect(next).toHaveBeenCalled();
    expect(metrics.recordHttpRequest).toHaveBeenCalledWith('GET', '/api/temples', 200, expect.any(Number));
  });
});
