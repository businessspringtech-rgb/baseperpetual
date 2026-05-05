// Vercel Serverless Function that delegates to the TanStack Start SSR build.
// Import the built server entry lazily so any module-init failures are caught
// by our request-level error handler instead of crashing the function before
// logs are emitted.

async function loadFetchHandler() {
  const mod = await import("../dist/server/server.js");
  const candidate = mod?.default ?? mod;

  if (typeof candidate === "function") {
    return candidate;
  }

  if (typeof candidate?.fetch === "function") {
    return candidate.fetch.bind(candidate);
  }

  if (typeof mod?.fetch === "function") {
    return mod.fetch.bind(mod);
  }

  throw new TypeError("Unsupported TanStack Start server export shape");
}

export default async function vercelHandler(req, res) {
  try {
    const fetchHandler = await loadFetchHandler();
    const protocol =
      (req.headers["x-forwarded-proto"] || "https").toString().split(",")[0];
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    const url = `${protocol}://${host}${req.url}`;

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else {
        headers.set(key, String(value));
      }
    }

    const method = req.method || "GET";
    const hasBody = method !== "GET" && method !== "HEAD";

    const request = new Request(url, {
      method,
      headers,
      body: hasBody ? req : undefined,
      // Required by Node when streaming a request body.
      duplex: hasBody ? "half" : undefined,
    });

    const response = await fetchHandler(request, undefined, {
      waitUntil() {},
      passThroughOnException() {},
    });

    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (!response.body) {
      res.end();
      return;
    }

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (error) {
    console.error("[vercel ssr] handler error", error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader("content-type", "text/plain; charset=utf-8");
    }
    res.end("Internal Server Error");
  }
}
