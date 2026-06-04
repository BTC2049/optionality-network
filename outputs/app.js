const STORAGE_KEY = "optionality-network-mvp";

const seedMembers = [
  {
    id: "m1",
    name: "Mina Liu",
    initials: "ML",
    title: "台灣加密 KOL",
    country: "台灣",
    languages: "中文、English",
    bio: "經營交易教育內容與 Telegram 社群，擅長新品上市導流與內容合作。",
    have: ["Telegram 社群", "Twitter/X 受眾", "KOL 人脈"],
    need: ["交易所合作", "影片剪輯"],
    stats: ["瀏覽 428", "連結 76", "已完成 18"],
    approved: true,
  },
  {
    id: "m2",
    name: "Ryan Park",
    initials: "RP",
    title: "交易所商務拓展",
    country: "新加坡",
    languages: "English、中文",
    bio: "協助交易所拓展亞洲聯盟推廣、KOL 與社群合作夥伴。",
    have: ["交易所資源", "聯盟推廣人脈", "項目方資源"],
    need: ["Telegram 社群", "KOL 推廣"],
    stats: ["瀏覽 312", "連結 54", "已完成 9"],
    approved: true,
  },
  {
    id: "m3",
    name: "Jade Wu",
    initials: "JW",
    title: "AI 自動化專家",
    country: "台灣",
    languages: "中文、English",
    bio: "為加密團隊建立客服、內容分發、BD 名單整理與社群營運自動化。",
    have: ["AI 自動化", "客服支援", "搜尋引擎優化"],
    need: ["項目合作", "媒體曝光"],
    stats: ["瀏覽 219", "連結 41", "已完成 7"],
    approved: true,
  },
  {
    id: "m4",
    name: "Leo Nakamura",
    initials: "LN",
    title: "社群經理",
    country: "日本",
    languages: "日本語、English",
    bio: "管理多語系 Discord 與 Telegram 社群，熟悉任務活動與大使計畫。",
    have: ["Discord 社群", "活動策劃", "翻譯"],
    need: ["項目方資源", "設計師"],
    stats: ["瀏覽 184", "連結 29", "已完成 5"],
    approved: true,
  },
  {
    id: "m5",
    name: "Sofia Chen",
    initials: "SC",
    title: "媒體夥伴",
    country: "香港",
    languages: "中文、English",
    bio: "提供加密媒體曝光、創辦人訪談、專題內容與產品上線宣傳。",
    have: ["媒體人脈", "影片剪輯", "平面設計"],
    need: ["項目合作", "KOL 人脈"],
    stats: ["瀏覽 367", "連結 63", "已完成 14"],
    approved: true,
  },
  {
    id: "m6",
    name: "Marco Silva",
    initials: "MS",
    title: "加密聯盟推廣者",
    country: "巴西",
    languages: "Português、English",
    bio: "擁有拉美交易流量與付費投放經驗，尋找交易所與教育產品合作。",
    have: ["付費流量", "交易社群", "YouTube 頻道"],
    need: ["交易所合作", "聯盟推廣夥伴"],
    stats: ["瀏覽 276", "連結 48", "已完成 11"],
    approved: true,
  },
];

const seedOpportunities = [
  {
    id: "o1",
    title: "尋找台灣加密 KOL",
    desc: "新交易產品上市，需要 Twitter/X 與 Telegram 推廣合作。",
    country: "台灣",
    budget: "US$500-2,000",
    contact: "Telegram @opnetwork",
    date: "今天",
  },
  {
    id: "o2",
    title: "需要 Telegram 社群",
    desc: "尋找交易、空投、Web3 學習型社群，合作 AMA 與教育內容。",
    country: "亞洲",
    budget: "可議",
    contact: "Twitter/X @growthbd",
    date: "昨天",
  },
  {
    id: "o3",
    title: "尋找交易所合作",
    desc: "項目方尋找亞洲區交易所 BD、Launchpool 或上幣資源。",
    country: "全球",
    budget: "選填",
    contact: "Email partnerships@example.com",
    date: "2 天前",
  },
  {
    id: "o4",
    title: "尋找 AI 自動化服務商",
    desc: "需要自動整理 KOL 名單、追蹤 BD pipeline、客服 FAQ 與社群回覆。",
    country: "遠端",
    budget: "US$1,000+",
    contact: "Discord optionality#2030",
    date: "3 天前",
  },
];

const seedRequests = [
  {
    id: "r1",
    type: "incoming",
    status: "新請求",
    title: "BitGrowth BD 想連結你的 Telegram 社群",
    body: "我們正在找台灣交易社群做教育內容合作，可以提供交易所資源與講師。",
  },
  {
    id: "r2",
    type: "sent",
    status: "已送出",
    title: "你已向 ChainVoice 媒體夥伴發送媒體曝光請求",
    body: "等待對方確認聯絡資訊。未來可擴充為訊息、評價與合作紀錄。",
  },
];

