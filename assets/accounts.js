(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("account-form");
  const list = document.getElementById("accounts-list");
  const empty = document.getElementById("accounts-empty");
  const accountId = document.getElementById("account-id");
  const transferForm = document.getElementById("transfer-form");
  const transferList = document.getElementById("transfer-list");
  const fromSelect = document.getElementById("transfer-from");
  const toSelect = document.getElementById("transfer-to");
  const status = document.getElementById("accounts-status");

  const typeLabels = {
    checking:"Conta corrente",
    savings:"Poupança",
    cash:"Dinheiro",
    digital:"Carteira digital",
    investment:"Investimentos"
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function flash(message, kind = "success") {
    status.textContent = message;
    status.className = "notice accounts-notice " + kind;
    status.hidden = false;
    clearTimeout(flash.timer);
    flash.timer = setTimeout(() => { status.hidden = true; }, 3400);
  }

  function resetForm() {
    form.reset();
    accountId.value = "";
    document.getElementById("account-type").value = "checking";
    document.getElementById("account-editor-title").textContent = "Nova conta";
    document.getElementById("save-account").textContent = "Salvar conta";
    document.getElementById("cancel-account-edit").hidden = true;
  }

  function editAccount(id) {
    const account = api.getAccount(id);
    if (!account) return;
    accountId.value = account.id;
    document.getElementById("account-name").value = account.name || "";
    document.getElementById("account-type").value = account.type || "checking";
    document.getElementById("account-institution").value = account.institution || "";
    document.getElementById("account-initial").value = Number(account.initialBalance || 0).toFixed(2);
    document.getElementById("account-default").checked = Boolean(account.isDefault);
    document.getElementById("account-editor-title").textContent = "Editar conta";
    document.getElementById("save-account").textContent = "Salvar alterações";
    document.getElementById("cancel-account-edit").hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function populateTransferSelects() {
    const accounts = api.getAccounts(false);
    const options = accounts.map(account =>
      `<option value="${account.id}">${escapeHtml(account.name)} · ${api.formatCurrency(api.getAccountBalance(account.id))}</option>`
    ).join("");
    fromSelect.innerHTML = '<option value="">Conta de origem</option>' + options;
    toSelect.innerHTML = '<option value="">Conta de destino</option>' + options;

    const defaultAccount = api.getDefaultAccount();
    if (defaultAccount) fromSelect.value = defaultAccount.id;
  }

  function render() {
    const accounts = api.getAccounts(true);
    const active = accounts.filter(account => account.active !== false);
    const total = api.getTotalAccountsBalance();

    document.getElementById("accounts-total-balance").textContent = api.formatCurrency(total);
    document.getElementById("accounts-active-count").textContent = String(active.length);
    document.getElementById("accounts-default-name").textContent = api.getDefaultAccount()?.name || "—";

    empty.hidden = accounts.length > 0;
    list.innerHTML = accounts.map(account => {
      const balance = api.getAccountBalance(account.id);
      const archived = account.active === false;
      return `
        <article class="account-card ${archived ? "archived" : ""}">
          <div class="account-card-top">
            <div class="account-icon ${account.type}">${account.type === "cash" ? "$" : account.type === "investment" ? "↗" : "◫"}</div>
            <div class="account-card-title">
              <div><strong>${escapeHtml(account.name)}</strong>${account.isDefault ? '<span class="account-default-badge">Padrão</span>' : ""}</div>
              <span>${escapeHtml(account.institution || typeLabels[account.type] || "Conta")} · ${typeLabels[account.type] || account.type}</span>
            </div>
            <span class="status-badge ${archived ? "inactive" : "paid"}">${archived ? "Arquivada" : "Ativa"}</span>
          </div>
          <div class="account-balance">
            <span>Saldo atual</span>
            <strong class="${balance < 0 ? "negative" : ""}">${api.formatCurrency(balance)}</strong>
            <small>Saldo inicial: ${api.formatCurrency(account.initialBalance)}</small>
          </div>
          <div class="account-actions">
            <button class="text-action" type="button" data-edit-account="${account.id}">Editar</button>
            ${!archived && !account.isDefault ? `<button class="text-action" type="button" data-default-account="${account.id}">Tornar padrão</button>` : ""}
            <button class="text-action ${archived ? "" : "danger-action"}" type="button" data-toggle-account="${account.id}">${archived ? "Reativar" : "Arquivar"}</button>
          </div>
        </article>
      `;
    }).join("");

    const transfers = api.getTransfers();
    transferList.innerHTML = transfers.slice(0, 12).map(item => {
      const from = api.getAccount(item.fromAccountId);
      const to = api.getAccount(item.toAccountId);
      return `
        <div class="transfer-row">
          <div class="transfer-flow"><span>${escapeHtml(from?.name || "Conta")}</span><b>→</b><span>${escapeHtml(to?.name || "Conta")}</span></div>
          <div><strong>${api.formatCurrency(item.amount)}</strong><small>${api.formatDate(item.date)}</small></div>
          <button type="button" class="text-action danger-action" data-remove-transfer="${item.id}">Excluir</button>
        </div>
      `;
    }).join("") || '<div class="mini-empty">Nenhuma transferência registrada.</div>';

    populateTransferSelects();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.upsertAccount({
        name: document.getElementById("account-name").value,
        type: document.getElementById("account-type").value,
        institution: document.getElementById("account-institution").value,
        initialBalance: document.getElementById("account-initial").value,
        isDefault: document.getElementById("account-default").checked,
        active: true
      }, accountId.value || null);
      resetForm();
      render();
      flash("Conta salva.");
    } catch {
      flash("Informe pelo menos o nome da conta.", "error");
    }
  });

  document.getElementById("cancel-account-edit").addEventListener("click", resetForm);

  list.addEventListener("click", event => {
    const edit = event.target.closest("[data-edit-account]");
    const toggle = event.target.closest("[data-toggle-account]");
    const makeDefault = event.target.closest("[data-default-account]");
    if (edit) editAccount(edit.dataset.editAccount);
    if (toggle) {
      const account = api.getAccount(toggle.dataset.toggleAccount);
      if (account) api.setAccountActive(account.id, account.active === false);
      render();
    }
    if (makeDefault) {
      try {
        api.setDefaultAccount(makeDefault.dataset.defaultAccount);
        render();
        flash("Conta padrão atualizada.");
      } catch {
        flash("Não foi possível definir essa conta como padrão.", "error");
      }
    }
  });

  transferForm.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.addTransfer({
        fromAccountId: fromSelect.value,
        toAccountId: toSelect.value,
        amount: document.getElementById("transfer-amount").value,
        date: document.getElementById("transfer-date").value,
        notes: document.getElementById("transfer-notes").value
      });
      transferForm.reset();
      document.getElementById("transfer-date").value = new Date().toISOString().slice(0,10);
      render();
      flash("Transferência registrada. Ela não altera receitas nem despesas.");
    } catch (error) {
      if (error?.message === "transfer_same_account") {
        flash("Origem e destino precisam ser contas diferentes.", "error");
      } else if (error?.message === "insufficient_account_balance") {
        flash("Saldo insuficiente. Disponível: " + api.formatCurrency(error.available || 0) + ".", "error");
      } else {
        flash("Preencha origem, destino e um valor maior que zero.", "error");
      }
    }
  });

  transferList.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove-transfer]");
    if (!remove) return;
    if (!confirm("Excluir esta transferência? Os saldos das duas contas serão recalculados.")) return;
    api.removeTransfer(remove.dataset.removeTransfer);
    render();
    flash("Transferência excluída.");
  });

  document.getElementById("transfer-date").value = new Date().toISOString().slice(0,10);
  resetForm();
  render();
})();