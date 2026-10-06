(() => {
  const SESSION_KEY = "vmp_admin_session_v1";
  const STORAGE_KEY = "vmp_admin_demo_v3";

  if (sessionStorage.getItem(SESSION_KEY) !== "active") {
    window.location.replace("./login/");
    return;
  }

  const planCatalog = {
    free: { name: "Free", price: 0, description: "Controle essencial para começar" },
    plus: { name: "Plus", price: 19.90, description: "Recursos avançados para uso individual" },
    family: { name: "Family", price: 29.90, description: "Compartilhamento e recursos para múltiplos membros" }
  };

  const seed = {
    signups: [4, 7, 5, 9, 8, 12, 14, 11, 16, 13, 19, 21],
    customers: [
      { id:"u1", name:"Marina Costa", email:"marina@exemplo.com", workspaceId:"w1", plan:"free", status:"active", joined:"2026-09-28", lastAccess:"Hoje, 08:42" },
      { id:"u2", name:"Rafael Lima", email:"rafael@exemplo.com", workspaceId:"w2", plan:"family", status:"active", joined:"2026-09-24", lastAccess:"Hoje, 07:55" },
      { id:"u3", name:"Camila Souza", email:"camila@exemplo.com", workspaceId:"w3", plan:"plus", status:"active", joined:"2026-09-19", lastAccess:"Ontem, 22:14" },
      { id:"u4", name:"João Martins", email:"joao@exemplo.com", workspaceId:"w4", plan:"free", status:"pending", joined:"2026-09-14", lastAccess:"Nunca" },
      { id:"u5", name:"Bianca Alves", email:"bianca@exemplo.com", workspaceId:"w5", plan:"family", status:"active", joined:"2026-09-10", lastAccess:"Ontem, 18:31" },
      { id:"u6", name:"Lucas Melo", email:"lucas@exemplo.com", workspaceId:"w6", plan:"free", status:"suspended", joined:"2026-08-31", lastAccess:"14 dias atrás" },
      { id:"u7", name:"Larissa Nunes", email:"larissa@exemplo.com", workspaceId:"w7", plan:"plus", status:"active", joined:"2026-08-26", lastAccess:"Hoje, 06:40" },
      { id:"u8", name:"Pedro Rocha", email:"pedro@exemplo.com", workspaceId:"w8", plan:"free", status:"active", joined:"2026-08-20", lastAccess:"2 dias atrás" },
      { id:"u9", name:"Renata Freitas", email:"renata@exemplo.com", workspaceId:"w9", plan:"family", status:"active", joined:"2026-08-13", lastAccess:"Hoje, 08:01" },
      { id:"u10", name:"Thiago Vieira", email:"thiago@exemplo.com", workspaceId:"w10", plan:"plus", status:"active", joined:"2026-08-05", lastAccess:"4 dias atrás" },
      { id:"u11", name:"Aline Cardoso", email:"aline@exemplo.com", workspaceId:"w11", plan:"free", status:"pending", joined:"2026-10-02", lastAccess:"Nunca" },
      { id:"u12", name:"Bruno Prado", email:"bruno@exemplo.com", workspaceId:"w12", plan:"plus", status:"active", joined:"2026-10-01", lastAccess:"Ontem, 16:22" }
    ],
    workspaces: [
      { id:"w1", name:"Casa da Marina", ownerId:"u1", type:"individual", members:1, plan:"free", status:"active", subscriptionStatus:"not_applicable", created:"2026-09-28" },
      { id:"w2", name:"Rafael & Ana", ownerId:"u2", type:"shared", members:2, plan:"family", status:"active", subscriptionStatus:"active", created:"2026-09-24" },
      { id:"w3", name:"Finanças Camila", ownerId:"u3", type:"individual", members:1, plan:"plus", status:"active", subscriptionStatus:"active", created:"2026-09-19" },
      { id:"w4", name:"Finanças João", ownerId:"u4", type:"individual", members:1, plan:"free", status:"pending", subscriptionStatus:"not_applicable", created:"2026-09-14" },
      { id:"w5", name:"Bianca & Leo", ownerId:"u5", type:"shared", members:2, plan:"family", status:"active", subscriptionStatus:"active", created:"2026-09-10" },
      { id:"w6", name:"Meu planejamento", ownerId:"u6", type:"individual", members:1, plan:"free", status:"suspended", subscriptionStatus:"not_applicable", created:"2026-08-31" },
      { id:"w7", name:"Larissa", ownerId:"u7", type:"individual", members:1, plan:"plus", status:"active", subscriptionStatus:"active", created:"2026-08-26" },
      { id:"w8", name:"Pedro - Pessoal", ownerId:"u8", type:"individual", members:1, plan:"free", status:"active", subscriptionStatus:"not_applicable", created:"2026-08-20" },
      { id:"w9", name:"Família Freitas", ownerId:"u9", type:"shared", members:4, plan:"family", status:"active", subscriptionStatus:"active", created:"2026-08-13" },
      { id:"w10", name:"Planejamento Thiago", ownerId:"u10", type:"individual", members:1, plan:"plus", status:"active", subscriptionStatus:"past_due", created:"2026-08-05" },
      { id:"w11", name:"Aline", ownerId:"u11", type:"individual", members:1, plan:"free", status:"pending", subscriptionStatus:"not_applicable", created:"2026-10-02" },
      { id:"w12", name:"Bruno & Dani", ownerId:"u12", type:"shared", members:2, plan:"plus", status:"active", subscriptionStatus:"trialing", created:"2026-10-01" }
    ],
    activity: [
      { id:"a1", type:"signup", at:"Hoje, 08:42", userId:"u1", workspaceId:"w1", title:"Novo cadastro confirmado", detail:"Marina Costa concluiu o cadastro." },
      { id:"a2", type:"access", at:"Hoje, 08:01", userId:"u9", workspaceId:"w9", title:"Acesso ao produto", detail:"Renata Freitas acessou o workspace Família Freitas." },
      { id:"a3", type:"plan", at:"Ontem, 18:50", userId:"u5", workspaceId:"w5", title:"Plano alterado", detail:"Bianca & Leo migraram para Family." },
      { id:"a4", type:"workspace", at:"Ontem, 16:22", userId:"u12", workspaceId:"w12", title:"Workspace compartilhado", detail:"Bruno & Dani passaram a ter 2 membros." },
      { id:"a5", type:"signup", at:"02/10, 13:18", userId:"u11", workspaceId:"w11", title:"Cadastro aguardando confirmação", detail:"Aline Cardoso ainda não confirmou o acesso." },
      { id:"a6", type:"access", at:"01/10, 20:40", userId:"u7", workspaceId:"w7", title:"Retorno ao produto", detail:"Larissa Nunes voltou a acessar após 5 dias." },
      { id:"a7", type:"workspace", at:"30/09, 11:05", userId:"u9", workspaceId:"w9", title:"Novo membro no workspace", detail:"Família Freitas agora possui 4 membros." },
      { id:"a8", type:"plan", at:"29/09, 09:12", userId:"u3", workspaceId:"w3", title:"Upgrade para Plus", detail:"Finanças Camila ativou o plano Plus." }
    ],
    supportNotes: [
      { id:"n1", customerId:"u10", at:"04/10/2026 14:20", author:"Admin", text:"Cliente relatou dúvida sobre renovação. Acompanhar status da assinatura." },
      { id:"n2", customerId:"u4", at:"03/10/2026 09:10", author:"Admin", text:"Cadastro pendente; aguardar confirmação antes de novo contato." }
    ]
  };

  const $ = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const pages = { customers:1, workspaces:1, activity:1 };
  const pageSizes = { customers:6, workspaces:6, activity:6 };

  function migrateState(input) {
    const value = input && typeof input === "object" ? input : clone(seed);
    value.signups = Array.isArray(value.signups) ? value.signups : clone(seed.signups);
    value.customers = Array.isArray(value.customers) ? value.customers : clone(seed.customers);
    value.workspaces = Array.isArray(value.workspaces) ? value.workspaces : clone(seed.workspaces);
    value.activity = Array.isArray(value.activity) ? value.activity : clone(seed.activity);
    value.supportNotes = Array.isArray(value.supportNotes) ? value.supportNotes : [];
    value.workspaces.forEach(workspace => {
      if (!workspace.subscriptionStatus) {
        workspace.subscriptionStatus = workspace.plan === "free" ? "not_applicable" : "active";
      }
    });
    return value;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.customers && saved?.workspaces && saved?.activity) return migrateState(saved);
    } catch {}
    const initial = clone(seed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  let state = loadState();
  let selectedCustomerId = null;

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat("pt-BR", { style:"currency", currency:"BRL" }).format(Number(value || 0));
  }

  function formatDate(value) {
    if (!value) return "—";
    const [year, month, day] = String(value).split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR").format(new Date(year, (month || 1) - 1, day || 1));
  }

  function nowLabel() {
    return new Intl.DateTimeFormat("pt-BR", {
      day:"2-digit", month:"2-digit", year:"numeric", hour:"2-digit", minute:"2-digit"
    }).format(new Date());
  }

  function customerById(id) {
    return state.customers.find(item => item.id === id) || null;
  }

  function workspaceById(id) {
    return state.workspaces.find(item => item.id === id) || null;
  }

  function planName(code) {
    return planCatalog[code]?.name || code;
  }

  function statusLabel(status) {
    return ({ active:"Ativo", pending:"Pendente", suspended:"Suspenso" })[status] || status;
  }

  function subscriptionLabel(status) {
    return ({
      active:"Ativa",
      trialing:"Em teste",
      past_due:"Pagamento pendente",
      canceled:"Cancelada",
      not_applicable:"Não se aplica"
    })[status] || status;
  }

  function typeLabel(type) {
    return type === "shared" ? "Compartilhado" : "Individual";
  }

  function eventLabel(type) {
    return ({ signup:"Cadastro", workspace:"Workspace", plan:"Plano", access:"Acesso", admin:"Admin" })[type] || type;
  }

  function revenueEligible(workspace) {
    return workspace.status === "active" &&
      workspace.plan !== "free" &&
      ["active","trialing"].includes(workspace.subscriptionStatus);
  }

  function getMetrics() {
    const activeWorkspaces = state.workspaces.filter(item => item.status === "active");
    const payingWorkspaces = activeWorkspaces.filter(revenueEligible);
    const mrr = payingWorkspaces.reduce((sum, item) => sum + Number(planCatalog[item.plan]?.price || 0), 0);
    const paidPlanCount = activeWorkspaces.filter(item => item.plan !== "free").length;
    const conversion = activeWorkspaces.length ? Math.round((paidPlanCount / activeWorkspaces.length) * 100) : 0;
    return {
      users: state.customers.length,
      activeUsers: state.customers.filter(item => item.status === "active").length,
      pendingUsers: state.customers.filter(item => item.status === "pending").length,
      suspendedUsers: state.customers.filter(item => item.status === "suspended").length,
      workspaces: activeWorkspaces.length,
      payingWorkspaces: payingWorkspaces.length,
      paidPlanCount,
      pastDue: activeWorkspaces.filter(item => item.subscriptionStatus === "past_due").length,
      mrr,
      conversion
    };
  }

  function addActivity(type, customerId, workspaceId, title, detail) {
    state.activity.unshift({
      id: "a-" + Date.now() + "-" + Math.random().toString(36).slice(2,6),
      type,
      at: "Agora",
      userId: customerId || "",
      workspaceId: workspaceId || "",
      title,
      detail
    });
    state.activity = state.activity.slice(0, 100);
    saveState();
  }

  function toast(message, kind = "success") {
    const el = $("admin-toast");
    el.textContent = message;
    el.className = "admin-toast " + kind;
    el.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { el.hidden = true; }, 3200);
  }

  function setView(view) {
    document.querySelectorAll("[data-admin-view]").forEach(button => {
      button.classList.toggle("active", button.dataset.adminView === view);
    });
    document.querySelectorAll("[data-admin-section]").forEach(section => {
      section.classList.toggle("active", section.dataset.adminSection === view);
    });
    const titles = {
      overview:"Visão geral",
      customers:"Clientes",
      workspaces:"Workspaces",
      plans:"Planos e receita",
      activity:"Atividade"
    };
    $("admin-page-title").textContent = titles[view] || "Admin";
    window.scrollTo({ top:0, behavior:"smooth" });
  }

  function paginate(items, scope) {
    const pageSize = pageSizes[scope];
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    pages[scope] = Math.min(Math.max(1, pages[scope]), totalPages);
    const start = (pages[scope] - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      page: pages[scope],
      totalPages,
      total: items.length
    };
  }

  function renderPagination(targetId, scope, data) {
    const target = $(targetId);
    if (!target) return;
    if (data.totalPages <= 1) {
      target.innerHTML = "";
      return;
    }

    const buttons = [];
    buttons.push(`<button type="button" data-page-scope="${scope}" data-page="${Math.max(1,data.page-1)}" ${data.page===1?"disabled":""}>←</button>`);
    for (let page = 1; page <= data.totalPages; page += 1) {
      buttons.push(`<button type="button" data-page-scope="${scope}" data-page="${page}" class="${page===data.page?"active":""}">${page}</button>`);
    }
    buttons.push(`<button type="button" data-page-scope="${scope}" data-page="${Math.min(data.totalPages,data.page+1)}" ${data.page===data.totalPages?"disabled":""}>→</button>`);
    target.innerHTML = `<span>Página ${data.page} de ${data.totalPages}</span><div>${buttons.join("")}</div>`;
  }

  function renderOverview() {
    const metrics = getMetrics();
    $("metric-users").textContent = metrics.users;
    $("metric-users-note").textContent = metrics.activeUsers + " ativos · " + metrics.pendingUsers + " pendentes";
    $("metric-workspaces").textContent = metrics.workspaces;
    $("metric-workspaces-note").textContent =
      state.workspaces.filter(item => item.type === "individual" && item.status === "active").length +
      " individuais · " +
      state.workspaces.filter(item => item.type === "shared" && item.status === "active").length +
      " compartilhados";
    $("metric-mrr").textContent = formatCurrency(metrics.mrr);
    $("metric-mrr-note").textContent = metrics.payingWorkspaces + " assinatura(s) gerando MRR";
    $("metric-conversion").textContent = metrics.conversion + "%";
    $("metric-conversion-note").textContent = "Base ativa em planos pagos";

    renderGrowthChart();
    renderPlanDistribution();

    const health = [
      { label:"Ativos", value:metrics.activeUsers, note:"usuários com acesso liberado", tone:"good" },
      { label:"Pendentes", value:metrics.pendingUsers, note:"aguardando confirmação", tone:"warn" },
      { label:"Suspensos", value:metrics.suspendedUsers, note:"acesso bloqueado", tone:"danger" },
      { label:"Cobrança pendente", value:metrics.pastDue, note:"assinaturas past_due", tone:"paid" }
    ];
    $("admin-health-grid").innerHTML = health.map(item => `
      <div class="admin-health-item ${item.tone}">
        <strong>${item.value}</strong><span>${item.label}</span><small>${item.note}</small>
      </div>
    `).join("");

    $("admin-health-pill").textContent = metrics.pastDue > 0 || metrics.suspendedUsers > 2 ? "Atenção" : "Estável";
    renderActivity($("admin-recent-activity"), state.activity.slice(0, 5), true);
  }

  function renderGrowthChart() {
    const windowSize = Number($("admin-growth-window")?.value || 12);
    const values = state.signups.slice(-windowSize);
    const max = Math.max(1, ...values);
    $("admin-signups-chart").innerHTML = values.map((value, index) => `
      <div class="admin-chart-bar-wrap">
        <span class="admin-chart-value">${value}</span>
        <span class="admin-chart-bar" style="height:${Math.max(5, Math.round((value / max) * 100))}%"></span>
        <small>P${index + 1}</small>
      </div>
    `).join("");
    $("admin-signups-chart").style.gridTemplateColumns = `repeat(${values.length}, minmax(0,1fr))`;
  }

  function renderPlanDistribution() {
    const total = state.workspaces.filter(item => item.status === "active").length || 1;
    const plans = Object.keys(planCatalog).map(code => {
      const count = state.workspaces.filter(item => item.status === "active" && item.plan === code).length;
      return { code, count, percent:Math.round((count / total) * 100) };
    });
    $("admin-plan-distribution").innerHTML = plans.map(item => `
      <div class="admin-plan-row">
        <div class="admin-plan-row-head">
          <div><span class="plan-badge ${item.code}">${planName(item.code)}</span><small>${item.count} workspace(s)</small></div>
          <strong>${item.percent}%</strong>
        </div>
        <div class="analysis-track"><span class="plan-fill ${item.code}" style="width:${item.percent}%"></span></div>
      </div>
    `).join("");
  }

  function filteredCustomers() {
    const term = ($("admin-customer-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
    const status = $("admin-customer-status")?.value || "";
    const plan = $("admin-customer-plan")?.value || "";
    return state.customers.filter(customer => {
      const workspace = workspaceById(customer.workspaceId);
      const termMatch = !term ||
        customer.name.toLocaleLowerCase("pt-BR").includes(term) ||
        customer.email.toLocaleLowerCase("pt-BR").includes(term) ||
        (workspace?.name || "").toLocaleLowerCase("pt-BR").includes(term);
      return termMatch && (!status || customer.status === status) && (!plan || customer.plan === plan);
    });
  }

  function renderCustomers() {
    const filtered = filteredCustomers();
    const paged = paginate(filtered, "customers");
    $("admin-customer-count").textContent = filtered.length + " registro(s) · página " + paged.page + " de " + paged.totalPages;
    $("admin-customer-body").innerHTML = paged.items.map(customer => {
      const workspace = workspaceById(customer.workspaceId);
      return `
        <tr>
          <td><strong>${escapeHtml(customer.name)}</strong><small>${escapeHtml(customer.email)}</small></td>
          <td><strong>${escapeHtml(workspace?.name || "—")}</strong><small>${workspace ? typeLabel(workspace.type) : "Sem workspace"}</small></td>
          <td><span class="plan-badge ${customer.plan}">${planName(customer.plan)}</span></td>
          <td><span class="admin-status ${customer.status}">${statusLabel(customer.status)}</span></td>
          <td>${formatDate(customer.joined)}</td>
          <td>${escapeHtml(customer.lastAccess)}</td>
          <td><button type="button" class="text-action admin-open-customer" data-customer-id="${customer.id}">Abrir</button></td>
        </tr>
      `;
    }).join("") || '<tr><td colspan="7" class="admin-empty-table">Nenhum cliente corresponde aos filtros.</td></tr>';
    renderPagination("admin-customer-pagination","customers",paged);
  }

  function filteredWorkspaces() {
    const term = ($("admin-workspace-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
    const type = $("admin-workspace-type")?.value || "";
    const plan = $("admin-workspace-plan")?.value || "";
    return state.workspaces.filter(workspace => {
      const owner = customerById(workspace.ownerId);
      const termMatch = !term ||
        workspace.name.toLocaleLowerCase("pt-BR").includes(term) ||
        (owner?.name || "").toLocaleLowerCase("pt-BR").includes(term);
      return termMatch && (!type || workspace.type === type) && (!plan || workspace.plan === plan);
    });
  }

  function renderWorkspaces() {
    const all = state.workspaces;
    const filtered = filteredWorkspaces();
    const paged = paginate(filtered, "workspaces");
    $("workspace-total").textContent = all.length;
    $("workspace-individual").textContent = all.filter(item => item.type === "individual").length;
    $("workspace-shared").textContent = all.filter(item => item.type === "shared").length;
    const members = all.reduce((sum, item) => sum + Number(item.members || 0), 0);
    $("workspace-members-average").textContent = all.length ? (members / all.length).toFixed(1).replace(".", ",") : "0";
    $("admin-workspace-count").textContent = filtered.length + " registro(s) · página " + paged.page + " de " + paged.totalPages;

    $("admin-workspace-grid").innerHTML = paged.items.map(workspace => {
      const owner = customerById(workspace.ownerId);
      return `
        <article class="admin-workspace-card">
          <div class="admin-workspace-card-head">
            <div>
              <span class="workspace-type-icon ${workspace.type}">${workspace.type === "shared" ? "2+" : "1"}</span>
              <div><strong>${escapeHtml(workspace.name)}</strong><small>${typeLabel(workspace.type)}</small></div>
            </div>
            <span class="admin-status ${workspace.status}">${statusLabel(workspace.status)}</span>
          </div>
          <div class="admin-workspace-owner">
            <span>Owner</span><strong>${escapeHtml(owner?.name || "—")}</strong><small>${escapeHtml(owner?.email || "")}</small>
          </div>
          <div class="admin-workspace-stats">
            <div><span>Membros</span><strong>${workspace.members}</strong></div>
            <div><span>Plano</span><strong>${planName(workspace.plan)}</strong></div>
            <div><span>Assinatura</span><strong>${subscriptionLabel(workspace.subscriptionStatus)}</strong></div>
          </div>
          <button type="button" class="btn ghost admin-workspace-open" data-customer-id="${workspace.ownerId}">Abrir owner</button>
        </article>
      `;
    }).join("") || '<div class="empty-state"><strong>Nenhum workspace encontrado.</strong><span>Altere os filtros para visualizar outros resultados.</span></div>';

    renderPagination("admin-workspace-pagination","workspaces",paged);
  }

  function renderPlans() {
    const metrics = getMetrics();
    $("plans-mrr").textContent = formatCurrency(metrics.mrr);
    $("plans-arr").textContent = formatCurrency(metrics.mrr * 12);
    $("plans-paying").textContent = metrics.payingWorkspaces;
    $("plans-conversion").textContent = metrics.conversion + "%";

    $("admin-plan-cards").innerHTML = Object.entries(planCatalog).map(([code, plan]) => {
      const workspaces = state.workspaces.filter(item => item.status === "active" && item.plan === code);
      const billable = workspaces.filter(revenueEligible);
      const revenue = billable.length * plan.price;
      const pending = workspaces.filter(item => item.subscriptionStatus === "past_due").length;
      return `
        <article class="panel admin-plan-card ${code}">
          <div class="admin-plan-card-top">
            <span class="plan-badge ${code}">${plan.name}</span>
            <strong>${formatCurrency(plan.price)}<small>/mês</small></strong>
          </div>
          <h2>${workspaces.length} workspace(s)</h2>
          <p class="muted">${escapeHtml(plan.description)}</p>
          <div class="admin-plan-card-metric"><span>MRR do plano</span><strong>${formatCurrency(revenue)}</strong></div>
          <div class="admin-plan-card-metric"><span>Gerando receita</span><strong>${billable.length}</strong></div>
          <div class="admin-plan-card-metric"><span>Pagamento pendente</span><strong>${pending}</strong></div>
        </article>
      `;
    }).join("");
  }

  function filteredActivity() {
    const term = ($("admin-activity-search")?.value || "").trim().toLocaleLowerCase("pt-BR");
    const type = $("admin-activity-type")?.value || "";
    return state.activity.filter(event => {
      const user = customerById(event.userId);
      const workspace = workspaceById(event.workspaceId);
      const termMatch = !term ||
        event.title.toLocaleLowerCase("pt-BR").includes(term) ||
        event.detail.toLocaleLowerCase("pt-BR").includes(term) ||
        (user?.name || "").toLocaleLowerCase("pt-BR").includes(term) ||
        (workspace?.name || "").toLocaleLowerCase("pt-BR").includes(term);
      return termMatch && (!type || event.type === type);
    });
  }

  function renderActivity(target = $("admin-activity-list"), events = null, compact = false) {
    if (!target) return;
    let source = events || filteredActivity();

    if (!compact && target.id === "admin-activity-list") {
      const paged = paginate(source, "activity");
      $("admin-activity-count").textContent = source.length + " evento(s) · página " + paged.page + " de " + paged.totalPages;
      source = paged.items;
      renderPagination("admin-activity-pagination","activity",paged);
    }

    target.innerHTML = source.map(event => {
      const user = customerById(event.userId);
      const workspace = workspaceById(event.workspaceId);
      return `
        <div class="admin-activity-item">
          <span class="activity-type-icon ${event.type}">${event.type === "signup" ? "+" : event.type === "plan" ? "↗" : event.type === "admin" ? "!" : "•"}</span>
          <div>
            <div class="admin-activity-title"><strong>${escapeHtml(event.title)}</strong><span>${eventLabel(event.type)}</span></div>
            <p>${escapeHtml(event.detail)}</p>
            ${compact ? "" : `<small>${escapeHtml(user?.name || "Sistema")}${workspace ? " · " + escapeHtml(workspace.name) : ""}</small>`}
          </div>
          <time>${escapeHtml(event.at)}</time>
        </div>
      `;
    }).join("") || '<div class="empty-state"><strong>Nenhum evento encontrado.</strong><span>Altere os filtros.</span></div>';
  }

  function renderAll() {
    renderOverview();
    renderCustomers();
    renderWorkspaces();
    renderPlans();
    renderActivity();
    if (selectedCustomerId) renderDrawer(selectedCustomerId);
  }

  function renderSupportNotes(customerId) {
    const notes = state.supportNotes
      .filter(note => note.customerId === customerId)
      .slice()
      .sort((a,b) => String(b.at).localeCompare(String(a.at)));

    return notes.length
      ? notes.map(note => `
          <div class="drawer-note">
            <div><strong>${escapeHtml(note.author)}</strong><span>${escapeHtml(note.at)}</span></div>
            <p>${escapeHtml(note.text)}</p>
          </div>
        `).join("")
      : '<div class="drawer-note-empty">Nenhuma nota operacional para este cliente.</div>';
  }

  function renderDrawer(customerId) {
    const customer = customerById(customerId);
    if (!customer) return closeDrawer();
    const workspace = workspaceById(customer.workspaceId);
    selectedCustomerId = customerId;

    $("drawer-customer-name").textContent = customer.name;
    $("admin-drawer-content").innerHTML = `
      <section class="drawer-profile">
        <div class="drawer-avatar">${escapeHtml(customer.name.slice(0,1).toUpperCase())}</div>
        <div><strong>${escapeHtml(customer.name)}</strong><span>${escapeHtml(customer.email)}</span></div>
      </section>

      <section class="drawer-summary-grid">
        <div><span>Status</span><strong class="admin-status ${customer.status}">${statusLabel(customer.status)}</strong></div>
        <div><span>Plano</span><strong class="plan-badge ${customer.plan}">${planName(customer.plan)}</strong></div>
        <div><span>Cadastro</span><strong>${formatDate(customer.joined)}</strong></div>
        <div><span>Último acesso</span><strong>${escapeHtml(customer.lastAccess)}</strong></div>
      </section>

      <section class="drawer-section">
        <p class="eyebrow">WORKSPACE</p>
        <div class="drawer-workspace-card">
          <strong>${escapeHtml(workspace?.name || "Sem workspace")}</strong>
          <span>${workspace ? typeLabel(workspace.type) + " · " + workspace.members + " membro(s)" : "—"}</span>
        </div>
      </section>

      <section class="drawer-section">
        <p class="eyebrow">PLANO E ASSINATURA</p>
        <label class="drawer-field">Plano atual
          <select id="drawer-plan-select">
            ${Object.entries(planCatalog).map(([code, plan]) => `<option value="${code}" ${customer.plan === code ? "selected" : ""}>${plan.name} · ${formatCurrency(plan.price)}/mês</option>`).join("")}
          </select>
        </label>
        <button class="btn primary drawer-full-button" type="button" id="drawer-save-plan">Salvar plano</button>

        <label class="drawer-field drawer-spaced-field">Status da assinatura
          <select id="drawer-subscription-select" ${customer.plan === "free" ? "disabled" : ""}>
            <option value="active" ${workspace?.subscriptionStatus === "active" ? "selected" : ""}>Ativa</option>
            <option value="trialing" ${workspace?.subscriptionStatus === "trialing" ? "selected" : ""}>Em teste</option>
            <option value="past_due" ${workspace?.subscriptionStatus === "past_due" ? "selected" : ""}>Pagamento pendente</option>
            <option value="canceled" ${workspace?.subscriptionStatus === "canceled" ? "selected" : ""}>Cancelada</option>
            ${customer.plan === "free" ? '<option value="not_applicable" selected>Não se aplica</option>' : ""}
          </select>
        </label>
        <button class="btn ghost drawer-full-button" type="button" id="drawer-save-subscription" ${customer.plan === "free" ? "disabled" : ""}>Salvar status da assinatura</button>
      </section>

      <section class="drawer-section">
        <p class="eyebrow">ACESSO</p>
        <div class="drawer-action-grid">
          ${customer.status !== "active" ? '<button class="btn secondary" id="drawer-activate" type="button">Ativar acesso</button>' : ""}
          ${customer.status === "active" ? '<button class="btn danger-button" id="drawer-suspend" type="button">Suspender acesso</button>' : ""}
          ${customer.status === "pending" ? '<button class="btn ghost" id="drawer-resend" type="button">Reenviar confirmação</button>' : ""}
        </div>
      </section>

      <section class="drawer-section">
        <p class="eyebrow">SUPORTE</p>
        <div class="drawer-note-list" id="drawer-note-list">${renderSupportNotes(customer.id)}</div>
        <label class="drawer-field drawer-spaced-field">Adicionar nota operacional
          <textarea id="drawer-support-note" rows="3" maxlength="500" placeholder="Ex.: cliente pediu ajuda com acesso, cobrança ou configuração da conta."></textarea>
        </label>
        <button class="btn ghost drawer-full-button" type="button" id="drawer-add-note">Salvar nota</button>
      </section>

      <section class="drawer-section drawer-privacy-note">
        <p class="eyebrow">PRIVACIDADE</p>
        <p>As notas devem tratar apenas de suporte operacional. Este painel não carrega gastos, receitas, metas ou outros dados financeiros do cliente.</p>
      </section>
    `;

    $("admin-customer-drawer").classList.add("open");
    $("admin-customer-drawer").setAttribute("aria-hidden", "false");
    $("admin-drawer-backdrop").hidden = false;

    $("drawer-save-plan")?.addEventListener("click", () => updateCustomerPlan(customer.id, $("drawer-plan-select").value));
    $("drawer-save-subscription")?.addEventListener("click", () => updateSubscriptionStatus(customer.id, $("drawer-subscription-select").value));
    $("drawer-activate")?.addEventListener("click", () => updateCustomerStatus(customer.id, "active"));
    $("drawer-suspend")?.addEventListener("click", () => updateCustomerStatus(customer.id, "suspended"));
    $("drawer-resend")?.addEventListener("click", () => {
      addActivity("admin", customer.id, customer.workspaceId, "Confirmação reenviada", "Administrador simulou o reenvio do e-mail de confirmação.");
      renderAll();
      toast("Confirmação simulada como reenviada.");
    });
    $("drawer-add-note")?.addEventListener("click", () => addSupportNote(customer.id));
  }

  function openDrawer(customerId) {
    renderDrawer(customerId);
  }

  function closeDrawer() {
    selectedCustomerId = null;
    $("admin-customer-drawer").classList.remove("open");
    $("admin-customer-drawer").setAttribute("aria-hidden", "true");
    $("admin-drawer-backdrop").hidden = true;
  }

  function updateCustomerPlan(customerId, plan) {
    if (!planCatalog[plan]) return;
    const customer = customerById(customerId);
    const workspace = workspaceById(customer?.workspaceId);
    if (!customer) return;

    const previous = customer.plan;
    customer.plan = plan;
    if (workspace) {
      workspace.plan = plan;
      if (plan === "free") workspace.subscriptionStatus = "not_applicable";
      else if (workspace.subscriptionStatus === "not_applicable" || workspace.subscriptionStatus === "canceled") workspace.subscriptionStatus = "active";
    }
    addActivity("admin", customer.id, customer.workspaceId, "Plano alterado pelo Admin", `${customer.name}: ${planName(previous)} → ${planName(plan)}.`);
    saveState();
    renderAll();
    toast("Plano atualizado na demonstração.");
  }

  function updateSubscriptionStatus(customerId, status) {
    const customer = customerById(customerId);
    const workspace = workspaceById(customer?.workspaceId);
    if (!customer || !workspace || customer.plan === "free") return;
    if (!["active","trialing","past_due","canceled"].includes(status)) return;

    const previous = workspace.subscriptionStatus;
    workspace.subscriptionStatus = status;
    addActivity("admin", customer.id, customer.workspaceId, "Status da assinatura alterado", `${subscriptionLabel(previous)} → ${subscriptionLabel(status)}.`);
    saveState();
    renderAll();
    toast("Status da assinatura atualizado.", status === "past_due" ? "warning" : "success");
  }

  function updateCustomerStatus(customerId, status) {
    const customer = customerById(customerId);
    const workspace = workspaceById(customer?.workspaceId);
    if (!customer) return;

    customer.status = status;
    if (workspace) workspace.status = status;
    addActivity("admin", customer.id, customer.workspaceId, "Status de acesso alterado", `${customer.name} agora está como ${statusLabel(status)}.`);
    saveState();
    renderAll();
    toast(status === "active" ? "Acesso ativado." : "Acesso suspenso.", status === "active" ? "success" : "warning");
  }

  function addSupportNote(customerId) {
    const customer = customerById(customerId);
    const textarea = $("drawer-support-note");
    const textValue = String(textarea?.value || "").trim();
    if (!customer || !textValue) {
      toast("Escreva uma nota antes de salvar.", "warning");
      return;
    }

    state.supportNotes.push({
      id:"n-" + Date.now(),
      customerId,
      at:nowLabel(),
      author:"Admin",
      text:textValue.slice(0,500)
    });
    addActivity("admin", customer.id, customer.workspaceId, "Nota de suporte adicionada", "Uma nova nota operacional foi registrada para o cliente.");
    saveState();
    renderAll();
    toast("Nota de suporte salva.");
  }

  document.querySelectorAll("[data-admin-view]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.adminView));
  });

  document.querySelectorAll("[data-admin-jump]").forEach(button => {
    button.addEventListener("click", () => setView(button.dataset.adminJump));
  });

  ["admin-customer-search","admin-customer-status","admin-customer-plan"].forEach(id => {
    $(id)?.addEventListener("input", () => {
      pages.customers = 1;
      renderCustomers();
    });
  });

  ["admin-workspace-search","admin-workspace-type","admin-workspace-plan"].forEach(id => {
    $(id)?.addEventListener("input", () => {
      pages.workspaces = 1;
      renderWorkspaces();
    });
  });

  ["admin-activity-search","admin-activity-type"].forEach(id => {
    $(id)?.addEventListener("input", () => {
      pages.activity = 1;
      renderActivity();
    });
  });

  $("admin-growth-window")?.addEventListener("input", renderGrowthChart);

  document.addEventListener("click", event => {
    const customerButton = event.target.closest("[data-customer-id]");
    if (customerButton) {
      openDrawer(customerButton.dataset.customerId);
      return;
    }

    const pageButton = event.target.closest("[data-page-scope]");
    if (pageButton && !pageButton.disabled) {
      const scope = pageButton.dataset.pageScope;
      pages[scope] = Number(pageButton.dataset.page || 1);
      if (scope === "customers") renderCustomers();
      if (scope === "workspaces") renderWorkspaces();
      if (scope === "activity") renderActivity();
      window.scrollTo({ top:0, behavior:"smooth" });
    }
  });

  $("admin-drawer-close").addEventListener("click", closeDrawer);
  $("admin-drawer-backdrop").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeDrawer();
  });

  $("admin-reset-demo").addEventListener("click", () => {
    if (!window.confirm("Restaurar os dados simulados originais do painel Admin?")) return;
    state = clone(seed);
    saveState();
    pages.customers = pages.workspaces = pages.activity = 1;
    closeDrawer();
    renderAll();
    toast("Dados administrativos restaurados.");
  });

  $("admin-logout").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace("./login/");
  });

  renderAll();
})();