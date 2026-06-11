// Extracts og:image (or twitter:image / first <img>) from a given URL
// Requires authentication; blocks SSRF to private/loopback/link-local hosts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Block private/loopback/link-local/CGNAT/multicast ranges
const isBlockedIPv4 = (ip: string) => {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true; // link-local (incl. cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // multicast/reserved
  return false;
};

const isBlockedHost = (host: string) => {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) return isBlockedIPv4(h);
  if (h.includes(":")) return true; // reject raw IPv6 to be safe
  return false;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Require authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const { url } = await req.json();
    if (!url || typeof url !== "string") return json({ error: "Missing url" }, 400);

    let parsed: URL;
    try { parsed = new URL(url); } catch { return json({ error: "Invalid URL" }, 400); }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return json({ error: "Only http(s) URLs are allowed" }, 400);
    }
    if (isBlockedHost(parsed.hostname)) {
      return json({ error: "URL host is not allowed" }, 400);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GiftBot/1.0; +https://lovable.app) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    // Reject redirects (could point to private hosts)
    if (res.status >= 300 && res.status < 400) {
      return json({ error: "Redirects are not allowed" }, 400);
    }

    const html = (await res.text()).slice(0, 1_000_000);

    const pick = (re: RegExp) => {
      const m = html.match(re);
      return m?.[1]?.trim();
    };

    let img =
      pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i) ||
      pick(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i) ||
      pick(/<img[^>]+src=["']([^"']+)["']/i);

    const title =
      pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
      pick(/<title>([^<]+)<\/title>/i);

    if (img && !/^https?:\/\//i.test(img)) {
      try { img = new URL(img, parsed).toString(); } catch (_) {}
    }
    if (img) {
      try {
        const imgUrl = new URL(img);
        if (
          (imgUrl.protocol !== "http:" && imgUrl.protocol !== "https:") ||
          isBlockedHost(imgUrl.hostname)
        ) img = undefined;
      } catch { img = undefined; }
    }

    return json({ image: img ?? null, title: title ?? null });
  } catch (e) {
    return json({ error: "Request failed" }, 500);
  }
});
