(() => {
  const users = [
    { name:"Marina Costa", email:"marina@exemplo.com", workspace:"Casa da Marina", type:"Individual", plan:"Free", status:"Ativo", last:"Hoje" },
    { name:"Rafael Lima", email:"rafael@exemplo.com", workspace:"Rafael & Ana", type:"Compartilhado", plan:"Plus", status:"Ativo", last:"Hoje" },
    { name:"Camila Souza", email:"camila@exemplo.com", workspace:"Família Souza", type:"Compartilhado", plan:"Free", status:"Ativo", last:"Ontem" },
    { name:"João Martins", email:"joao@exemplo.com", workspace:"Finanças João", type:"Individual", plan:"Free", status:"Pendente", last:"3 dias" },
    { name:"Bianca Alves", email:"bianca@exemplo.com", workspace:"Bianca & Leo", type:"Compartilhado", plan:"Plus", status:"Ativo", last:"5 dias" },
    { name:"Lucas Melo", email:"lucas@exemplo.com", workspace:"Meu planejamento", type:"Individual", plan:"Free", status:"Inativo", last:"14 dias" }
  ];

  const signups = [4, 7, 5, 9, 8, 12, 14, 11, 16, 13, 19, 21];
  const tableBody = document.getElementById("admin-users-body");
  const search = document.getElementById("admin-search");
  const statusFilter = document.getElementById("admin-status-filter");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderChart() {
    const max = Math.max(...signups);
    document.getElementById("admin-signups-chart").innerHTML = signups.map((value, index) => `
      <div class="admin-chart-bar-wrap">
        <span class="admin-chart-value">${value}</span>
        <span class="admin-chart-bar" style="height:${Math.round((value/max)*100)}%"></span>
        <small>${index + 1}</small>
      </div>
    `).join("");
  }

  function renderTable() {
    const term = search.value.trim().toLocaleLowerCase("pt-BR");
    const status = statusFilter.value;
    const filtered = users.filter(user => {
      const matchesTerm = !term ||
        user.name.toLocaleLowerCase("pt-BR").includes(term) ||
        user.email.toLocaleLowerCase("pt-BR").includes(term) ||
        user.workspace.toLocaleLowerCase("pt-BR").includes(term);
      const matchesStatus = !status || user.status === status;
      return matchesTerm && matchesStatus;
    });

    tableBody.innerHTML = filtered.map(user => `
      <tr>
        <td><strong>${escapeHtml(user.name)}</strong><small>${escapeHtml(user.email)}</small></td>
        <td><strong>${escapeHtml(user.workspace)}</strong><small>${escapeHtml(user.type)}</small></td>
        <td><span class="plan-badge ${user.plan.toLowerCase()}">${escapeHtml(user.plan)}</span></td>
        <td><span class="admin-status ${user.status.toLowerCase()}">${escapeHtml(user.status)}</span></td>
        <td>${escapeHtml(user.last)}</td>
        <td><button type="button" class="text-action" disabled title="Será ativado com backend real">Abrir</button></td>
      </tr>
    `).join("");

    document.getElementById("admin-result-count").textContent = filtered.length + " registro(s) visível(is)";
  }

  search.addEventListener("input", renderTable);
  statusFilter.addEventListener("input", renderTable);
  renderChart();
  renderTable();
})();