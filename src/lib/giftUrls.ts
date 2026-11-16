export const MAX_GIFT_URLS = 10;

export function giftUrls(item: { urls?: string[] | null; url?: string | null }) {
  const urls = (item.urls ?? []).map(url => url.trim()).filter(Boolean);
  return urls.length ? urls : item.url?.trim() ? [item.url.trim()] : [];
}

export function giftUrlPayload(rows: string[]) {
  const urls = rows.map(url => url.trim()).filter(Boolean);
  if (urls.length > MAX_GIFT_URLS) throw new Error("Lze přidat nejvýše 10 odkazů.");
  return { urls, url: urls[0] ?? null };
}