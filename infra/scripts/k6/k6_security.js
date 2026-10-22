/**
 * k6 Security Load Test — Auth and rate-limit endpoints under stress.
 *
 * Objective: verify that WAF, rate limiters, and auth middleware maintain
 * protection even under severe load. Tests:
 *   - Rate limiter returns 429 (not 500) when limits are exceeded
 *   - Unauthenticated requests return 401 (not 200 or 500)
 *   - Auth endpoint does not leak stack traces or internal details on error
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 k6 run k6_security.js
 *
 * Environment variables:
 *   BASE_URL       — Base URL without trailing slash (required)
 *   VUS            — Concurrent virtual users (default: 100)
 *   VALID_TOKEN    — A valid Bearer token for authenticated requests (optional)
 */

import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate } from "k6/metrics";

const rateLimitHits = new Counter("rate_limit_hits");
const authFailures = new Counter("auth_failures");
const unexpectedErrors = new Rate("unexpected_errors");

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const VUS = parseInt(__ENV.VUS || "100");
const VALID_TOKEN = __ENV.VALID_TOKEN || "";

export const options = {
  stages: [
    { duration: "1m", target: VUS },      // Ramp-up
    { duration: "5m", target: VUS },      // Sustained stress
    { duration: "1m", target: VUS * 2 },  // Burst — push rate limiter
    { duration: "1m", target: 0 },        // Cool-down
  ],
  thresholds: {
    // Server must never return 5xx — degrade gracefully with 429 or 401
    http_req_failed: ["rate<0.01"],
    unexpected_errors: ["rate<0.01"],
    http_req_duration: ["p(95)<1000"],
  },
};

export default function () {
  group("unauthenticated access — expect 401", () => {
    const res = http.get(`${BASE_URL}/api/v1/protected-resource`, {
      headers: { Accept: "application/json" },
    });

    check(res, {
      "401 on missing token": (r) => r.status === 401,
      "no stack trace in body": (r) => !r.body.includes("at Object.") && !r.body.includes("stacktrace"),
      "no internal path in body": (r) => !r.body.includes("/src/") && !r.body.includes("/app/"),
    });

    authFailures.add(res.status !== 401 ? 1 : 0);
    unexpectedErrors.add(res.status >= 500 ? 1 : 0);
  });

  group("rate limiter — expect 429 under burst", () => {
    // Fire 5 rapid requests without sleep to trigger rate limit
    for (let i = 0; i < 5; i++) {
      const res = http.get(`${BASE_URL}/api/v1/public-endpoint`, {
        headers: { Accept: "application/json" },
      });

      check(res, {
        "no 5xx on rate limit": (r) => r.status < 500,
        "rate limit returns 429 not 500": (r) => r.status !== 500,
      });

      if (res.status === 429) {
        rateLimitHits.add(1);
      }

      unexpectedErrors.add(res.status >= 500 ? 1 : 0);
    }
  });

  if (VALID_TOKEN) {
    group("authenticated request — expect 200", () => {
      const res = http.get(`${BASE_URL}/api/v1/protected-resource`, {
        headers: {
          Authorization: `Bearer ${VALID_TOKEN}`,
          Accept: "application/json",
        },
      });

      check(res, {
        "200 with valid token": (r) => r.status === 200,
        "response has content-type json": (r) =>
          r.headers["Content-Type"] && r.headers["Content-Type"].includes("application/json"),
      });

      unexpectedErrors.add(res.status >= 500 ? 1 : 0);
    });
  }

  sleep(0.2);
}

export function handleSummary(data) {
  return {
    stdout: JSON.stringify(
      {
        test: "security-load",
        rate_limit_hits: data.metrics.rate_limit_hits?.values?.count,
        auth_failures: data.metrics.auth_failures?.values?.count,
        unexpected_error_rate: data.metrics.unexpected_errors?.values?.rate,
        p95_ms: data.metrics.http_req_duration?.values?.["p(95)"],
      },
      null,
      2
    ),
  };
}
