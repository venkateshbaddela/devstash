import { describe, it, expect } from "vitest";
import { getClientIp, rateLimitResponse, type RateLimitResult } from "@/lib/rate-limit";

describe("Rate Limit Utility", () => {
  describe("getClientIp", () => {
    it("extracts IP from cf-connecting-ip header", async () => {
      const headers = new Headers({
        "cf-connecting-ip": "203.0.113.195",
        "x-real-ip": "198.51.100.1",
        "x-forwarded-for": "192.0.2.1, 10.0.0.1",
      });

      const ip = await getClientIp(headers);
      expect(ip).toBe("203.0.113.195");
    });

    it("extracts IP from x-real-ip when cf-connecting-ip is missing", async () => {
      const headers = new Headers({
        "x-real-ip": "198.51.100.1",
        "x-forwarded-for": "192.0.2.1, 10.0.0.1",
      });

      const ip = await getClientIp(headers);
      expect(ip).toBe("198.51.100.1");
    });

    it("extracts first IP from x-forwarded-for when other headers missing", async () => {
      const headers = new Headers({
        "x-forwarded-for": "  192.0.2.55 , 10.0.0.1, 172.16.0.1",
      });

      const ip = await getClientIp(headers);
      expect(ip).toBe("192.0.2.55");
    });

    it("works when passed a Request object", async () => {
      const request = new Request("https://devstash.io/api/test", {
        headers: {
          "x-real-ip": "198.51.100.99",
        },
      });

      const ip = await getClientIp(request);
      expect(ip).toBe("198.51.100.99");
    });

    it("falls back to 127.0.0.1 when headers are empty or missing", async () => {
      const headers = new Headers({});
      const ip = await getClientIp(headers);
      expect(ip).toBe("127.0.0.1");
    });
  });

  describe("rateLimitResponse", () => {
    it("creates a NextResponse with status 429 and rate limit headers", async () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 5,
        remaining: 0,
        reset: 1700000000000,
        retryAfterSeconds: 300,
        errorMessage: "Too many attempts. Please try again in 5 minutes.",
      };

      const response = rateLimitResponse(mockResult);

      expect(response.status).toBe(429);
      expect(response.headers.get("Retry-After")).toBe("300");
      expect(response.headers.get("X-RateLimit-Limit")).toBe("5");
      expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
      expect(response.headers.get("X-RateLimit-Reset")).toBe("1700000000000");

      const body = await response.json();
      expect(body).toEqual({
        error: "Too many attempts. Please try again in 5 minutes.",
      });
    });

    it("accepts a custom error message", async () => {
      const mockResult: RateLimitResult = {
        success: false,
        limit: 3,
        remaining: 0,
        reset: 1700000000000,
        retryAfterSeconds: 60,
      };

      const response = rateLimitResponse(mockResult, "Custom cooldown message");
      const body = await response.json();
      expect(body.error).toBe("Custom cooldown message");
    });
  });
});
