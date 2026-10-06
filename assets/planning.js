(() => {
  const api = VisionMoneyProDemo;
  const monthInput = document.getElementById("planning-month");
  const budgetList = document.getElementById("budget-list");
  const totalIncome = document.getElementById("total-income");
  const totalBudget = document.getElementById("total-budget");
  const totalSpent = document.getElementById("total-spent");
  const totalRemaining = document.getElementById("total-remaining");
  const incomeInput = document.getElementById("planning-income");
  const allocationPercent = document.getElementById("allocation-percent");
  const allocationFill = document.getElementById("allocation-track-fill");
  const allocationAvailable = document.getElementById("allocation-available");
  const recordedIncomeHint = document.getElementById("recorded-income-hint");
  const warning = document.getElementById("planning-warning");

  function currentMonth() {
    return monthInput.value || new Date().toISOString().slice(0, 7);
  }

  function showWarning(message, type = "warning") {
    warning.textContent = message;
    warning.className = "planning-warning " + type;
    warning.hidden = false;
  }

  function hideWarning() {
    warning.hidden = true;
  }

  function render() {
    const month = currentMonth();
    const budgets = api.getBudgets(month);
    const spend = api.getCategorySpend(month);
    const allocation = api.getBudgetAllocation(month);
    const monthSummary = api.getMonthSummary(month);
    const byCategory = Object.fromEntries(budgets.map(item => [item.category, item.amount]));

    let spentSum = 0;

    budgetList.innerHTML = api.getCategories("expense").map(category => {
      const planned = Number(byCategory[category] || 0);
      const spent = Number(spend[category] || 0);
      const usagePercent = planned > 0 ? Math.round((spent / planned) * 100) : 0;
      const cappedUsage = Math.min(100, Math.max(0, usagePercent));
      const remaining = Math.max(0, planned - spent);
      const incomeShare = allocation.income > 0 && planned > 0
        ? Math.round((planned / allocation.income) * 100)
        : 0;
      spentSum += spent;

      return `
        <article class="budget-row ${planned > 0 ? "has-budget" : ""}">
          <div class="budget-row-head">
            <div>
              <strong>${category}</strong>
              <span>${planned > 0
                ? api.formatCurrency(planned) + " planejado · " + incomeShare + "% da renda"
                : "Sem limite definido"}</span>
            </div>
            <div class="budget-row-values">
              <strong>${api.formatCurrency(spent)}</strong>
              <span>${planned > 0
                ? api.formatCurrency(remaining) + " restante · " + usagePercent + "% usado"
                : "gasto no mês"}</span>
            </div>
          </div>

          <div
            class="progress-track budget-usage-track ${usagePercent > 100 ? "over-limit" : ""}"
            role="progressbar"
            aria-label="Uso do limite de ${category}"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${cappedUsage}"
            title="${planned > 0 ? usagePercent + "% do limite utilizado" : "Sem limite definido"}"
          >
            <span class="budget-progress-fill" style="--progress:${cappedUsage}%"></span>
            <strong class="progress-track-label">${planned > 0 ? usagePercent + "%" : "—"}</strong>
          </div>

          <div class="budget-actions">
            <input data-budget-input="${category}" type="number" min="0.01" step="0.01" placeholder="Definir limite" value="${planned > 0 ? planned.toFixed(2) : ""}" ${allocation.income > 0 ? "" : "disabled"}>
            <button class="btn ghost" type="button" data-save-budget="${category}" ${allocation.income > 0 ? "" : "disabled"}>Salvar</button>
            ${planned > 0 ? `<button class="text-action danger-action" type="button" data-remove-budget="${category}">Remover</button>` : ""}
          </div>
        </article>
      `;
    }).join("");

    incomeInput.value = allocation.income > 0 ? allocation.income.toFixed(2) : "";
    totalIncome.textContent = api.formatCurrency(allocation.income);
    totalBudget.textContent = api.formatCurrency(allocation.allocated);
    totalSpent.textContent = api.formatCurrency(spentSum);
    totalRemaining.textContent = api.formatCurrency(allocation.available);

    allocationPercent.textContent = allocation.percent + "%";
    allocationFill.style.setProperty("--progress", allocation.percent + "%");
    allocationFill.parentElement?.setAttribute("aria-valuenow", String(allocation.percent));
    allocationAvailable.textContent = api.formatCurrency(allocation.available) + " disponível para novos limites";
    recordedIncomeHint.textContent = "Receitas registradas no mês: " + api.formatCurrency(monthSummary.incomeTotal);

    if (!(allocation.income > 0)) {
      showWarning("Informe primeiro a renda disponível do mês para liberar a definição dos limites.", "info");
    } else if (allocation.percent >= 100) {
      showWarning("100% da renda já está distribuída. Para aumentar um limite, reduza outro ou aumente a renda-base.", "warning");
    } else {
      hideWarning();
    }
  }

  document.getElementById("save-planning-income").addEventListener("click", () => {
    try {
      const value = Number(incomeInput.value || 0);
      const currentAllocated = api.getBudgetAllocation(currentMonth()).allocated;

      if (!(value > 0)) {
        showWarning("Informe uma renda maior que zero.", "error");
        return;
      }

      if (value + 0.001 < currentAllocated) {
        showWarning(
          "Essa renda é menor que os limites já definidos (" + api.formatCurrency(currentAllocated) +
          "). Reduza os limites antes de diminuir a renda-base.",
          "error"
        );
        return;
      }

      api.setPlanningIncome(currentMonth(), value);
      render();
    } catch {
      showWarning("Não foi possível salvar a renda informada.", "error");
    }
  });

  document.getElementById("use-recorded-income").addEventListener("click", () => {
    const income = api.getMonthSummary(currentMonth()).incomeTotal;
    const currentAllocated = api.getBudgetAllocation(currentMonth()).allocated;

    if (!(income > 0)) {
      showWarning("Não há receitas registradas neste mês. Cadastre uma receita ou informe a renda manualmente.", "info");
      return;
    }

    if (income + 0.001 < currentAllocated) {
      showWarning(
        "As receitas registradas (" + api.formatCurrency(income) +
        ") são menores que os limites já definidos (" + api.formatCurrency(currentAllocated) + ").",
        "error"
      );
      return;
    }

    api.setPlanningIncome(currentMonth(), income);
    render();
  });

  budgetList.addEventListener("click", (event) => {
    const save = event.target.closest("[data-save-budget]");
    const remove = event.target.closest("[data-remove-budget]");

    if (save) {
      const category = save.dataset.saveBudget;
      const input = budgetList.querySelector('[data-budget-input="' + CSS.escape(category) + '"]');
      try {
        api.upsertBudget(category, input.value, currentMonth());
        render();
      } catch (error) {
        if (error?.message === "planning_income_required") {
          showWarning("Informe primeiro a renda disponível do mês.", "info");
          return;
        }
        if (error?.message === "budget_exceeds_income") {
          showWarning(
            "Esse limite ultrapassa a renda disponível. Você ainda pode distribuir " +
            api.formatCurrency(error.available || 0) + ".",
            "error"
          );
          return;
        }
        showWarning("Informe um limite maior que zero.", "error");
      }
    }

    if (remove) {
      api.removeBudget(remove.dataset.removeBudget, currentMonth());
      render();
    }
  });

  monthInput.addEventListener("input", render);
  monthInput.value = new Date().toISOString().slice(0, 7);
  render();
})();