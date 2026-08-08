import type { HttpClient, HttpRequestOptions, HttpResponse } from "../types";

export class FetchHttpClient implements HttpClient {
  async request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 10_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: options.method ?? "GET",
        headers: options.headers,
        body: options.body as BodyInit | undefined,
        signal: controller.signal,
      });

      const body = await response.text();
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key.toLowerCase()] = value;
      });

      return {
        status: response.status,
        headers,
        body,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}

/** Test double for unit tests without network access. */
export class MockHttpClient implements HttpClient {
  private readonly handlers = new Map<
    string,
    (url: string, options: HttpRequestOptions) => Promise<HttpResponse> | HttpResponse
  >();

  on(
    matcher: string | RegExp,
    handler: (url: string, options: HttpRequestOptions) => Promise<HttpResponse> | HttpResponse
  ): void {
    this.handlers.set(String(matcher), handler);
  }

  async request(url: string, options: HttpRequestOptions = {}): Promise<HttpResponse> {
    for (const [matcher, handler] of this.handlers.entries()) {
      const regex = matcher.startsWith("/") ? new RegExp(matcher.slice(1, -1)) : null;
      if (url.includes(matcher) || regex?.test(url)) {
        return await handler(url, options);
      }
    }

    return {
      status: 404,
      headers: {},
      body: JSON.stringify({ message: "No mock handler registered" }),
    };
  }
}
