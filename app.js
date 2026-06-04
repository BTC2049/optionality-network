const DEMO_KEY = "optionality-network-demo-v2";

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
      approved: true,
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
      approved: true,
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
      approved: true,
      profile_views: 219,
      connections: 41,
      completed_partnerships: 7,
      member_since: "2026-06-01",
    },
  ],
  opportunities: [
    {
      id: "demo-opp-1",
      title: "尋找台灣加密 KOL",
      description: "新交易產品上市，需要 Twitter/X 與 Telegram 推廣合作。",
      country: "台灣",
      budget: "US$500-2,000",
      contact_method: "Telegram @opnetwork",
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-opp-2",
      title: "需要 Telegram 社群",
      description: "尋找交易、空投、Web3 學習型社群，合作 AMA 與教育內容。",
      country: "亞洲",
      budget: "可議",
      contact_method: "Twitter/X @growthbd",
      created_at: new Date().toISOString(),
    },
  ],
  requests: [],
};

let state = loadDemoState();
let currentUser = null;
let currentProfile = null;
let activeFilter = "all";

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
  adminNavLink: document.querySelector("#adminNavLink"),
  adminSection: document.querySelector("#admin"),
  pendingMembers: document.querySelector("#pendingMembers"),
  profileView: document.querySelector("#profileView"),
  profileLink: document.querySelector("#profileLink"),
  toast: document.querySelector("#toast"),
};

init();

async function init() {
  wireEvents();
  if (supabaseClient) {
    await initCloudMode();
  } else {
    initDemoMode();
  }
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
  document.addEventListener("click", handleDocumentClick);
}

async function initCloudMode() {
  els.authMessage.textContent = "輸入 Email 後，我們會寄送登入連結。";

  const { data } = await supabaseClient.auth.getSession();
  currentUser = data.session?.user || null;
  supabaseClient.auth.onAuthStateChange(async (_event, session) => {
    currentUser = session?.user || null;
    await refreshAll();
  });
}

function initDemoMode() {
  els.authMessage.textContent = "輸入 Email 後即可開始建立你的會員頁。";
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
  updateAdminVisibility();
  await loadCloudData();
  currentProfile = findCurrentProfile();
  fillProfileForm(currentProfile);
  renderMembers();
  renderOpportunities();
  renderRequests();
  renderProfile();
  renderAdmin();
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

  const [{ data: members }, { data: opportunities }, { data: requests }] = await Promise.all([
    supabaseClient.from("profiles").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("opportunities").select("*").order("created_at", { ascending: false }),
    currentUser
      ? supabaseClient
          .from("partnership_requests")
          .select("*, sender:sender_id(username, full_name, title), receiver:receiver_id(username, full_name, title)")
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  state.members = members || [];
  state.opportunities = opportunities || [];
  state.requests = requests || [];
}

function findCurrentProfile() {
  if (!currentUser) return null;
  return state.members.find((member) => member.id === currentUser.id || member.email === currentUser.email) || null;
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
    showToast("已登入，可以開始建立會員頁");
    await refreshAll();
    return;
  }
  const { error } = await supabaseClient.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin + window.location.pathname },
  });
  showToast(error ? error.message : "登入連結已寄出，請檢查 Email");
}

async function handleGoogleLogin() {
  if (!supabaseClient) {
    showToast("目前請先使用 Email 登入");
    return;
  }
  await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + window.location.pathname },
  });
}

async function handleLogout() {
  if (supabaseClient) await supabaseClient.auth.signOut();
  currentUser = null;
  currentProfile = null;
  await refreshAll();
}

async function handleProfileSave(event) {
  event.preventDefault();
  if (!currentUser) {
    showToast("請先登入再建立會員頁");
    location.hash = "join";
    return;
  }

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
    approved: currentProfile?.approved || false,
  };

  if (!profile.username || !profile.full_name || !profile.country) {
    showToast("請填寫姓名、Username 和國家");
    return;
  }

  if (!profile.resources_have.length || !profile.resources_need.length) {
    showToast("請至少各選一個擁有與需要的資源");
    return;
  }

  if (supabaseClient) {
    const { error } = await supabaseClient.from("profiles").upsert(profile, { onConflict: "id" });
    if (error) return showToast(error.message);
  } else {
    const index = state.members.findIndex((member) => member.id === profile.id);
    const demoProfile = { ...profile, approved: true, profile_views: 0, connections: 0, completed_partnerships: 0 };
    if (index >= 0) state.members[index] = { ...state.members[index], ...demoProfile };
    else state.members.unshift(demoProfile);
    saveDemoState();
  }

  showToast(supabaseClient ? "會員頁已儲存，審核後會出現在探索頁" : "會員頁已儲存");
  await refreshAll();
  location.hash = "profile";
}

async function handleOpportunitySave(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast("請先登入，再發布合作機會");
    location.hash = "join";
    return;
  }

  if (!currentProfile) {
    showToast("請先建立並儲存你的會員頁，再發布合作機會");
    location.hash = "join";
    return;
  }

  const opportunity = {
    title: value("#oppTitle"),
    description: value("#oppDesc"),
    country: value("#oppCountry"),
    budget: value("#oppBudget") || "預算可議",
    contact_method: value("#oppContact"),
    author_id: currentProfile.id,
  };

  if (supabaseClient) {
    const { error } = await supabaseClient.from("opportunities").insert(opportunity);
    if (error) return showToast("發布失敗，請確認你的會員頁已儲存，或稍後再試");
  } else {
    state.opportunities.unshift({ ...opportunity, id: `demo-opp-${Date.now()}`, created_at: new Date().toISOString() });
    saveDemoState();
  }

  showToast("合作機會已發布");
  await refreshAll();
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

  const approveButton = event.target.closest("[data-approve]");
  if (approveButton) {
    await approveProfile(approveButton.dataset.approve);
  }
}

