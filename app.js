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
      country: "新加坡",
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

let state = loadDemoState();
state.members ||= [];
state.opportunities ||= [];
state.requests ||= [];
state.messages ||= [];
let currentUser = null;
let currentProfile = null;
let activeFilter = "all";
let pendingIntent = null;
let activeRequestId = null;

const els = {
  logoutButton: document.querySelector("#logoutButton"),
  loginForm: document.querySelector("#loginForm"),
  loginEmail: document.querySelector("#loginEmail"),
  googleLoginButton: document.querySelector("#googleLoginButton"),
  authMessage: document.querySelector("#authMessage"),
  profileForm: document.querySelector("#profileForm"),
  memberGrid: document.querySelector("#memberGrid"),
  memberSearch: document.querySelector("#memberSearch"),
  opportunityForm: document.querySelector("#opportunityForm"),
  opportunityList: document.querySelector("#opportunityList"),
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
  profileView: document.querySelector("#profileView"),
  profileLink: document.querySelector("#profileLink"),
  toast: document.querySelector("#toast"),
};

init();

async function init() {
  wireEvents();
  if (supabaseClient) await initCloudMode();
  else initDemoMode();
  await refreshAll();
}

function wireEvents() {
  document.querySelectorAll(".tag-picker button").forEach((button) => {
    button.addEventListener("click", () => button.classList.toggle("selected"));
  });

  document.querySelectorAll(".filter").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".filter").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      activeFilter = button.dataset.filter;
      renderMembers();
    });
  });

  els.memberSearch.addEventListener("input", renderMembers);
  els.loginForm.addEventListener("submit", handleEmailLogin);
  els.googleLoginButton.addEventListener("click", handleGoogleLogin);
  els.logoutButton.addEventListener("click", handleLogout);
  els.profileForm.addEventListener("submit", handleProfileSave);
  els.opportunityForm.addEventListener("submit", handleOpportunitySave);
  els.notificationBell.addEventListener("click", () => {
    location.hash = "requests";
    showToast("已帶你到合作請求");
  });
  els.closeMessageModal.addEventListener("click", closeMessageModal);
  els.messageForm.addEventListener("submit", handleMessageSend);
  document.addEventListener("click", handleDocumentClick);
}

async function initCloudMode() {
  els.authMessage.textContent = "你可以用 Email 登入連結，或直接使用 Google 登入。";
  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    await refreshAll();
  });
}

function initDemoMode() {
  els.authMessage.textContent = "登入後就可以發布需求和發送合作請求。";
  currentUser = { id: "demo-user", email: "demo@optionality.network" };
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
  updateAdminVisibility();
  fillProfileForm(currentProfile);
  renderMembers();
  renderOpportunities();
  renderRequests();
  renderProfile();
  renderAdmin();
  renderNotificationBell();
}

function updateAdminVisibility() {
  const allowed = isAdmin();
  els.adminNavLink.classList.toggle("hidden", !allowed);
  els.adminSection.classList.toggle("hidden", !allowed);
  els.adminSection.setAttribute("aria-hidden", allowed ? "false" : "true");
  if (!allowed && window.location.hash === "#admin") {
    window.location.hash = "members";
    showToast("管理後台僅限管理員查看");
  }
}

async function loadCloudData() {
  if (!supabaseClient) return;

  const [{ data: members }, { data: opportunities }, { data: requests }, { data: messages }] = await Promise.all([
    supabaseClient.from("profiles").select("*").order("created_at", { ascending: false }),
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
  ]);

  state.members = members || [];
  state.opportunities = opportunities || [];
  state.requests = requests || [];
  state.messages = messages || [];
}

function findCurrentProfile() {
  if (!currentUser) return null;
  return state.members.find((member) => member.id === currentUser.id || member.email === currentUser.email) || null;
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
    showToast("目前請先使用 Email 登入");
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
    showToast("Google 登入尚未開通，請先使用 Email 登入");
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
    const { error } = await supabaseClient.from("profiles").upsert(profile, { onConflict: "id" });
    if (error) return showToast("會員頁儲存失敗，請確認 Username 沒有重複");
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
  location.hash = "profile";
}

async function handleOpportunitySave(event) {
  event.preventDefault();
  if (!currentUser) return askLoginFirst("先用 Email 登入，就能發布需求");

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
    location.hash = "opportunities";
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
      .eq("status", "active");
    if (error) return 3;
    return count || 0;
  }
  return state.opportunities.filter((item) => item.author_id === currentUser.id && item.status !== "cancelled").length;
}

