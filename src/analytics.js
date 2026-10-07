const ANALYTICS_KEY = 'app_analytics';
const ANALYTICS_VERSION = 2;
const MAX_PAGEVIEWS = 500;
const MAX_SEARCHES = 200;
const MAX_CHATBOT_MISSES = 200;

export const emptyAnalytics = () => ({
  version: ANALYTICS_VERSION,
  pageviews: [],
  searches: [],
  chatbotMisses: [],
});

const asArray = value => Array.isArray(value) ? value : [];
const bounded = (items, max) => items.slice(-max);
const safeCount = value => Number.isFinite(Number(value)) ? Math.max(0, Math.floor(Number(value))) : 0;
const safeTs = value => Number.isFinite(Number(value)) ? Number(value) : Date.now();

export const normalizeAnalytics = value => {
  const source = value && typeof value === 'object' ? value : {};
  return {
    version: ANALYTICS_VERSION,
    pageviews: bounded(asArray(source.pageviews).map(item => ({
      tab: String(item?.tab || ''),
      title: String(item?.title || ''),
      path: String(item?.path || ''),
      ts: safeTs(item?.ts),
    })), MAX_PAGEVIEWS),
    searches: bounded(asArray(source.searches).map(item => ({
      resultCount: safeCount(item?.resultCount),
      ts: safeTs(item?.ts),
    })), MAX_SEARCHES),
    chatbotMisses: bounded(asArray(source.chatbotMisses).map(item => ({
      category: String(item?.category || ''),
      ts: safeTs(item?.ts),
    })), MAX_CHATBOT_MISSES),
  };
};

export const analyticsLoad = storage => {
  try {
    const raw = storage.getItem(ANALYTICS_KEY);
    if (!raw) return emptyAnalytics();
    const normalized = normalizeAnalytics(JSON.parse(raw));
    storage.setItem(ANALYTICS_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return emptyAnalytics();
  }
};

export const analyticsSave = (storage, data) => {
  try {
    storage.setItem(ANALYTICS_KEY, JSON.stringify(normalizeAnalytics(data)));
  } catch {}
};

export const analyticsClear = storage => {
  try { storage.removeItem(ANALYTICS_KEY); } catch {}
};

export const recordPageview = (data, tab, title, path = [], ts = Date.now()) => normalizeAnalytics({
  ...data,
  pageviews: [...asArray(data?.pageviews), {
    tab: String(tab || ''),
    title: String(title || ''),
    path: asArray(path).filter(Boolean).map(String).join(' › '),
    ts,
  }],
});

export const recordSearch = (data, resultCount, ts = Date.now()) => normalizeAnalytics({
  ...data,
  searches: [...asArray(data?.searches), { resultCount, ts }],
});

export const recordChatbotMiss = (data, category, ts = Date.now()) => normalizeAnalytics({
  ...data,
  chatbotMisses: [...asArray(data?.chatbotMisses), { category: String(category || ''), ts }],
});