async function createRequest(receiverId) {
  if (!currentUser) return showToast("請先登入再發送合作請求");
  if (receiverId === currentUser.id) return showToast("這是你自己的會員頁");
  const receiver = state.members.find((member) => member.id === receiverId);
  const request = {
    sender_id: currentUser.id,
    receiver_id: receiverId,
    message: `我想和 ${receiver?.full_name || "你"} 交換資源，看看是否能合作。`,
    status: "pending",
  };

  if (supabaseClient) {
    const { error } = await supabaseClient.from("partnership_requests").insert(request);
    if (error) return showToast(error.message);
  } else {
    state.requests.unshift({ ...request, id: `demo-req-${Date.now()}`, receiver, created_at: new Date().toISOString() });
    saveDemoState();
  }
  showToast("合作請求已送出");
  await refreshAll();
  location.hash = "requests";
}

async function createOpportunityRequest(opportunityId) {
  if (!currentUser) return showToast("請先登入再回覆機會");
  const opportunity = state.opportunities.find((item) => item.id === opportunityId);
  showToast(`已記錄你想合作：${opportunity?.title || "這個機會"}`);
}

async function updateRequest(id, action) {
  const status = action === "accept" ? "accepted" : "later";
  if (supabaseClient) {
    const { error } = await supabaseClient.from("partnership_requests").update({ status }).eq("id", id);
    if (error) return showToast(error.message);
  } else {
    const request = state.requests.find((item) => item.id === id);
    if (request) request.status = status;
    saveDemoState();
  }
  showToast(status === "accepted" ? "已接受合作請求" : "已標記稍後處理");
  await refreshAll();
}

async function approveProfile(id) {
  if (!isAdmin() && supabaseClient) return showToast("只有管理員可以審核會員");
  if (supabaseClient) {
    const { error } = await supabaseClient.from("profiles").update({ approved: true }).eq("id", id);
    if (error) return showToast(error.message);
  } else {
    const member = state.members.find((item) => item.id === id);
    if (member) member.approved = true;
    saveDemoState();
  }
  showToast("會員已審核通過");
  await refreshAll();
}

function renderMembers() {
  const query = els.memberSearch.value.trim().toLowerCase();
  const visible = state.members
    .filter((member) => member.approved || member.id === currentUser?.id || isAdmin())
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
          <small>${escapeHtml(member.title)} · ${escapeHtml(member.country)} ${member.approved ? "" : "· 待審核"}</small>
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
  els.opportunityList.innerHTML = state.opportunities.length
    ? state.opportunities
        .map(
          (item) => `
      <article class="opportunity-card">
        <header>
          <div>
            <h3>${escapeHtml(item.title)}</h3>
            <small>${escapeHtml(item.country || "遠端")} · ${dateText(item.created_at)}</small>
          </div>
          <span class="budget">${escapeHtml(item.budget || "預算可議")}</span>
        </header>
        <p>${escapeHtml(item.description)}</p>
        <div class="member-meta">
          <span>${escapeHtml(item.contact_method || "站內合作請求")}</span>
        </div>
        <button class="button secondary" type="button" data-opportunity="${item.id}">我想合作</button>
      </article>`
        )
        .join("")
    : '<article class="opportunity-card"><h3>目前沒有合作機會</h3><p>發布第一個需求，讓適合的人找到你。</p></article>';
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
            </div>`
          : `<div class="metrics-mini"><span>${label}</span><span>${dateText(request.created_at)}</span></div>`
      }
    </article>`;
}

function renderProfile() {
  const username = new URLSearchParams(window.location.search).get("u");
  const profile = username
    ? state.members.find((member) => member.username === username)
    : currentProfile || state.members[0];

  if (!profile) {
    els.profileView.innerHTML = '<article class="member-card"><h3>尚未建立會員頁</h3><p>請先登入並儲存你的會員資料。</p></article>';
    els.profileLink.textContent = "登入並儲存會員資料後，這裡會產生你的公開頁連結。";
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
          <small>${escapeHtml(profile.title)} · ${escapeHtml(profile.country)} ${profile.approved ? "· 已審核" : "· 待審核"}</small>
        </div>
      </div>
      <p>${escapeHtml(profile.bio || "這位會員尚未填寫簡介。")}</p>
      <h4>我擁有的資源</h4>
      <div class="tag-list">${tags(profile.resources_have)}</div>
      <h4>我需要的資源</h4>
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
  els.pendingMembers.innerHTML = "";
    return;
  }

  const pending = state.members.filter((member) => !member.approved);
  document.querySelector("#statMembers").textContent = state.members.length;
  document.querySelector("#statOpps").textContent = state.opportunities.length;
  document.querySelector("#statRequests").textContent = state.requests.length;
  document.querySelector("#statPending").textContent = pending.length;

  els.pendingMembers.innerHTML = pending.length
    ? pending
        .map(
          (member) => `
      <div class="admin-item">
        <span>${escapeHtml(member.full_name)} · ${escapeHtml(member.title)}</span>
        <button type="button" data-approve="${member.id}">通過</button>
      </div>`
        )
        .join("")
    : '<p class="empty-text">目前沒有待審核會員。</p>';

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
