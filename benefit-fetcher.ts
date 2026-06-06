// Supabase Edge Function: benefit-fetcher
// Deploy with JWT verification disabled and protect it with BENEFIT_FETCH_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SOURCES = [
  {
    name: "Binance",
    url: "https://www.binance.com/en/support/announcement/list/93",
    base: "https://www.binance.com",
  },
  {
    name: "Bybit",
    url: "https://www.bybit.com/en/promo/global",
    base: "https://www.bybit.com",
  },
  {
    name: "OKX",
    url: "https://www.okx.com/help/section/announcements-latest-announcements",
    base: "https://www.okx.com",
  },
  {
    name: "Coinbase",
    url: "https://www.coinbase.com/blog/landing/product",
    base: "https://www.coinbase.com",
  },
  {
    name: "Kraken",
    url: "https://blog.kraken.com/product",
    base: "https://blog.kraken.com",
  },
  {
    name: "Kraken",
    url: "https://blog.kraken.com/feed",
    base: "https://blog.kraken.com",
  },
  {
    name: "Coinbase",
    url: "https://www.coinbase.com/blog/rss.xml",
    base: "https://www.coinbase.com",
  },
  {
    name: "Uniswap",
    url: "https://blog.uniswap.org/rss.xml",
    base: "https://blog.uniswap.org",
  },
  {
    name: "MetaMask",
    url: "https://metamask.io/news/latest/",
    base: "https://metamask.io",
  },
];

const BENEFIT_WORDS = [
  "reward",
  "rewards",
  "bonus",
  "campaign",
  "promotion",
  "promo",
  "airdrop",
  "earn",
  "staking",
  "launchpool",
  "launchpad",
  "fee",
  "discount",
  "voucher",
  "giveaway",
  "competition",
  "referral",
  "new user",
  "learn and earn",
  "福利",
  "獎勵",
  "活動",
  "空投",
  "手續費",
  "折扣",
];

const BLOCKED_WORDS = [
  "privacy",
  "terms",
  "cookie",
  "careers",
  "legal",
  "support",
  "login",
  "sign in",
  "status",
];

const headers = {
  "user-agent": "Mozilla/5.0 (compatible; OptionalityBenefitRadar/1.0; +https://btc2049.github.io/optionality-network/)",
  "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
};

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ error: "POST only" }, 405);
  }

  const fetchSecret = Deno.env.get("BENEFIT_FETCH_SECRET");
  if (!fetchSecret || request.headers.get("x-benefit-secret") !== fetchSecret) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment variables" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  await supabase.rpc("expire_old_benefits");

  const candidates = [];
  for (const source of SOURCES) {
    try {
      const html = await fetchText(source.url);
      candidates.push(...extractCandidates(html, source), ...extractRssCandidates(html, source));
    } catch (error) {
      console.error(`Source failed: ${source.name}`, error);
    }
  }

  const uniqueCandidates = dedupe(candidates).slice(0, 60);
  if (!uniqueCandidates.length) {
    return json({ inserted: 0, message: "Sources returned no qualified benefits" });
  }
  const { data: existingRows } = await supabase
    .from("benefit_catalog")
    .select("source_url")
    .in("source_url", uniqueCandidates.map((item) => item.url));
  const existing = new Set((existingRows || []).map((item) => item.source_url));

  const rows = [];
  for (const candidate of uniqueCandidates) {
    if (existing.has(candidate.url) || rows.length >= 20) continue;
    try {
      rows.push(await enrichCandidate(candidate));
    } catch (error) {
      console.error(`Detail failed: ${candidate.url}`, error);
      rows.push(toCatalogRow(candidate));
    }
  }

  if (!rows.length) {
    return json({ inserted: 0, message: "No new qualified benefits found" });
  }

  const { data, error } = await supabase
    .from("benefit_catalog")
    .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true })
    .select("id, title, source_name");

  if (error) return json({ error: error.message }, 500);
  return json({ inserted: data?.length || 0, benefits: data || [] });
});

