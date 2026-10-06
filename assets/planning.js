(() => {
  const api = VisionMoneyProDemo;
  const monthInput = document.getElementById("planning-month");
  const budgetList = document.getElementById("budget-list");
  const totalBudget = document.getElementById("total-budget");
  const totalSpent = document.getElementById("total-spent");
  const totalRemaining = document.getElementById("total-remaining");

  function render() {
    const month = monthInput.value || new Date().toISOString().slice(0, 7);
    const budgets = api.getBudgets(month);
    const spend = api.getCategorySpend(month);
    const byCategory = Object.fromEntries(budgets.map(item => [item.category, item.amount]));

    let budgetSum = 0;
    let spentSum = 0;

    budgetList.innerHTML = api.getCategories("expense").map(category => {
      const planned = Number(byCategory[category] || 0);
      const spent = Number(spend[category] || 0);
      const percent = planned > 0 ? Math.min(100, Math.round((spent / planned) * 100)) : 0;
      const remaining = Math.max(0, planned - spent);
      budgetSum += planned;
      spentSum += spent;

      return `
        <article class="budget-row">
          <div class="budget-row-head">
            <div>
              <strong>${category}</strong>
              <span>${planned > 0 ? api.formatCurrency(planned) + " planejado" : "Sem limite definido"}</span>
            </div>
            <div class="budget-row-values">
              <strong>${api.formatCurrency(spent)}</strong>
              <span>${planned > 0 ? api.formatCurrency(remaining) + " restante" : "gasto no mês"}</span>
            </div>
          </div>
          <div class="progress-track"><span style="width:${percent}%"></span></div>
          <div class="budget-actions">
            <input data-budget-input="${category}" type="number" min="0.01" step="0.01" placeholder="Definir limite" value="${planned > 0 ? planned.toFixed(2) : ""}">
            <button class="btn ghost" type="button" data-save-budget="${category}">Salvar</button>
            ${planned > 0 ? `<button class="text-action danger-action" type="button" data-remove-budget="${category}">Remover</button>` : ""}
          </div>
        </article>
      `;
    }).join("");

    totalBudget.textContent = api.formatCurrency(budgetSum);
    totalSpent.textContent = api.formatCurrency(spentSum);
    totalRemaining.textContent = api.formatCurrency(Math.max(0, budgetSum - spentSum));
  }

  budgetList.addEventListener("click", (event) => {
    const save = event.target.closest("[data-save-budget]");
    const remove = event.target.closest("[data-remove-budget]");

    if (save) {
      const category = save.dataset.saveBudget;
      const input = budgetList.querySelector('[data-budget-input="' + CSS.escape(category) + '"]');
      try {
        api.upsertBudget(category, input.value, monthInput.value);
        render();
      } catch {
        window.alert("Informe um limite maior que zero.");
      }
    }

    if (remove) {
      api.removeBudget(remove.dataset.removeBudget, monthInput.value);
      render();
    }
  });

  monthInput.addEventListener("input", render);
  monthInput.value = new Date().toISOString().slice(0, 7);
  render();
})();