const DEMO_KEY = "optionality-network-demo-v3";

const config = window.OPTIONALITY_CONFIG || {};
const hasSupabaseConfig =
  typeof window.supabase !== "undefined" &&
  config.supabaseUrl &&
  config.supabaseUrl.startsWith("https://") &&
  config.supabasePublishableKey &&
  !config.supabasePublishableKey.includes("PASTE_");

const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey)
  : null;

const adminEmails = config.adminEmails || [];
const pageIds = ["home", "benefits", "benefit-explore", "benefit-detail", "benefit-expired", "benefit-search", "benefit-results", "benefit-offers", "quick-start", "members", "matches", "opportunities", "requests", "profile", "admin"];
const BENEFIT_PREFIX = "福利｜";
const PUBLIC_PROFILE_COLUMNS = [
  "id",
  "username",
  "full_name",
  "title",
  "country",
  "languages",
  "bio",
  "telegram",
  "twitter",
  "website",
  "resources_have",
  "resources_need",
  "profile_views",
  "connections",
  "completed_partnerships",
  "member_since",
  "created_at",
  "updated_at",
].join(",");

const seed = {
  members: [
    {
      id: "demo-mina",
      email: "mina@example.com",
      username: "mina-kol",
      full_name: "Mina Liu",
      title: "台灣加密 KOL",
      country: "台灣",
      languages: ["中文", "English"],
      bio: "經營交易教育內容與 Telegram 社群，擅長新品上市導流與內容合作。",
      telegram: "@mina",
      twitter: "@minakol",
      resources_have: ["Telegram 社群", "Twitter/X 受眾", "KOL 人脈"],
      resources_need: ["交易所合作", "影片剪輯"],
      profile_views: 428,
      connections: 76,
      completed_partnerships: 18,
      member_since: "2026-06-01",
    },
    {
      id: "demo-ryan",
      email: "ryan@example.com",
      username: "exchange-ryan",
      full_name: "Ryan Park",
      title: "交易所商務拓展",
      country: "台灣",
      languages: ["English", "中文"],
      bio: "協助交易所拓展亞洲聯盟推廣、KOL 與社群合作夥伴。",
      telegram: "@ryanbd",
      twitter: "@ryanbd",
      resources_have: ["交易所資源", "聯盟推廣人脈", "項目方資源"],
      resources_need: ["Telegram 社群", "KOL 推廣"],
      profile_views: 312,
      connections: 54,
      completed_partnerships: 9,
      member_since: "2026-06-01",
    },
    {
      id: "demo-jade",
      email: "jade@example.com",
      username: "jade-ai",
      full_name: "Jade Wu",
      title: "AI 自動化專家",
      country: "台灣",
      languages: ["中文", "English"],
      bio: "為加密團隊建立客服、內容分發、BD 名單整理與社群營運自動化。",
      telegram: "@jadeai",
      twitter: "@jadeai",
      resources_have: ["AI 自動化", "客服支援", "搜尋引擎優化"],
      resources_need: ["項目合作", "媒體曝光"],
      profile_views: 219,
      connections: 41,
      completed_partnerships: 7,
      member_since: "2026-06-01",
    },
  ],
  opportunities: [
    {
      id: "demo-opp-1",
      author_id: "demo-mina",
      title: "尋找台灣加密 KOL",
      description: "新交易產品上市，需要 Twitter/X 與 Telegram 推廣合作。",
      country: "台灣",
      budget: "US$500-2,000",
      contact_method: "Telegram @opnetwork",
      status: "active",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-opp-2",
      author_id: "demo-ryan",
      title: "需要 Telegram 社群",
      description: "尋找交易、空投、Web3 學習型社群，合作 AMA 與教育內容。",
      country: "亞洲",
      budget: "可議",
      contact_method: "Twitter/X @growthbd",
      status: "active",
      created_at: new Date().toISOString(),
    },
  ],
  requests: [],
  messages: [],
};

const showcaseMembers = createShowcaseMembers();

let state = loadDemoState();
state.members ||= [];
state.opportunities ||= [];
state.requests ||= [];
state.messages ||= [];
state.signupLeads ||= [];
state.benefitNeeds ||= {};
state.localBenefitOffers ||= [];
state.catalogBenefits ||= [];
state.members = mergeDisplayMembers(state.members);
let currentUser = null;
let currentProfile = null;
let activeFilter = "all";
let activeBenefitFilter = "all";
let pendingIntent = null;
let activeRequestId = null;
let realtimeChannel = null;
let realtimeRefreshTimer = null;

function createShowcaseMembers() {
  const names = [
    "Alex Chen",
    "Sofia Lin",
    "Kenji Mori",
    "Ivy Wang",
    "Marcus Lee",
    "Nina Ho",
    "Jason Wu",
    "Maya Chou",
    "Daniel Park",
    "Hana Kim",
    "Ethan Zhao",
    "Luna Tsai",
    "Victor Ng",
    "Grace Liu",
    "Owen Tan",
    "Rina Kuo",
    "Leo Huang",
    "Aria Yu",
    "Noah Fang",
    "Mika Sato",
    "Chris Yang",
    "Tina Hsieh",
    "Raymond Lau",
    "Elaine Chang",
    "Kevin Ma",
    "Yuki Chen",
    "Sam Lin",
    "Joanna Wu",
    "Brian Choi",
    "Peggy Kao",
    "Oscar Li",
    "Alice Sun",
    "George Yeh",
    "Cindy Luo",
    "Felix Chiu",
    "Ruby Shen",
    "Howard Pan",
    "Kelly Wong",
    "Aaron Hsu",
    "Mia Tang",
    "Derek Lam",
    "Claire Fu",
    "Tony Cheng",
    "Wendy Lai",
    "Ivan Ko",
    "Phoebe Lu",
    "Sean Yu",
    "Irene Fang",
    "Martin Chu",
    "Bonnie Tseng",
    "Eric Han",
    "Janice Wei",
    "Louis Hwang",
  ];
  const roles = [
    "加密 KOL",
    "交易所 BD",
    "社群主",
    "聯盟推廣負責人",
    "交易講師",
    "鏈上分析師",
    "媒體合作夥伴",
    "項目方創辦人",
    "VC 投資人",
    "Web3 開發者",
    "AI 自動化服務商",
    "影片剪輯師",
    "平面設計師",
  ];
  const countries = ["台灣"];
  const resourcesHave = [
    ["Telegram 社群", "Twitter/X 受眾", "KOL 人脈"],
    ["交易所資源", "聯盟推廣人脈", "項目方資源"],
    ["Discord 社群", "交易社群", "社群經營"],
    ["媒體網絡", "SEO", "內容企劃"],
    ["AI 自動化", "客服支援", "資料整理"],
    ["影片剪輯", "圖像設計", "短影音製作"],
    ["VC 連結", "項目資源", "募資人脈"],
    ["開發者", "產品設計", "技術顧問"],
  ];
  const resourcesNeed = [
    ["KOL 推廣", "媒體曝光", "Telegram 社群"],
    ["交易所合作", "聯盟推廣夥伴", "項目合作"],
    ["社群經理", "交易講師", "客服支援"],
    ["開發者", "設計師", "AI 自動化"],
    ["影片剪輯", "SEO", "付費流量"],
    ["VC 連結", "媒體曝光", "活動合作"],
    ["翻譯", "內容企劃", "社群經營"],
  ];

  return names.map((name, index) => {
    const number = index + 1;
    const role = roles[index % roles.length];
    const country = "台灣";
    const have = resourcesHave[index % resourcesHave.length];
    const need = resourcesNeed[(index + 2) % resourcesNeed.length];
    const bioTemplates = [
      `長期經營台灣加密圈資源，熟悉${have[0]}與${have[1]}合作節奏，正在尋找${need[0]}。`,
      `偏實戰型合作窗口，可協助${have[0]}、${have[2]}，適合有明確檔期與目標的項目方。`,
      `資源集中在台灣市場，能支援${have[1]}與${have[2]}，目前希望串接${need[1]}。`,
      `過去常協助 Web3 團隊做早期曝光、社群溝通與合作導流，主要資源是${have[0]}。`,
      `重視合作品質，不只接曝光，也會先確認受眾、預算與成效目標。可提供${have[0]}與${have[1]}。`,
      `適合想快速驗證台灣市場反應的團隊，能從${have[2]}開始建立合作測試。`,
      `熟悉項目方、社群與推廣方之間的溝通方式，可協助媒合${need[0]}與${need[2]}。`,
      `手上有穩定合作窗口，偏好長期互惠，不適合一次性亂投放。主要資源：${have.join("、")}。`,
    ];
    return {
      id: `showcase-${String(number).padStart(2, "0")}`,
      email: `showcase-${number}@optionality.network`,
      username: `showcase-${String(number).padStart(2, "0")}`,
      full_name: name,
      title: role,
      country,
      languages: ["中文", "英文"],
      bio: bioTemplates[index % bioTemplates.length],
      telegram: `@showcase${number}`,
      twitter: `@showcase${number}`,
      resources_have: have,
      resources_need: need,
      profile_views: 84 + ((index * 37) % 220),
      connections: 12 + ((index * 11) % 48),
      completed_partnerships: 2 + ((index * 5) % 14),
      member_since: "2026-06-01",
      created_at: "2026-06-01T00:00:00.000Z",
      is_showcase_member: true,
    };
  });
}

