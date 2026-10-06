(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("recurrence-form");
  const list = document.getElementById("recurrence-list");
  const empty = document.getElementById("recurrence-empty");
  const idInput = document.getElementById("recurrence-id");
  const kindInput = document.getElementById("recurrence-kind");
  const categoryInput = document.getElementById("recurrence-category");
  const status = document.getElementById("recurrence-status");

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function flash(message, kind = "success") {
    status.textContent = message;
    status.className = "notice recurrence-notice " + kind;
    status.hidden = false;
    setTimeout(() => { status.hidden = true; }, 3600);
  }

  function populateCategories(selected = "") {
    const categories = api.getCategories(kindInput.value);
    categoryInput.innerHTML = categories.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("");
    if (selected && categories.includes(selected)) categoryInput.value = selected;
  }

  function resetForm() {
    form.reset();
    idInput.value = "";
    kindInput.value = "expense";
    document.getElementById("recurrence-frequency").value = "monthly";
    document.getElementById("recurrence-next-date").value = new Date().toISOString().slice(0,10);
    document.getElementById("recurrence-editor-title").textContent = "Nova recorrência";
    document.getElementById("save-recurrence").textContent = "Salvar recorrência";
    document.getElementById("cancel-recurrence-edit").hidden = true;
    populateCategories();
  }

  function edit(id) {
    const item = api.getRecurrence(id);
    if (!item) return;
    idInput.value = item.id;
    kindInput.value = item.kind;
    populateCategories(item.category);
    document.getElementById("recurrence-description").value = item.description;
    document.getElementById("recurrence-amount").value = Number(item.amount || 0).toFixed(2);
    document.getElementById("recurrence-frequency").value = item.frequency;
    document.getElementById("recurrence-next-date").value = item.nextDate;
    document.getElementById("recurrence-editor-title").textContent = "Editar recorrência";
    document.getElementById("save-recurrence").textContent = "Salvar alterações";
    document.getElementById("cancel-recurrence-edit").hidden = false;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function render() {
    const items = api.getRecurrences();
    empty.hidden = items.length > 0;
    document.getElementById("recurrence-active-count").textContent = items.filter(item => item.active !== false).length;
    document.getElementById("recurrence-expense-total").textContent = api.formatCurrency(items.filter(i => i.active !== false && i.kind === "expense").reduce((s,i)=>s+Number(i.amount||0),0));
    document.getElementById("recurrence-income-total").textContent = api.formatCurrency(items.filter(i => i.active !== false && i.kind === "income").reduce((s,i)=>s+Number(i.amount||0),0));

    const frequencyLabel = { weekly:"Semanal", monthly:"Mensal", yearly:"Anual" };
    list.innerHTML = items.map(item => `
      <article class="recurrence-row ${item.active === false ? "inactive" : ""}">
        <div class="recurrence-kind ${item.kind}">${item.kind === "income" ? "+" : "−"}</div>
        <div class="recurrence-main">
          <div class="recurrence-title"><strong>${escapeHtml(item.description)}</strong><span class="status-badge ${item.active === false ? "inactive" : "pending"}">${item.active === false ? "Pausada" : "Ativa"}</span></div>
          <div class="transaction-meta"><span>${escapeHtml(item.category)}</span><span>•</span><span>${frequencyLabel[item.frequency] || item.frequency}</span><span>•</span><span>Próxima: ${api.formatDate(item.nextDate)}</span></div>
        </div>
        <div class="recurrence-value">
          <strong>${api.formatCurrency(item.amount)}</strong>
          <div class="row-actions">
            <button type="button" data-edit-recurrence="${item.id}">Editar</button>
            <button type="button" data-toggle-recurrence="${item.id}">${item.active === false ? "Ativar" : "Pausar"}</button>
            <button type="button" data-remove-recurrence="${item.id}" class="danger-action">Excluir</button>
          </div>
        </div>
      </article>
    `).join("");
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.upsertRecurrence({
        kind: kindInput.value,
        description: document.getElementById("recurrence-description").value,
        amount: document.getElementById("recurrence-amount").value,
        category: categoryInput.value,
        frequency: document.getElementById("recurrence-frequency").value,
        nextDate: document.getElementById("recurrence-next-date").value,
        active: true
      }, idInput.value || null);
      resetForm();
      render();
      flash("Recorrência salva.");
    } catch {
      flash("Preencha descrição, valor e próxima data.", "error");
    }
  });

  kindInput.addEventListener("change", () => populateCategories());
  document.getElementById("cancel-recurrence-edit").addEventListener("click", resetForm);
  document.getElementById("generate-recurrences").addEventListener("click", () => {
    const count = api.generateDueRecurrences();
    render();
    flash(count ? count + " lançamento(s) gerado(s)." : "Nenhuma recorrência vencida até hoje.");
  });

  list.addEventListener("click", event => {
    const editButton = event.target.closest("[data-edit-recurrence]");
    const toggleButton = event.target.closest("[data-toggle-recurrence]");
    const removeButton = event.target.closest("[data-remove-recurrence]");
    if (editButton) edit(editButton.dataset.editRecurrence);
    if (toggleButton) {
      const item = api.getRecurrence(toggleButton.dataset.toggleRecurrence);
      if (item) api.toggleRecurrence(item.id, item.active === false);
      render();
    }
    if (removeButton) {
      const item = api.getRecurrence(removeButton.dataset.removeRecurrence);
      if (item && confirm('Excluir a recorrência "' + item.description + '"?')) {
        api.removeRecurrence(item.id);
        render();
      }
    }
  });

  resetForm();
  render();
})();