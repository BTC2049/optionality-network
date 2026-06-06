// Supabase Edge Function: benefit-fetcher
// Deploy with JWT verification disabled and protect it with BENEFIT_FETCH_SECRET.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DIRECT_SOURCES = [
  { name: "Binance", url: "https://www.binance.com/zh-TC/support/announcement/list/93", base: "https://www.binance.com", group: "exchange", locale: "zh-TW" },
  { name: "Bybit", url: "https://www.bybit.com/zh-TW/promo/global", base: "https://www.bybit.com", group: "exchange", locale: "zh-TW" },
  { name: "OKX", url: "https://www.okx.com/zh-hant/help/section/announcements-latest-announcements", base: "https://www.okx.com", group: "exchange", locale: "zh-TW" },
  { name: "Bitget", url: "https://www.bitget.com/zh-TW/support", base: "https://www.bitget.com", group: "exchange", locale: "zh-TW" },
  { name: "Gate", url: "https://www.gate.com/zh-tw/announcements", base: "https://www.gate.com", group: "exchange", locale: "zh-TW" },
  { name: "MEXC", url: "https://www.mexc.com/zh-TW/support", base: "https://www.mexc.com", group: "exchange", locale: "zh-TW" },
  { name: "BingX", url: "https://bingx.com/zh-tw/support/notice/", base: "https://bingx.com", group: "exchange", locale: "zh-TW" },
  { name: "Galxe", url: "https://app.galxe.com/quest", base: "https://app.galxe.com", group: "quest", locale: "en" },
  { name: "Layer3", url: "https://layer3.xyz/quests", base: "https://layer3.xyz", group: "quest", locale: "en" },
  { name: "Zealy", url: "https://zealy.io/explore", base: "https://zealy.io", group: "quest", locale: "en" },
  { name: "Intract", url: "https://www.intract.io/quest", base: "https://www.intract.io", group: "quest", locale: "en" },
  { name: "TaskOn", url: "https://taskon.xyz/campaign", base: "https://taskon.xyz", group: "quest", locale: "en" },
  { name: "CoinMarketCap", url: "https://coinmarketcap.com/airdrop/", base: "https://coinmarketcap.com", group: "airdrop", locale: "en" },
  { name: "DappRadar", url: "https://dappradar.com/hub/airdrops", base: "https://dappradar.com", group: "airdrop", locale: "en" },
  { name: "Airdrops.io", url: "https://airdrops.io/latest/", base: "https://airdrops.io", group: "airdrop", locale: "en" },
];

const BLOCKED_HOSTS = [
  "t.me",
  "telegram.me",
  "discord.gg",
  "bit.ly",
  "tinyurl.com",
  "linktr.ee",
  "forms.gle",
  "docs.google.com",
  "udn.com",
  "cnyes.com",
  "chinatimes.com",
  "ettoday.net",
  "setn.com",
  "ltn.com.tw",
  "moneydj.com",
  "businessweekly.com.tw",
  "technews.tw",
  "inside.com.tw",
];

const SOURCES_PER_GROUP = 4;

const MAX_DAILY_ROWS = 20;
const MAX_PER_SOURCE = 3;
const MAX_PER_CATEGORY = 6;

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

const CRYPTO_WORDS = [
  "cryptocurrency",
  "crypto",
  "blockchain",
  "web3",
  "bitcoin",
  "ethereum",
  "stablecoin",
  "defi",
  "gamefi",
  "nft",
  "token",
  "usdt",
  "usdc",
  "區塊鏈",
  "加密貨幣",
  "虛擬貨幣",
  "數位資產",
  "比特幣",
  "以太坊",
  "穩定幣",
  "代幣",
  "空投",
  "鏈上",
  "交易所",
  "加密錢包",
  "質押",
];

const CRYPTO_BRANDS = [
  "binance",
  "bybit",
  "okx",
  "bitget",
  "gate.io",
  "mexc",
  "bingx",
  "coinbase",
  "kraken",
  "kucoin",
  "crypto.com",
  "bitunix",
  "backpack",
  "metamask",
  "trust wallet",
  "uniswap",
  "pancakeswap",
  "opensea",
  "blur",
  "magic eden",
  "幣安",
  "歐易",
  "幣託",
  "現代財富",
];

const BLOCKED_WORDS = [
  "privacy",
  "terms",
  "cookie",
  "careers",
  "legal",
  "login",
  "sign in",
  "status",
  "總統府",
  "觀光署",
  "觀光資訊網",
  "資料加密",
  "加密機制",
  "加密技術",
  "encryption",
  "encrypted",
];