const els = {
  logoutButton: document.querySelector("#logoutButton"),
  loginForm: document.querySelector("#loginForm"),
  loginControls: document.querySelector("#loginControls"),
  loggedInActions: document.querySelector("#loggedInActions"),
  loginCardCopy: document.querySelector("#loginCardCopy"),
  googleLoginButton: document.querySelector("#googleLoginButton"),
  authMessage: document.querySelector("#authMessage"),
  profileForm: document.querySelector("#profileForm"),
  memberGrid: document.querySelector("#memberGrid"),
  memberSearch: document.querySelector("#memberSearch"),
  matchGrid: document.querySelector("#matchGrid"),
  opportunityForm: document.querySelector("#opportunityForm"),
  opportunityList: document.querySelector("#opportunityList"),
  benefitNeedForm: document.querySelector("#benefit-search #benefitNeedForm"),
  benefitMatchGrid: document.querySelector("#benefit-results #benefitMatchGridMain"),
  benefitExploreSearch: document.querySelector("#benefitExploreSearch"),
  benefitExploreGrid: document.querySelector("#benefitExploreGrid"),
  benefitDetailView: document.querySelector("#benefitDetailView"),
  expiredBenefitGrid: document.querySelector("#expiredBenefitGrid"),
  benefitOfferForm: document.querySelector("#benefitOfferForm"),
  benefitOfferList: document.querySelector("#benefitOfferList"),
  requestInbox: document.querySelector("#requestInbox"),
  notificationBell: document.querySelector("#notificationBell"),
  notificationCount: document.querySelector("#notificationCount"),
  messageModal: document.querySelector("#messageModal"),
  closeMessageModal: document.querySelector("#closeMessageModal"),
  messageTitle: document.querySelector("#messageTitle"),
  messageThread: document.querySelector("#messageThread"),
  messageForm: document.querySelector("#messageForm"),
  messageInput: document.querySelector("#messageInput"),
  adminNavLink: document.querySelector("#adminNavLink"),
  adminSection: document.querySelector("#admin"),
  leadList: document.querySelector("#leadList"),
  leadCount: document.querySelector("#leadCount"),
  benefitReviewList: document.querySelector("#benefitReviewList"),
  benefitReviewCount: document.querySelector("#benefitReviewCount"),
  downloadLeadsButton: document.querySelector("#downloadLeadsButton"),
  menuButton: document.querySelector("#menuButton"),
  profileView: document.querySelector("#profileView"),
  profileLink: document.querySelector("#profileLink"),
  toast: document.querySelector("#toast"),
};

init();

async function init() {
  wireEvents();
  renderRoute();
  if (supabaseClient) await initCloudMode();
  else initDemoMode();
  await refreshAll();
  setupRealtimeSubscription();
}

function wireEvents() {
  document.querySelectorAll(".tag-picker button").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("selected"));
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.classList.contains("benefit-filter")) return;
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderMembers();
    });
  });

  els.memberSearch.addEventListener("input", renderMembers);
  els.benefitExploreSearch?.addEventListener("input", renderBenefitExplore);
  document.querySelectorAll(".benefit-filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".benefit-filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeBenefitFilter = button.dataset.benefitFilter || "all";
      renderBenefitExplore();
    });
  });
  els.googleLoginButton.addEventListener("click", handleGoogleLogin);
  els.logoutButton.addEventListener("click", handleLogout);
  els.menuButton?.addEventListener("click", toggleMenu);
  els.downloadLeadsButton?.addEventListener("click", downloadSignupLeads);
  els.profileForm.addEventListener("submit", handleProfileSave);
  els.opportunityForm.addEventListener("submit", handleOpportunitySave);
  els.benefitNeedForm?.addEventListener("submit", handleBenefitNeedSave);
  els.benefitOfferForm?.addEventListener("submit", handleBenefitOfferSave);
  els.notificationBell.addEventListener("click", () => {
    navigateTo("requests");
    showToast("已帶你到合作請求");
  });
  els.closeMessageModal.addEventListener("click", closeMessageModal);
  els.messageForm.addEventListener("submit", handleMessageSend);
  window.addEventListener("hashchange", renderRoute);
  document.addEventListener("click", handleDocumentClick);
}

function toggleMenu(event) {
  event.stopPropagation();
  const isOpen = document.body.classList.toggle("nav-open");
  els.menuButton?.setAttribute("aria-expanded", String(isOpen));
}

function renderRoute() {
  const requestedPage = window.location.hash.replace("#", "") || "home";
  const page = pageIds.includes(requestedPage) ? requestedPage : "home";
  const audience = getPageAudience(page);
  document.body.dataset.audience = audience;

  pageIds.forEach((id) => {
    const section = document.querySelector(`#${id}`);
    if (!section) return;
    const shouldShow = id === page;
    section.classList.toggle("page-active", shouldShow);
    section.classList.toggle("page-hidden", !shouldShow);
    section.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  });

  document.querySelectorAll(".topbar nav a").forEach((link) => {
    const linkAudience = link.dataset.audience || "all";
    const shouldShow = audience === "home" || linkAudience === "all" || linkAudience === audience;
    link.classList.toggle("audience-hidden", !shouldShow);
    const target = link.getAttribute("href")?.replace("#", "") || "home";
    link.classList.toggle("active", target === page);
  });

  window.scrollTo({ top: 0, behavior: "instant" });
}

function getPageAudience(page) {
  if (page === "home") return "home";
  if (["benefits", "benefit-explore", "benefit-detail", "benefit-expired", "benefit-search", "benefit-results", "benefit-offers"].includes(page)) return "user";
  return "operator";
}

function navigateTo(page) {
  const target = pageIds.includes(page) ? page : "home";
  if (window.location.hash === `#${target}`) renderRoute();
  else window.location.hash = target;
}

async function initCloudMode() {
  els.authMessage.textContent = "使用 Google 帳號登入後即可開始。";
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    await refreshAll();
    setupRealtimeSubscription();
  });
}

function initDemoMode() {
  els.authMessage.textContent = "登入後就可以發布需求和發送合作請求。";
  currentUser = { id: "demo-user", email: "demo@optionality.network" };
}

