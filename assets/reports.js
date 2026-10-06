(() => {
  const api = VisionMoneyProDemo;
  const startInput = document.getElementById("report-start");
  const endInput = document.getElementById("report-end");

  const escapeCsv = (value) => {
    const text = String(value ?? "");
    return /[;"\n\r]/.test(text) ? '"' + text.replaceAll('"','""') + '"' : text;
  };

  function formatCsvMoney(value) {
    return Number(value || 0).toFixed(2).replace(".",",");
  }

  function downloadCsv(filename, rows) {
    const content = "\uFEFF" + rows.map(row => row.map(escapeCsv).join(";")).join("\r\n");
    const blob = new Blob([content], {type:"text/csv;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function inRange(date) {
    return date >= startInput.value && date <= endInput.value;
  }

  function filteredTransactions(kind) {
    return api.getTransactions(kind).filter(item => inRange(item.date));
  }

  function monthsBetween(start, end) {
    const months = [];
    let [year, month] = start.slice(0,7).split("-").map(Number);
    const [endYear, endMonth] = end.slice(0,7).split("-").map(Number);
    let guard = 0;
    while ((year < endYear || (year === endYear && month <= endMonth)) && guard < 240) {
      months.push(year + "-" + String(month).padStart(2,"0"));
      month += 1;
      if (month > 12) { month = 1; year += 1; }
      guard += 1;
    }
    return months;
  }

  function monthLabel(month) {
    const [year, mon] = month.split("-").map(Number);
    return new Intl.DateTimeFormat("pt-BR",{month:"long",year:"numeric"}).format(new Date(year,mon-1,1));
  }

  function render() {
    if (!startInput.value || !endInput.value || startInput.value > endInput.value) return;

    const incomes = filteredTransactions("income");
    const expenses = filteredTransactions("expense");
    const incomeTotal = incomes.reduce((sum,item)=>sum+Number(item.amount||0),0);
    const expenseTotal = expenses.reduce((sum,item)=>sum+Number(item.amount||0),0);
    const balance = incomeTotal - expenseTotal;
    const saving = incomeTotal > 0 ? Math.round((balance / incomeTotal) * 100) : 0;

    document.getElementById("report-income").textContent = api.formatCurrency(incomeTotal);
    document.getElementById("report-expense").textContent = api.formatCurrency(expenseTotal);
    document.getElementById("report-balance").textContent = api.formatCurrency(balance);
    document.getElementById("report-saving").textContent = saving + "%";
    document.getElementById("report-income-count").textContent = incomes.length + " lançamento(s)";
    document.getElementById("report-expense-count").textContent = expenses.length + " lançamento(s)";

    const categoryTotals = {};
    expenses.forEach(item => {
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + Number(item.amount || 0);
    });
    const categories = Object.entries(categoryTotals)
      .map(([name,value])=>({name,value}))
      .sort((a,b)=>b.value-a.value);

    const max = Math.max(1,...categories.map(item=>item.value));
    const categoryEl = document.getElementById("report-categories");
    document.getElementById("report-categories-empty").hidden = categories.length > 0;
    categoryEl.innerHTML = categories.slice(0,10).map(item => {
      const width = Math.round((item.value / max) * 100);
      const share = expenseTotal > 0 ? Math.round((item.value / expenseTotal) * 100) : 0;
      return `
        <div class="analysis-row">
          <div class="analysis-row-head"><strong>${item.name}</strong><span>${api.formatCurrency(item.value)} · ${share}%</span></div>
          <div class="analysis-track"><span style="width:${width}%"></span></div>
        </div>
      `;
    }).join("");

    const months = monthsBetween(startInput.value,endInput.value);
    const monthlyBody = document.getElementById("report-monthly-body");
    monthlyBody.innerHTML = months.map(month => {
      const monthlyIncome = incomes.filter(item=>item.date.slice(0,7)===month).reduce((sum,item)=>sum+Number(item.amount||0),0);
      const monthlyExpense = expenses.filter(item=>item.date.slice(0,7)===month).reduce((sum,item)=>sum+Number(item.amount||0),0);
      const monthlyBalance = monthlyIncome-monthlyExpense;
      const monthlySaving = monthlyIncome>0 ? Math.round((monthlyBalance/monthlyIncome)*100) : 0;
      return `<tr>
        <td>${monthLabel(month)}</td>
        <td class="positive">${api.formatCurrency(monthlyIncome)}</td>
        <td class="negative">${api.formatCurrency(monthlyExpense)}</td>
        <td>${api.formatCurrency(monthlyBalance)}</td>
        <td>${monthlySaving}%</td>
      </tr>`;
    }).join("");

    document.getElementById("report-period-label").textContent =
      api.formatDate(startInput.value) + " → " + api.formatDate(endInput.value);
  }

  document.getElementById("apply-report-range").addEventListener("click", render);

  document.getElementById("export-transactions").addEventListener("click", () => {
    const rows = [["data","tipo","descricao","valor","categoria","conta","cartao","observacao"]];
    const all = [
      ...filteredTransactions("income").map(item=>({...item,kind:"receita"})),
      ...filteredTransactions("expense").map(item=>({...item,kind:"gasto"}))
    ].sort((a,b)=>String(a.date).localeCompare(String(b.date)));

    all.forEach(item => {
      const account = item.accountId ? api.getAccount(item.accountId) : null;
      const card = item.cardId ? api.getCard(item.cardId) : null;
      rows.push([
        api.formatDate(item.date), item.kind, item.description, formatCsvMoney(item.amount),
        item.category || "", account?.name || "", card?.name || "", item.notes || ""
      ]);
    });

    downloadCsv("visionmoneypro-movimentacoes-" + startInput.value + "-a-" + endInput.value + ".csv", rows);
  });

  document.getElementById("export-monthly").addEventListener("click", () => {
    const rows = [["mes","receitas","despesas","resultado","taxa_economia"]];
    monthsBetween(startInput.value,endInput.value).forEach(month => {
      const incomes = filteredTransactions("income").filter(item=>item.date.slice(0,7)===month);
      const expenses = filteredTransactions("expense").filter(item=>item.date.slice(0,7)===month);
      const income = incomes.reduce((sum,item)=>sum+Number(item.amount||0),0);
      const expense = expenses.reduce((sum,item)=>sum+Number(item.amount||0),0);
      const balance = income-expense;
      const saving = income>0 ? Math.round((balance/income)*100) : 0;
      rows.push([month,formatCsvMoney(income),formatCsvMoney(expense),formatCsvMoney(balance),saving+"%"]);
    });
    downloadCsv("visionmoneypro-resumo-mensal.csv", rows);
  });

  document.getElementById("export-payables").addEventListener("click", () => {
    const rows = [["vencimento","descricao","valor","categoria","status","observacao"]];
    api.getPayables().filter(item=>inRange(item.dueDate)).forEach(item => {
      rows.push([
        api.formatDate(item.dueDate),item.description,formatCsvMoney(item.amount),
        item.category,item.status,item.notes||""
      ]);
    });
    downloadCsv("visionmoneypro-contas-a-pagar.csv", rows);
  });

  document.getElementById("export-transfers").addEventListener("click", () => {
    const rows = [["data","origem","destino","valor","observacao"]];
    api.getTransfers().filter(item=>inRange(item.date)).forEach(item => {
      rows.push([
        api.formatDate(item.date),
        api.getAccount(item.fromAccountId)?.name || "",
        api.getAccount(item.toAccountId)?.name || "",
        formatCsvMoney(item.amount),item.notes||""
      ]);
    });
    downloadCsv("visionmoneypro-transferencias.csv", rows);
  });

  document.getElementById("print-report").addEventListener("click", () => window.print());

  const now = new Date();
  const first = new Date(now.getFullYear(),now.getMonth(),1,12).toISOString().slice(0,10);
  const last = new Date(now.getFullYear(),now.getMonth()+1,0,12).toISOString().slice(0,10);
  startInput.value = first;
  endInput.value = last;
  render();
})();