const seedCategories = [
  "Telegram 社群",
  "Twitter/X 受眾",
  "KOL 人脈",
  "交易所資源",
  "媒體曝光",
  "AI 自動化",
  "付費流量",
  "影片剪輯",
];

const memberGrid = document.querySelector("#memberGrid");
const searchInput = document.querySelector("#memberSearch");
const filterButtons = document.querySelectorAll(".filter");
const opportunityList = document.querySelector("#opportunityList");
const signupForm = document.querySelector("#signupForm");
const opportunityForm = document.querySelector("#opportunityForm");
const requestInbox = document.querySelector("#requestInbox");
const pendingMembers = document.querySelector("#pendingMembers");
const categoryForm = document.querySelector("#categoryForm");
const categoryInput = document.querySelector("#categoryInput");
const categoryList = document.querySelector("#categoryList");
const toast = document.querySelector("#toast");

let activeFilter = "all";

const state = loadState();

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);
  return {
    members: seedMembers,
    opportunities: seedOpportunities,
    requests: seedRequests,
    categories: seedCategories,
    authMethod: "Email",
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function initialsFromName(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function selectedTags(selector) {
  return Array.from(document.querySelectorAll(`${selector} button.selected`)).map((button) =>
    button.textContent.trim()
  );
}

function renderMembers() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = state.members
    .filter((member) => member.approved)
    .filter((member) => {
      const haystack = [
        member.name,
        member.title,
        member.country,
        member.languages,
        member.bio,
        ...member.have,
        ...member.need,
      ]
        .join(" ")
        .toLowerCase();
      const matchesQuery = !query || haystack.includes(query);
      const matchesFilter = activeFilter === "all" || haystack.includes(activeFilter.toLowerCase());
      return matchesQuery && matchesFilter;
    });

  memberGrid.innerHTML = filtered
    .map(
      (member) => `
      <article class="member-card">
        <div class="member-top">
          <span class="avatar">${member.initials}</span>
          <div>
            <h3>${member.name}</h3>
            <small>${member.title} · ${member.country}</small>
          </div>
        </div>
        <p>${member.bio}</p>
        <div class="tag-list" aria-label="擁有資源">
          ${member.have.map((tag) => `<span class="tag">${tag}</span>`).join("")}
        </div>
        <div class="tag-list" aria-label="需要資源">
          ${member.need.map((tag) => `<span class="tag need">${tag}</span>`).join("")}
        </div>
        <div class="member-meta">
          ${member.stats.map((stat) => `<span>${stat}</span>`).join("")}
          <span>加入時間 2026</span>
        </div>
        <button class="button primary connect-button" data-member="${member.id}" type="button">建立連結</button>
      </article>
    `
    )
    .join("");

  if (!filtered.length) {
    memberGrid.innerHTML =
      '<article class="member-card"><h3>沒有找到符合條件的會員</h3><p>試試搜尋 KOL、商務拓展、台灣、Telegram 社群或 AI 自動化。</p></article>';
  }
}

function renderOpportunities() {
  opportunityList.innerHTML = state.opportunities
    .map(
      (item) => `
      <article class="opportunity-card">
        <header>
          <div>
            <h3>${item.title}</h3>
            <small>${item.country} · ${item.date}</small>
          </div>
          <span class="budget">${item.budget || "預算可議"}</span>
        </header>
        <p>${item.desc}</p>
        <div class="member-meta">
          <span>${item.contact}</span>
          <span>發布時間 ${item.date}</span>
        </div>
        <button class="button secondary opportunity-request" data-title="${item.title}" type="button">我想合作</button>
      </article>
    `
    )
    .join("");
}

function renderRequests() {
  requestInbox.innerHTML = state.requests
    .map(
      (request) => `
      <article>
        <span class="status ${request.status === "新請求" ? "new" : ""}">${request.status}</span>
        <h3>${request.title}</h3>
        <p>${request.body}</p>
        ${
          request.status === "新請求"
            ? `<div class="row-actions">
                <button class="button primary request-action" data-action="accept" data-id="${request.id}">接受</button>
                <button class="button ghost request-action" data-action="later" data-id="${request.id}">稍後處理</button>
              </div>`
            : `<div class="metrics-mini">
                <span>個人頁瀏覽 184</span>
                <span>連結數 37</span>
                <span>已完成合作 12</span>
              </div>`
        }
      </article>
    `
    )
    .join("");
}

function renderAdmin() {
  const pending = state.members.filter((member) => !member.approved);
  pendingMembers.innerHTML = pending.length
    ? pending
        .map(
          (member) => `
          <div class="admin-item">
            <span>${member.name} · ${member.title}</span>
            <button type="button" class="approve-member" data-member="${member.id}">通過</button>
          </div>
        `
        )
        .join("")
    : '<p class="empty-text">目前沒有待審核會員。</p>';

  categoryList.innerHTML = state.categories.map((category) => `<span class="tag">${category}</span>`).join("");
}

function rerenderAll() {
  renderMembers();
  renderOpportunities();
  renderRequests();
  renderAdmin();
}

document.querySelectorAll(".tag-picker button").forEach((button) => {
  button.addEventListener("click", () => button.classList.toggle("selected"));
});

document.querySelectorAll(".auth-button").forEach((button) => {
  button.addEventListener("click", () => {
    state.authMethod = button.dataset.auth;
    saveState();
    showToast(`已選擇 ${state.authMethod} 登入`);
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    activeFilter = button.dataset.filter;
    renderMembers();
  });
});

searchInput.addEventListener("input", renderMembers);

signupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const have = selectedTags(".tag-picker:not(.needs)");
  const need = selectedTags(".tag-picker.needs");
  const name = document.querySelector("#signupName").value.trim();
  const role = document.querySelector("#signupRole").value;
  const country = document.querySelector("#signupCountry").value.trim();

  if (!have.length || !need.length) {
    showToast("請至少各選一個「我擁有」和「我需要」的資源");
    return;
  }

  state.members.unshift({
    id: `m${Date.now()}`,
    name,
    initials: initialsFromName(name),
    title: role,
    country,
    languages: "中文、English",
    bio: `${name} 正在尋找加密產業合作夥伴，可透過 ${state.authMethod} 登入建立公開名片。`,
    have,
    need,
    stats: ["瀏覽 0", "連結 0", "已完成 0"],
    approved: false,
  });

  saveState();
  signupForm.reset();
  document.querySelectorAll(".tag-picker button.selected").forEach((button) => button.classList.remove("selected"));
  rerenderAll();
  showToast("申請已送出，管理員可在後台審核");
  location.hash = "admin";
});

opportunityForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.opportunities.unshift({
    id: `o${Date.now()}`,
    title: document.querySelector("#oppTitle").value.trim(),
    desc: document.querySelector("#oppDesc").value.trim(),
    country: document.querySelector("#oppCountry").value.trim(),
    budget: document.querySelector("#oppBudget").value.trim() || "預算可議",
    contact: document.querySelector("#oppContact").value.trim(),
    date: "剛剛",
  });
  saveState();
  renderOpportunities();
  showToast("合作機會已發布");
});

document.addEventListener("click", (event) => {
  const connectButton = event.target.closest(".connect-button");
  if (connectButton) {
    const member = state.members.find((item) => item.id === connectButton.dataset.member);
    state.requests.unshift({
      id: `r${Date.now()}`,
      type: "sent",
      status: "已送出",
      title: `你已向 ${member.name} 發送合作請求`,
      body: `希望與 ${member.title} 交換資源：${member.have.slice(0, 2).join("、")}。`,
    });
    saveState();
    renderRequests();
    connectButton.textContent = "請求已送出";
    connectButton.classList.remove("primary");
    connectButton.classList.add("secondary");
    showToast("合作請求已送出");
    return;
  }

  const quickButton = event.target.closest(".quick-request");
  if (quickButton) {
    state.requests.unshift({
      id: `r${Date.now()}`,
      type: "sent",
      status: "已送出",
      title: `你已向 ${quickButton.dataset.target} 發送合作請求`,
      body: "系統已依照媒合中心建議建立一筆合作請求。",
    });
    saveState();
    renderRequests();
    showToast("已從媒合中心建立請求");
    location.hash = "requests";
    return;
  }

  const opportunityButton = event.target.closest(".opportunity-request");
  if (opportunityButton) {
    state.requests.unshift({
      id: `r${Date.now()}`,
      type: "sent",
      status: "已送出",
      title: `你想合作：${opportunityButton.dataset.title}`,
      body: "已把這個機會加入合作請求，等待對方確認聯絡方式。",
    });
    saveState();
    renderRequests();
    showToast("已加入合作請求");
    return;
  }

  const requestButton = event.target.closest(".request-action");
  if (requestButton) {
    const request = state.requests.find((item) => item.id === requestButton.dataset.id);
    request.status = requestButton.dataset.action === "accept" ? "已接受" : "稍後處理";
    saveState();
    renderRequests();
    showToast(request.status === "已接受" ? "已接受合作請求" : "已標記稍後處理");
    return;
  }

  const approveButton = event.target.closest(".approve-member");
  if (approveButton) {
    const member = state.members.find((item) => item.id === approveButton.dataset.member);
    member.approved = true;
    saveState();
    rerenderAll();
    showToast(`${member.name} 已通過審核並出現在會員探索`);
    return;
  }

  const shortcutButton = event.target.closest(".admin-shortcut");
  if (shortcutButton) {
    const target = document.querySelector(`#${shortcutButton.dataset.target}`);
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    if (target.matches("input")) target.focus();
    showToast("已帶你到對應的管理區塊");
    return;
  }

  if (event.target.closest(".future-button")) {
    showToast("此功能已預留架構，MVP 先專注媒合與合作請求");
  }
});

categoryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const category = categoryInput.value.trim();
  if (!category) return;
  if (!state.categories.includes(category)) state.categories.push(category);
  categoryInput.value = "";
  saveState();
  renderAdmin();
  showToast("資源分類已新增");
});

rerenderAll();