async function handleDocumentClick(event) {
  const profileButton = event.target.closest("[data-profile]");
  if (profileButton) {
    const username = profileButton.dataset.profile;
    window.history.pushState({}, "", `?u=${encodeURIComponent(username)}#profile`);
    renderProfile();
    location.hash = "profile";
    return;
  }

  const connectButton = event.target.closest("[data-connect]");
  if (connectButton) {
    await createRequest(connectButton.dataset.connect);
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

  const cancelOppButton = event.target.closest("[data-cancel-opportunity]");
  if (cancelOppButton) await cancelOpportunity(cancelOppButton.dataset.cancelOpportunity);
}

async function createRequest(receiverId) {
  if (!currentUser) return askLoginFirst("先用 Email 登入，就能發送合作請求");
  if (receiverId === currentUser.id) return showToast("這是你自己的會員頁");

  const receiver = state.members.find((member) => member.id === receiverId);
  const request = {
    sender_id: currentProfile?.id || currentUser.id,
    receiver_id: receiverId,
    message: `我想和 ${receiver?.full_name || "你"} 交換資源，看看是否能合作。`,
    status: "pending",
  };

  if (supabaseClient && !currentProfile) {
    pendingIntent = { type: "request", payload: request };
    return askProfileLater("發送前先補一點資料，對方才知道你是誰");
  }

  await saveRequest(request);
}

async function saveRequest(request) {
  let requestId = null;

  if (supabaseClient) {
    const { data, error } = await supabaseClient.from("partnership_requests").insert(request).select("id").single();
    if (error) return showToast("請求送出失敗，請稍後再試");
    requestId = data?.id || null;
    if (data?.id) await sendMessage(data.id, request.message, { silent: true });
  } else {
    const receiver = state.members.find((member) => member.id === request.receiver_id);
    const id = `demo-req-${Date.now()}`;
    requestId = id;
    state.requests.unshift({ ...request, id, receiver, created_at: new Date().toISOString() });
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
  location.hash = "requests";
  if (requestId) openMessageModal(requestId);
}

async function createOpportunityRequest(opportunityId) {
  if (!currentUser) return askLoginFirst("先用 Email 登入，就能回覆這個需求");
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

function askLoginFirst(message) {
  showToast(message);
  location.hash = "quick-start";
}

function getAuthRedirectUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function askProfileLater(message) {
  showToast(message);
  prefillProfileFromEmail();
  location.hash = "profile";
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
        member.full_name,
        member.username,
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

function memberCard(member) {
  return `
    <article class="member-card">
      <div class="member-top">
        <span class="avatar">${initials(member.full_name)}</span>
        <div>
          <h3>${escapeHtml(member.full_name)}</h3>
          <small>${escapeHtml(member.title)} · ${escapeHtml(member.country)}</small>
        </div>
      </div>
      <p>${escapeHtml(member.bio || "這位會員尚未填寫簡介。")}</p>
      <div class="tag-list">${tags(member.resources_have)}</div>
      <div class="tag-list">${tags(member.resources_need, "need")}</div>
      <div class="member-meta">
        <span>瀏覽 ${member.profile_views || 0}</span>
        <span>連結 ${member.connections || 0}</span>
        <span>已完成 ${member.completed_partnerships || 0}</span>
      </div>
      <div class="row-actions">
        <button class="button secondary" type="button" data-profile="${escapeHtml(member.username)}">查看頁面</button>
        <button class="button primary" type="button" data-connect="${member.id}">建立連結</button>
      </div>
    </article>`;
}

function renderOpportunities() {
  const visible = state.opportunities.filter((item) => item.status !== "cancelled" || item.author_id === currentUser?.id || isAdmin());
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
          <span>${escapeHtml(item.contact_method || "站內合作請求")}</span>
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
  els.profileLink.innerHTML = `公開連結：<a href="${url}">${url}</a>`;
  els.profileView.innerHTML = `
    <article class="profile-card">
      <div class="member-top">
        <span class="avatar">${initials(profile.full_name)}</span>
        <div>
          <h3>${escapeHtml(profile.full_name)}</h3>
          <small>${escapeHtml(profile.title)} · ${escapeHtml(profile.country)}</small>
        </div>
      </div>
      <p>${escapeHtml(profile.bio || "這位會員尚未填寫簡介。")}</p>
      <h4>我有</h4>
      <div class="tag-list">${tags(profile.resources_have)}</div>
      <h4>我需要</h4>
      <div class="tag-list">${tags(profile.resources_need, "need")}</div>
      <div class="member-meta">
        <span>Telegram ${escapeHtml(profile.telegram || "未公開")}</span>
        <span>Twitter/X ${escapeHtml(profile.twitter || "未公開")}</span>
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
