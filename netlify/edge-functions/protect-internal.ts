declare const Netlify: { env: { get: (name: string) => string | undefined } };

const COOKIE_NAME = "grafeio_internal_session";
const SESSION_SECONDS = 8 * 60 * 60;
const encoder = new TextEncoder();

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] as string);
}

function readCookie(request: Request, name: string): string | null {
  const prefix = `${name}=`;
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const item = part.trim();
    if (item.startsWith(prefix)) return item.slice(prefix.length);
  }
  return null;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  return toBase64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function safeEqual(left: string, right: string): Promise<boolean> {
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const av = new Uint8Array(a);
  const bv = new Uint8Array(b);
  let difference = av.length ^ bv.length;
  for (let i = 0; i < av.length; i++) difference |= av[i] ^ bv[i];
  return difference === 0;
}

function normalizePassword(value: string): string {
  return value.normalize("NFC").trim();
}

async function createSession(secret: string): Promise<string> {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  return `${expires}.${await hmac(String(expires), secret)}`;
}

async function validSession(token: string | null, secret: string): Promise<boolean> {
  if (!token) return false;
  const [expiresText, signature, extra] = token.split(".");
  if (!expiresText || !signature || extra) return false;
  const expires = Number(expiresText);
  if (!Number.isInteger(expires) || expires <= Date.now() / 1000) return false;
  return safeEqual(signature, await hmac(expiresText, secret));
}

function cookie(value: string, maxAge: number): string {
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function loginPage(pathname: string, failed = false): Response {
  const action = htmlEscape(pathname);
  return new Response(`<!doctype html>
<html lang="sl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Prijava · GRAFEIO</title>
<style>*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#111;color:#f5f5f3;font-family:Arial,sans-serif}.box{width:min(90vw,360px);padding:36px;border:1px solid #333;background:#181818}.brand{letter-spacing:.32em;margin-bottom:28px}.brand b{font-family:Georgia,serif;font-size:34px;font-weight:400;letter-spacing:0}.dots{color:#c4521a}label{display:block;font-size:12px;letter-spacing:.12em;text-transform:uppercase;margin-bottom:9px;color:#bbb}input,button{width:100%;padding:13px 14px;font:inherit}input{border:1px solid #555;background:#111;color:#fff;border-radius:0}input:focus{outline:2px solid #c4521a;outline-offset:2px}button{margin-top:14px;border:0;background:#c4521a;color:#fff;cursor:pointer}.error{min-height:20px;margin:0 0 14px;color:#ff9b6a;font-size:13px}</style></head>
<body><main class="box"><div class="brand"><b>g</b> RAFEIO <span class="dots">▪▪▪</span></div>
<p class="error" role="alert">${failed ? "Geslo ni pravilno." : ""}</p>
<form method="post" action="${action}"><label for="password">Geslo</label><input id="password" name="password" type="password" required autocomplete="current-password" autofocus><button type="submit">Vstopi</button></form>
</main></body></html>`, { status: failed ? 401 : 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex, nofollow" } });
}

export default async function protectInternal(request: Request, context: { next: () => Promise<Response> }) {
  const password = Netlify.env.get("GRAFEIO_ACCESS_PASSWORD");
  const sessionSecret = Netlify.env.get("GRAFEIO_SESSION_SECRET");
  if (!password || !sessionSecret || sessionSecret.length < 32) {
    return new Response("Zaščitena stran trenutno ni na voljo.", { status: 503, headers: { "cache-control": "no-store" } });
  }

  const url = new URL(request.url);
  if (url.searchParams.get("logout") === "1") {
    return new Response(null, { status: 303, headers: { location: url.pathname, "set-cookie": cookie("", 0), "cache-control": "no-store" } });
  }

  if (await validSession(readCookie(request, COOKIE_NAME), sessionSecret)) {
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set("cache-control", "private, no-store");
    headers.set("x-robots-tag", "noindex, nofollow");
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  if (request.method === "POST") {
    const origin = request.headers.get("origin");
    if (origin && origin !== url.origin) return new Response("Nedovoljena zahteva.", { status: 403 });
    const form = await request.formData();
    const submitted = normalizePassword(String(form.get("password") || ""));
    if (await safeEqual(submitted, normalizePassword(password))) {
      const token = await createSession(sessionSecret);
      return new Response(null, { status: 303, headers: { location: url.pathname, "set-cookie": cookie(token, SESSION_SECONDS), "cache-control": "no-store" } });
    }
    return loginPage(url.pathname, true);
  }

  return loginPage(url.pathname);
}

export const config = {
  path: ["/mojca", "/mojca.html", "/grafeio-cenik", "/grafeio-cenik/*"],
  rateLimit: { windowLimit: 30, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