const INFORMATIONAL_PATTERNS = [
  /什麼是/,
  /有哪些/,
  /推薦/,
  /完整比較/,
  /完整分析/,
  /優缺點/,
  /懶人包/,
  /教學/,
  /指南/,
  /攻略/,
  /研究室/,
  /評測/,
  /\d+\s*分鐘.*了解/,
  /\bwhat is\b/i,
  /\bguide\b/i,
  /\breview\b/i,
  /\bcomparison\b/i,
  /\bexplained\b/i,
  /\bhow to\b/i,
];

const ACTIONABLE_BENEFIT_PATTERNS = [
  /空投/,
  /註冊獎勵/,
  /新戶獎勵/,
  /迎新獎勵/,
  /入金獎勵/,
  /交易獎勵/,
  /任務獎勵/,
  /限時活動/,
  /交易競賽/,
  /獎池/,
  /瓜分/,
  /優惠碼/,
  /折扣碼/,
  /手續費(?:減免|折扣|優惠|回饋|返還|零)/,
  /零手續費/,
  /免費試用/,
  /體驗券/,
  /贈獎/,
  /抽獎/,
  /\bairdrop\b/i,
  /\bsign[- ]?up bonus\b/i,
  /\bwelcome bonus\b/i,
  /\bdeposit bonus\b/i,
  /\btrading rewards?\b/i,
  /\breward pool\b/i,
  /\bgiveaway\b/i,
  /\bpromo code\b/i,
  /\bfee (?:discount|rebate)\b/i,
  /\bzero fees?\b/i,
  /\bfree trial\b/i,
  /\bvoucher\b/i,
  /\blaunchpool\b/i,
  /\blaunchpad\b/i,
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

  return json({
    inserted: 0,
    paused: true,
    message: "自動福利抓取目前已暫停，不會新增任何資料。",
  });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment variables" }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  await supabase.rpc("expire_old_benefits");
  await supabase.rpc("rebalance_benefit_catalog");
  const { data: configuredSources } = await supabase
    .from("benefit_sources")
    .select("name, url, base_url, source_group, locale")
    .eq("is_active", true);
  const sourcePool = configuredSources?.length
    ? configuredSources.map((source) => ({
        name: source.name,
        url: source.url,
        base: source.base_url,
        group: source.source_group,
        locale: source.locale || "zh-TW",
      }))
    : DIRECT_SOURCES;

  const candidates = [];
  const diagnostics = {
    feedsChecked: 0,
    feedsFailed: 0,
    rawResultsFound: 0,
    malformedResults: 0,
    staleRejected: 0,
    relevanceRejected: 0,
    unsafeUrlRejected: 0,
    unsafeUrlSamples: [],
    candidatesFound: 0,
    duplicateOrExisting: 0,
    detailRejected: 0,
    detailFailed: 0,
  };
  for (const source of buildDirectSourceRotation(sourcePool)) {
    diagnostics.feedsChecked += 1;
    try {
      const html = await fetchText(source.url);
      const discovered = [
        ...extractDirectCandidates(html, source, diagnostics),
        ...extractRssCandidates(html, source, diagnostics),
      ];
      candidates.push(...discovered);
    } catch (error) {
      diagnostics.feedsFailed += 1;
      console.error(`Direct source failed: ${source.name}`, error);
    }
  }

  const uniqueCandidates = diversifyCandidates(dedupe(candidates)).slice(0, 80);
  diagnostics.candidatesFound = uniqueCandidates.length;
  if (!uniqueCandidates.length) {
    return json({
      inserted: 0,
      message: "本次直接來源沒有產生可檢查的候選活動，請查看診斷資料。",
      diagnostics,
    });
  }
  const { data: existingRows } = await supabase
    .from("benefit_catalog")
    .select("source_url, status")
    .eq("status", "active")
    .in("source_url", uniqueCandidates.map((item) => item.url));
  const existing = new Set((existingRows || []).map((item) => item.source_url));

  const rows = [];
  const sourceCounts = new Map();
  const categoryCounts = new Map();
  for (const candidate of uniqueCandidates) {
    if (existing.has(candidate.url)) {
      diagnostics.duplicateOrExisting += 1;
      continue;
    }
    if (rows.length >= MAX_DAILY_ROWS) continue;
    if ((sourceCounts.get(candidate.source) || 0) >= MAX_PER_SOURCE) continue;
    try {
      const row = await enrichCandidate(candidate, diagnostics);
      if (!row) {
        diagnostics.detailRejected += 1;
        continue;
      }
      if ((categoryCounts.get(row.category) || 0) >= MAX_PER_CATEGORY) continue;
      rows.push(row);
      sourceCounts.set(candidate.source, (sourceCounts.get(candidate.source) || 0) + 1);
      categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
    } catch (error) {
      diagnostics.detailFailed += 1;
      console.error(`Detail failed: ${candidate.url}`, error);
      if (cryptoBenefitRelevance(`${candidate.title} ${candidate.description || ""}`).qualified) {
        const row = toCatalogRow(candidate);
        if ((categoryCounts.get(row.category) || 0) < MAX_PER_CATEGORY) {
          rows.push(row);
          sourceCounts.set(candidate.source, (sourceCounts.get(candidate.source) || 0) + 1);
          categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
        }
      }
    }
  }

  if (!rows.length) {
    return json({
      inserted: 0,
      message: "找到候選內容，但本次沒有通過福利品質檢查的新活動。",
      diagnostics,
    });
  }

  const { data, error } = await supabase
    .from("benefit_catalog")
    .upsert(rows, { onConflict: "source_url", ignoreDuplicates: false })
    .select("id, title, source_name");

  if (error) return json({ error: error.message }, 500);
  await supabase.rpc("rebalance_benefit_catalog");
  const insertedIds = (data || []).map((item) => item.id);
  const { data: activeRows } = insertedIds.length
    ? await supabase
        .from("benefit_catalog")
        .select("id, title, source_name, status")
        .in("id", insertedIds)
        .eq("status", "active")
    : { data: [] };
  return json({
    inserted: data?.length || 0,
    activeAfterReview: activeRows?.length || 0,
    benefits: activeRows || [],
    diagnostics,
  });
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

function buildDirectSourceRotation(sourcePool) {
  const day = Math.floor(Date.now() / 86400000);
  const groups = ["exchange", "quest", "airdrop"];
  return groups.flatMap((group) =>
    sourcePool
      .filter((source) => source.group === group)
      .map((source) => ({ ...source, order: hashText(`${day}-${source.url}`) }))
      .sort((a, b) => a.order - b.order)
      .slice(0, SOURCES_PER_GROUP)
  );
}

function extractDirectCandidates(html, source, diagnostics) {
  const results = [];
  const anchorPattern = /<a\b([^>]*)href=["']([^"'#]+)["']([^>]*)>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(anchorPattern)) {
    diagnostics.rawResultsFound += 1;
    const rawLink = match[2].trim();
    const attributes = `${match[1]} ${match[3]}`;
    const visibleTitle = cleanText(match[4]);
    const attributeTitle =
      attributeValue(attributes, "aria-label") ||
      attributeValue(attributes, "title") ||
      "";
    let url;
    try {
      url = normalizeExternalUrl(new URL(rawLink, source.base).href);
    } catch {
      diagnostics.malformedResults += 1;
      continue;
    }

    const title = (visibleTitle || attributeTitle || titleFromUrl(url)).slice(0, 200);
    if (title.length < 3) {
      diagnostics.malformedResults += 1;
      continue;
    }
    const searchable = `${title} ${url}`.toLowerCase();
    const relevance = directSourceRelevance(searchable, source.group, url);
    if (!relevance.qualified || BLOCKED_WORDS.some((word) => searchable.includes(word))) {
      diagnostics.relevanceRejected += 1;
      continue;
    }
    if (!url.startsWith(source.base) || !isSafeDiscoveryUrl(url)) {
      diagnostics.unsafeUrlRejected += 1;
      if (diagnostics.unsafeUrlSamples.length < 3) diagnostics.unsafeUrlSamples.push(url);
      continue;
    }
    results.push({
      source: source.name,
      url,
      title,
      description: "",
      keywordHits: relevance.score,
      locale: containsChinese(title) ? "zh-TW" : source.locale,
      sourceGroup: source.group,
    });
  }
  return results;
}

