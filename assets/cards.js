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

  function accountOptions() {
    const accounts = api.getAccounts(false);
    const defaultAccount = api.getDefaultAccount();
    return {
      defaultId: defaultAccount?.id || "",
      html: accounts.map(account =>
        `<option value="${account.id}">${escapeHtml(account.name)} · ${api.formatCurrency(api.getAccountBalance(account.id))}</option>`
      ).join("")
    };
  }

  function statusLabel(status) {
    return status === "paid" ? "Paga" : status === "overdue" ? "Atrasada" : "Aberta";
  }

  function render() {
    const cards = api.getCards(true);
    const activeCards = cards.filter(card => card.active !== false);
    const month = monthInput.value || new Date().toISOString().slice(0, 7);
    const totalLimits = activeCards.reduce((sum, card) => sum + Number(card.limit || 0), 0);
    const totalBills = activeCards.reduce((sum, card) => sum + api.getCardBill(card.id, month).total, 0);
    const totalUsed = activeCards.reduce((sum, card) => sum + api.getCardUsedLimit(card.id), 0);
    const accounts = accountOptions();

    document.getElementById("cards-count").textContent = String(activeCards.length);
    document.getElementById("cards-limits").textContent = api.formatCurrency(totalLimits);
    document.getElementById("cards-bills").textContent = api.formatCurrency(totalBills);
    document.getElementById("cards-available").textContent = api.formatCurrency(Math.max(0, totalLimits - totalUsed));
    document.getElementById("bill-month-label").textContent = api.formatMonth(month);

    empty.hidden = cards.length > 0;

    list.innerHTML = cards.map(card => {
      const bill = api.getCardBill(card.id, month);
      const usedLimit = api.getCardUsedLimit(card.id);
      const usage = card.limit > 0 ? Math.min(100, Math.round((usedLimit / card.limit) * 100)) : 0;
      const available = Math.max(0, Number(card.limit || 0) - usedLimit);
      const archived = card.active === false;
      const items = bill.items.slice(0, 8);
      const status = bill.status || "open";

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
                <div class="card-bill-status-row">
                  <span class="eyebrow">${archived ? "ARQUIVADO" : "FATURA"}</span>
                  <span class="status-badge ${status === "paid" ? "paid" : status === "overdue" ? "overdue" : "pending"}">${statusLabel(status)}</span>
                </div>
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
            <div class="card-usage-row"><span>${usage}% do limite em aberto</span><span>${bill.items.length} compra(s) nesta fatura</span></div>

            <div class="bill-items">
              ${items.length ? items.map(item => `
                <div class="bill-item">
                  <div>
                    <strong>${escapeHtml(item.description)}</strong>
                    <small>
                      ${api.formatDate(item.date)} · ${escapeHtml(item.category)}
                      ${item.installments && item.installmentNumber ? " · parcela " + item.installmentNumber + "/" + item.installments : ""}
                    </small>
                  </div>
                  <strong>${api.formatCurrency(item.amount)}</strong>
                </div>
              `).join("") : '<div class="mini-empty">Nenhuma compra nesta fatura.</div>'}
            </div>

            ${bill.total > 0 ? `
              <div class="bill-payment-box">
                ${bill.payment
                  ? `
                    <div class="bill-paid-info">
                      <div><span>Pago em</span><strong>${new Intl.DateTimeFormat("pt-BR").format(new Date(bill.payment.paidAt))}</strong></div>
                      <div><span>Conta</span><strong>${escapeHtml(api.getAccount(bill.payment.accountId)?.name || "Conta")}</strong></div>
                    </div>
                    <button class="btn ghost" type="button" data-reopen-bill="${card.id}">Reabrir fatura</button>
                  `
                  : `
                    <div class="bill-payment-form">
                      <label>Conta para pagamento
                        <select data-bill-account="${card.id}">
                          ${accounts.html || '<option value="">Cadastre uma conta primeiro</option>'}
                        </select>
                      </label>
                      <button class="btn secondary" type="button" data-pay-bill="${card.id}" ${accounts.html ? "" : "disabled"}>Pagar fatura</button>
                    </div>
                  `
                }
              </div>
            ` : ""}

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

    document.querySelectorAll("[data-bill-account]").forEach(select => {
      if (accounts.defaultId) select.value = accounts.defaultId;
    });
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
    const pay = event.target.closest("[data-pay-bill]");
    const reopen = event.target.closest("[data-reopen-bill]");

    if (edit) editCard(edit.dataset.editCard);

    if (toggle) {
      const card = api.getCard(toggle.dataset.toggleCard);
      if (card) api.setCardActive(card.id, card.active === false);
      render();
    }

    if (pay) {
      const cardIdValue = pay.dataset.payBill;
      const select = list.querySelector('[data-bill-account="' + CSS.escape(cardIdValue) + '"]');
      try {
        api.payCardBill(cardIdValue, monthInput.value, select?.value || "");
        render();
      } catch (error) {
        if (error?.message === "insufficient_account_balance") {
          window.alert("Saldo insuficiente nessa conta. Disponível: " + api.formatCurrency(error.available || 0) + ".");
        } else if (error?.message === "account_not_available") {
          window.alert("Cadastre ou selecione uma conta ativa para pagar a fatura.");
        } else {
          window.alert("Não foi possível pagar esta fatura.");
        }
      }
    }

    if (reopen) {
      if (!window.confirm("Reabrir esta fatura na demonstração? O valor voltará para o saldo da conta usada no pagamento.")) return;
      api.reopenCardBill(reopen.dataset.reopenBill, monthInput.value);
      render();
    }
  });

  monthInput.value = new Date().toISOString().slice(0, 7);
  resetForm();
  render();
})();