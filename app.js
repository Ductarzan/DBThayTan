const AUTO_REFRESH_MS = 30000;
const SOURCES = {
  dongdo: {
    label: "ĐH Đông Đô",
    sheetId: "1NgLuWiU3zzmTX3aKpykD7rqj2-x5x1nD1FyQlZUTE2U",
    gid: "1810436556"
  },
  bachnghe: {
    label: "CĐ Bách Nghệ",
    sheetId: "13p-bxCn4bhO9TBcT0pssfeIENUF-tPYZNkMFba1EffM",
    gid: "1644038176"
  }
};

const fields = {
  name: "Tên",
  email: "Email",
  phone: "Số điện thoại",
  major: "Ngành học quan tâm",
  admission: "Phương thức xét tuyển phù hợp nhất",
  score: "Tổng điểm trung bình 3 năm",
  program: "Hệ đào tạo",
  leader: "Leader",
  pic: "PIC",
  status: "Tình trạng liên hệ",
  care1: "Chăm sóc lần 1",
  care2: "Chăm sóc lần 2",
  care3: "Chăm sóc lần 3",
  createdTime: "created_time"
};
const OVERDUE_HOURS = 24;
const MAJOR_RULES = [
  {
    label: "Quản trị kinh doanh",
    aliases: ["quản trị kinh doanh", "quản trị nguồn nhân lực"]
  },
  {
    label: "Thương mại điện tử",
    aliases: ["quản trị thương mại điện tử", "digital marketing", "logistics và chuỗi cung ứng số", "thương mại quốc tế", "thương mại điện tử"]
  },
  {
    label: "Tài chính - Ngân hàng",
    aliases: ["tài chính ngân hàng", "tài chính doanh nghiệp", "thanh toán quốc tế", "tài chính - ngân hàng"]
  },
  { label: "Kế toán", aliases: ["kế toán"] },
  { label: "Luật kinh tế", aliases: ["luật kinh tế"] },
  {
    label: "Công nghệ thông tin",
    aliases: ["công nghệ thông tin", "trí tuệ nhân tạo ứng dụng", "an toàn hệ thống thông tin", "lập trình máy tính"]
  },
  {
    label: "Công nghệ ô tô",
    aliases: [
      "kỹ thuật điện ô tô",
      "công nghệ ô tô điện",
      "cơ điện tử ô tô",
      "công nghệ ô tô số",
      "công nghệ kỹ thuật ô tô",
      "công nghệ ô tô",
      "o to"
    ]
  },
  { label: "Thú y", aliases: ["thú y"] },
  { label: "Dược", aliases: ["dược học", "dược"] },
  { label: "Điều dưỡng", aliases: ["điều dưỡng"] },
  { label: "Kỹ thuật xét nghiệm Y học", aliases: ["kỹ thuật xét nghiệm y học"] },
  { label: "Tiếng Trung", aliases: ["ngôn ngữ trung quốc", "ngôn ngữ trung", "tiếng trung"] },
  { label: "Tiếng Nhật", aliases: ["ngôn ngữ nhật", "tiếng nhật"] },
  { label: "Tiếng Hàn", aliases: ["ngôn ngữ hàn quốc", "ngôn ngữ hàn", "tiếng hàn", "hàn"] },
  { label: "Tiếng Anh", aliases: ["ngôn ngữ anh", "tiếng anh"] },
  { label: "Quản trị khách sạn", aliases: ["quản trị khách sạn"] },
  { label: "Kỹ thuật chế biến món ăn", aliases: ["kỹ thuật chế biến món ăn"] },
  { label: "Nghiệp vụ nhà hàng", aliases: ["nghiệp vụ nhà hàng"] },
  { label: "Thiết kế đồ họa", aliases: ["thiết kế đồ họa"] },
  { label: "Điện công nghiệp", aliases: ["điện công nghiệp"] },
  { label: "Y sĩ đa khoa", aliases: ["y sĩ đa khoa"] },
  { label: "Y học cổ truyền", aliases: ["y học cổ truyền"] },
  { label: "Kỹ thuật pha chế đồ uống", aliases: ["kỹ thuật pha chế đồ uống"] },
  { label: "Kỹ thuật vật lý trị liệu và PHCN", aliases: ["kỹ thuật vật lý trị liệu và phcn"] },
  { label: "Quản lý nhà nước", aliases: ["quản lý nhà nước"] }
];

