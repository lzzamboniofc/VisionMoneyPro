(() => {
  const page = document.body.dataset.transactionKind === "income" ? "income" : "expense";
  const isIncome = page === "income";
  const api = window.VisionMoneyProDemo;

  const $ = (id) => document.getElementById(id);
  const form = $("transaction-form");
  const list = $("transaction-list");
  const empty = $("transaction-empty");
  const search = $("transaction-search");
  const categoryFilter = $("category-filter");
  const monthFilter = $("month-filter");
  const editorTitle = $("editor-title");
  const submitButton = $("submit-transaction");
  const cancelButton = $("cancel-edit");
  const transactionId = $("transaction-id");
  const amountInput = $("transaction-amount");
  const dateInput = $("transaction-date");
  const categoryInput = $("transaction-category");
  const cardInput = $("transaction-card");
  const accountInput = $("transaction-account");
  const installmentsInput = $("transaction-installments");
  const installmentsField = $("installments-field");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function populateCategories() {
    const categories = api.getCategories(isIncome ? "income" : "expense");
    categoryInput.innerHTML = categories
      .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join("");
    categoryFilter.innerHTML = '<option value="">Todas as categorias</option>' +
      categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  }

  function populateAccounts(selected = "") {
    if (!accountInput) return;
    const accounts = api.getAccounts(false);
    const defaultAccount = api.getDefaultAccount();
    accountInput.innerHTML = accounts.length
      ? accounts.map(account => `<option value="${account.id}">${escapeHtml(account.name)} · ${api.formatCurrency(api.getAccountBalance(account.id))}</option>`).join("")
      : '<option value="">Nenhuma conta cadastrada</option>';

    const target = selected || defaultAccount?.id || "";
    if (target && accounts.some(account => account.id === target)) accountInput.value = target;

    const helper = $("account-helper");
    if (helper) {
      helper.innerHTML = accounts.length
        ? 'O saldo desta conta será atualizado automaticamente. <a href="../contas/">Gerenciar contas</a>.'
        : 'Cadastre uma conta em <a href="../contas/">Contas e carteiras</a> para acompanhar o saldo.';
    }
  }

  function syncPaymentFields() {
    if (isIncome) return;
    const usingCard = Boolean(cardInput?.value);
    if (accountInput) accountInput.disabled = usingCard;
    if (installmentsField) installmentsField.hidden = !usingCard;
    if (installmentsInput && !usingCard) installmentsInput.value = "1";
  }

  function populateCards() {
    if (!cardInput) return;
    const cards = api.getCards(false);
    cardInput.innerHTML = '<option value="">Sem cartão / outro meio</option>' +
      cards.map(card => `<option value="${card.id}">${escapeHtml(card.name)}${card.lastFour ? " •••• " + escapeHtml(card.lastFour) : ""}</option>`).join("");
    const helper = $("card-helper");
    if (helper) {
      helper.innerHTML = cards.length
        ? 'Compras no cartão entram na fatura e só reduzem o saldo da conta quando a fatura for paga.'
        : 'Nenhum cartão ativo. <a href="../cartoes/">Cadastre um cartão</a> para vincular compras.';
    }
  }

  function currentMonth() {
    return new Date().toISOString().slice(0, 7);
  }

  function resetEditor() {
    form.reset();
    transactionId.value = "";
    dateInput.value = new Date().toISOString().slice(0, 10);
    categoryInput.selectedIndex = 0;
    if (cardInput) cardInput.value = "";
    if (installmentsInput) installmentsInput.value = "1";
    populateAccounts();
    syncPaymentFields();
    editorTitle.textContent = isIncome ? "Nova receita" : "Novo gasto";
    submitButton.textContent = isIncome ? "Salvar receita" : "Salvar gasto";
    cancelButton.hidden = true;
  }

  function edit(id) {
    const item = api.getTransaction(page, id);
    if (!item) return;
    transactionId.value = item.id;
    $("transaction-description").value = item.description;
    amountInput.value = Number(item.amount || 0).toFixed(2);
    dateInput.value = item.date;
    categoryInput.value = item.category;
    $("transaction-notes").value = item.notes || "";
    if (cardInput) cardInput.value = item.cardId || "";
    populateAccounts(item.accountId || "");
    if (installmentsInput) installmentsInput.value = "1";
    syncPaymentFields();
    editorTitle.textContent = isIncome ? "Editar receita" : "Editar gasto";
    submitButton.textContent = "Salvar alterações";
    cancelButton.hidden = false;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function remove(id) {
    const item = api.getTransaction(page, id);
    if (!item) return;
    if (!window.confirm(`Excluir "${item.description}"?`)) return;
    api.removeTransaction(page, id);
    if (transactionId.value === id) resetEditor();
    render();
  }

  function filteredItems() {
    const term = search.value.trim().toLocaleLowerCase("pt-BR");
    const category = categoryFilter.value;
    const month = monthFilter.value;
    return api.getTransactions(page).filter(item => {
      const card = item.cardId ? api.getCard(item.cardId) : null;
      const matchesTerm = !term ||
        item.description.toLocaleLowerCase("pt-BR").includes(term) ||
        item.category.toLocaleLowerCase("pt-BR").includes(term) ||
        (item.notes || "").toLocaleLowerCase("pt-BR").includes(term) ||
        (card?.name || "").toLocaleLowerCase("pt-BR").includes(term);
      const matchesCategory = !category || item.category === category;
      const matchesMonth = !month || item.date.slice(0, 7) === month;
      return matchesTerm && matchesCategory && matchesMonth;
    });
  }

  function render() {
    const all = api.getTransactions(page);
    const items = filteredItems();
    const filteredTotal = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const current = api.getMonthSummary(currentMonth());

    $("transaction-count").textContent = String(items.length);
    $("filtered-total").textContent = api.formatCurrency(filteredTotal);
    $("month-total").textContent = api.formatCurrency(isIncome ? current.incomeTotal : current.expenseTotal);
    $("all-count").textContent = String(all.length);

    empty.hidden = items.length > 0;
    list.innerHTML = items.map(item => {
      const card = !isIncome && item.cardId ? api.getCard(item.cardId) : null;
      const account = item.accountId ? api.getAccount(item.accountId) : null;
      const installmentLabel = item.installments && item.installmentNumber
        ? `Parcela ${item.installmentNumber}/${item.installments}`
        : "";
      return `
        <article class="transaction-row">
          <div class="transaction-main">
            <span class="transaction-type ${isIncome ? "income" : "expense"}">${isIncome ? "+" : "−"}</span>
            <div>
              <strong>${escapeHtml(item.description)}</strong>
              <div class="transaction-meta">
                <span>${escapeHtml(item.category)}</span>
                <span>•</span>
                <span>${api.formatDate(item.date)}</span>
                ${card ? `<span>•</span><span class="meta-card">${escapeHtml(card.name)}</span>` : ""}
                ${account ? `<span>•</span><span>${escapeHtml(account.name)}</span>` : ""}
                ${installmentLabel ? `<span>•</span><span>${installmentLabel}</span>` : ""}
              </div>
            </div>
          </div>
          <div class="transaction-value">
            <strong>${isIncome ? "+" : "−"} ${api.formatCurrency(item.amount)}</strong>
            <div class="row-actions">
              <button type="button" data-action="edit" data-id="${item.id}">Editar</button>
              <button type="button" data-action="delete" data-id="${item.id}" class="danger-action">Excluir</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const payload = {
        description: $("transaction-description").value,
        amount: amountInput.value,
        date: dateInput.value,
        category: categoryInput.value,
        notes: $("transaction-notes").value,
        cardId: cardInput?.value || "",
        accountId: accountInput?.value || ""
      };

      const installments = Number(installmentsInput?.value || 1);
      if (!isIncome && !transactionId.value && payload.cardId && installments > 1) {
        api.createInstallmentPurchase({ ...payload, installments });
      } else {
        api.upsertTransaction(page, payload, transactionId.value || null);
      }

      resetEditor();
      render();
    } catch {
      window.alert("Preencha a descrição e informe um valor maior que zero.");
    }
  });

  cancelButton.addEventListener("click", resetEditor);
  cardInput?.addEventListener("change", syncPaymentFields);
  [search, categoryFilter, monthFilter].forEach(element => element.addEventListener("input", render));
  list.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    if (button.dataset.action === "edit") edit(button.dataset.id);
    if (button.dataset.action === "delete") remove(button.dataset.id);
  });

  $("seed-data")?.addEventListener("click", () => {
    const seeded = api.seedExampleData();
    if (!seeded) window.alert("Já existem dados nesta demonstração.");
    populateCards();
    populateAccounts();
    render();
  });

  populateCategories();
  populateCards();
  populateAccounts();
  monthFilter.value = currentMonth();
  resetEditor();
  render();
})();