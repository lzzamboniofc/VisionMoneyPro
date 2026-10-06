(() => {
  const PROFILE_KEY = "vmp_demo_profile";
  const WORKSPACE_KEY = "vmp_demo_workspace";
  const EXPENSES_KEY = "vmp_demo_expenses";
  const INCOMES_KEY = "vmp_demo_incomes";
  const BUDGETS_KEY = "vmp_demo_budgets";
  const GOALS_KEY = "vmp_demo_goals";
  const CONTRIBUTIONS_KEY = "vmp_demo_goal_contributions";
  const CARDS_KEY = "vmp_demo_cards";
  const PAYABLES_KEY = "vmp_demo_payables";

  const safeParse = (value, fallback = null) => {
    try { return value ? JSON.parse(value) : fallback; } catch { return fallback; }
  };

  const normalizeMoney = (value) => {
    const parsed = Number(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : 0;
  };

  const newId = () => {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return "vmp-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  };

  const currentDate = () => new Date().toISOString().slice(0, 10);
  const currentMonth = () => currentDate().slice(0, 7);

  const expenseCategories = [
    "Moradia", "Alimentação", "Transporte", "Saúde", "Educação",
    "Lazer", "Assinaturas", "Compras", "Impostos", "Outros gastos"
  ];

  const incomeCategories = [
    "Salário", "Freelance", "Rendimentos", "Outras rendas"
  ];

  function getCollection(kind) {
    const key = kind === "income" ? INCOMES_KEY : EXPENSES_KEY;
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function saveCollection(kind, items) {
    const key = kind === "income" ? INCOMES_KEY : EXPENSES_KEY;
    localStorage.setItem(key, JSON.stringify(Array.isArray(items) ? items : []));
  }

  function getArray(key) {
    const value = safeParse(localStorage.getItem(key), []);
    return Array.isArray(value) ? value : [];
  }

  function saveArray(key, value) {
    localStorage.setItem(key, JSON.stringify(Array.isArray(value) ? value : []));
  }

  function normalizeTransaction(kind, input, existingId) {
    const categoryList = kind === "income" ? incomeCategories : expenseCategories;
    const date = String(input?.date || currentDate()).slice(0, 10);
    const category = categoryList.includes(String(input?.category || ""))
      ? String(input.category)
      : categoryList[0];

    const base = {
      id: existingId || newId(),
      description: String(input?.description || "").trim().slice(0, 180),
      amount: normalizeMoney(input?.amount),
      date,
      category,
      notes: String(input?.notes || "").trim().slice(0, 500),
      createdAt: input?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (kind === "expense") {
      const cardId = String(input?.cardId || "").trim();
      const validCard = cardId && getArray(CARDS_KEY).some(card => card.id === cardId);
      base.paymentMethod = validCard ? "credit" : String(input?.paymentMethod || "debit").slice(0, 30);
      base.cardId = validCard ? cardId : "";
    }

    return base;
  }

  function monthKey(dateLike = new Date()) {
    const date = dateLike instanceof Date ? dateLike : new Date(dateLike + "T12:00:00");
    if (Number.isNaN(date.getTime())) return currentMonth();
    return date.toISOString().slice(0, 7);
  }

  function addMonthsToMonth(month, offset) {
    const [year, mon] = String(month).split("-").map(Number);
    const date = new Date(year, (mon || 1) - 1 + offset, 1, 12);
    return date.toISOString().slice(0, 7);
  }

  function lastDayOfMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0, 12).getDate();
  }

  function cardBillMonthForExpense(expense, card) {
    const [year, month, day] = String(expense.date || currentDate()).split("-").map(Number);
    const closingDay = Number(card?.closingDay || 1);
    const dueDay = Number(card?.dueDay || 1);
    const baseMonth = `${year}-${String(month).padStart(2, "0")}`;

    let offset = dueDay <= closingDay ? 1 : 0;
    if (day > closingDay) offset += 1;
    return addMonthsToMonth(baseMonth, offset);
  }

  function dueDateForBillMonth(month, dueDay) {
    const [year, mon] = String(month).split("-").map(Number);
    const last = lastDayOfMonth(year, mon - 1);
    return `${year}-${String(mon).padStart(2, "0")}-${String(Math.min(Number(dueDay || 1), last)).padStart(2, "0")}`;
  }

  window.VisionMoneyProDemo = {
    expenseCategories,
    incomeCategories,

    getProfile() {
      return safeParse(localStorage.getItem(PROFILE_KEY), { name: "", email: "" });
    },

    saveProfile(profile) {
      const value = {
        name: String(profile?.name || "").trim().slice(0, 100),
        email: String(profile?.email || "").trim().slice(0, 160)
      };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(value));
      return value;
    },

    getWorkspace() {
      return safeParse(localStorage.getItem(WORKSPACE_KEY), null);
    },

    saveWorkspace(workspace) {
      const value = {
        mode: workspace?.mode === "shared" ? "shared" : "individual",
        name: String(workspace?.name || "Minhas finanças").trim().slice(0, 100),
        partnerName: String(workspace?.partnerName || "").trim().slice(0, 100),
        partnerEmail: String(workspace?.partnerEmail || "").trim().slice(0, 160)
      };
      localStorage.setItem(WORKSPACE_KEY, JSON.stringify(value));
      return value;
    },

    getTransactions(kind) {
      return getCollection(kind)
        .slice()
        .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt)));
    },

    getTransaction(kind, id) {
      return getCollection(kind).find(item => item.id === id) || null;
    },

    upsertTransaction(kind, input, id = null) {
      const items = getCollection(kind);
      const index = id ? items.findIndex(item => item.id === id) : -1;
      const current = index >= 0 ? items[index] : null;
      const normalized = normalizeTransaction(kind, {
        ...input,
        createdAt: current?.createdAt
      }, current?.id || null);

      if (!normalized.description) throw new Error("description_required");
      if (!(normalized.amount > 0)) throw new Error("amount_required");

      if (index >= 0) items[index] = normalized;
      else items.push(normalized);

      saveCollection(kind, items);
      return normalized;
    },

    removeTransaction(kind, id) {
      const before = getCollection(kind);
      const after = before.filter(item => item.id !== id);
      saveCollection(kind, after);
      return after.length !== before.length;
    },

    getMonthSummary(month = currentMonth()) {
      const expenses = getCollection("expense").filter(item => String(item.date).slice(0, 7) === month);
      const incomes = getCollection("income").filter(item => String(item.date).slice(0, 7) === month);
      const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const incomeTotal = incomes.reduce((sum, item) => sum + Number(item.amount || 0), 0);

      return {
        month,
        expenseTotal: Math.round(expenseTotal * 100) / 100,
        incomeTotal: Math.round(incomeTotal * 100) / 100,
        balance: Math.round((incomeTotal - expenseTotal) * 100) / 100,
        expenseCount: expenses.length,
        incomeCount: incomes.length
      };
    },

    getBudgets(month = currentMonth()) {
      return getArray(BUDGETS_KEY)
        .filter(item => item.month === month)
        .sort((a, b) => String(a.category).localeCompare(String(b.category), "pt-BR"));
    },

    upsertBudget(category, amount, month = currentMonth()) {
      const value = normalizeMoney(amount);
      if (!(value > 0)) throw new Error("budget_amount_required");
      if (!expenseCategories.includes(category)) throw new Error("invalid_category");

      const budgets = getArray(BUDGETS_KEY);
      const index = budgets.findIndex(item => item.month === month && item.category === category);
      const record = {
        id: index >= 0 ? budgets[index].id : newId(),
        month,
        category,
        amount: value,
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) budgets[index] = record;
      else budgets.push(record);
      saveArray(BUDGETS_KEY, budgets);
      return record;
    },

    removeBudget(category, month = currentMonth()) {
      const budgets = getArray(BUDGETS_KEY);
      saveArray(BUDGETS_KEY, budgets.filter(item => !(item.month === month && item.category === category)));
    },

    getCategorySpend(month = currentMonth()) {
      const totals = Object.fromEntries(expenseCategories.map(category => [category, 0]));
      getCollection("expense")
        .filter(item => String(item.date).slice(0, 7) === month)
        .forEach(item => {
          totals[item.category] = Math.round(((totals[item.category] || 0) + Number(item.amount || 0)) * 100) / 100;
        });
      return totals;
    },

    getGoals() {
      return getArray(GOALS_KEY).slice().sort((a, b) =>
        Number(a.completed) - Number(b.completed) ||
        String(a.targetDate || "9999-12-31").localeCompare(String(b.targetDate || "9999-12-31"))
      );
    },

    getGoal(id) {
      return this.getGoals().find(goal => goal.id === id) || null;
    },

    upsertGoal(input, id = null) {
      const goals = getArray(GOALS_KEY);
      const index = id ? goals.findIndex(goal => goal.id === id) : -1;
      const current = index >= 0 ? goals[index] : null;
      const name = String(input?.name || "").trim().slice(0, 100);
      const targetAmount = normalizeMoney(input?.targetAmount);
      if (!name) throw new Error("goal_name_required");
      if (!(targetAmount > 0)) throw new Error("goal_amount_required");

      const goal = {
        id: current?.id || newId(),
        name,
        targetAmount,
        targetDate: String(input?.targetDate || "").slice(0, 10),
        completed: Boolean(input?.completed ?? current?.completed ?? false),
        createdAt: current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) goals[index] = goal;
      else goals.push(goal);
      saveArray(GOALS_KEY, goals);
      return goal;
    },

    removeGoal(id) {
      saveArray(GOALS_KEY, this.getGoals().filter(goal => goal.id !== id));
      saveArray(CONTRIBUTIONS_KEY, getArray(CONTRIBUTIONS_KEY).filter(item => item.goalId !== id));
    },

    setGoalCompleted(id, completed) {
      const goal = this.getGoal(id);
      if (!goal) return null;
      return this.upsertGoal({ ...goal, completed: Boolean(completed) }, id);
    },

    getGoalContributions(goalId = null) {
      return getArray(CONTRIBUTIONS_KEY)
        .filter(item => !goalId || item.goalId === goalId)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));
    },

    addGoalContribution(goalId, amount, date = currentDate(), notes = "") {
      if (!this.getGoal(goalId)) throw new Error("goal_not_found");
      const value = normalizeMoney(amount);
      if (!(value > 0)) throw new Error("contribution_amount_required");
      const items = getArray(CONTRIBUTIONS_KEY);
      const record = {
        id: newId(),
        goalId,
        amount: value,
        date: String(date || currentDate()).slice(0, 10),
        notes: String(notes || "").trim().slice(0, 300),
        createdAt: new Date().toISOString()
      };
      items.push(record);
      saveArray(CONTRIBUTIONS_KEY, items);
      return record;
    },

    removeGoalContribution(id) {
      saveArray(CONTRIBUTIONS_KEY, getArray(CONTRIBUTIONS_KEY).filter(item => item.id !== id));
    },

    getGoalProgress(goalId) {
      const goal = this.getGoal(goalId);
      if (!goal) return { saved: 0, percent: 0, remaining: 0 };
      const saved = this.getGoalContributions(goalId).reduce((sum, item) => sum + Number(item.amount || 0), 0);
      const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((saved / goal.targetAmount) * 100)) : 0;
      return {
        saved: Math.round(saved * 100) / 100,
        percent,
        remaining: Math.max(0, Math.round((goal.targetAmount - saved) * 100) / 100)
      };
    },

    getCards(includeInactive = true) {
      return getArray(CARDS_KEY)
        .filter(card => includeInactive || card.active !== false)
        .sort((a, b) => Number(b.active !== false) - Number(a.active !== false) || String(a.name).localeCompare(String(b.name), "pt-BR"));
    },

    getCard(id) {
      return this.getCards(true).find(card => card.id === id) || null;
    },

    upsertCard(input, id = null) {
      const cards = getArray(CARDS_KEY);
      const index = id ? cards.findIndex(card => card.id === id) : -1;
      const current = index >= 0 ? cards[index] : null;
      const name = String(input?.name || "").trim().slice(0, 80);
      const limit = normalizeMoney(input?.limit);
      const closingDay = Math.min(31, Math.max(1, Number(input?.closingDay || 1)));
      const dueDay = Math.min(31, Math.max(1, Number(input?.dueDay || 1)));

      if (!name) throw new Error("card_name_required");
      if (!(limit > 0)) throw new Error("card_limit_required");

      const card = {
        id: current?.id || newId(),
        name,
        brand: String(input?.brand || "").trim().slice(0, 30),
        lastFour: String(input?.lastFour || "").replace(/\D/g, "").slice(-4),
        limit,
        closingDay,
        dueDay,
        active: input?.active === false ? false : true,
        createdAt: current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) cards[index] = card;
      else cards.push(card);
      saveArray(CARDS_KEY, cards);
      return card;
    },

    setCardActive(id, active) {
      const card = this.getCard(id);
      if (!card) return null;
      return this.upsertCard({ ...card, active: Boolean(active) }, id);
    },

    getCardBill(cardId, billMonth = currentMonth()) {
      const card = this.getCard(cardId);
      if (!card) return { total: 0, items: [], dueDate: "", month: billMonth };

      const items = getCollection("expense")
        .filter(item => item.cardId === cardId && cardBillMonthForExpense(item, card) === billMonth)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      const total = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
      return {
        total: Math.round(total * 100) / 100,
        items,
        dueDate: dueDateForBillMonth(billMonth, card.dueDay),
        month: billMonth
      };
    },

    getTotalCardBills(billMonth = currentMonth()) {
      return this.getCards(false).reduce((sum, card) => sum + this.getCardBill(card.id, billMonth).total, 0);
    },

    getPayables() {
      return getArray(PAYABLES_KEY).slice().sort((a, b) =>
        Number(a.status === "paid") - Number(b.status === "paid") ||
        String(a.dueDate).localeCompare(String(b.dueDate))
      );
    },

    getPayable(id) {
      return this.getPayables().find(item => item.id === id) || null;
    },

    upsertPayable(input, id = null) {
      const items = getArray(PAYABLES_KEY);
      const index = id ? items.findIndex(item => item.id === id) : -1;
      const current = index >= 0 ? items[index] : null;
      const description = String(input?.description || "").trim().slice(0, 180);
      const amount = normalizeMoney(input?.amount);
      const category = expenseCategories.includes(String(input?.category || ""))
        ? String(input.category)
        : expenseCategories[0];
      const dueDate = String(input?.dueDate || currentDate()).slice(0, 10);

      if (!description) throw new Error("payable_description_required");
      if (!(amount > 0)) throw new Error("payable_amount_required");

      const payable = {
        id: current?.id || newId(),
        description,
        amount,
        category,
        dueDate,
        status: input?.status === "paid" ? "paid" : (current?.status === "paid" ? "paid" : "pending"),
        paidAt: current?.paidAt || "",
        linkedExpenseId: current?.linkedExpenseId || "",
        notes: String(input?.notes || "").trim().slice(0, 500),
        createdAt: current?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (index >= 0) items[index] = payable;
      else items.push(payable);
      saveArray(PAYABLES_KEY, items);
      return payable;
    },

    removePayable(id) {
      saveArray(PAYABLES_KEY, getArray(PAYABLES_KEY).filter(item => item.id !== id));
    },

    markPayablePaid(id, createExpense = false) {
      const items = getArray(PAYABLES_KEY);
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return null;
      const payable = items[index];

      if (createExpense && !payable.linkedExpenseId) {
        const expense = this.upsertTransaction("expense", {
          description: payable.description,
          amount: payable.amount,
          date: currentDate(),
          category: payable.category,
          notes: payable.notes ? `Conta paga: ${payable.notes}` : "Gerado a partir de Contas a Pagar"
        });
        payable.linkedExpenseId = expense.id;
      }

      payable.status = "paid";
      payable.paidAt = new Date().toISOString();
      payable.updatedAt = new Date().toISOString();
      items[index] = payable;
      saveArray(PAYABLES_KEY, items);
      return payable;
    },

    reopenPayable(id) {
      const items = getArray(PAYABLES_KEY);
      const index = items.findIndex(item => item.id === id);
      if (index < 0) return null;
      items[index] = { ...items[index], status: "pending", paidAt: "", updatedAt: new Date().toISOString() };
      saveArray(PAYABLES_KEY, items);
      return items[index];
    },

    getPayablesSummary() {
      const items = this.getPayables();
      const today = currentDate();
      const pending = items.filter(item => item.status !== "paid");
      const paid = items.filter(item => item.status === "paid");
      const overdue = pending.filter(item => item.dueDate < today);
      return {
        pendingTotal: Math.round(pending.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100) / 100,
        paidTotal: Math.round(paid.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100) / 100,
        overdueTotal: Math.round(overdue.reduce((sum, item) => sum + Number(item.amount || 0), 0) * 100) / 100,
        pendingCount: pending.length,
        paidCount: paid.length,
        overdueCount: overdue.length
      };
    },

    getRecentTransactions(limit = 6) {
      const expenses = getCollection("expense").map(item => ({ ...item, kind: "expense" }));
      const incomes = getCollection("income").map(item => ({ ...item, kind: "income" }));
      return [...expenses, ...incomes]
        .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.updatedAt).localeCompare(String(a.updatedAt)))
        .slice(0, Math.max(1, Number(limit) || 6));
    },

    seedExampleData() {
      if (getCollection("expense").length || getCollection("income").length || getArray(CARDS_KEY).length) return false;
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, "0");
      const day = (n) => `${y}-${m}-${String(Math.min(n, 28)).padStart(2, "0")}`;

      const card = this.upsertCard({
        name: "Cartão principal",
        brand: "Visa",
        lastFour: "4821",
        limit: 5000,
        closingDay: 3,
        dueDay: 10
      });

      saveCollection("income", [
        normalizeTransaction("income", { description: "Salário", amount: 6500, date: day(5), category: "Salário" }),
        normalizeTransaction("income", { description: "Projeto freelance", amount: 1200, date: day(14), category: "Freelance" })
      ]);

      saveCollection("expense", [
        normalizeTransaction("expense", { description: "Aluguel", amount: 1850, date: day(7), category: "Moradia", paymentMethod: "pix" }),
        normalizeTransaction("expense", { description: "Supermercado", amount: 620.35, date: day(10), category: "Alimentação", cardId: card.id }),
        normalizeTransaction("expense", { description: "Combustível", amount: 280, date: day(12), category: "Transporte", cardId: card.id }),
        normalizeTransaction("expense", { description: "Streaming", amount: 55.9, date: day(16), category: "Assinaturas", cardId: card.id })
      ]);

      this.upsertPayable({
        description: "Internet",
        amount: 119.9,
        dueDate: day(20),
        category: "Moradia",
        notes: "Plano residencial"
      });

      return true;
    },

    formatCurrency(value) {
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
    },

    formatDate(value) {
      if (!value) return "";
      const [year, month, day] = String(value).split("-").map(Number);
      const date = new Date(year, (month || 1) - 1, day || 1);
      return new Intl.DateTimeFormat("pt-BR").format(date);
    },

    formatMonth(value) {
      if (!value) return "";
      const [year, month] = String(value).split("-").map(Number);
      const date = new Date(year, (month || 1) - 1, 1);
      return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(date);
    },

    monthKey,

    reset() {
      [
        PROFILE_KEY, WORKSPACE_KEY, EXPENSES_KEY, INCOMES_KEY, BUDGETS_KEY,
        GOALS_KEY, CONTRIBUTIONS_KEY, CARDS_KEY, PAYABLES_KEY
      ].forEach(key => localStorage.removeItem(key));
    }
  };
})();