let rawRows = [];
let rowsBySource = { dongdo: [], bachnghe: [] };
let activeSource = "dongdo";
let statusChart;
let careChart;
const leadPagination = {
  page: 1,
  pageSize: 5
};

const els = {
  refreshBtn: document.getElementById("refreshBtn"),
  lastUpdated: document.getElementById("lastUpdated"),
  campusSwitch: document.getElementById("campusSwitch"),
  leaderFilter: document.getElementById("leaderFilter"),
  picFilter: document.getElementById("picFilter"),
  majorFilter: document.getElementById("majorFilter"),
  programFilter: document.getElementById("programFilter"),
  kpiCards: document.getElementById("kpiCards"),
  leadTableHead: document.querySelector("#leadTable thead"),
  leadTableBody: document.querySelector("#leadTable tbody"),
  majorStatsHead: document.querySelector("#majorStatsTable thead"),
  majorStatsBody: document.querySelector("#majorStatsTable tbody"),
  leaderRankHead: document.querySelector("#leaderRankTable thead"),
  leaderRankBody: document.querySelector("#leaderRankTable tbody"),
  picRankHead: document.querySelector("#picRankTable thead"),
  picRankBody: document.querySelector("#picRankTable tbody"),
  overdueHead: document.querySelector("#overdueTable thead"),
  overdueBody: document.querySelector("#overdueTable tbody"),
  leadMeta: document.getElementById("leadMeta"),
  leadPageSize: document.getElementById("leadPageSize"),
  leadPrevBtn: document.getElementById("leadPrevBtn"),
  leadNextBtn: document.getElementById("leadNextBtn"),
  leadPageNumbers: document.getElementById("leadPageNumbers")
};

function getSheetCsvUrl(sourceKey) {
  const s = SOURCES[sourceKey];
  return `https://docs.google.com/spreadsheets/d/${s.sheetId}/export?format=csv&gid=${s.gid}`;
}

function parseCsv(text) {
  const lines = [];
  let cur = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === '"') {
      if (inQuotes && next === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === "," && !inQuotes) {
      row.push(cur);
      cur = "";
      continue;
    }

    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(cur);
      lines.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur || row.length) {
    row.push(cur);
    lines.push(row);
  }

  const [headers, ...data] = lines;
  return data
    .filter((r) => r.some((v) => v && v.trim() !== ""))
    .map((r) => headers.reduce((acc, h, idx) => {
      acc[h.trim()] = (r[idx] || "").trim();
      return acc;
    }, {}));
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((r) => getMappedValue(r, key)).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
}

function getMappedValue(row, key) {
  if (key === fields.pic) {
    return row[fields.pic] || row["CTV phụ trách"] || row["CTV"] || "";
  }
  if (key === fields.leader) {
    return row[fields.leader] || row["Leader phụ trách"] || "";
  }
  return row[key] || "";
}

function setSelectOptions(selectEl, values) {
  const selected = selectEl.value;
  selectEl.innerHTML = '<option value="">Tất cả</option>' + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (values.includes(selected)) selectEl.value = selected;
}

function renderCampusCards() {
  const now = new Date();
  const todayKey = formatDateKey(now);
  els.campusSwitch.innerHTML = Object.entries(SOURCES).map(([key, src]) => {
    const rows = rowsBySource[key] || [];
    const todayCount = rows.filter((r) => formatDateKey(parseDateSafe(r[fields.createdTime])) === todayKey).length;
    return `
      <article class="campus-card ${key === activeSource ? "active" : ""}" data-source="${key}">
        <h3>${escapeHtml(src.label)}</h3>
        <p>${rows.length} lead • Hôm nay: ${todayCount}</p>
      </article>
    `;
  }).join("");

  els.campusSwitch.querySelectorAll(".campus-card").forEach((card) => {
    card.addEventListener("click", () => {
      activeSource = card.dataset.source;
      rawRows = rowsBySource[activeSource] || [];
      setSelectOptions(els.leaderFilter, uniqueValues(rawRows, fields.leader));
      setSelectOptions(els.picFilter, uniqueValues(rawRows, fields.pic));
      setSelectOptions(els.majorFilter, uniqueValues(rawRows, fields.major));
      setSelectOptions(els.programFilter, uniqueValues(rawRows, fields.program));
      renderCampusCards();
      resetLeadPagination();
      refreshAllViews();
    });
  });
}

