(() => {
  const api = VisionMoneyProDemo;
  const input = document.getElementById("global-search-input");
  const typeFilter = document.getElementById("global-search-type");
  const resultsEl = document.getElementById("global-search-results");
  const emptyEl = document.getElementById("global-search-empty");
  const countEl = document.getElementById("global-search-count");
  const titleEl = document.getElementById("global-search-title");

  const normalize = (value) => String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .toLocaleLowerCase("pt-BR").trim();

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function buildIndex() {
    const items = [];

    api.getTransactions("expense").forEach(item => {
      const account = item.accountId ? api.getAccount(item.accountId) : null;
      const card = item.cardId ? api.getCard(item.cardId) : null;
      items.push({
        type:"expense", icon:"−", title:item.description,
        subtitle:[item.category, account?.name, card?.name].filter(Boolean).join(" · "),
        meta:api.formatDate(item.date),
        value:"− " + api.formatCurrency(item.amount),
        search:[item.description,item.category,item.notes,account?.name,card?.name].join(" "),
        href:"../gastos/"
      });
    });

    api.getTransactions("income").forEach(item => {
      const account = item.accountId ? api.getAccount(item.accountId) : null;
      items.push({
        type:"income", icon:"+", title:item.description,
        subtitle:[item.category, account?.name].filter(Boolean).join(" · "),
        meta:api.formatDate(item.date),
        value:"+ " + api.formatCurrency(item.amount),
        search:[item.description,item.category,item.notes,account?.name].join(" "),
        href:"../receitas/"
      });
    });

    api.getPayables().forEach(item => {
      items.push({
        type:"payable", icon:"✓", title:item.description,
        subtitle:item.category + " · " + (item.status === "paid" ? "Pago" : "Pendente"),
        meta:"Venc. " + api.formatDate(item.dueDate),
        value:api.formatCurrency(item.amount),
        search:[item.description,item.category,item.notes,item.status].join(" "),
        href:"../contas-a-pagar/"
      });
    });

    api.getAccounts(true).forEach(item => {
      items.push({
        type:"account", icon:"◫", title:item.name,
        subtitle:[item.institution, item.active === false ? "Arquivada" : "Ativa"].filter(Boolean).join(" · "),
        meta:"Conta / carteira",
        value:api.formatCurrency(api.getAccountBalance(item.id)),
        search:[item.name,item.institution,item.type].join(" "),
        href:"../contas/"
      });
    });

    api.getCards(true).forEach(item => {
      items.push({
        type:"card", icon:"▣", title:item.name,
        subtitle:[item.brand, item.lastFour ? "•••• " + item.lastFour : "", item.active === false ? "Arquivado" : "Ativo"].filter(Boolean).join(" · "),
        meta:"Cartão de crédito",
        value:api.formatCurrency(Math.max(0, Number(item.limit || 0) - api.getCardUsedLimit(item.id))) + " disponível",
        search:[item.name,item.brand,item.lastFour].join(" "),
        href:"../cartoes/"
      });
    });

    api.getGoals().forEach(item => {
      const progress = api.getGoalProgress(item.id);
      items.push({
        type:"goal", icon:"◎", title:item.name,
        subtitle:item.completed ? "Concluída" : progress.percent + "% concluída",
        meta:item.targetDate ? "Prazo " + api.formatDate(item.targetDate) : "Sem prazo",
        value:api.formatCurrency(progress.saved) + " / " + api.formatCurrency(item.targetAmount),
        search:[item.name,item.targetDate,item.completed ? "concluida" : "ativa"].join(" "),
        href:"../metas/"
      });
    });

    api.getRecurrences().forEach(item => {
      items.push({
        type:"recurrence", icon:"↻", title:item.description,
        subtitle:(item.kind === "income" ? "Receita" : "Gasto") + " · " + item.category,
        meta:"Próxima " + api.formatDate(item.nextDate),
        value:api.formatCurrency(item.amount),
        search:[item.description,item.category,item.frequency,item.kind].join(" "),
        href:"../recorrencias/"
      });
    });

    return items;
  }

  function typeLabel(type) {
    return ({
      expense:"Gasto", income:"Receita", payable:"Conta a pagar",
      account:"Conta", card:"Cartão", goal:"Meta", recurrence:"Recorrência"
    })[type] || type;
  }

  function render() {
    const term = normalize(input.value);
    const selectedType = typeFilter.value;
    const index = buildIndex();

    const params = new URLSearchParams(location.search);
    if (term) params.set("q", input.value.trim()); else params.delete("q");
    if (selectedType) params.set("tipo", selectedType); else params.delete("tipo");
    history.replaceState(null,"",location.pathname + (params.toString() ? "?" + params.toString() : ""));

    if (term.length < 2) {
      resultsEl.innerHTML = "";
      emptyEl.hidden = false;
      countEl.textContent = "0 resultado(s)";
      titleEl.textContent = "Comece digitando";
      return;
    }

    const tokens = term.split(/\s+/).filter(Boolean);
    const results = index
      .filter(item => !selectedType || item.type === selectedType)
      .filter(item => {
        const haystack = normalize([item.title,item.subtitle,item.meta,item.value,item.search].join(" "));
        return tokens.every(token => haystack.includes(token));
      })
      .slice(0,100);

    countEl.textContent = results.length + " resultado(s)";
    titleEl.textContent = results.length ? 'Resultados para "' + input.value.trim() + '"' : "Nenhum resultado";
    emptyEl.hidden = results.length > 0;
    if (!results.length) {
      emptyEl.innerHTML = '<strong>Nada encontrado.</strong><span>Tente outro termo ou retire o filtro de tipo.</span>';
    }

    resultsEl.innerHTML = results.map(item => `
      <a class="global-result ${item.type}" href="${item.href}">
        <span class="global-result-icon">${item.icon}</span>
        <div class="global-result-main">
          <div><strong>${escapeHtml(item.title)}</strong><span>${typeLabel(item.type)}</span></div>
          <p>${escapeHtml(item.subtitle || "—")}</p>
          <small>${escapeHtml(item.meta || "")}</small>
        </div>
        <strong class="global-result-value">${escapeHtml(item.value || "")}</strong>
        <span class="movement-arrow">→</span>
      </a>
    `).join("");
  }

  const params = new URLSearchParams(location.search);
  input.value = params.get("q") || "";
  typeFilter.value = params.get("tipo") || "";

  input.addEventListener("input", render);
  typeFilter.addEventListener("input", render);
  document.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== input && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      input.focus();
    }
  });

  render();
  if (!input.value) input.focus();
})();