async function fetchText(url) {
  const response = await fetch(url, {
    headers,
    redirect: "follow",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return await response.text();
}

function extractCandidates(html, source) {
  const results = [];
  const anchorPattern = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    const href = match[1].trim();
    const title = cleanText(match[2]);
    if (title.length < 8 || title.length > 180) continue;

    const searchable = `${title} ${href}`.toLowerCase();
    const keywordHits = BENEFIT_WORDS.filter((word) => searchable.includes(word)).length;
    if (keywordHits < 1 || BLOCKED_WORDS.some((word) => searchable.includes(word))) continue;

    let url;
    try {
      url = new URL(href, source.base).href;
    } catch {
      continue;
    }
    if (!url.startsWith(source.base)) continue;
    results.push({ source: source.name, url, title, keywordHits });
  }
  return results.sort((a, b) => b.keywordHits - a.keywordHits);
}

function extractRssCandidates(xml, source) {
  const results = [];
  const itemPattern = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  for (const itemMatch of xml.matchAll(itemPattern)) {
    const item = itemMatch[1];
    const title = cleanText(tagValue(item, "title"));
    const rawLink =
      tagValue(item, "link") ||
      item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ||
      "";
    if (!title || !rawLink) continue;

    const searchable = `${title} ${item}`.toLowerCase();
    const keywordHits = BENEFIT_WORDS.filter((word) => searchable.includes(word)).length;
    if (keywordHits < 1 || BLOCKED_WORDS.some((word) => searchable.includes(word))) continue;

    let url;
    try {
      url = new URL(decodeHtml(rawLink.trim()), source.base).href;
    } catch {
      continue;
    }
    results.push({ source: source.name, url, title, keywordHits });
  }
  return results.sort((a, b) => b.keywordHits - a.keywordHits);
}

async function enrichCandidate(candidate) {
  const html = await fetchText(candidate.url);
  const title = meta(html, "og:title") || documentTitle(html) || candidate.title;
  const description =
    meta(html, "og:description") ||
    meta(html, "description", "name") ||
    `${candidate.source} 最新公開福利或活動，請在官方頁面確認資格、期限與地區限制。`;
  const imageUrl = meta(html, "og:image") || null;
  const publishedAt =
    meta(html, "article:published_time") ||
    meta(html, "datePublished", "itemprop") ||
    new Date().toISOString();
  const expiresAt =
    meta(html, "event:end_time") ||
    meta(html, "endDate", "itemprop") ||
    extractDeadline(`${title} ${description} ${cleanText(html).slice(0, 12000)}`, publishedAt);

  return toCatalogRow({
    ...candidate,
    title: cleanText(title).slice(0, 180),
    description: cleanText(description).slice(0, 500),
    imageUrl,
    publishedAt,
    expiresAt,
  });
}

function toCatalogRow(candidate) {
  const category = classify(candidate.title, candidate.description || "");
  return {
    source_name: candidate.source,
    source_url: candidate.url,
    title: candidate.title,
    summary:
      candidate.description ||
      `${candidate.source} 最新公開福利或活動，請在官方頁面確認資格、期限與地區限制。`,
    category,
    audience: audienceFor(category),
    value_text: valueFor(category),
    image_url: candidate.imageUrl || null,
    published_at: safeDate(candidate.publishedAt),
    expires_at: safeOptionalDate(candidate.expiresAt) || new Date(Date.now() + 30 * 86400000).toISOString(),
    status: "active",
    is_automated: true,
    fetched_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function classify(...parts) {
  const text = parts.join(" ").toLowerCase();
  if (/airdrop|空投|launchpool|launchpad/.test(text)) return "空投任務";
  if (/fee|手續費|discount|折扣/.test(text)) return "最低手續費";
  if (/tool|wallet|api|bot|軟體|工具/.test(text)) return "工具折扣";
  if (/staking|earn|yield|理財|質押/.test(text)) return "理財收益";
  return "新戶福利";
}

function audienceFor(category) {
  if (category === "空投任務") return "空投參與者";
  if (category === "最低手續費") return "交易用戶";
  if (category === "工具折扣") return "Web3 工具用戶";
  if (category === "理財收益") return "理財用戶";
  return "新手入門";
}

function valueFor(category) {
  if (category === "最低手續費") return "比較交易成本與活動條件";
  if (category === "空投任務") return "查看資格、任務與活動期限";
  if (category === "工具折扣") return "查看功能、試用或優惠條件";
  if (category === "理財收益") return "查看收益方式與風險說明";
  return "查看獎勵與參加條件";
}

function extractDeadline(text, publishedAt) {
  const normalized = text
    .replace(/[年月]/g, "/")
    .replace(/日/g, " ")
    .replace(/\s+/g, " ");
  const year = new Date(publishedAt || Date.now()).getUTCFullYear();
  const patterns = [
    /(?:deadline|ends?|ending|until|valid until|expires?|截止|結束|活動期間(?:至|到)?)[^0-9]{0,24}(20\d{2})[\/.-](\d{1,2})[\/.-](\d{1,2})/gi,
    /(?:deadline|ends?|ending|until|valid until|expires?|截止|結束|活動期間(?:至|到)?)[^0-9]{0,24}(\d{1,2})[\/.-](\d{1,2})(?:[\/.-](20\d{2}))?/gi,
    /(?:deadline|ends?|ending|until|valid until|expires?)[^A-Za-z0-9]{0,24}(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2})(?:,\s*(20\d{2}))?/gi,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(normalized);
    if (!match) continue;
    let deadline;
    if (/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i.test(match[1])) {
      deadline = new Date(`${match[1]} ${match[2]}, ${match[3] || year} 23:59:59 GMT+0800`);
    } else if (match[1]?.length === 4) {
      deadline = new Date(`${match[1]}-${pad(match[2])}-${pad(match[3])}T23:59:59+08:00`);
    } else {
      deadline = new Date(`${match[3] || year}-${pad(match[1])}-${pad(match[2])}T23:59:59+08:00`);
    }
    if (!Number.isNaN(deadline.getTime()) && deadline.getTime() > Date.now() - 86400000) {
      return deadline.toISOString();
    }
  }
  return null;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function meta(html, key, attribute = "property") {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${attribute}=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attribute}=["']${escaped}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }
  return "";
}

function documentTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? cleanText(match[1]) : "";
}

function tagValue(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].replace(/^<!\[CDATA\[|\]\]>$/g, "") : "";
}

function cleanText(value) {
  return decodeHtml(value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function decodeHtml(value) {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const normalized = item.url.replace(/[?#].*$/, "").replace(/\/$/, "");
    if (seen.has(normalized)) return false;
    seen.add(normalized);
    item.url = normalized;
    return true;
  });
}

function safeDate(value) {
  const date = value ? new Date(value) : new Date();
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function safeOptionalDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
