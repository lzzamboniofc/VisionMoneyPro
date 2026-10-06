(() => {
  const api = VisionMoneyProDemo;
  const form = document.getElementById("category-form");
  const type = document.getElementById("category-kind");
  const name = document.getElementById("category-name");
  const expenseList = document.getElementById("expense-category-list");
  const incomeList = document.getElementById("income-category-list");
  const status = document.getElementById("category-status");

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  function flash(message, kind = "success") {
    status.textContent = message;
    status.className = "notice category-notice " + kind;
    status.hidden = false;
    setTimeout(() => { status.hidden = true; }, 3200);
  }

  function renderList(kind, target) {
    const defaults = kind === "income" ? api.incomeCategories : api.expenseCategories;
    const custom = api.getCustomCategories(kind);

    target.innerHTML = [
      ...defaults.map(item => `
        <div class="category-item">
          <div><span class="category-dot ${kind}"></span><strong>${escapeHtml(item)}</strong></div>
          <span class="category-lock">Padrão</span>
        </div>
      `),
      ...custom.map(item => `
        <div class="category-item custom">
          <div><span class="category-dot ${kind}"></span><strong>${escapeHtml(item.name)}</strong></div>
          <button class="text-action danger-action" type="button" data-remove-category="${item.id}">Excluir</button>
        </div>
      `)
    ].join("");
  }

  function render() {
    renderList("expense", expenseList);
    renderList("income", incomeList);
    document.getElementById("expense-category-count").textContent = api.getCategories("expense").length;
    document.getElementById("income-category-count").textContent = api.getCategories("income").length;
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      api.addCategory(type.value, name.value);
      name.value = "";
      render();
      flash("Categoria criada e já disponível nos lançamentos.");
    } catch (error) {
      flash(error?.message === "category_exists" ? "Essa categoria já existe." : "Informe um nome para a categoria.", "error");
    }
  });

  document.addEventListener("click", event => {
    const button = event.target.closest("[data-remove-category]");
    if (!button) return;
    try {
      api.removeCustomCategory(button.dataset.removeCategory);
      render();
      flash("Categoria removida.");
    } catch (error) {
      flash(error?.message === "category_in_use"
        ? "Essa categoria está sendo usada. Altere os lançamentos/orçamentos antes de excluir."
        : "Não foi possível excluir a categoria.", "error");
    }
  });

  render();
})();