function attributeValue(attributes, name) {
  const match = attributes.match(new RegExp(`${name}=["']([^"']+)["']`, "i"));
  return match ? cleanText(match[1]) : "";
}

function titleFromUrl(value) {
  try {
    const url = new URL(value);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop() || "";
    return decodeURIComponent(lastSegment)
      .replace(/\.(html?|php)$/i, "")
      .replace(/[-_]+/g, " ")
      .replace(/\b\d{5,}\b/g, "")
      .trim();
  } catch {
    return "";
  }
}

function extractRssCandidates(xml, source, diagnostics) {
  const results = [];
  const itemPattern = /<(?:item|entry)\b[^>]*>([\s\S]*?)<\/(?:item|entry)>/gi;
  for (const itemMatch of xml.matchAll(itemPattern)) {
    diagnostics.rawResultsFound += 1;
    const item = itemMatch[1];
    const title = cleanText(tagValue(item, "title"));
    const rawLink =
      tagValue(item, "link") ||
      item.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] ||
      "";
    const publishedAt =
      tagValue(item, "pubDate") ||
      tagValue(item, "published") ||
      tagValue(item, "updated") ||
      "";
    const description = cleanText(tagValue(item, "description") || tagValue(item, "summary") || "");
    if (!title || !rawLink) {
      diagnostics.malformedResults += 1;
      continue;
    }

    const searchable = `${title} ${description}`.toLowerCase();
    const relevance = discoveryRelevance(searchable, source.query);
    if (!relevance.qualified || BLOCKED_WORDS.some((word) => searchable.includes(word))) {
      diagnostics.relevanceRejected += 1;
      continue;
    }

    let url;
    try {
      url = resolveDiscoveryUrl(rawLink, source.base);
    } catch {
      diagnostics.malformedResults += 1;
      continue;
    }
    if (!isSafeDiscoveryUrl(url)) {
      diagnostics.unsafeUrlRejected += 1;
      if (diagnostics.unsafeUrlSamples.length < 3) diagnostics.unsafeUrlSamples.push(url);
      continue;
    }
    const sourceName = sourceNameFromUrl(url);
    results.push({
      source: sourceName,
      url,
      title,
      description,
      keywordHits: relevance.score,
      locale: containsChinese(title) ? "zh-TW" : source.locale,
      discoveryQuery: source.query,
      publishedAt,
    });
  }
  return results.sort((a, b) => b.keywordHits - a.keywordHits);
}

