// Extracts og:image (or twitter:image / first <img>) from a given URL
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "Missing url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; GiftBot/1.0; +https://lovable.app) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    const html = await res.text();

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
      try {
        img = new URL(img, url).toString();
      } catch (_) {}
    }

    return new Response(JSON.stringify({ image: img ?? null, title: title ?? null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
