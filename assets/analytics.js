(() => {
  const api = VisionMoneyProDemo;
  const monthInput = document.getElementById("analytics-month");

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function shiftMonth(month, offset) {
    const [year, mon] = String(month).split("-").map(Number);
    return new Date(year, (mon || 1) - 1 + offset, 1, 12).toISOString().slice(0, 7);
  }

  function monthShort(month) {
    const [year, mon] = String(month).split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(year, mon - 1, 1))
      .replace(".", "");
  }

  function render() {
    const month = monthInput.value || new Date().toISOString().slice(0, 7);
    const summary = api.getMonthSummary(month);
    const savingRate = summary.incomeTotal > 0
      ? Math.round(((summary.incomeTotal - summary.expenseTotal) / summary.incomeTotal) * 100)
      : 0;

    const spend = api.getCategorySpend(month);
    const categories = Object.entries(spend)
      .map(([category, value]) => ({ category, value: Number(value || 0) }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    const topCategory = categories[0] || null;
    const avgExpense = summary.expenseCount > 0 ? summary.expenseTotal / summary.expenseCount : 0;

    document.getElementById("analytics-balance").textContent = api.formatCurrency(summary.balance);
    document.getElementById("analytics-saving").textContent = savingRate + "%";
    document.getElementById("analytics-top-category").textContent = topCategory ? topCategory.category : "—";
    document.getElementById("analytics-average-expense").textContent = api.formatCurrency(avgExpense);

    const maxCategory = Math.max(1, ...categories.map(item => item.value));
    const categoryList = document.getElementById("analytics-categories");
    const categoryEmpty = document.getElementById("analytics-categories-empty");
    categoryEmpty.hidden = categories.length > 0;
    categoryList.innerHTML = categories.slice(0, 8).map(item => {
      const percent = Math.round((item.value / maxCategory) * 100);
      const share = summary.expenseTotal > 0 ? Math.round((item.value / summary.expenseTotal) * 100) : 0;
      return `
        <div class="analysis-row">
          <div class="analysis-row-head">
            <strong>${escapeHtml(item.category)}</strong>
            <span>${api.formatCurrency(item.value)} · ${share}%</span>
          </div>
          <div class="analysis-track"><span style="width:${percent}%"></span></div>
        </div>
      `;
    }).join("");

    const months = Array.from({ length: 6 }, (_, i) => shiftMonth(month, i - 5));
    const trend = months.map(value => ({ month: value, ...api.getMonthSummary(value) }));
    const maxTrend = Math.max(1, ...trend.flatMap(item => [item.incomeTotal, item.expenseTotal]));

    document.getElementById("analytics-trend").innerHTML = trend.map(item => {
      const incomeHeight = Math.max(3, Math.round((item.incomeTotal / maxTrend) * 100));
      const expenseHeight = Math.max(3, Math.round((item.expenseTotal / maxTrend) * 100));
      return `
        <div class="trend-group">
          <div class="trend-bars">
            <span class="trend-bar income" style="height:${incomeHeight}%" title="Receitas: ${api.formatCurrency(item.incomeTotal)}"></span>
            <span class="trend-bar expense" style="height:${expenseHeight}%" title="Despesas: ${api.formatCurrency(item.expenseTotal)}"></span>
          </div>
          <small>${monthShort(item.month)}</small>
        </div>
      `;
    }).join("");

    const budgets = api.getBudgets(month);
    const budgetMap = Object.fromEntries(budgets.map(item => [item.category, Number(item.amount || 0)]));
    const planned = budgets.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const spentAgainstBudget = Object.entries(budgetMap).reduce((sum, [category]) => sum + Number(spend[category] || 0), 0);
    const budgetUsage = planned > 0 ? Math.round((spentAgainstBudget / planned) * 100) : 0;

    document.getElementById("analytics-budget-planned").textContent = api.formatCurrency(planned);
    document.getElementById("analytics-budget-spent").textContent = api.formatCurrency(spentAgainstBudget);
    document.getElementById("analytics-budget-usage").textContent = planned > 0 ? budgetUsage + "%" : "—";
    document.getElementById("analytics-budget-track").style.width = Math.min(100, budgetUsage) + "%";

    const budgetStatus = document.getElementById("analytics-budget-status");
    if (!planned) {
      budgetStatus.textContent = "Nenhum orçamento definido para este mês.";
    } else if (budgetUsage <= 80) {
      budgetStatus.textContent = "Você está dentro de uma faixa confortável do orçamento.";
    } else if (budgetUsage <= 100) {
      budgetStatus.textContent = "Atenção: o orçamento já está perto do limite.";
    } else {
      budgetStatus.textContent = "O gasto nas categorias planejadas ultrapassou o orçamento.";
    }
  }

  monthInput.value = new Date().toISOString().slice(0, 7);
  monthInput.addEventListener("input", render);
  render();
})();