function resolveDiscoveryUrl(rawLink, base) {
  const parsed = new URL(decodeHtml(rawLink.trim()), base);
  if (parsed.hostname.endsWith("bing.com")) {
    const directTarget =
      parsed.searchParams.get("url") ||
      parsed.searchParams.get("target") ||
      parsed.searchParams.get("r");
    if (directTarget && /^https?:\/\//i.test(directTarget)) {
      return normalizeExternalUrl(directTarget);
    }

    const encodedTarget = parsed.searchParams.get("u");
    if (encodedTarget?.startsWith("a1")) {
      const base64Url = encodedTarget.slice(2).replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64Url.padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
      const decodedTarget = atob(padded);
      if (/^https?:\/\//i.test(decodedTarget)) return normalizeExternalUrl(decodedTarget);
    }
  }
  return normalizeExternalUrl(parsed.href);
}

function normalizeExternalUrl(value) {
  const url = new URL(value);
  if (url.protocol === "http:") url.protocol = "https:";
  url.hash = "";
  return url.href;
}

function isSafeDiscoveryUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (url.protocol !== "https:" || BLOCKED_HOSTS.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) return false;
    const riskyText = `${url.pathname} ${url.search}`.toLowerCase();
    return !/(connect-wallet|wallet-connect|claim-now|seed-phrase|private-key|auth\/callback)/.test(riskyText);
  } catch {
    return false;
  }
}

function sourceNameFromUrl(value) {
  try {
    const host = new URL(value).hostname.replace(/^www\./, "");
    const label = host.split(".").slice(-2, -1)[0] || host.split(".")[0];
    return label
      .split(/[-_]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return "公開來源";
  }
}

function cryptoBenefitRelevance(value = "") {
  const text = value.toLowerCase();
  const cryptoHits = CRYPTO_WORDS.filter((word) => text.includes(word)).length;
  const brandHits = CRYPTO_BRANDS.filter((word) => text.includes(word)).length;
  const benefitHits = BENEFIT_WORDS.filter((word) => {
    if (/^[a-z ]+$/i.test(word)) return new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
    return text.includes(word);
  }).length;
  const actionableHits = ACTIONABLE_BENEFIT_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const informational = INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(text));
  return {
    qualified: (cryptoHits >= 1 || brandHits >= 1) && actionableHits >= 1 && !informational,
    score: cryptoHits * 3 + brandHits * 4 + benefitHits + actionableHits * 6,
  };
}

