declare const Netlify: { env: { get: (name: string) => string | undefined } };

const MAX_PROBLEM_LEN = 4000;
const MAX_TRADE_LEN = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function htmlEscape(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char] as string);
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

interface Payload {
  lang?: string;
  problem?: string;
  trade?: string;
  email?: string;
  consentReply?: boolean;
  consentShare?: boolean;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  _gotcha?: string;
}

export default async function prvaPomocSubmit(request: Request) {
  if (request.method !== "POST") {
    return json(405, { ok: false, error: "method_not_allowed" });
  }

  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) {
    return json(403, { ok: false, error: "bad_origin" });
  }

  let payload: Payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "bad_json" });
  }

  // Honeypot: bots that fill this get a normal-looking "success" and nothing happens.
  if (typeof payload._gotcha === "string" && payload._gotcha.trim() !== "") {
    return json(200, { ok: true });
  }

  const lang = payload.lang === "en" ? "en" : "sl";
  const problem = String(payload.problem || "").trim().slice(0, MAX_PROBLEM_LEN);
  const trade = String(payload.trade || "").trim().slice(0, MAX_TRADE_LEN);
  const email = String(payload.email || "").trim();
  const consentReply = payload.consentReply === true;
  const consentShare = payload.consentShare === true;
  const utmSource = String(payload.utm_source || "").trim().slice(0, 120);
  const utmMedium = String(payload.utm_medium || "").trim().slice(0, 120);
  const utmCampaign = String(payload.utm_campaign || "").trim().slice(0, 120);

  if (!problem || !email || !consentReply) {
    return json(400, { ok: false, error: "missing_fields" });
  }
  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: "bad_email" });
  }

  const apiKey = Netlify.env.get("BREVO_API_KEY");
  const listId = Netlify.env.get(lang === "en" ? "BREVO_LIST_ID_EN" : "BREVO_LIST_ID_SL");
  const notifyTo = Netlify.env.get("GRAFEIO_NOTIFY_EMAIL") || "grafeio.creative@gmail.com";
  const senderEmail = Netlify.env.get("BREVO_SENDER_EMAIL") || "grafeio.creative@gmail.com";

  if (!apiKey) {
    return json(503, { ok: false, error: "not_configured" });
  }

  // Primary: a transactional email to GRAFEIO's inbox, Reply-To set to the
  // submitter, so replying is a single click. This is what actually makes
  // "we read it and reply by email" true — must succeed for the request to
  // count as a success.
  const utmLine = [utmSource, utmMedium, utmCampaign].some(Boolean)
    ? `<p><strong>UTM:</strong> ${htmlEscape(utmSource || "–")} / ${htmlEscape(utmMedium || "–")} / ${htmlEscape(utmCampaign || "–")}</p>`
    : "";
  const emailHtml = `
    <p><strong>Jezik strani:</strong> ${lang === "en" ? "EN" : "SL"}</p>
    <p><strong>${lang === "en" ? "What eats the most time" : "Kaj jemlje največ časa"}:</strong><br>${htmlEscape(problem).replace(/\n/g, "<br>")}</p>
    <p><strong>${lang === "en" ? "Trade" : "Dejavnost"}:</strong> ${trade ? htmlEscape(trade) : "–"}</p>
    <p><strong>Email:</strong> ${htmlEscape(email)}</p>
    <p><strong>${lang === "en" ? "OK to share anonymously" : "Sme deliti anonimno"}:</strong> ${consentShare ? (lang === "en" ? "yes" : "da") : (lang === "en" ? "no" : "ne")}</p>
    ${utmLine}
  `.trim();

  let emailOk = false;
  try {
    const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { email: senderEmail, name: "GRAFEIO · Prva pomoč" },
        to: [{ email: notifyTo }],
        replyTo: { email },
        subject: lang === "en" ? "First aid: new submission" : "Prva pomoč: nova prijava",
        htmlContent: emailHtml,
      }),
    });
    emailOk = emailRes.ok;
  } catch {
    emailOk = false;
  }

  if (!emailOk) {
    return json(502, { ok: false, error: "email_failed" });
  }

  // Secondary, best-effort: add/update the contact on the matching list.
  // Never blocks the response — the email above already succeeded.
  if (listId) {
    try {
      await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          email,
          listIds: [Number(listId)],
          updateEnabled: true,
        }),
      });
    } catch {
      // ignored — list add is best-effort
    }
  }

  return json(200, { ok: true });
}

export const config = {
  path: "/api/prva-pomoc",
  rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ["ip", "domain"] },
};
