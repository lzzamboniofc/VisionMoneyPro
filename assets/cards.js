(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("card-form");
  const list = document.getElementById("cards-list");
  const empty = document.getElementById("cards-empty");
  const monthInput = document.getElementById("bill-month");
  const cardId = document.getElementById("card-id");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resetForm() {
    form.reset();
    cardId.value = "";
    document.getElementById("card-closing").value = "3";
    document.getElementById("card-due").value = "10";
    document.getElementById("card-editor-title").textContent = "Novo cartão";
    document.getElementById("save-card").textContent = "Salvar cartão";
    document.getElementById("cancel-card-edit").hidden = true;
  }

  function editCard(id) {
    const card = api.getCard(id);
    if (!card) return;
    cardId.value = card.id;
    document.getElementById("card-name").value = card.name || "";
    document.getElementById("card-brand").value = card.brand || "";
    document.getElementById("card-last-four").value = card.lastFour || "";
    document.getElementById("card-limit").value = Number(card.limit || 0).toFixed(2);
    document.getElementById("card-closing").value = card.closingDay || 1;
    document.getElementById("card-due").value = card.dueDay || 1;
    document.getElementById("card-editor-title").textContent = "Editar cartão";
    document.getElementById("save-card").textContent = "Salvar alterações";
    document.getElementById("cancel-card-edit").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function render() {
    const cards = api.getCards(true);
    const activeCards = cards.filter(card => card.active !== false);
    const month = monthInput.value || new Date().toISOString().slice(0, 7);
    const totalLimits = activeCards.reduce((sum, card) => sum + Number(card.limit || 0), 0);
    const totalBills = activeCards.reduce((sum, card) => sum + api.getCardBill(card.id, month).total, 0);

    document.getElementById("cards-count").textContent = String(activeCards.length);
    document.getElementById("cards-limits").textContent = api.formatCurrency(totalLimits);
    document.getElementById("cards-bills").textContent = api.formatCurrency(totalBills);
    document.getElementById("cards-available").textContent = api.formatCurrency(Math.max(0, totalLimits - totalBills));
    document.getElementById("bill-month-label").textContent = api.formatMonth(month);

    empty.hidden = cards.length > 0;

    list.innerHTML = cards.map(card => {
      const bill = api.getCardBill(card.id, month);
      const usage = card.limit > 0 ? Math.min(100, Math.round((bill.total / card.limit) * 100)) : 0;
      const available = Math.max(0, Number(card.limit || 0) - bill.total);
      const archived = card.active === false;
      const items = bill.items.slice(0, 5);

      return `
        <article class="credit-card-panel ${archived ? "archived" : ""}">
          <div class="credit-card-visual">
            <div class="credit-card-top">
              <span class="card-chip"></span>
              <span class="card-brand">${escapeHtml(card.brand || "Crédito")}</span>
            </div>
            <strong>${escapeHtml(card.name)}</strong>
            <div class="card-number">${card.lastFour ? "•••• •••• •••• " + escapeHtml(card.lastFour) : "•••• •••• •••• ••••"}</div>
            <div class="credit-card-bottom">
              <span>Fecha dia <b>${card.closingDay}</b></span>
              <span>Vence dia <b>${card.dueDay}</b></span>
            </div>
          </div>

          <div class="card-bill-content">
            <div class="section-head card-bill-head">
              <div>
                <span class="eyebrow">${archived ? "ARQUIVADO" : "FATURA"}</span>
                <h3>${api.formatCurrency(bill.total)}</h3>
                <small>Vencimento ${api.formatDate(bill.dueDate)}</small>
              </div>
              <div class="card-bill-limit">
                <span>Limite</span>
                <strong>${api.formatCurrency(card.limit)}</strong>
                <small>${api.formatCurrency(available)} disponível</small>
              </div>
            </div>

            <div class="progress-track card-limit-track"><span style="width:${usage}%"></span></div>
            <div class="card-usage-row"><span>${usage}% utilizado</span><span>${bill.items.length} compra(s) na fatura</span></div>

            <div class="bill-items">
              ${items.length ? items.map(item => `
                <div class="bill-item">
                  <div><strong>${escapeHtml(item.description)}</strong><small>${api.formatDate(item.date)} · ${escapeHtml(item.category)}</small></div>
                  <strong>${api.formatCurrency(item.amount)}</strong>
                </div>
              `).join("") : '<div class="mini-empty">Nenhuma compra nesta fatura.</div>'}
            </div>

            <div class="card-actions">
              <a class="text-action" href="../gastos/">Adicionar compra</a>
              <button class="text-action" type="button" data-edit-card="${card.id}">Editar</button>
              <button class="text-action ${archived ? "" : "danger-action"}" type="button" data-toggle-card="${card.id}">
                ${archived ? "Reativar" : "Arquivar"}
              </button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.upsertCard({
        name: document.getElementById("card-name").value,
        brand: document.getElementById("card-brand").value,
        lastFour: document.getElementById("card-last-four").value,
        limit: document.getElementById("card-limit").value,
        closingDay: document.getElementById("card-closing").value,
        dueDay: document.getElementById("card-due").value,
        active: true
      }, cardId.value || null);
      resetForm();
      render();
    } catch {
      window.alert("Preencha o nome do cartão, limite, fechamento e vencimento.");
    }
  });

  document.getElementById("cancel-card-edit").addEventListener("click", resetForm);
  monthInput.addEventListener("input", render);

  list.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-card]");
    const toggle = event.target.closest("[data-toggle-card]");
    if (edit) editCard(edit.dataset.editCard);
    if (toggle) {
      const card = api.getCard(toggle.dataset.toggleCard);
      if (card) api.setCardActive(card.id, card.active === false);
      render();
    }
  });

  monthInput.value = new Date().toISOString().slice(0, 7);
  resetForm();
  render();
})();