function directSourceRelevance(value = "", group = "", sourceUrl = "") {
  const text = value.toLowerCase();
  if (INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(text))) return { qualified: false, score: 0 };
  const actionableHits = ACTIONABLE_BENEFIT_PATTERNS.filter((pattern) => pattern.test(text)).length;
  const benefitHits = BENEFIT_WORDS.filter((word) => {
    if (/^[a-z ]+$/i.test(word)) return new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
    return text.includes(word);
  }).length;
  const questHits = (text.match(/\b(quest|campaign|points?|xp|task|mint|allowlist|whitelist)\b/gi) || []).length
    + (text.match(/任務|積分|鑄造|白名單|活動/g) || []).length;
  const activityPath = /\/(promo|promotion|campaign|event|events|activity|activities|reward|rewards|bonus|airdrop|quest|quests|launchpool|launchpad|earn)(\/|[-_?])/i.test(new URL(sourceUrl || "https://invalid.local").pathname + new URL(sourceUrl || "https://invalid.local").search);

  if (group === "quest" || group === "airdrop") {
    return {
      qualified: actionableHits >= 1 || questHits >= 1 || activityPath,
      score: actionableHits * 6 + questHits * 4 + benefitHits * 2 + (activityPath ? 5 : 0),
    };
  }
  return {
    qualified: actionableHits >= 1 || benefitHits >= 2 || activityPath,
    score: actionableHits * 6 + benefitHits * 2 + (activityPath ? 5 : 0),
  };
}

function discoveryRelevance(value = "", discoveryQuery = "") {
  const text = value.toLowerCase();
  const cryptoHits = CRYPTO_WORDS.filter((word) => text.includes(word)).length;
  const brandHits = CRYPTO_BRANDS.filter((word) => text.includes(word)).length;
  const benefitHits = BENEFIT_WORDS.filter((word) => {
    if (/^[a-z ]+$/i.test(word)) return new RegExp(`\\b${word.replace(/\s+/g, "\\s+")}\\b`, "i").test(text);
    return text.includes(word);
  }).length;
  const blocked = INFORMATIONAL_PATTERNS.some((pattern) => pattern.test(text));
  const queryIsCryptoSpecific = CRYPTO_WORDS.some((word) => discoveryQuery.toLowerCase().includes(word));
  return {
    qualified: benefitHits >= 1 && !blocked && (cryptoHits >= 1 || brandHits >= 1 || queryIsCryptoSpecific),
    score: cryptoHits * 3 + brandHits * 4 + benefitHits * 2,
  };
}

