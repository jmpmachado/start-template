/**
 * k6 Endurance Test — Steady load over a long duration.
 *
 * Objective: detect memory leaks, throughput degradation, and cumulative latency
 * under continuous workload (hours or days in staging).
 *
 * Usage:
 *   TARGET_URL=http://localhost:3000/api/v1/health k6 run k6_endurance.js
 *
 * Environment variables:
 *   TARGET_URL    — Base URL of the API under test (required)
 *   VUS           — Number of virtual users (default: 50)
 *   DURATION      — Steady-state duration (default: 30m; use 2h+ for real endurance)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const errorRate = new Rate("errors");
const latencyTrend = new Trend("custom_latency");

const TARGET_URL = __ENV.TARGET_URL || "http://localhost:3000/api/v1/health";
const VUS = parseInt(__ENV.VUS || "50");
const DURATION = __ENV.DURATION || "30m";

export const options = {
  stages: [
    { duration: "3m", target: VUS },       // Ramp-up
    { duration: DURATION, target: VUS },   // Steady state — observe for degradation
    { duration: "2m", target: 0 },         // Cool-down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500", "p(99)<1000"],
    http_req_failed: ["rate<0.01"],
    errors: ["rate<0.01"],
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    headers: { Accept: "application/json" },
    timeout: "10s",
  });

  const success = check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 500ms": (r) => r.timings.duration < 500,
    "response has body": (r) => r.body && r.body.length > 0,
  });

  errorRate.add(!success);
  latencyTrend.add(res.timings.duration);

  sleep(1 + Math.random());   // 1–2s think time — simulate real user pacing
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "endurance",
        p95_ms: data.metrics.http_req_duration?.values?.["p(95)"],
        p99_ms: data.metrics.http_req_duration?.values?.["p(99)"],
        error_rate: data.metrics.http_req_failed?.values?.rate,
        iterations: data.metrics.iterations?.values?.count,
      },
      null,
      2
    ),
  };
}