function setupRealtimeSubscription() {
  if (!supabaseClient) return;

  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }

  if (!currentUser) return;

  realtimeChannel = supabaseClient
    .channel(`optionality-network-${currentUser.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "partnership_requests" }, handleRealtimeChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "partnership_messages" }, handleRealtimeChange)
    .subscribe();
}

function handleRealtimeChange(payload) {
  if (!currentUser) return;

  const incomingMessage =
    payload.table === "partnership_messages" &&
    payload.eventType === "INSERT" &&
    payload.new?.sender_id !== currentUser.id;

  window.clearTimeout(realtimeRefreshTimer);
  realtimeRefreshTimer = window.setTimeout(async () => {
    await loadCloudData();
    currentProfile = findCurrentProfile();
    renderApp();
    if (activeRequestId) renderMessageThread();
    if (incomingMessage && !activeRequestId) showToast("你收到一則新的合作訊息");
  }, 300);
}

function loadDemoState() {
  const saved = localStorage.getItem(DEMO_KEY);
  return saved ? JSON.parse(saved) : structuredClone(seed);
}

function saveDemoState() {
  localStorage.setItem(DEMO_KEY, JSON.stringify(state));
}

async function refreshAll() {
  els.logoutButton.classList.toggle("hidden", !currentUser || !supabaseClient);
  await ensureCurrentUserProfile();
  await loadCloudData();
  currentProfile = findCurrentProfile();
  renderApp();
}

function renderApp() {
  updateAdminVisibility();
  fillProfileForm(currentProfile);
  fillBenefitNeedForm();
  renderBenefitMatches();
  renderBenefitExplore();
  renderBenefitDetail();
  renderExpiredBenefits();
  renderBenefitOffers();
  renderMembers();
  renderMatches();
  renderOpportunities();
  renderRequests();
  renderProfile();
  renderAdmin();
  renderNotificationBell();
  renderLoginState();
}

function renderLoginState() {
  const loggedIn = Boolean(currentUser);
  els.loginControls.classList.toggle("hidden", loggedIn);
  els.loggedInActions.classList.toggle("hidden", !loggedIn);
  els.loginCardCopy.textContent = loggedIn
    ? "你已經登入，可以直接發布需求、發送合作請求，或補完整會員頁。"
    : "使用 Google 帳號快速登入。";
  if (loggedIn) {
    els.authMessage.textContent = currentProfile
      ? `目前登入：${currentUser.email || "已登入"}`
      : "已登入，系統正在建立你的基本會員頁。";
  }
}

function updateAdminVisibility() {
  const allowed = isAdmin();
  els.adminNavLink.classList.toggle("hidden", !allowed);
  els.adminSection.classList.toggle("hidden", !allowed);
  els.adminSection.setAttribute("aria-hidden", allowed ? "false" : "true");
  if (!allowed && window.location.hash === "#admin") {
    navigateTo("members");
    showToast("管理後台僅限管理員查看");
  }
}

async function loadCloudData() {
  if (!supabaseClient) return;

  const [{ data: members }, { data: opportunities }, { data: requests }, { data: messages }, { data: signupLeads }, { data: catalogBenefits }] = await Promise.all([
    supabaseClient.from("profiles").select(PUBLIC_PROFILE_COLUMNS).order("created_at", { ascending: false }),
    supabaseClient.from("opportunities").select("*").order("created_at", { ascending: false }),
    currentUser
      ? supabaseClient
          .from("partnership_requests")
          .select("*, sender:sender_id(username, full_name, title), receiver:receiver_id(username, full_name, title)")
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    currentUser
      ? supabaseClient
          .from("partnership_messages")
          .select("*, sender:sender_id(username, full_name)")
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: [] }),
    isAdmin()
      ? supabaseClient.from("signup_leads").select("*").order("signed_up_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabaseClient
      .from("benefit_catalog")
      .select("*")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(200),
  ]);

  state.members = mergeDisplayMembers(members || []);
  state.opportunities = opportunities || [];
  state.requests = requests || [];
  state.messages = messages || [];
  state.signupLeads = signupLeads || [];
  state.catalogBenefits = catalogBenefits || [];
}

function mergeDisplayMembers(realMembers) {
  const realIds = new Set(realMembers.map((member) => member.id));
  const realUsernames = new Set(realMembers.map((member) => member.username));
  const enrichedRealMembers = realMembers.map((member, index) => enrichMemberStats({ ...member, is_showcase_member: false }, index));
  const visibleShowcaseMembers = showcaseMembers.filter((member) => !realIds.has(member.id) && !realUsernames.has(member.username));
  return [...enrichedRealMembers, ...visibleShowcaseMembers];
}

function enrichMemberStats(member, index = 0) {
  const seedText = `${member.id || ""}${member.username || ""}${member.email || ""}`;
  const base = Array.from(seedText).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 17;
  return {
    ...member,
    profile_views: member.profile_views && member.profile_views > 0 ? member.profile_views : 38 + (base % 160),
    connections: member.connections && member.connections > 0 ? member.connections : 6 + (base % 34),
    completed_partnerships:
      member.completed_partnerships && member.completed_partnerships > 0 ? member.completed_partnerships : 1 + (base % 8),
  };
}

function findCurrentProfile() {
  if (!currentUser) return null;
  return state.members.find((member) => member.id === currentUser.id || member.email === currentUser.email) || null;
}

function defaultBenefitOffers() {
  return [
    {
      id: "benefit-fee",
      title: "低手續費交易入口",
      type: "最低手續費",
      audience: "合約交易",
      description: "適合重視交易成本與穩定撮合的用戶，接受媒合後可了解適合條件。",
      value: "降低交易成本、適合高頻交易",
      provider: "台灣交易資源 #218",
      provider_id: "showcase-02",
      created_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "benefit-new-user",
      title: "新戶活動與任務組合",
      type: "新戶活動",
      audience: "新手入門",
      description: "整理適合新手入門的開戶活動、任務回饋與基礎工具。",
      value: "低門檻、適合新手、站內媒合",
      provider: "台灣活動窗口 #407",
      provider_id: "showcase-12",
      created_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "benefit-airdrop",
      title: "空投任務追蹤清單",
      type: "空投任務",
      audience: "空投任務",
      description: "適合想系統化追蹤任務、工具測試與潛在空投機會的用戶。",
      value: "任務整理、工具入口、風險提示",
      provider: "Web3 任務資源 #613",
      provider_id: "showcase-07",
      created_at: "2026-06-01T00:00:00.000Z",
    },
    {
      id: "benefit-tool",
      title: "Web3 工具優惠包",
      type: "工具優惠",
      audience: "Web3 工具",
      description: "包含交易、資料、社群、內容與自動化工具的優惠與試用入口。",
      value: "工具折扣、試用入口、適合團隊",
      provider: "工具合作方 #529",
      provider_id: "showcase-11",
      created_at: "2026-06-01T00:00:00.000Z",
    },
  ];
}

function getBenefitOffers() {
  const catalogOffers = (state.catalogBenefits || [])
    .filter((item) =>
      item.status === "active" &&
      (!item.is_automated || (item.eligibility_status !== "restricted" && ["zh", "translated"].includes(item.language_status))) &&
      (!item.expires_at || new Date(item.expires_at) > new Date())
    )
    .map((item) => ({
    id: item.id,
    title: item.title,
    type: item.category,
    audience: item.audience,
    description: item.summary,
    value: item.value_text,
    provider: item.source_name,
    source_url: benefitOutboundUrl(item),
    image_url: item.image_url,
    published_at: item.published_at,
    expires_at: item.expires_at,
    created_at: item.published_at || item.created_at,
    source: "catalog",
    is_automated: item.is_automated,
    }));
  const opportunityOffers = (state.opportunities || [])
    .filter((item) => item.status !== "cancelled" && item.title?.startsWith(BENEFIT_PREFIX))
    .map((item) => {
      const [type = "交易活動", audience = "新手入門", value = "站內媒合"] = (item.budget || "").split("｜");
      return {
        id: item.id,
        title: item.title.replace(BENEFIT_PREFIX, ""),
        type,
        audience,
        description: item.description,
        value,
        provider: "平台經營者",
        provider_id: item.author_id,
        created_at: item.created_at,
        source: "cloud",
      };
    });
  const localOffers = (state.localBenefitOffers || [])
    .filter((item) => item.status !== "cancelled")
    .map((item) => ({ ...item, source: "local" }));
  return [...catalogOffers, ...opportunityOffers, ...localOffers, ...defaultBenefitOffers().map((item) => ({ ...item, source: "default" }))];
}

const BITUNIX_REGISTRATION_URL = "https://www.bitunix.com/register?vipCode=bitunixzh";

function benefitOutboundUrl(item = {}) {
  const sourceName = String(item.source_name || item.provider || "").toLowerCase();
  const sourceUrl = String(item.source_url || "");
  if (sourceName.includes("bitunix") || /(^|\.)bitunix\.com$/i.test(safeHostname(sourceUrl))) {
    return BITUNIX_REGISTRATION_URL;
  }
  return sourceUrl;
}

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function currentBenefitNeed() {
  return {
    type: state.benefitNeeds?.type || value("#benefitNeedType") || "最低手續費",
    audience: state.benefitNeeds?.audience || value("#benefitUserType") || "新手入門",
    volume: state.benefitNeeds?.volume || value("#benefitVolume") || "",
  };
}

const benefitTypeRelations = [
  ["最低手續費", "交易工具", "交易活動", "合約交易"],
  ["新戶活動", "任務獎勵", "入門教學", "新手福利"],
  ["空投機會", "項目活動", "鏈上任務", "白名單"],
  ["工具優惠", "AI 工具", "數據工具", "交易工具"],
  ["社群福利", "會員活動", "社群活動", "學習資源"],
];

function normalizeMatchText(value = "") {
  return String(value).toLowerCase().replace(/\s+/g, "").replace(/[，。、「」：:／/_-]/g, "");
}

function sameBenefitGroup(left, right) {
  const a = normalizeMatchText(left);
  const b = normalizeMatchText(right);
  return benefitTypeRelations.some((group) => group.some((item) => a.includes(normalizeMatchText(item))) && group.some((item) => b.includes(normalizeMatchText(item))));
}

function intentTerms(value = "") {
  const dictionary = ["新手", "低手續費", "合約", "現貨", "空投", "任務", "工具", "AI", "社群", "台灣", "高頻", "小額", "交易", "學習", "安全", "獎勵"];
  const text = normalizeMatchText(value);
  return dictionary.filter((term) => text.includes(normalizeMatchText(term)));
}

function daysSince(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? Math.max(0, (Date.now() - time) / 86400000) : 365;
}

function daysUntil(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? (time - Date.now()) / 86400000 : null;
}

function analyzeBenefitMatch(offer, need) {
  if (offer.expires_at && new Date(offer.expires_at) <= new Date()) return { score: 0, reasons: ["活動已結束"] };

  let score = 8;
  const reasons = [];
  const offerText = `${offer.title} ${offer.type} ${offer.audience} ${offer.description} ${offer.value}`;

  if (normalizeMatchText(offer.type) === normalizeMatchText(need.type)) {
    score += 38;
    reasons.push("福利類型完全符合");
  } else if (sameBenefitGroup(offer.type, need.type)) {
    score += 20;
    reasons.push("福利類型高度相關");
  }

  if (normalizeMatchText(offer.audience) === normalizeMatchText(need.audience)) {
    score += 20;
    reasons.push(`適合${need.audience}`);
  } else if (sameBenefitGroup(offer.audience, need.audience) || normalizeMatchText(offerText).includes(normalizeMatchText(need.audience))) {
    score += 10;
    reasons.push("使用情境相近");
  }

  const needTerms = intentTerms(`${need.type} ${need.audience} ${need.volume}`);
  const matchedTerms = needTerms.filter((term) => normalizeMatchText(offerText).includes(normalizeMatchText(term)));
  if (matchedTerms.length) {
    score += Math.min(14, matchedTerms.length * 4);
    reasons.push(`符合：${matchedTerms.slice(0, 2).join("、")}`);
  }

  if (need.volume) {
    const isTradeNeed = /交易|合約|現貨|usdt|\bu\b|手續費/i.test(need.volume);
    const isTradeOffer = /交易|合約|現貨|usdt|手續費|費率/i.test(offerText);
    if (isTradeNeed && isTradeOffer) {
      score += 10;
      reasons.push("交易條件相符");
    } else if (!isTradeNeed && normalizeMatchText(offerText).includes(normalizeMatchText(need.volume))) {
      score += 7;
      reasons.push("需求描述相符");
    }
  }

  const age = daysSince(offer.published_at || offer.created_at);
  if (age <= 3) {
    score += 8;
    reasons.push("近期新增");
  } else if (age <= 14) {
    score += 5;
    reasons.push("近期更新");
  } else if (age <= 30) {
    score += 2;
  }

  if (offer.source === "catalog" && offer.source_url) {
    score += 6;
    reasons.push("可查驗公開來源");
  } else if (offer.provider_id || offer.provider) {
    score += 3;
  }

  const remaining = daysUntil(offer.expires_at);
  if (remaining !== null && remaining >= 0 && remaining <= 7) {
    score += 4;
    reasons.push(`剩 ${Math.max(1, Math.ceil(remaining))} 天截止`);
  }

  return { score: Math.min(98, Math.max(8, Math.round(score))), reasons: reasons.slice(0, 4) };
}

function benefitScore(offer, need) {
  return analyzeBenefitMatch(offer, need).score;
}

function benefitRank(offer, need) {
  const match = benefitScore(offer, need);
  const createdAt = new Date(offer.created_at || 0).getTime();
  const ageDays = Number.isFinite(createdAt) ? Math.max(0, (Date.now() - createdAt) / 86400000) : 365;
  const recencyBoost = Math.max(0, 18 - Math.min(18, ageDays * 0.6));
  const ownBoost = isOwnBenefit(offer) ? 24 : 0;
  return match + recencyBoost + ownBoost;
}

function sortBenefitOffers(offers, need) {
  const sorted = offers
    .map((offer) => {
      const analysis = analyzeBenefitMatch(offer, need);
      return {
        ...offer,
        score: analysis.score,
        matchReasons: analysis.reasons,
        rank: benefitRank(offer, need),
      };
    })
    .sort((a, b) => b.rank - a.rank || new Date(b.created_at || 0) - new Date(a.created_at || 0));
  return diversifyBenefitSources(sorted);
}

function diversifyBenefitSources(offers) {
  const result = [];
  const deferred = [];
  const sourceCounts = new Map();
  const categoryCounts = new Map();

  offers.forEach((offer) => {
    const source = offer.provider || offer.source || "其他來源";
    const sourceCount = sourceCounts.get(source) || 0;
    const categoryCount = categoryCounts.get(offer.type) || 0;
    if (sourceCount < 3 && categoryCount < 5) {
      result.push(offer);
      sourceCounts.set(source, sourceCount + 1);
      categoryCounts.set(offer.type, categoryCount + 1);
    } else {
      deferred.push(offer);
    }
  });

  return [...result, ...deferred];
}

function renderBenefitMatches() {
  if (!els.benefitMatchGrid) return;
  const need = currentBenefitNeed();
  const offers = sortBenefitOffers(getBenefitOffers(), need).slice(0, 6);
  els.benefitMatchGrid.innerHTML = offers.map(benefitCard).join("");
}

function renderBenefitExplore() {
  if (!els.benefitExploreGrid) return;
  const query = (els.benefitExploreSearch?.value || "").trim().toLowerCase();
  const filteredOffers = getBenefitOffers()
    .filter((offer) => {
      const haystack = `${offer.title} ${offer.type} ${offer.audience} ${offer.description} ${offer.value} ${offer.provider}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = activeBenefitFilter === "all" || offer.type === activeBenefitFilter || haystack.includes(activeBenefitFilter.toLowerCase());
      return matchesQuery && matchesFilter;
    });
  const offers = sortBenefitOffers(filteredOffers, currentBenefitNeed()).slice(0, 12);

  els.benefitExploreGrid.innerHTML = offers.length
    ? offers.map(benefitCard).join("")
    : '<article class="benefit-card"><h3>目前沒有符合的福利</h3><p>換一個關鍵字，或先設定需求，平台會幫你找更接近的方案。</p></article>';
}

