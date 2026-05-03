// Vercel Serverless Function that delegates to the TanStack Start SSR build.
// The Vite build emits a Web-Fetch-style handler at `dist/server/index.js`
// (default export shape: `{ fetch(request: Request): Promise<Response> }`).
// This file adapts Node's IncomingMessage/ServerResponse to that handler.
import handler from "../dist/server/index.js";

export const config = {
  // Use the Node.js runtime — the SSR bundle relies on `node:*` built-ins.
  runtime: "nodejs20.x",
  // Make sure the chunked SSR bundle (and its dynamic imports) is shipped
  // alongside the function.
  includeFiles: "dist/server/**",
};

export default async function vercelHandler(req, res) {
  try {
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

    const response = await handler.fetch(request);

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
