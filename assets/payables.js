(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("payable-form");
  const list = document.getElementById("payables-list");
  const empty = document.getElementById("payables-empty");
  const payableId = document.getElementById("payable-id");
  const statusFilter = document.getElementById("payable-status-filter");
  const monthFilter = document.getElementById("payable-month-filter");
  const search = document.getElementById("payable-search");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function populateCategories() {
    document.getElementById("payable-category").innerHTML = api.getCategories("expense")
      .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
  }

  function resetForm() {
    form.reset();
    payableId.value = "";
    document.getElementById("payable-date").value = new Date().toISOString().slice(0, 10);
    document.getElementById("payable-editor-title").textContent = "Nova conta";
    document.getElementById("save-payable").textContent = "Salvar conta";
    document.getElementById("cancel-payable-edit").hidden = true;
  }

  function editPayable(id) {
    const item = api.getPayable(id);
    if (!item) return;
    payableId.value = item.id;
    document.getElementById("payable-description").value = item.description;
    document.getElementById("payable-amount").value = Number(item.amount || 0).toFixed(2);
    document.getElementById("payable-date").value = item.dueDate;
    document.getElementById("payable-category").value = item.category;
    document.getElementById("payable-notes").value = item.notes || "";
    document.getElementById("payable-editor-title").textContent = "Editar conta";
    document.getElementById("save-payable").textContent = "Salvar alterações";
    document.getElementById("cancel-payable-edit").hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function filteredItems() {
    const today = new Date().toISOString().slice(0, 10);
    const status = statusFilter.value;
    const month = monthFilter.value;
    const term = search.value.trim().toLocaleLowerCase("pt-BR");

    return api.getPayables().filter(item => {
      const overdue = item.status !== "paid" && item.dueDate < today;
      const statusMatch =
        !status ||
        (status === "pending" && item.status !== "paid" && !overdue) ||
        (status === "paid" && item.status === "paid") ||
        (status === "overdue" && overdue);
      const monthMatch = !month || item.dueDate.slice(0, 7) === month;
      const termMatch = !term ||
        item.description.toLocaleLowerCase("pt-BR").includes(term) ||
        item.category.toLocaleLowerCase("pt-BR").includes(term) ||
        (item.notes || "").toLocaleLowerCase("pt-BR").includes(term);
      return statusMatch && monthMatch && termMatch;
    });
  }

  function render() {
    const summary = api.getPayablesSummary();
    document.getElementById("payable-pending-total").textContent = api.formatCurrency(summary.pendingTotal);
    document.getElementById("payable-pending-count").textContent = summary.pendingCount + " pendente(s)";
    document.getElementById("payable-overdue-total").textContent = api.formatCurrency(summary.overdueTotal);
    document.getElementById("payable-overdue-count").textContent = summary.overdueCount + " atrasada(s)";
    document.getElementById("payable-paid-total").textContent = api.formatCurrency(summary.paidTotal);
    document.getElementById("payable-paid-count").textContent = summary.paidCount + " paga(s)";

    const items = filteredItems();
    empty.hidden = items.length > 0;
    const today = new Date().toISOString().slice(0, 10);

    list.innerHTML = items.map(item => {
      const overdue = item.status !== "paid" && item.dueDate < today;
      const state = item.status === "paid" ? "paid" : overdue ? "overdue" : "pending";
      const stateLabel = item.status === "paid" ? "Pago" : overdue ? "Atrasado" : "Pendente";

      return `
        <article class="payable-row ${state}">
          <div class="payable-date-box">
            <strong>${String(item.dueDate).slice(8,10)}</strong>
            <span>${new Intl.DateTimeFormat("pt-BR",{month:"short"}).format(new Date(item.dueDate+"T12:00:00")).replace(".","")}</span>
          </div>
          <div class="payable-main">
            <div class="payable-title-row">
              <div>
                <strong>${escapeHtml(item.description)}</strong>
                <div class="transaction-meta"><span>${escapeHtml(item.category)}</span><span>•</span><span>Vence ${api.formatDate(item.dueDate)}</span></div>
              </div>
              <span class="status-badge ${state}">${stateLabel}</span>
            </div>
            ${item.notes ? `<p class="payable-note">${escapeHtml(item.notes)}</p>` : ""}
          </div>
          <div class="payable-value">
            <strong>${api.formatCurrency(item.amount)}</strong>
            <div class="row-actions payable-actions">
              ${item.status === "paid"
                ? `<button type="button" data-reopen-payable="${item.id}">Reabrir</button>`
                : `<button type="button" data-pay-payable="${item.id}">Marcar pago</button><button type="button" data-pay-expense="${item.id}">Pagar + lançar gasto</button>`}
              <button type="button" data-edit-payable="${item.id}">Editar</button>
              <button type="button" data-remove-payable="${item.id}" class="danger-action">Excluir</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.upsertPayable({
        description: document.getElementById("payable-description").value,
        amount: document.getElementById("payable-amount").value,
        dueDate: document.getElementById("payable-date").value,
        category: document.getElementById("payable-category").value,
        notes: document.getElementById("payable-notes").value
      }, payableId.value || null);
      resetForm();
      render();
    } catch {
      window.alert("Preencha descrição, valor e vencimento.");
    }
  });

  document.getElementById("cancel-payable-edit").addEventListener("click", resetForm);
  [statusFilter, monthFilter, search].forEach(element => element.addEventListener("input", render));

  list.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-payable]");
    const remove = event.target.closest("[data-remove-payable]");
    const pay = event.target.closest("[data-pay-payable]");
    const payExpense = event.target.closest("[data-pay-expense]");
    const reopen = event.target.closest("[data-reopen-payable]");

    if (edit) editPayable(edit.dataset.editPayable);
    if (pay) {
      api.markPayablePaid(pay.dataset.payPayable, false);
      render();
    }
    if (payExpense) {
      api.markPayablePaid(payExpense.dataset.payExpense, true);
      render();
    }
    if (reopen) {
      api.reopenPayable(reopen.dataset.reopenPayable);
      render();
    }
    if (remove) {
      const item = api.getPayable(remove.dataset.removePayable);
      if (item && window.confirm('Excluir "' + item.description + '"?')) {
        api.removePayable(item.id);
        render();
      }
    }
  });

  populateCategories();
  monthFilter.value = new Date().toISOString().slice(0, 7);
  resetForm();
  render();
})();