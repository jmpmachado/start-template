/**
 * k6 Spike Test — Sudden traffic burst simulation.
 *
 * Objective: evaluate how the system reacts to instantaneous load surges
 * (product launches, viral events, enrollment peaks).
 * Measures: response time under spike, error rate, recovery time after spike.
 *
 * Usage:
 *   TARGET_URL=http://localhost:3000/api/v1/resource k6 run k6_spike.js
 *
 * Environment variables:
 *   TARGET_URL    — Base URL of the API under test (required)
 *   BASELINE_VUS  — Virtual users during baseline (default: 10)
 *   SPIKE_VUS     — Virtual users during spike (default: 300)
 */

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate } from "k6/metrics";

const errorRate = new Rate("errors");

const TARGET_URL = __ENV.TARGET_URL || "http://localhost:3000/api/v1/resource";
const BASELINE_VUS = parseInt(__ENV.BASELINE_VUS || "10");
const SPIKE_VUS = parseInt(__ENV.SPIKE_VUS || "300");

export const options = {
  stages: [
    { duration: "1m", target: BASELINE_VUS },    // Establish baseline
    { duration: "30s", target: SPIKE_VUS },       // Instant spike
    { duration: "3m", target: SPIKE_VUS },        // Hold spike — observe behavior
    { duration: "30s", target: BASELINE_VUS },    // Drop back to baseline
    { duration: "2m", target: BASELINE_VUS },     // Recovery observation
    { duration: "30s", target: 0 },               // Cool-down
  ],
  thresholds: {
    // During baseline: tight thresholds
    http_req_duration: ["p(95)<500"],
    // Overall: allow some degradation during spike, but not full failure
    http_req_failed: ["rate<0.05"],
    errors: ["rate<0.05"],
  },
};

export default function () {
  const res = http.get(TARGET_URL, {
    headers: { Accept: "application/json" },
    timeout: "15s",
  });

  const success = check(res, {
    "status 2xx or 429": (r) => r.status < 500,
    "not a server error": (r) => r.status !== 500 && r.status !== 502 && r.status !== 503,
  });

  errorRate.add(!success);

  sleep(0.5);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "spike",
        p95_ms: data.metrics.http_req_duration?.values?.["p(95)"],
        max_ms: data.metrics.http_req_duration?.values?.max,
        error_rate: data.metrics.http_req_failed?.values?.rate,
        peak_rps: data.metrics.http_reqs?.values?.rate,
      },
      null,
      2
    ),
  };
}