function getFilteredRows() {
  const f = {
    leader: els.leaderFilter.value,
    pic: els.picFilter.value,
    major: els.majorFilter.value,
    program: els.programFilter.value
  };

  return rawRows.filter((r) => {
    if (f.leader && getMappedValue(r, fields.leader) !== f.leader) return false;
    if (f.pic && getMappedValue(r, fields.pic) !== f.pic) return false;
    if (f.major && getMappedValue(r, fields.major) !== f.major) return false;
    if (f.program && getMappedValue(r, fields.program) !== f.program) return false;
    return true;
  });
}

function resetLeadPagination() {
  leadPagination.page = 1;
}

function countBy(rows, key) {
  return rows.reduce((acc, r) => {
    const k = r[key] || "Chưa liên hệ";
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});
}

function toNumberSafe(v) {
  if (!v) return null;
  const n = Number(String(v).replace(/,/g, ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function parseDateSafe(v) {
  if (!v) return null;
  const normalized = String(v).trim().replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function isCareDone(r) {
  return Boolean((r[fields.care1] || "").trim());
}

function updateKpis(rows) {
  const now = new Date();
  const todayKey = formatDateKey(now);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yesterdayKey = formatDateKey(yesterday);

  const total = rows.length;
  const contacted = rows.filter((r) => (r[fields.status] || "").trim() !== "").length;
  const care3 = rows.filter((r) => (r[fields.care3] || "").trim() !== "").length;
  const todayCount = rows.filter((r) => formatDateKey(parseDateSafe(r[fields.createdTime])) === todayKey).length;
  const yesterdayCount = rows.filter((r) => formatDateKey(parseDateSafe(r[fields.createdTime])) === yesterdayKey).length;
  const delta = todayCount - yesterdayCount;
  const deltaText = `${delta >= 0 ? "+" : ""}${delta}`;

  const kpiItems = [
    ["Tổng lead", total, "Toàn bộ dữ liệu sau lọc"],
    ["Đã liên hệ", contacted, total ? `${Math.round((contacted / total) * 100)}%` : "0%"],
    ["Đã chăm sóc lần 3", care3, total ? `${Math.round((care3 / total) * 100)}%` : "0%"],
    ["Leads hôm nay", todayCount, `Ngày ${toDisplayDate(todayKey)}`],
    ["So sánh hôm nay/hôm qua", `${todayCount} / ${yesterdayCount}`, `Chênh lệch: ${deltaText} lead`]
  ];

  els.kpiCards.innerHTML = kpiItems.map(([title, value, sub], idx) => `
    <div class="kpi ${idx === kpiItems.length - 1 ? "compare" : ""}">
      <h3>${title}</h3>
      <div class="value">${value}</div>
      <div class="sub">${sub}</div>
    </div>
  `).join("");
}

function renderStatusChart(rows) {
  const byStatus = countBy(rows, fields.status);
  const labels = Object.keys(byStatus);
  const data = Object.values(byStatus);

  if (statusChart) statusChart.destroy();
  statusChart = new Chart(document.getElementById("statusChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Số lượng",
        data,
        backgroundColor: "#0f766e"
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
    }
  });
}

function renderCareChart(rows) {
  const done1 = rows.filter((r) => r[fields.care1]).length;
  const done2 = rows.filter((r) => r[fields.care2]).length;
  const done3 = rows.filter((r) => r[fields.care3]).length;

  if (careChart) careChart.destroy();
  careChart = new Chart(document.getElementById("careChart"), {
    type: "doughnut",
    data: {
      labels: ["Chăm sóc lần 1", "Chăm sóc lần 2", "Chăm sóc lần 3"],
      datasets: [{
        data: [done1, done2, done3],
        backgroundColor: ["#0f766e", "#14b8a6", "#f59e0b"]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "58%",
      plugins: { legend: { position: "bottom" } }
    }
  });
}

function badgeStatus(value) {
  if (!value) return '<span class="badge none">Chưa liên hệ</span>';
  const normalized = value.toLowerCase();
  if (normalized.includes("đã") || normalized.includes("xong") || normalized.includes("ok")) {
    return `<span class="badge ok">${escapeHtml(value)}</span>`;
  }
  return `<span class="badge warn">${escapeHtml(value)}</span>`;
}

function formatDateKey(d) {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toDisplayDate(dateKey) {
  if (!dateKey) return "-";
  const [y, m, d] = dateKey.split("-");
  return `${d}/${m}/${y}`;
}

function normalizeText(v) {
  return (v || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyMajor(rawMajor) {
  const n = normalizeText(rawMajor);
  if (!n) return "Chưa rõ ngành";
  for (const rule of MAJOR_RULES) {
    for (const alias of rule.aliases) {
      if (n.includes(normalizeText(alias))) return rule.label;
    }
  }
  return rawMajor;
}

function buildPerformanceRanks(rows, ownerKey) {
  const map = rows.reduce((acc, r) => {
    const owner = (getMappedValue(r, ownerKey) || "Chưa gán").trim() || "Chưa gán";
    if (!acc[owner]) acc[owner] = { owner, total: 0, contacted: 0, cared: 0 };
    acc[owner].total += 1;
    if ((r[fields.status] || "").trim()) acc[owner].contacted += 1;
    if (isCareDone(r)) acc[owner].cared += 1;
    return acc;
  }, {});

  return Object.values(map)
    .map((x) => ({
      ...x,
      contactedRate: x.total ? (x.contacted / x.total) : 0,
      caredRate: x.total ? (x.cared / x.total) : 0,
      score: (x.total ? (x.contacted / x.total) : 0) * 0.6 + (x.total ? (x.cared / x.total) : 0) * 0.4
    }))
    .sort((a, b) => b.score - a.score || b.total - a.total);
}

function renderRankTable(headEl, bodyEl, rows) {
  headEl.innerHTML = "<tr><th>Hạng</th><th>Tên</th><th>Tổng lead</th><th>Tỉ lệ liên hệ</th><th>Tỉ lệ gọi lần 1</th><th>Điểm</th></tr>";
  bodyEl.innerHTML = rows.slice(0, 10).map((r, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td>${escapeHtml(r.owner)}</td>
      <td>${r.total}</td>
      <td>${Math.round(r.contactedRate * 100)}%</td>
      <td>${Math.round(r.caredRate * 100)}%</td>
      <td>${(r.score * 100).toFixed(1)}</td>
    </tr>
  `).join("");
}

function getOverdueLeads(rows) {
  const now = Date.now();
  return rows.map((r) => {
    const created = parseDateSafe(r[fields.createdTime]);
    if (!created) return null;
    const hours = (now - created.getTime()) / 36e5;
    if (hours <= OVERDUE_HOURS) return null;
    if (isCareDone(r)) return null;
    return { row: r, hours };
  })
    .filter(Boolean)
    .sort((a, b) => b.hours - a.hours);
}

function renderOverdueTable(rows) {
  const overdue = getOverdueLeads(rows);
  els.overdueHead.innerHTML = "<tr><th>Tên</th><th>Leader</th><th>PIC</th><th>SĐT</th><th>Thời gian tạo</th><th>Quá hạn</th></tr>";
  els.overdueBody.innerHTML = overdue.map((x) => `
    <tr>
      <td>${escapeHtml(x.row[fields.name] || "")}</td>
      <td>${escapeHtml(getMappedValue(x.row, fields.leader))}</td>
      <td>${escapeHtml(getMappedValue(x.row, fields.pic))}</td>
      <td>${escapeHtml(x.row[fields.phone] || "")}</td>
      <td>${escapeHtml(x.row[fields.createdTime] || "")}</td>
      <td><span class="badge danger">${Math.floor(x.hours)}h</span></td>
    </tr>
  `).join("");
  if (!overdue.length) {
    els.overdueBody.innerHTML = "<tr><td colspan=\"6\">Không có lead quá hạn chăm sóc.</td></tr>";
  }
}

function compareByNewest(a, b) {
  const timeA = parseDateSafe(a[fields.createdTime])?.getTime() || 0;
  const timeB = parseDateSafe(b[fields.createdTime])?.getTime() || 0;
  return timeB - timeA;
}

function getVisiblePageNumbers(page, totalPages) {
  const maxPages = 5;
  if (totalPages <= maxPages) return Array.from({ length: totalPages }, (_, idx) => idx + 1);
  const start = Math.max(1, Math.min(page - 2, totalPages - maxPages + 1));
  return Array.from({ length: maxPages }, (_, idx) => start + idx);
}

function renderLeadPagination(totalRows, currentPage, totalPages) {
  const startIndex = totalRows ? ((currentPage - 1) * leadPagination.pageSize) + 1 : 0;
  const endIndex = Math.min(currentPage * leadPagination.pageSize, totalRows);

  els.leadMeta.innerHTML = `
    <span class="data-chip">${totalRows} lead</span>
    <span class="data-chip">${startIndex}-${endIndex || 0} đang hiển thị</span>
    <span class="data-chip">Trang ${currentPage}/${Math.max(totalPages, 1)}</span>
  `;

  els.leadPrevBtn.disabled = currentPage <= 1;
  els.leadNextBtn.disabled = currentPage >= totalPages;

  const pages = getVisiblePageNumbers(currentPage, totalPages);
  els.leadPageNumbers.innerHTML = pages.map((page) => `
    <button type="button" class="page-number ${page === currentPage ? "active" : ""}" data-page="${page}">
      ${page}
    </button>
  `).join("");
}

function renderTable(rows) {
  const cols = [
    fields.createdTime, fields.name, fields.phone, fields.email,
    fields.major, fields.program, fields.leader, fields.pic,
    fields.status, fields.care1, fields.care2, fields.care3
  ];
  const sortedRows = [...rows].sort(compareByNewest);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / leadPagination.pageSize));
  if (leadPagination.page > totalPages) leadPagination.page = totalPages;
  const currentPage = Math.max(1, leadPagination.page);
  const start = (currentPage - 1) * leadPagination.pageSize;
  const pagedRows = sortedRows.slice(start, start + leadPagination.pageSize);

  els.leadTableHead.innerHTML = `<tr>${cols.map((c) => `<th>${c}</th>`).join("")}</tr>`;
  els.leadTableBody.innerHTML = pagedRows.map((r) => `
    <tr>
      ${cols.map((c) => {
        if (c === fields.status) return `<td>${badgeStatus(r[c])}</td>`;
        return `<td>${escapeHtml(getMappedValue(r, c))}</td>`;
      }).join("")}
    </tr>
  `).join("");
  if (!pagedRows.length) {
    els.leadTableBody.innerHTML = `<tr><td colspan="${cols.length}">Không có lead phù hợp với bộ lọc hiện tại.</td></tr>`;
  }
  renderLeadPagination(sortedRows.length, currentPage, totalPages);
}

function isRegularProgram(v) {
  if (activeSource === "bachnghe") return true;
  return (v || "").toLowerCase().includes("đại học chính quy");
}

function renderMajorStatsTable(rows) {
  const agg = new Map();

  for (const r of rows) {
    const major = classifyMajor((r[fields.major] || "Chưa rõ ngành").trim());
    if (!agg.has(major)) {
      agg.set(major, { major, regular: 0, nonRegular: 0, total: 0 });
    }
    const item = agg.get(major);
    if (isRegularProgram(r[fields.program])) item.regular += 1;
    else item.nonRegular += 1;
    item.total += 1;
  }

  const list = [...agg.values()].sort((a, b) => b.total - a.total || a.major.localeCompare(b.major, "vi"));

  const sumRegular = list.reduce((s, x) => s + x.regular, 0);
  const sumNonRegular = list.reduce((s, x) => s + x.nonRegular, 0);
  const sumTotal = list.reduce((s, x) => s + x.total, 0);

  els.majorStatsHead.innerHTML = "<tr><th>Ngành</th><th>Đại học chính quy</th><th>Ngoài chính quy</th><th>Tổng</th></tr>";
  els.majorStatsBody.innerHTML = list.map((x) => `
    <tr>
      <td>${escapeHtml(x.major)}</td>
      <td>${x.regular}</td>
      <td>${x.nonRegular}</td>
      <td>${x.total}</td>
    </tr>
  `).join("");

  els.majorStatsBody.innerHTML += `
    <tr>
      <td><strong>Sum</strong></td>
      <td><strong>${sumRegular}</strong></td>
      <td><strong>${sumNonRegular}</strong></td>
      <td><strong>${sumTotal}</strong></td>
    </tr>
  `;

  if (!list.length) {
    els.majorStatsBody.innerHTML = "<tr><td colspan=\"4\">Không có dữ liệu thống kê ngành.</td></tr>";
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function refreshAllViews() {
  const filtered = getFilteredRows();
  updateKpis(filtered);
  renderStatusChart(filtered);
  renderCareChart(filtered);
  renderRankTable(els.leaderRankHead, els.leaderRankBody, buildPerformanceRanks(filtered, fields.leader));
  renderRankTable(els.picRankHead, els.picRankBody, buildPerformanceRanks(filtered, fields.pic));
  renderOverdueTable(filtered);
  renderTable(filtered);
  renderMajorStatsTable(filtered);
}

async function loadData() {
  const entries = Object.keys(SOURCES);
  const results = await Promise.all(entries.map(async (key) => {
    const res = await fetch(getSheetCsvUrl(key), { cache: "no-store" });
    if (!res.ok) throw new Error(`Không tải được dữ liệu ${SOURCES[key].label}: ${res.status}`);
    const csv = await res.text();
    return [key, parseCsv(csv)];
  }));
  rowsBySource = Object.fromEntries(results);
  rawRows = rowsBySource[activeSource] || [];

  setSelectOptions(els.leaderFilter, uniqueValues(rawRows, fields.leader));
  setSelectOptions(els.picFilter, uniqueValues(rawRows, fields.pic));
  setSelectOptions(els.majorFilter, uniqueValues(rawRows, fields.major));
  setSelectOptions(els.programFilter, uniqueValues(rawRows, fields.program));

  renderCampusCards();
  resetLeadPagination();
  refreshAllViews();
  els.lastUpdated.textContent = `Cập nhật: ${new Date().toLocaleString("vi-VN")} • ${SOURCES[activeSource].label}`;
}

async function refresh() {
  try {
    await loadData();
  } catch (err) {
    console.error(err);
    if (window.location.protocol === "file:") {
      els.lastUpdated.textContent = "Đang mở bằng file:// nên trình duyệt có thể chặn tải dữ liệu. Hãy mở qua http://127.0.0.1:8000/index.html";
      return;
    }
    els.lastUpdated.textContent = "Lỗi tải dữ liệu. Kiểm tra quyền chia sẻ Google Sheet hoặc kết nối mạng.";
  }
}

[els.leaderFilter, els.picFilter, els.majorFilter, els.programFilter]
  .forEach((el) => el.addEventListener("change", () => {
    resetLeadPagination();
    refreshAllViews();
  }));

els.leadPageSize.addEventListener("change", () => {
  leadPagination.pageSize = Number(els.leadPageSize.value) || 5;
  resetLeadPagination();
  refreshAllViews();
});

els.leadPrevBtn.addEventListener("click", () => {
  if (leadPagination.page <= 1) return;
  leadPagination.page -= 1;
  refreshAllViews();
});

els.leadNextBtn.addEventListener("click", () => {
  leadPagination.page += 1;
  refreshAllViews();
});

els.leadPageNumbers.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-page]");
  if (!btn) return;
  leadPagination.page = Number(btn.dataset.page) || 1;
  refreshAllViews();
});

els.refreshBtn.addEventListener("click", refresh);

leadPagination.pageSize = Number(els.leadPageSize.value) || 5;

refresh();
setInterval(refresh, AUTO_REFRESH_MS);