async function enrichCandidate(candidate, diagnostics) {
  const html = await fetchText(candidate.url);
  const title = meta(html, "og:title") || documentTitle(html) || candidate.title;
  const description =
    meta(html, "og:description") ||
    meta(html, "description", "name") ||
    candidate.description ||
    `${candidate.source} 最新公開福利或活動，請在官方頁面確認資格、期限與地區限制。`;
  const imageUrl = meta(html, "og:image") || null;
  const publishedAt =
    meta(html, "article:published_time") ||
    meta(html, "datePublished", "itemprop") ||
    candidate.publishedAt ||
    new Date().toISOString();
  const expiresAt =
    meta(html, "event:end_time") ||
    meta(html, "endDate", "itemprop") ||
    extractDeadline(`${title} ${description} ${cleanText(html).slice(0, 12000)}`, publishedAt);
  const fullText = `${candidate.source || ""} ${title} ${description} ${candidate.title || ""} ${candidate.description || ""}`;
  const relevance = cryptoBenefitRelevance(fullText);
  const trustedPlatformRelevance = directSourceRelevance(fullText, candidate.sourceGroup, candidate.url);
  const sourceQualified = candidate.sourceGroup
    ? trustedPlatformRelevance.qualified
    : relevance.qualified;
  if (!sourceQualified || BLOCKED_WORDS.some((word) => `${title} ${description}`.toLowerCase().includes(word))) return null;
  if ((expiresAt && new Date(expiresAt) <= new Date()) || (!expiresAt && daysOld(publishedAt) > 60)) {
    diagnostics.staleRejected += 1;
    return null;
  }

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
  const localized = localizeBenefit(candidate, category);
  return {
    source_name: candidate.source,
    source_url: candidate.url,
    title: localized.title,
    summary: localized.summary,
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

function localizeBenefit(candidate, category) {
  const rawTitle = cleanText(candidate.title || "");
  const rawDescription = cleanText(candidate.description || "");
  const translatedTitle = translateCommonCryptoText(rawTitle);
  const isChineseTitle = containsChinese(translatedTitle);
  const reward = extractRewardHint(`${rawTitle} ${rawDescription}`);
  const deadline = candidate.expiresAt ? `，活動期限至 ${formatTaiwanDate(candidate.expiresAt)}` : "";
  const rewardText = reward ? `，重點包含 ${reward}` : "";

  const title = isChineseTitle
    ? translatedTitle.slice(0, 110)
    : `${candidate.source}｜${category}${reward ? `：${reward}` : ""}`;

  const summary = containsChinese(rawDescription) && chineseRatio(rawDescription) >= 0.18
    ? rawDescription.slice(0, 260)
    : `${candidate.source} 官方發布的${category}資訊${rewardText}${deadline}。適用資格、地區限制及實際獎勵請以官方頁面為準。`;

  return { title, summary };
}

function translateCommonCryptoText(value) {
  const replacements = [
    [/\bnew user\b/gi, "新用戶"],
    [/\bwelcome bonus\b/gi, "迎新獎勵"],
    [/\bsign[- ]?up bonus\b/gi, "註冊獎勵"],
    [/\btrading competition\b/gi, "交易競賽"],
    [/\btrading campaign\b/gi, "交易活動"],
    [/\bdeposit campaign\b/gi, "入金活動"],
    [/\bdeposit bonus\b/gi, "入金獎勵"],
    [/\bfee discount\b/gi, "手續費優惠"],
    [/\bzero fees?\b/gi, "零手續費"],
    [/\blearn and earn\b/gi, "學習獎勵"],
    [/\blaunchpool\b/gi, "新幣挖礦"],
    [/\blaunchpad\b/gi, "新幣認購"],
    [/\bairdrop\b/gi, "空投"],
    [/\bgiveaway\b/gi, "贈獎活動"],
    [/\brewards?\b/gi, "獎勵"],
    [/\bbonus\b/gi, "獎勵"],
    [/\bcampaign\b/gi, "活動"],
    [/\bpromotion\b/gi, "優惠活動"],
    [/\bstaking\b/gi, "質押"],
    [/\bearn\b/gi, "理財"],
    [/\breferral\b/gi, "邀請活動"],
    [/\bvouchers?\b/gi, "體驗券"],
  ];
  return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}

function containsChinese(value = "") {
  return /[\u3400-\u9fff]/.test(value);
}

function chineseRatio(value = "") {
  const compact = value.replace(/\s+/g, "");
  if (!compact) return 0;
  return (compact.match(/[\u3400-\u9fff]/g) || []).length / compact.length;
}

function extractRewardHint(value = "") {
  const amount = value.match(/(?:up to|max(?:imum)?|最高|獎池|瓜分)?\s*(?:USDT\s*)?[$＄]?\s?[\d,.]+\s?(?:USDT|USDC|USD|U|%|美元|美金)/i);
  if (!amount) return "";
  return translateCommonCryptoText(cleanText(amount[0])).replace(/^up to\s*/i, "最高 ");
}

function formatTaiwanDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    month: "numeric",
    day: "numeric",
  }).format(date);
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

function diversifyCandidates(items) {
  const groups = new Map();
  items.forEach((item) => {
    const group = groups.get(item.source) || [];
    group.push(item);
    groups.set(item.source, group);
  });
  groups.forEach((group) => {
    group.sort((a, b) => {
      const chinesePriority = Number(containsChinese(b.title)) - Number(containsChinese(a.title));
      const recencyPriority = new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
      return chinesePriority || b.keywordHits - a.keywordHits || recencyPriority;
    });
  });

  const orderedSources = [...groups.keys()].sort((a, b) => {
    const aChinese = groups.get(a)?.some((item) => item.locale === "zh-TW") ? 1 : 0;
    const bChinese = groups.get(b)?.some((item) => item.locale === "zh-TW") ? 1 : 0;
    return bChinese - aChinese;
  });
  const result = [];
  for (let round = 0; round < 12; round += 1) {
    orderedSources.forEach((source) => {
      const candidate = groups.get(source)?.[round];
      if (candidate) result.push(candidate);
    });
  }
  return result;
}

function hashText(value = "") {
  return Array.from(value).reduce((sum, character) => ((sum * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function daysOld(value) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? Math.max(0, (Date.now() - time) / 86400000) : 0;
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