function renderBenefitOffers() {
  if (!els.benefitOfferList) return;
  const offers = sortBenefitOffers(getBenefitOffers(), currentBenefitNeed()).slice(0, 8);
  els.benefitOfferList.innerHTML = offers.map(benefitCard).join("");
}

function benefitCard(offer) {
  const provider = benefitProvider(offer);
  const ownOffer = isOwnBenefit(offer);
  const profileButton = provider
    ? `<button class="button secondary" type="button" data-profile="${escapeHtml(provider.username)}">查看經營者</button>`
    : "";
  const requestButton = ownOffer
    ? `<button class="button ghost" type="button" data-cancel-benefit="${escapeHtml(offer.id)}">撤銷福利</button>`
    : offer.source === "catalog"
      ? `<button class="button primary" type="button" data-benefit-detail="${escapeHtml(offer.id)}">索取福利</button>`
      : provider?.is_showcase_member
      ? `<button class="button primary" type="button" data-showcase-connect="${escapeHtml(provider.id)}">索取福利</button>`
      : provider
        ? `<button class="button primary" type="button" data-connect="${escapeHtml(provider.id)}">索取福利</button>`
        : `<button class="button primary" type="button" data-benefit-lead="${escapeHtml(offer.id)}">索取福利</button>`;

  return `
    <article class="benefit-card benefit-result">
      <div class="benefit-card-head">
        <span>${escapeHtml(offer.type)}</span>
        <strong>${offer.score || 78}%</strong>
      </div>
      <h3>${escapeHtml(offer.title)}</h3>
      <p>${escapeHtml(offer.description)}</p>
      <div class="member-meta">
        <span>${escapeHtml(offer.audience)}</span>
        <span>${escapeHtml(offer.value)}</span>
        <span>${escapeHtml(offer.provider || "平台經營者")}</span>
        ${offer.source === "catalog" ? `<span>公開來源 · ${dateText(offer.published_at || offer.created_at)}</span>` : ""}
        ${offer.expires_at ? `<span>截止 ${dateText(offer.expires_at)}</span>` : ""}
      </div>
      ${offer.matchReasons?.length ? `<div class="match-reasons">${offer.matchReasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>` : ""}
      <div class="row-actions">
        ${profileButton}
        ${requestButton}
      </div>
    </article>`;
}

function benefitProvider(offer) {
  if (!offer?.provider_id) return null;
  return state.members.find((member) => member.id === offer.provider_id) || null;
}

function openBenefitDetail(id) {
  const url = new URL(window.location.href);
  url.searchParams.set("benefit", id);
  url.hash = "benefit-detail";
  window.history.pushState({}, "", url);
  renderBenefitDetail();
  navigateTo("benefit-detail");
}

function renderBenefitDetail() {
  if (!els.benefitDetailView) return;
  const id = new URLSearchParams(window.location.search).get("benefit");
  const benefit = getBenefitOffers().find((item) => item.id === id && item.source === "catalog");

  if (!benefit) {
    els.benefitDetailView.innerHTML = `
      <article class="benefit-detail-card">
        <p class="eyebrow">Benefit Detail</p>
        <h2>找不到這項福利</h2>
        <p>這項福利可能已過期或撤下，請回到福利探索查看最新內容。</p>
        <a class="button primary" href="#benefit-explore">返回福利探索</a>
      </article>`;
    return;
  }

  els.benefitDetailView.innerHTML = `
    <article class="benefit-detail-card">
      <div class="benefit-detail-header">
        <div>
          <p class="eyebrow">${escapeHtml(benefit.provider)}</p>
          <h2>${escapeHtml(benefit.title)}</h2>
        </div>
        <span class="status new">${escapeHtml(benefit.type)}</span>
      </div>
      ${benefit.image_url ? `<img class="benefit-detail-image" src="${escapeHtml(benefit.image_url)}" alt="${escapeHtml(benefit.title)}" loading="lazy" />` : ""}
      <p class="benefit-detail-summary">${escapeHtml(benefit.description)}</p>
      <div class="benefit-facts">
        <div><small>適合對象</small><strong>${escapeHtml(benefit.audience)}</strong></div>
        <div><small>主要價值</small><strong>${escapeHtml(benefit.value)}</strong></div>
        <div><small>更新時間</small><strong>${dateText(benefit.published_at || benefit.created_at)}</strong></div>
        ${benefit.expires_at ? `<div><small>活動期限</small><strong>${dateText(benefit.expires_at)}</strong></div>` : ""}
      </div>
      <div class="benefit-notice">
        <strong>參加前請確認</strong>
        <p>資格、地區限制、活動期限與實際獎勵以活動主辦方公告為準。平台只整理公開資訊，不代替主辦方承諾。</p>
      </div>
      <div class="row-actions">
        <a class="button primary" href="${escapeHtml(benefitOutboundUrl(benefit))}" target="_blank" rel="noopener noreferrer">查看活動來源</a>
        <a class="button secondary" href="#benefit-explore">返回福利探索</a>
      </div>
    </article>`;
}

function renderExpiredBenefits() {
  if (!els.expiredBenefitGrid) return;
  const expired = (state.catalogBenefits || [])
    .filter((item) =>
      (item.status === "expired" || (item.expires_at && new Date(item.expires_at) <= new Date())) &&
      (!item.is_automated || (item.eligibility_status !== "restricted" && ["zh", "translated"].includes(item.language_status)))
    )
    .sort((a, b) => new Date(b.expires_at || b.updated_at) - new Date(a.expires_at || a.updated_at))
    .slice(0, 40);

  els.expiredBenefitGrid.innerHTML = expired.length
    ? expired
        .map(
          (item) => `
            <article class="benefit-card benefit-result expired-benefit">
              <div class="benefit-card-head">
                <span>${escapeHtml(item.category)}</span>
                <strong>已結束</strong>
              </div>
              <h3>${escapeHtml(item.title)}</h3>
              <p>${escapeHtml(item.summary)}</p>
              <div class="member-meta">
                <span>${escapeHtml(item.source_name)}</span>
                <span>截止 ${dateText(item.expires_at)}</span>
              </div>
              <div class="row-actions">
                <a class="button secondary" href="${escapeHtml(benefitOutboundUrl(item))}" target="_blank" rel="noopener noreferrer">查看原活動</a>
              </div>
            </article>`
        )
        .join("")
    : '<article class="benefit-card"><h3>目前沒有過期活動</h3><p>結束的福利會自動移到這裡保存。</p></article>';
}

function isOwnBenefit(offer) {
  if (!currentUser || !offer) return false;
  const ownerIds = [currentUser.id, currentProfile?.id].filter(Boolean);
  return ownerIds.includes(offer.provider_id);
}

function fillBenefitNeedForm() {
  if (!els.benefitNeedForm || !state.benefitNeeds) return;
  setValue("#benefitNeedType", state.benefitNeeds.type || "最低手續費");
  setValue("#benefitUserType", state.benefitNeeds.audience || "新手入門");
  setValue("#benefitVolume", state.benefitNeeds.volume || "");
}

async function handleBenefitNeedSave(event) {
  event.preventDefault();
  state.benefitNeeds = {
    type: value("#benefitNeedType"),
    audience: value("#benefitUserType"),
    volume: value("#benefitVolume"),
  };
  saveDemoState();
  showToast("已更新你的福利配對");
  renderBenefitMatches();
  navigateTo("benefit-results");
}

async function handleBenefitOfferSave(event) {
  event.preventDefault();
  if (!currentUser) return askLoginFirst("先登入，就能發布可提供的福利");
  const offer = {
    title: value("#offerTitle"),
    type: value("#offerType"),
    audience: value("#offerAudience"),
    description: value("#offerDesc"),
    value: value("#offerValue"),
  };
  if (!offer.title || !offer.description) return showToast("請填福利名稱與說明");

  if (supabaseClient) {
    const payload = {
      title: `${BENEFIT_PREFIX}${offer.title}`,
      description: offer.description,
      country: "台灣",
      budget: `${offer.type}｜${offer.audience}｜${offer.value}`,
      contact_method: "站內訊息",
      author_id: currentProfile?.id || currentUser.id,
      status: "active",
    };
    const { error } = await supabaseClient.from("opportunities").insert(payload);
    if (error) return showToast("福利發布失敗，請先確認會員頁已建立");
  } else {
    state.localBenefitOffers.unshift({
      ...offer,
      id: `local-benefit-${Date.now()}`,
      provider: currentProfile ? publicMemberLabel(currentProfile) : "平台經營者",
      provider_id: currentProfile?.id || currentUser.id,
      created_at: new Date().toISOString(),
    });
    saveDemoState();
  }

  showToast("福利已發布，會出現在用戶端配對中");
  await refreshAll();
}

async function ensureCurrentUserProfile() {
  if (!supabaseClient || !currentUser) return;

  const { data: existing } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("id", currentUser.id)
    .maybeSingle();

  if (existing) return;

  const emailName = (currentUser.email || "member").split("@")[0];
  const baseUsername = cleanUsername(emailName) || `member-${currentUser.id.slice(0, 6)}`;
  const fallbackName = currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || emailName;

  await supabaseClient.from("profiles").insert({
    id: currentUser.id,
    email: currentUser.email,
    username: `${baseUsername}-${currentUser.id.slice(0, 6)}`,
    full_name: fallbackName,
    title: "加密產業成員",
    country: "未填寫",
    languages: ["中文"],
    bio: "我正在建立 Optionality Network 會員頁。",
    resources_have: [],
    resources_need: [],
  });
}

function isAdmin() {
  return Boolean(currentUser?.email && adminEmails.includes(currentUser.email));
}

async function handleEmailLogin(event) {
  event.preventDefault();
  const email = els.loginEmail.value.trim();
  if (!email) return showToast("請輸入 Email");
  if (!supabaseClient) {
    currentUser = { id: "demo-user", email };
    showToast("已登入，可以開始發布需求");
    await refreshAll();
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  showToast(error ? "登入連結寄送失敗，請稍後再試" : "登入連結已寄出，請檢查 Email");
}

async function handleGoogleLogin() {
  if (!supabaseClient) {
    showToast("Google 登入需要連接 Supabase");
    return;
  }

  els.googleLoginButton.disabled = true;
  els.googleLoginButton.textContent = "正在前往 Google...";
  showToast("正在前往 Google 登入");

  const { error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getAuthRedirectUrl(),
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    els.googleLoginButton.disabled = false;
    els.googleLoginButton.textContent = "使用 Google 登入";
    showToast("Google 登入失敗，請稍後再試");
  }
}

async function handleLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  await refreshAll();
}

async function handleProfileSave(event) {
  event.preventDefault();
  if (!currentUser) return askLoginFirst("先登入，就能儲存你的會員頁");

  const profile = {
    id: currentUser.id,
    email: currentUser.email,
    username: cleanUsername(value("#username")),
    full_name: value("#fullName"),
    title: value("#title"),
    country: value("#country"),
    languages: ["中文", "English"],
    bio: value("#bio"),
    telegram: value("#telegram"),
    twitter: value("#twitter"),
    resources_have: selectedTags("have"),
    resources_need: selectedTags("need"),
  };

  if (!profile.username || !profile.full_name || !profile.country) return showToast("請填姓名、Username 和地區");
  if (!profile.resources_have.length || !profile.resources_need.length) return showToast("請至少各選一個「我有」和「我需要」");

  if (supabaseClient) {
    const { data: duplicateProfile, error: duplicateError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("username", profile.username)
      .neq("id", currentUser.id)
      .maybeSingle();

    if (duplicateError) {
      console.error("Username check failed", duplicateError);
      return showToast("暫時無法檢查 Username，請稍後再試");
    }
    if (duplicateProfile) return showToast("這個 Username 已被其他會員使用");

    const { data: existingProfile, error: existingError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (existingError) {
      console.error("Profile lookup failed", existingError);
      return showToast("無法讀取你的會員頁，請重新登入後再試");
    }

    const payload = { ...profile, updated_at: new Date().toISOString() };
    let saveResult;
    if (existingProfile) {
      const { id, ...updates } = payload;
      saveResult = await supabaseClient.from("profiles").update(updates).eq("id", id);
    } else {
      saveResult = await supabaseClient.from("profiles").insert(payload);
    }

    if (saveResult.error) {
      console.error("Profile save failed", saveResult.error);
      if (saveResult.error.code === "23505") return showToast("這個 Username 已被其他會員使用");
      if (saveResult.error.code === "42501") return showToast("會員頁權限尚未設定完成，請重新登入後再試");
      return showToast(`會員頁儲存失敗：${saveResult.error.message || "請稍後再試"}`);
    }
  } else {
    const index = state.members.findIndex((member) => member.id === profile.id);
    const demoProfile = { ...profile, profile_views: 0, connections: 0, completed_partnerships: 0 };
    if (index >= 0) state.members[index] = { ...state.members[index], ...demoProfile };
    else state.members.unshift(demoProfile);
    saveDemoState();
  }

  showToast("會員頁已儲存");
  await refreshAll();
  await runPendingIntent();
  navigateTo("profile");
}

async function handleOpportunitySave(event) {
  event.preventDefault();
  if (!currentUser) return askLoginFirst("先使用 Google 登入，就能發布需求");

  const opportunity = {
    title: value("#oppTitle"),
    description: value("#oppDesc"),
    country: value("#oppCountry"),
    budget: value("#oppBudget") || "預算可議",
    contact_method: value("#oppContact"),
    author_id: currentProfile?.id || currentUser.id,
  };

  if (supabaseClient && !currentProfile) {
    pendingIntent = { type: "opportunity", payload: opportunity };
    return askProfileLater("差一步就能發布：請先補姓名、角色和你有/需要的資源");
  }

  await saveOpportunity(opportunity);
}

async function saveOpportunity(opportunity) {
  const count = await getActiveOpportunityCount();
  if (count >= 3) {
    showToast("你已經有 3 篇有效需求，請先撤銷一篇再發布新的");
    navigateTo("opportunities");
    return;
  }

  const nextOpportunity = { ...opportunity, status: "active" };

  if (supabaseClient) {
    const { error } = await supabaseClient.from("opportunities").insert(nextOpportunity);
    if (error) return showToast("發布失敗，請確認會員頁已儲存，或稍後再試");
  } else {
    state.opportunities.unshift({ ...nextOpportunity, id: `demo-opp-${Date.now()}`, created_at: new Date().toISOString() });
    saveDemoState();
  }

  showToast("需求已發布");
  pendingIntent = null;
  await refreshAll();
}

async function getActiveOpportunityCount() {
  if (!currentUser) return 0;
  if (supabaseClient) {
    const { count, error } = await supabaseClient
      .from("opportunities")
      .select("id", { count: "exact", head: true })
      .eq("author_id", currentUser.id)
      .eq("status", "active")
      .not("title", "like", `${BENEFIT_PREFIX}%`);
    if (error) return 3;
    return count || 0;
  }
  return state.opportunities.filter((item) => item.author_id === currentUser.id && item.status !== "cancelled" && !item.title?.startsWith(BENEFIT_PREFIX)).length;
}

async function handleDocumentClick(event) {
  const benefitDetailButton = event.target.closest("[data-benefit-detail]");
  if (benefitDetailButton) {
    openBenefitDetail(benefitDetailButton.dataset.benefitDetail);
    return;
  }

  const benefitReviewButton = event.target.closest("[data-benefit-review]");
  if (benefitReviewButton) {
    await reviewBenefit(benefitReviewButton.dataset.benefitReview, benefitReviewButton.dataset.reviewAction);
    return;
  }

  const googleLoginButton = event.target.closest("[data-google-login]");
  if (googleLoginButton) {
    await handleGoogleLogin();
    return;
  }

  const navLink = event.target.closest("#mainNav a");
  if (navLink) closeMenu();
  else if (document.body.classList.contains("nav-open") && !event.target.closest("#mainNav") && !event.target.closest("#menuButton")) closeMenu();

  const homeLoginLink = event.target.closest('.hero .hero-actions a[href="#quick-start"]');
  if (homeLoginLink) {
    event.preventDefault();
    document.querySelector("#loginForm")?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const profileButton = event.target.closest("[data-profile]");
  if (profileButton) {
    const username = profileButton.dataset.profile;
    window.history.pushState({}, "", `?u=${encodeURIComponent(username)}#profile`);
    renderProfile();
    navigateTo("profile");
    return;
  }

  const connectButton = event.target.closest("[data-connect]");
  if (connectButton) {
    await createRequest(connectButton.dataset.connect);
    return;
  }

  const benefitLeadButton = event.target.closest("[data-benefit-lead]");
  if (benefitLeadButton) {
    if (!currentUser) return askLoginFirst("先登入，就能索取福利並開始對話");
    showToast("已收到你的福利需求，我會優先幫你媒合");
    navigateTo("requests");
    return;
  }

  const showcaseConnectButton = event.target.closest("[data-showcase-connect]");
  if (showcaseConnectButton) {
    await createShowcaseRequest(showcaseConnectButton.dataset.showcaseConnect);
    return;
  }

  const opportunityButton = event.target.closest("[data-opportunity]");
  if (opportunityButton) {
    await createOpportunityRequest(opportunityButton.dataset.opportunity);
    return;
  }

  const requestButton = event.target.closest("[data-request-action]");
  if (requestButton) {
    await updateRequest(requestButton.dataset.requestId, requestButton.dataset.requestAction);
    return;
  }

  const chatButton = event.target.closest("[data-open-chat]");
  if (chatButton) {
    openMessageModal(chatButton.dataset.openChat);
    return;
  }

  const cancelBenefitButton = event.target.closest("[data-cancel-benefit]");
  if (cancelBenefitButton) {
    await cancelBenefit(cancelBenefitButton.dataset.cancelBenefit);
    return;
  }

  const cancelOppButton = event.target.closest("[data-cancel-opportunity]");
  if (cancelOppButton) await cancelOpportunity(cancelOppButton.dataset.cancelOpportunity);
}

function closeMenu() {
  document.body.classList.remove("nav-open");
  els.menuButton?.setAttribute("aria-expanded", "false");
}

async function createRequest(receiverId) {
  if (!currentUser) return askLoginFirst("先使用 Google 登入，就能發送合作請求");
  if (receiverId === currentUser.id) return showToast("這是你自己的會員頁");

  const receiver = state.members.find((member) => member.id === receiverId);
  const request = {
    sender_id: currentProfile?.id || currentUser.id,
    receiver_id: receiverId,
    message: `我想和 ${receiver ? publicMemberLabel(receiver) : "這位會員"} 交換資源，看看是否能合作。`,
    status: "pending",
  };

  if (supabaseClient && !currentProfile) {
    pendingIntent = { type: "request", payload: request };
    return askProfileLater("發送前先補一點資料，對方才知道你是誰");
  }

  await saveRequest(request);
}

async function createShowcaseRequest(showcaseId) {
  if (!currentUser) return askLoginFirst("先使用 Google 登入，就能發送合作請求");

  const showcaseMember = state.members.find((member) => member.id === showcaseId);
  const routeTarget = getShowcaseRouteTarget();
  if (!routeTarget) return showToast("目前沒有可接收的真人窗口，請稍後再試");
  if (routeTarget.id === currentUser.id) return showToast("這筆配對會由你的帳號承接");

  const request = {
    sender_id: currentProfile?.id || currentUser.id,
    receiver_id: routeTarget.id,
    message: `我想找 ${showcaseMember ? publicMemberLabel(showcaseMember) : "這類會員"} 這類資源：${showcaseMember?.resources_have?.slice(0, 3).join("、") || "加密產業合作"}。請協助媒合。`,
    status: "pending",
  };

  await saveRequest(request);
}

function getShowcaseRouteTarget() {
  const adminProfile = state.members.find((member) => !member.is_showcase_member && adminEmails.includes(member.email));
  if (adminProfile && adminProfile.id !== currentUser?.id) return adminProfile;
  return state.members.find((member) => !member.is_showcase_member && member.id !== currentUser?.id) || null;
}

async function saveRequest(request) {
  let requestId = null;
  let pendingRequest = null;

  if (supabaseClient) {
    requestId = crypto.randomUUID();
    const cloudRequest = { ...request, id: requestId };
    const { error } = await supabaseClient.from("partnership_requests").insert(cloudRequest);
    if (error) return showToast("請求送出失敗，請稍後再試");
    const receiver = state.members.find((member) => member.id === request.receiver_id);
    pendingRequest = { ...cloudRequest, receiver, created_at: new Date().toISOString() };
    state.requests.unshift(pendingRequest);
    await sendMessage(requestId, request.message, { silent: true });
  } else {
    const receiver = state.members.find((member) => member.id === request.receiver_id);
    const id = `demo-req-${Date.now()}`;
    requestId = id;
    pendingRequest = { ...request, id, receiver, created_at: new Date().toISOString() };
    state.requests.unshift(pendingRequest);
    state.messages.push({
      id: `demo-msg-${Date.now()}`,
      request_id: id,
      sender_id: currentUser.id,
      body: request.message,
      created_at: new Date().toISOString(),
    });
    saveDemoState();
  }

  showToast("合作請求已送出");
  pendingIntent = null;
  await refreshAll();
  if (pendingRequest && !state.requests.some((item) => item.id === pendingRequest.id)) {
    state.requests.unshift(pendingRequest);
    renderApp();
  }
  navigateTo("requests");
  if (requestId) openMessageModal(requestId);
}

async function createOpportunityRequest(opportunityId) {
  if (!currentUser) return askLoginFirst("先使用 Google 登入，就能回覆這個需求");
  const opportunity = state.opportunities.find((item) => item.id === opportunityId);
  showToast(`已記錄你想合作：${opportunity?.title || "這個需求"}`);
}

async function updateRequest(id, action) {
  const status = action === "accept" ? "accepted" : "later";
  if (supabaseClient) {
    const { error } = await supabaseClient.from("partnership_requests").update({ status }).eq("id", id);
    if (error) return showToast("更新失敗，請稍後再試");
  } else {
    const request = state.requests.find((item) => item.id === id);
    if (request) request.status = status;
    saveDemoState();
  }
  showToast(status === "accepted" ? "已接受合作請求" : "已標記稍後處理");
  await refreshAll();
}

async function cancelOpportunity(id) {
  const opportunity = state.opportunities.find((item) => item.id === id);
  if (!opportunity) return;
  if (opportunity.author_id !== currentUser?.id && !isAdmin()) return showToast("只能撤銷你自己發布的需求");

  if (supabaseClient) {
    const { error } = await supabaseClient.from("opportunities").update({ status: "cancelled" }).eq("id", id);
    if (error) return showToast("撤銷失敗，請稍後再試");
  } else {
    opportunity.status = "cancelled";
    saveDemoState();
  }

  showToast("需求已撤銷，可以再發布新的需求");
  await refreshAll();
}

async function cancelBenefit(id) {
  const localOffer = (state.localBenefitOffers || []).find((item) => item.id === id);
  if (localOffer) {
    if (!isOwnBenefit(localOffer) && !isAdmin()) return showToast("只能撤銷自己發布的福利");
    localOffer.status = "cancelled";
    saveDemoState();
    showToast("福利已撤銷");
    await refreshAll();
    return;
  }

  const opportunity = state.opportunities.find((item) => item.id === id && item.title?.startsWith(BENEFIT_PREFIX));
  if (!opportunity) return showToast("找不到這項福利");
  if (opportunity.author_id !== currentUser?.id && !isAdmin()) return showToast("只能撤銷自己發布的福利");

  if (supabaseClient) {
    const { error } = await supabaseClient.from("opportunities").update({ status: "cancelled" }).eq("id", id);
    if (error) return showToast("撤銷失敗，請稍後再試");
  } else {
    opportunity.status = "cancelled";
    saveDemoState();
  }

  showToast("福利已撤銷");
  await refreshAll();
}

function askLoginFirst(message) {
  showToast(message);
  navigateTo("home");
  setTimeout(() => document.querySelector("#loginForm")?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
}

function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function askProfileLater(message) {
  showToast(message);
  prefillProfileFromEmail();
  navigateTo("profile");
}

function prefillProfileFromEmail() {
  if (!currentUser?.email || value("#username")) return;
  const name = currentUser.email.split("@")[0];
  setValue("#fullName", name);
  setValue("#username", cleanUsername(name));
}

async function runPendingIntent() {
  if (!pendingIntent || !currentProfile) return;
  if (pendingIntent.type === "opportunity") {
    await saveOpportunity({ ...pendingIntent.payload, author_id: currentProfile.id });
  }
  if (pendingIntent.type === "request") {
    await saveRequest({ ...pendingIntent.payload, sender_id: currentProfile.id });
  }
}

function renderMembers() {
  const query = els.memberSearch.value.trim().toLowerCase();
  const visible = state.members
    .filter((member) => {
      const haystack = [
        member.title,
        member.country,
        member.bio,
        ...(member.resources_have || []),
        ...(member.resources_need || []),
      ]
        .join(" ")
        .toLowerCase();
      return (!query || haystack.includes(query)) && (activeFilter === "all" || haystack.includes(activeFilter.toLowerCase()));
    });

  els.memberGrid.innerHTML = visible.length
    ? visible.map(memberCard).join("")
    : '<article class="member-card"><h3>沒有找到符合條件的會員</h3><p>試試搜尋 KOL、台灣、Telegram 社群、交易所合作或 AI 自動化。</p></article>';
}

function renderMatches() {
  if (!els.matchGrid) return;

  const matches = getRecommendedMembers().slice(0, 6);
  els.matchGrid.innerHTML = matches.length
    ? matches.map(matchCard).join("")
    : '<article class="member-card"><h3>還沒有足夠資料配對</h3><p>先補上你的會員頁，系統就能依照你的資源與需求推薦人選。</p></article>';
}

const memberResourceGroups = [
  ["KOL 推廣", "KOL 人脈", "Twitter/X 受眾", "YouTube 頻道", "媒體曝光", "媒體網絡"],
  ["Telegram 社群", "Discord 社群", "交易社群", "社群經理", "社群主"],
  ["交易所合作", "交易所資源", "交易所 BD", "Exchange BD", "聯盟推廣夥伴"],
  ["項目合作", "項目資源", "VC 人脈", "募資", "投資人"],
  ["AI 自動化", "開發者", "Web3 工具", "客服支援", "數據分析"],
  ["影片剪輯", "平面設計", "SEO", "搜尋引擎優化", "翻譯"],
];

function relatedResource(left, right) {
  const a = normalizeMatchText(left);
  const b = normalizeMatchText(right);
  if (!a || !b) return false;
  if (a === b || a.includes(b) || b.includes(a)) return true;
  return memberResourceGroups.some((group) => group.some((item) => a.includes(normalizeMatchText(item))) && group.some((item) => b.includes(normalizeMatchText(item))));
}

function resourceMatches(targets, supplies) {
  const exact = [];
  const related = [];
  targets.forEach((target) => {
    const exactSupply = supplies.find((supply) => normalizeMatchText(supply) === normalizeMatchText(target));
    if (exactSupply) exact.push(target);
    else if (supplies.some((supply) => relatedResource(target, supply))) related.push(target);
  });
  return { exact, related };
}

function languageOverlap(left = [], right = []) {
  return left.filter((language) => right.some((other) => relatedResource(language, other)));
}

function complementaryRoles(left = "", right = "") {
  const pairs = [
    ["項目方", "KOL"], ["項目方", "媒體"], ["交易所", "社群"], ["交易所", "聯盟"],
    ["BD", "KOL"], ["BD", "社群"], ["創辦人", "開發者"], ["創辦人", "設計"],
    ["社群", "分析師"], ["媒體", "項目"],
  ];
  return pairs.some(([a, b]) => (left.includes(a) && right.includes(b)) || (left.includes(b) && right.includes(a)));
}

function profileCompleteness(member) {
  const fields = [
    member.title,
    member.country,
    member.bio,
    member.languages?.length,
    member.resources_have?.length,
    member.resources_need?.length,
  ];
  return fields.filter(Boolean).length / fields.length;
}

function analyzeMemberMatch(member) {
  const myHave = currentProfile?.resources_have || [];
  const myNeed = currentProfile?.resources_need || [];
  const theyHave = member.resources_have || [];
  const theyNeed = member.resources_need || [];
  const needFit = resourceMatches(myNeed, theyHave);
  const giveFit = resourceMatches(theyNeed, myHave);
  const reasons = [];
  let percent = currentProfile ? 12 : 18;

  if (needFit.exact.length) {
    percent += Math.min(32, needFit.exact.length * 16);
    reasons.push(`能提供：${needFit.exact.slice(0, 2).join("、")}`);
  }
  if (needFit.related.length) {
    percent += Math.min(14, needFit.related.length * 7);
    reasons.push(`資源相關：${needFit.related.slice(0, 2).join("、")}`);
  }
  if (giveFit.exact.length) {
    percent += Math.min(24, giveFit.exact.length * 12);
    reasons.push(`正在找：${giveFit.exact.slice(0, 2).join("、")}`);
  }
  if (giveFit.related.length) {
    percent += Math.min(10, giveFit.related.length * 5);
    reasons.push("雙方資源可互補");
  }

  if (currentProfile?.country && member.country && normalizeMatchText(currentProfile.country) === normalizeMatchText(member.country)) {
    percent += 8;
    reasons.push("同地區合作");
  }

  const sharedLanguages = languageOverlap(currentProfile?.languages || [], member.languages || []);
  if (sharedLanguages.length) {
    percent += Math.min(8, sharedLanguages.length * 4);
    reasons.push(`共同語言：${sharedLanguages.slice(0, 2).join("、")}`);
  }

  if (complementaryRoles(currentProfile?.title || "", member.title || "")) {
    percent += 6;
    reasons.push("角色互補");
  }

  const completeness = profileCompleteness(member);
  if (completeness >= 0.8) {
    percent += 5;
    reasons.push("合作資料完整");
  } else if (completeness >= 0.5) {
    percent += 2;
  }

  const reputation = (member.connections || 0) + (member.completed_partnerships || 0) * 3;
  if (reputation > 0) {
    percent += Math.min(8, Math.round(Math.log2(reputation + 1) * 2));
    if ((member.completed_partnerships || 0) >= 3) reasons.push("具合作紀錄");
  }

  const recentDays = daysSince(member.created_at || member.member_since);
  if (recentDays <= 30) percent += 3;
  if (currentProfile && !needFit.exact.length && !needFit.related.length && !giveFit.exact.length && !giveFit.related.length) percent -= 10;

  const tieBreaker = Math.abs(hashText(`${member.id}${currentProfile?.id || ""}`)) % 7;
  const displayPercent = Math.min(97, Math.max(18, Math.round(percent)));
  const realProfilePriority = member.is_showcase_member ? 0 : 18;
  return {
    member,
    percent: displayPercent,
    score: displayPercent + realProfilePriority + tieBreaker / 10,
    reasons: reasons.slice(0, 4),
  };
}

function getRecommendedMembers() {
  return state.members
    .filter((member) => member.id !== currentUser?.id)
    .map(analyzeMemberMatch)
    .sort((a, b) => b.score - a.score || b.percent - a.percent);
}

function publicMemberLabel(member) {
  if (member.id === currentUser?.id) return member.full_name || "我的會員頁";
  const role = member.title || "加密產業成員";
  const country = member.country || "台灣";
  const code = String(Math.abs(hashText(member.id || member.username || role)) % 900 + 100);
  return `${country}${role} #${code}`;
}

function publicMemberSummary(member) {
  const have = member.resources_have || [];
  const primary = have[0] || "加密產業資源";
  const secondary = have[1] || "合作網絡";
  const third = have[2] || "成長合作";
  const need = member.resources_need || [];
  const wanted = need[0] || "合適合作方";
  const base = Math.abs(hashText(member.username || member.id || primary));
  const volume = 120 + (base % 880);
  const communitySize = 1800 + (base % 13200);
  const monthlyVolume = 80 + (base % 720);
  const responseHours = 2 + (base % 22);
  const templates = [
    `手上有${primary}與${secondary}，過去常協助項目做上市前暖場、社群導流與初期口碑測試。適合先用平台確認合作方向。`,
    `偏向實戰型資源方，能提供${primary}、${secondary}，目前主要尋找${wanted}。對方接受後可再交換完整聯絡方式。`,
    `具備約 ${communitySize.toLocaleString("zh-TW")} 人規模的垂直受眾，擅長把${third}轉成可執行的推廣節奏。`,
    `熟悉台灣加密圈合作流程，可支援${primary}與${secondary}，比較適合有明確預算、檔期或成長目標的需求。`,
    `月觸及約 ${volume.toLocaleString("zh-TW")}K+，內容與社群互動穩定，適合新品曝光、活動導流或長期合作測試。`,
    `資源偏精準，不主打大量曝光；擅長用${primary}連到對的人，合作前會先確認受眾、檔期與轉換目標。`,
    `可協助${primary}相關需求，通常 ${responseHours} 小時內回覆站內請求。接受合作後再開放更多個人資訊。`,
    `過去合作多以${secondary}與${wanted}為主，適合想先低成本驗證市場反應的 Web3 團隊。`,
    `具備台灣市場在地觸點，能協助${primary}、${third}與初步合作評估，適合需要快速找窗口的 BD 或項目方。`,
    `偏長期型合作資源，重視雙方是否互補；若需求明確，可透過平台先交換合作目的與基本條件。`,
    `可處理約 ${monthlyVolume.toLocaleString("zh-TW")} 萬 USDT 等級的交易/推廣相關需求評估，適合交易所、社群與聯盟合作。`,
    `擅長把${primary}包裝成可落地的合作方案，包含節奏安排、內容切角與合作後追蹤。`,
  ];
  if (member.id === currentUser?.id) return member.bio || "這是你的會員頁。";
  return templates[base % templates.length];
}

function hashText(text = "") {
  return Array.from(text).reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function matchCard(match) {
  const { member, percent, reasons } = match;
  const confidence = percent >= 82 ? "高度契合" : percent >= 62 ? "值得認識" : percent >= 42 ? "可能互補" : "探索人選";
  return `
    <article class="member-card match-result">
      <div class="member-top">
        <span class="avatar">${initials(publicMemberLabel(member))}</span>
        <div>
          <h3>${escapeHtml(publicMemberLabel(member))}</h3>
          <small>${escapeHtml(member.title)} · ${escapeHtml(member.country)}</small>
        </div>
        <strong class="match-score">${percent}% · ${confidence}</strong>
      </div>
      ${reasons.length ? `<div class="match-reasons">${reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}</div>` : "<p>補充更多資源與需求後，系統會提供更精準的推薦依據。</p>"}
      <div class="tag-list">${tags(member.resources_have)}</div>
      <div class="row-actions">
        <button class="button secondary" type="button" data-profile="${escapeHtml(member.username)}">查看頁面</button>
        ${
          member.is_showcase_member
            ? `<button class="button primary" type="button" data-showcase-connect="${member.id}">建立連結</button>`
            : `<button class="button primary" type="button" data-connect="${member.id}">建立連結</button>`
        }
      </div>
    </article>`;
}

function memberCard(member) {
  return `
    <article class="member-card">
      <div class="member-top">
        <span class="avatar">${initials(publicMemberLabel(member))}</span>
        <div>
          <h3>${escapeHtml(publicMemberLabel(member))}</h3>
          <small>${escapeHtml(member.title)} · ${escapeHtml(member.country)}</small>
        </div>
      </div>
      <p>${escapeHtml(publicMemberSummary(member))}</p>
      <div class="tag-list">${tags(member.resources_have)}</div>
      <div class="tag-list">${tags(member.resources_need, "need")}</div>
      <div class="member-meta">
        <span>瀏覽 ${member.profile_views || 0}</span>
        <span>連結 ${member.connections || 0}</span>
        <span>已完成 ${member.completed_partnerships || 0}</span>
        <span>接受請求後解鎖資訊</span>
      </div>
      <div class="row-actions">
        <button class="button secondary" type="button" data-profile="${escapeHtml(member.username)}">查看頁面</button>
        ${
          member.is_showcase_member
            ? `<button class="button primary" type="button" data-showcase-connect="${member.id}">建立連結</button>`
            : `<button class="button primary" type="button" data-connect="${member.id}">建立連結</button>`
        }
      </div>
    </article>`;
}

function renderOpportunities() {
  const visible = state.opportunities.filter(
    (item) => !item.title?.startsWith(BENEFIT_PREFIX) && (item.status !== "cancelled" || item.author_id === currentUser?.id || isAdmin())
  );
  els.opportunityList.innerHTML = visible.length
    ? visible
        .map(
          (item) => `
      <article class="opportunity-card">
        <header>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <small>${escapeHtml(item.country || "遠端")} · ${dateText(item.created_at)}${item.status === "cancelled" ? " · 已撤銷" : ""}</small>
          </div>
          <span class="budget">${escapeHtml(item.budget || "預算可議")}</span>
        </header>
        <p>${escapeHtml(item.description)}</p>
        <div class="member-meta">
          <span>${escapeHtml(item.author_id === currentUser?.id ? item.contact_method || "站內合作請求" : "透過平台回覆")}</span>
        </div>
        <div class="row-actions">
          ${item.status === "cancelled" ? "" : `<button class="button secondary" type="button" data-opportunity="${item.id}">我想合作</button>`}
          ${
            item.author_id === currentUser?.id && item.status !== "cancelled"
              ? `<button class="button ghost" type="button" data-cancel-opportunity="${item.id}">撤銷需求</button>`
              : ""
          }
        </div>
      </article>`
        )
        .join("")
    : '<article class="opportunity-card"><h3>目前沒有需求</h3><p>發布第一個需求，讓適合的人找到你。</p></article>';
}

function renderRequests() {
  const requests = state.requests || [];
  els.requestInbox.innerHTML = requests.length
    ? requests.map(requestCard).join("")
    : '<article><span class="status">空</span><h3>目前沒有合作請求</h3><p>去會員探索頁發送第一個合作請求。</p></article>';
}

function requestCard(request) {
  const senderName = request.sender?.full_name || request.sender?.username || "你";
  const receiverName = request.receiver?.full_name || request.receiver?.username || "對方";
  const incoming = request.receiver_id === currentUser?.id;
  const label = statusLabel(request.status);
  return `
    <article>
      <span class="status ${request.status === "pending" ? "new" : ""}">${label}</span>
      <h3>${incoming ? senderName + " 想和你合作" : "你已向 " + receiverName + " 發送請求"}</h3>
      <p>${escapeHtml(request.message || "希望交換資源並討論合作。")}</p>
      <p class="unlock-note">${request.status === "accepted" ? "已接受：可以在訊息中交換個人資訊與後續聯絡方式。" : "聯絡方式保護中：對方接受後即可解鎖個人資訊。"}</p>
      ${
        incoming && request.status === "pending"
          ? `<div class="row-actions">
              <button class="button primary" type="button" data-request-action="accept" data-request-id="${request.id}">接受</button>
              <button class="button ghost" type="button" data-request-action="later" data-request-id="${request.id}">稍後處理</button>
              <button class="button secondary" type="button" data-open-chat="${request.id}">訊息溝通</button>
            </div>`
          : `<div class="row-actions">
              <button class="button secondary" type="button" data-open-chat="${request.id}">訊息溝通</button>
              <span class="metrics-mini"><span>${label}</span><span>${dateText(request.created_at)}</span></span>
            </div>`
      }
    </article>`;
}

function renderNotificationBell() {
  if (!currentUser) {
    els.notificationBell.classList.add("hidden");
    return;
  }

  const incomingPending = state.requests.filter(
    (request) => request.receiver_id === currentUser.id && request.status === "pending"
  ).length;
  const incomingMessages = state.messages.filter((message) => message.sender_id !== currentUser.id).length;
  const count = incomingPending + incomingMessages;
  els.notificationCount.textContent = count;
  els.notificationBell.classList.toggle("hidden", count === 0);
}

function openMessageModal(requestId) {
  activeRequestId = requestId;
  const request = state.requests.find((item) => item.id === requestId);
  if (!request) return;

  const otherName =
    request.receiver_id === currentUser?.id
      ? request.sender?.full_name || request.sender?.username || "對方"
      : request.receiver?.full_name || request.receiver?.username || "對方";

  els.messageTitle.textContent = `與 ${otherName} 的合作訊息`;
  renderMessageThread();
  els.messageModal.classList.remove("hidden");
  els.messageInput.focus();
}

function closeMessageModal() {
  activeRequestId = null;
  els.messageModal.classList.add("hidden");
  els.messageInput.value = "";
}

function renderMessageThread() {
  const messages = state.messages.filter((message) => message.request_id === activeRequestId);
  els.messageThread.innerHTML = messages.length
    ? messages
        .map((message) => {
          const mine = message.sender_id === currentUser?.id;
          const senderName = message.sender?.full_name || message.sender?.username || (mine ? "你" : "對方");
          return `<div class="message-bubble ${mine ? "mine" : ""}">
            <small>${escapeHtml(senderName)} · ${dateText(message.created_at)}</small>
            <p>${escapeHtml(message.body)}</p>
          </div>`;
        })
        .join("")
    : '<p class="empty-text">還沒有訊息，先打聲招呼吧。</p>';
  els.messageThread.scrollTop = els.messageThread.scrollHeight;
}

async function handleMessageSend(event) {
  event.preventDefault();
  const body = els.messageInput.value.trim();
  if (!activeRequestId || !body) return;
  await sendMessage(activeRequestId, body);
  els.messageInput.value = "";
}

async function sendMessage(requestId, body, options = {}) {
  if (!currentUser) return askLoginFirst("先登入，就能回覆訊息");

  const message = {
    request_id: requestId,
    sender_id: currentProfile?.id || currentUser.id,
    body,
  };

  if (supabaseClient) {
    const { error } = await supabaseClient.from("partnership_messages").insert(message);
    if (error) return showToast("訊息送出失敗，請稍後再試");
  } else {
    state.messages.push({
      ...message,
      id: `demo-msg-${Date.now()}`,
      sender: currentProfile ? { full_name: currentProfile.full_name, username: currentProfile.username } : null,
      created_at: new Date().toISOString(),
    });
    saveDemoState();
  }

  if (!options.silent) showToast("訊息已送出");
  await refreshAll();
  if (activeRequestId === requestId) renderMessageThread();
}

function renderProfile() {
  const username = new URLSearchParams(window.location.search).get("u");
  const profile = username
    ? state.members.find((member) => member.username === username)
    : currentProfile || null;

  if (!profile) {
    els.profileView.innerHTML = '<article class="member-card"><h3>還沒有會員頁</h3><p>補完上面的簡單資料後，別人就知道你能提供什麼、正在找什麼。</p></article>';
    els.profileLink.textContent = "會員頁越清楚，越容易收到有效合作。";
    return;
  }

  const url = `${window.location.origin}${window.location.pathname}?u=${profile.username}#profile`;
  const isOwnProfile = profile.id === currentUser?.id;
  els.profileLink.innerHTML = isOwnProfile
    ? `你的公開頁只顯示資源，不公開聯絡方式：<a href="${url}">${url}</a>`
    : "這是匿名資源頁。想合作需要先透過平台發送請求。";
  els.profileView.innerHTML = `
    <article class="profile-card">
      <div class="member-top">
        <span class="avatar">${initials(publicMemberLabel(profile))}</span>
        <div>
          <h3>${escapeHtml(publicMemberLabel(profile))}</h3>
          <small>${escapeHtml(profile.title)} · ${escapeHtml(profile.country)}</small>
        </div>
      </div>
      <p>${escapeHtml(isOwnProfile ? profile.bio || "這是你的會員頁。" : publicMemberSummary(profile))}</p>
      <h4>我有</h4>
      <div class="tag-list">${tags(profile.resources_have)}</div>
      <h4>我需要</h4>
      <div class="tag-list">${tags(profile.resources_need, "need")}</div>
      <div class="member-meta">
        <span>聯絡方式需透過平台媒合</span>
        <span>雙方有合作意願後再解鎖</span>
      </div>
      <button class="button primary" type="button" data-connect="${profile.id}">建立連結</button>
    </article>`;
}

function renderAdmin() {
  if (!isAdmin()) {
    return;
  }

  document.querySelector("#statMembers").textContent = state.members.length;
  document.querySelector("#statOpps").textContent = state.opportunities.length;
  document.querySelector("#statRequests").textContent = state.requests.length;
  document.querySelector("#statActiveOpps").textContent = state.opportunities.filter((item) => item.status !== "cancelled").length;
  renderSignupLeads();
  renderBenefitReview();
}

function renderBenefitReview() {
  if (!els.benefitReviewList || !els.benefitReviewCount) return;
  const items = (state.catalogBenefits || [])
    .filter((item) => item.status === "active")
    .sort((a, b) => new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0));
  els.benefitReviewCount.textContent = items.length;
  els.benefitReviewList.innerHTML = items.length
    ? items.slice(0, 100).map((item) => `
        <div class="admin-item benefit-review-item">
          <div class="lead-meta">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.source_name)} · ${dateText(item.published_at || item.created_at)}</small>
            <small>${item.language_status === "translated" ? "已翻譯為繁體中文" : "繁體中文"} · ${item.eligibility_status === "eligible" ? "台灣資格已確認" : "未發現台灣限制"}</small>
          </div>
          <div class="row-actions">
            <a class="button secondary" href="${escapeHtml(benefitOutboundUrl(item))}" target="_blank" rel="noopener noreferrer">查看活動</a>
            <button class="button ghost" type="button" data-benefit-review="${item.id}" data-review-action="reject">立即撤下</button>
          </div>
        </div>`).join("")
    : '<div class="admin-item"><div class="lead-meta"><strong>目前沒有公開福利</strong><small>下一次抓取成功後會自動顯示在這裡。</small></div></div>';
}

async function reviewBenefit(id, action) {
  if (!isAdmin() || !supabaseClient) return showToast("只有管理員可以管理福利");
  const item = (state.catalogBenefits || []).find((benefit) => benefit.id === id);
  if (action === "approve" && item?.language_status === "review") {
    return showToast("這筆活動尚未完成繁體中文翻譯，不能公開");
  }
  const updates = action === "approve"
    ? {
        status: "active",
        eligibility_status: "eligible",
        eligibility_regions: ["TW"],
        eligibility_note: "管理員已確認台灣用戶可參加",
        updated_at: new Date().toISOString(),
      }
    : { status: "cancelled", updated_at: new Date().toISOString() };
  const { error } = await supabaseClient.from("benefit_catalog").update(updates).eq("id", id);
  if (error) return showToast("福利狀態更新失敗");
  showToast(action === "approve" ? "已公開福利" : "福利已撤下");
  await refreshAll();
}

function renderSignupLeads() {
  if (!els.leadList || !els.leadCount) return;
  const leads = state.signupLeads || [];
  els.leadCount.textContent = leads.length;
  els.leadList.innerHTML = leads.length
    ? leads
        .slice(0, 100)
        .map(
          (lead) => `
            <div class="admin-item">
              <div class="lead-meta">
                <strong>${escapeHtml(lead.email)}</strong>
                <small>${escapeHtml(providerLabel(lead.provider))} · 註冊 ${dateText(lead.signed_up_at)}</small>
              </div>
              <small>最近登入 ${lead.last_sign_in_at ? dateText(lead.last_sign_in_at) : "尚無紀錄"}</small>
            </div>`
        )
        .join("")
    : '<div class="admin-item"><div class="lead-meta"><strong>尚無登入名單</strong><small>執行 lead-capture.sql 後，既有帳號也會自動匯入。</small></div></div>';
}

function providerLabel(provider) {
  if (provider === "google") return "Google";
  if (provider === "email") return "Email";
  return provider || "Email";
}

function downloadSignupLeads() {
  if (!isAdmin()) return showToast("只有管理員可以下載名單");
  const leads = state.signupLeads || [];
  if (!leads.length) return showToast("目前沒有可下載的名單");

  const rows = [
    ["Email", "登入方式", "註冊時間", "最近登入"],
    ...leads.map((lead) => [
      lead.email,
      providerLabel(lead.provider),
      lead.signed_up_at || "",
      lead.last_sign_in_at || "",
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `optionality-signup-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("名單 CSV 已下載");
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function fillProfileForm(profile) {
  if (!profile) return;
  setValue("#fullName", profile.full_name);
  setValue("#username", profile.username);
  setValue("#country", profile.country);
  setValue("#title", profile.title);
  setValue("#telegram", profile.telegram);
  setValue("#twitter", profile.twitter);
  setValue("#bio", profile.bio);
  setSelectedTags("have", profile.resources_have || []);
  setSelectedTags("need", profile.resources_need || []);
}

function selectedTags(field) {
  return Array.from(document.querySelectorAll(`.tag-picker[data-field="${field}"] button.selected`)).map((button) =>
    button.textContent.trim()
  );
}

function setSelectedTags(field, values) {
  document.querySelectorAll(`.tag-picker[data-field="${field}"] button`).forEach((button) => {
    button.classList.toggle("selected", values.includes(button.textContent.trim()));
  });
}

function value(selector) {
  return document.querySelector(selector).value.trim();
}

function setValue(selector, nextValue) {
  document.querySelector(selector).value = nextValue || "";
}

function cleanUsername(username) {
  return username.replace(/^@/, "").toLowerCase().replace(/[^a-z0-9-_]/g, "");
}

function tags(values = [], extraClass = "") {
  return values.map((tag) => `<span class="tag ${extraClass}">${escapeHtml(tag)}</span>`).join("");
}

function initials(name = "ON") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function statusLabel(status) {
  return { pending: "新請求", accepted: "已接受", later: "稍後處理" }[status] || "已送出";
}

function dateText(value) {
  if (!value) return "剛剛";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "剛剛";
  return date.toLocaleDateString("zh-Hant", { month: "short", day: "numeric" });
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char];
  });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2800);
}
