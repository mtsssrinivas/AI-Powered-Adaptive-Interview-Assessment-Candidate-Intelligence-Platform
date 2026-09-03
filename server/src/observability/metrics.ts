export interface RouteMetric {
  route: string;
  method: string;
  statusCode: number;
  count: number;
  totalDurationMs: number;
  minDurationMs: number;
  maxDurationMs: number;
  durations: number[];
}

export class MetricsCollector {
  private static routeMetrics = new Map<string, RouteMetric>();
  private static totalRequests = 0;
  private static status2xx = 0;
  private static status4xx = 0;
  private static status5xx = 0;
  private static startTime = Date.now();

  static recordRequest(
    method: string,
    route: string,
    statusCode: number,
    durationMs: number
  ): void {
    this.totalRequests++;
    if (statusCode >= 200 && statusCode < 300) this.status2xx++;
    else if (statusCode >= 400 && statusCode < 500) this.status4xx++;
    else if (statusCode >= 500) this.status5xx++;

    const key = `${method}:${route}:${statusCode}`;
    const existing = this.routeMetrics.get(key);

    if (!existing) {
      this.routeMetrics.set(key, {
        route,
        method,
        statusCode,
        count: 1,
        totalDurationMs: durationMs,
        minDurationMs: durationMs,
        maxDurationMs: durationMs,
        durations: [durationMs],
      });
    } else {
      existing.count++;
      existing.totalDurationMs += durationMs;
      existing.minDurationMs = Math.min(existing.minDurationMs, durationMs);
      existing.maxDurationMs = Math.max(existing.maxDurationMs, durationMs);
      if (existing.durations.length < 500) {
        existing.durations.push(durationMs);
      }
    }
  }

  static getPercentile(durations: number[], percentile: number): number {
    if (durations.length === 0) return 0;
    const sorted = [...durations].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  static getMetricsJSON() {
    const memory = process.memoryUsage();
    const allDurations: number[] = [];

    const routes = Array.from(this.routeMetrics.values()).map((r) => {
      allDurations.push(...r.durations);
      return {
        method: r.method,
        route: r.route,
        statusCode: r.statusCode,
        requestsCount: r.count,
        avgDurationMs: Math.round((r.totalDurationMs / r.count) * 10) / 10,
        minDurationMs: r.minDurationMs,
        maxDurationMs: r.maxDurationMs,
        p50Ms: this.getPercentile(r.durations, 50),
        p95Ms: this.getPercentile(r.durations, 95),
        p99Ms: this.getPercentile(r.durations, 99),
      };
    });

    return {
      system: {
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        nodeVersion: process.version,
        memoryUsageMb: {
          rss: Math.round(memory.rss / (1024 * 1024)),
          heapUsed: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotal: Math.round(memory.heapTotal / (1024 * 1024)),
          external: Math.round(memory.external / (1024 * 1024)),
        },
      },
      http: {
        totalRequests: this.totalRequests,
        status2xx: this.status2xx,
        status4xx: this.status4xx,
        status5xx: this.status5xx,
        globalP50Ms: this.getPercentile(allDurations, 50),
        globalP95Ms: this.getPercentile(allDurations, 95),
        globalP99Ms: this.getPercentile(allDurations, 99),
        routes,
      },
    };
  }

  static getPrometheusMetrics(): string {
    const json = this.getMetricsJSON();
    return `
# HELP interviewiq_http_requests_total Total number of HTTP requests
# TYPE interviewiq_http_requests_total counter
interviewiq_http_requests_total ${json.http.totalRequests}
interviewiq_http_requests_status{status="2xx"} ${json.http.status2xx}
interviewiq_http_requests_status{status="4xx"} ${json.http.status4xx}
interviewiq_http_requests_status{status="5xx"} ${json.http.status5xx}

# HELP interviewiq_process_resident_memory_bytes Resident memory size in bytes
# TYPE interviewiq_process_resident_memory_bytes gauge
interviewiq_process_resident_memory_bytes ${json.system.memoryUsageMb.rss * 1024 * 1024}

# HELP interviewiq_process_heap_used_bytes Heap memory used in bytes
# TYPE interviewiq_process_heap_used_bytes gauge
interviewiq_process_heap_used_bytes ${json.system.memoryUsageMb.heapUsed * 1024 * 1024}

# HELP interviewiq_uptime_seconds Total uptime in seconds
# TYPE interviewiq_uptime_seconds gauge
interviewiq_uptime_seconds ${json.system.uptimeSeconds}
`.trim();
  }
}
