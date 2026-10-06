(() => {
  const api = VisionMoneyProDemo;
  const fileInput = document.getElementById("import-file");
  const dropzone = document.getElementById("import-dropzone");
  const accountSelect = document.getElementById("import-default-account");
  const previewBody = document.getElementById("import-preview-body");
  const tableWrap = document.getElementById("import-table-wrap");
  const empty = document.getElementById("import-empty");
  const confirmButton = document.getElementById("confirm-import");
  const message = document.getElementById("import-message");

  let previewRows = [];
  let currentFile = null;
  let currentFormat = "";

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
    .replaceAll('"',"&quot;").replaceAll("'","&#039;");

  const normalizeText = (value) => String(value ?? "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .trim().toLocaleLowerCase("pt-BR");

  function notify(text, kind = "info") {
    message.textContent = text;
    message.className = "notice import-message " + kind;
    message.hidden = false;
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => { message.hidden = true; }, 4500);
  }

  function populateAccounts() {
    const accounts = api.getAccounts(false);
    const preferred = accountSelect.value || api.getDefaultAccount()?.id || "";
    accountSelect.innerHTML = '<option value="">Sem conta padrão</option>' +
      accounts.map(account =>
        `<option value="${account.id}">${escapeHtml(account.name)} · ${api.formatCurrency(api.getAccountBalance(account.id))}</option>`
      ).join("");
    if (preferred && accounts.some(account => account.id === preferred)) accountSelect.value = preferred;
  }

  function normalizeHeader(value) {
    const key = normalizeText(value).replace(/[^a-z0-9]/g,"");
    const aliases = {
      data:"data", date:"data", datalancamento:"data", datamovimento:"data",
      tipo:"tipo", type:"tipo", natureza:"tipo",
      descricao:"descricao", description:"descricao", historico:"descricao", nome:"descricao",
      valor:"valor", amount:"valor", quantia:"valor",
      categoria:"categoria", category:"categoria",
      conta:"conta", account:"conta", carteira:"conta",
      cartao:"cartao", cartaocredito:"cartao", creditcard:"cartao",
      observacao:"observacao", observacoes:"observacao", memo:"observacao", notes:"observacao"
    };
    return aliases[key] || key;
  }

  function detectDelimiter(line) {
    const candidates = [";", ",", "\t"];
    return candidates
      .map(delimiter => ({ delimiter, count: (line.match(new RegExp(delimiter === "\t" ? "\\t" : "\\" + delimiter, "g")) || []).length }))
      .sort((a,b) => b.count - a.count)[0]?.delimiter || ";";
  }

  function parseCsvLine(line, delimiter) {
    const cells = [];
    let cell = "";
    let quoted = false;
    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      if (char === '"') {
        if (quoted && line[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === delimiter && !quoted) {
        cells.push(cell);
        cell = "";
      } else {
        cell += char;
      }
    }
    cells.push(cell);
    return cells.map(value => value.trim());
  }

  function parseCsv(text) {
    const clean = String(text || "").replace(/^\uFEFF/,"").replace(/\r\n/g,"\n").replace(/\r/g,"\n");
    const lines = clean.split("\n").filter(line => line.trim());
    if (lines.length < 2) throw new Error("csv_empty");

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);

    return lines.slice(1).map((line, index) => {
      const values = parseCsvLine(line, delimiter);
      const raw = {};
      headers.forEach((header, column) => { raw[header] = values[column] ?? ""; });
      return { raw, sourceRow:index + 2 };
    });
  }

  function getOfxTag(block, tag) {
    const match = String(block).match(new RegExp("<" + tag + ">([^<\\r\\n]*)", "i"));
    return match ? match[1].trim() : "";
  }

  function parseOfx(text) {
    const blocks = String(text || "").match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi) || [];
    if (!blocks.length) throw new Error("ofx_empty");

    return blocks.map((block, index) => {
      const amount = getOfxTag(block, "TRNAMT");
      const date = getOfxTag(block, "DTPOSTED").slice(0,8);
      const name = getOfxTag(block, "NAME");
      const memo = getOfxTag(block, "MEMO");
      const fitid = getOfxTag(block, "FITID");

      return {
        raw: {
          data: date,
          tipo: Number(amount) < 0 ? "gasto" : "receita",
          descricao: name || memo || "Movimentação OFX",
          valor: String(Math.abs(Number(amount || 0))),
          categoria: "",
          conta: "",
          cartao: "",
          observacao: memo && memo !== name ? memo : "",
          fitid
        },
        sourceRow:index + 1
      };
    });
  }

  function parseDate(value) {
    const text = String(value || "").trim();
    if (/^\d{8}/.test(text)) {
      return text.slice(0,4) + "-" + text.slice(4,6) + "-" + text.slice(6,8);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    const br = text.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);
    if (br) return br[3] + "-" + br[2].padStart(2,"0") + "-" + br[1].padStart(2,"0");
    return "";
  }

  function parseMoney(value) {
    let text = String(value ?? "").trim().replace(/R\$/gi,"").replace(/\s/g,"");
    if (!text) return 0;
    const negative = text.startsWith("-");
    text = text.replace(/[^0-9,.-]/g,"");

    if (text.includes(",") && text.includes(".")) {
      if (text.lastIndexOf(",") > text.lastIndexOf(".")) {
        text = text.replace(/\./g,"").replace(",",".");
      } else {
        text = text.replace(/,/g,"");
      }
    } else if (text.includes(",")) {
      text = text.replace(/\./g,"").replace(",",".");
    }

    const amount = Number(text);
    return Number.isFinite(amount) ? Math.abs(amount) * (negative ? -1 : 1) : 0;
  }

  function resolveType(value, amount) {
    const type = normalizeText(value);
    if (["receita","income","entrada","credito","crédito"].includes(type)) return "income";
    if (["gasto","despesa","expense","saida","saída","debito","débito"].includes(type)) return "expense";
    if (amount < 0) return "expense";
    if (amount > 0) return "income";
    return "";
  }

  function matchByName(items, name) {
    const target = normalizeText(name);
    if (!target) return null;
    return items.find(item => normalizeText(item.name) === target) || null;
  }

  function fingerprint(row) {
    if (row.raw.fitid) return "ofx:" + String(row.raw.fitid).trim();
    return [
      row.kind, row.date, Number(row.amount || 0).toFixed(2),
      normalizeText(row.description), normalizeText(row.raw.conta), normalizeText(row.raw.cartao)
    ].join("|").slice(0,240);
  }

  function prepareRows(sourceRows) {
    const expenseCategories = api.getCategories("expense");
    const incomeCategories = api.getCategories("income");
    const accounts = api.getAccounts(false);
    const cards = api.getCards(false);
    const fallbackAccount = api.getAccount(accountSelect.value);

    const seen = new Set();

    return sourceRows.map(source => {
      const raw = source.raw || {};
      const parsedAmount = parseMoney(raw.valor);
      const kind = resolveType(raw.tipo, parsedAmount);
      const amount = Math.abs(parsedAmount);
      const date = parseDate(raw.data);
      const description = String(raw.descricao || "").trim();
      const warnings = [];
      const errors = [];

      if (!date) errors.push("Data inválida");
      if (!kind) errors.push("Tipo inválido");
      if (!description) errors.push("Descrição vazia");
      if (!(amount > 0)) errors.push("Valor inválido");

      const categories = kind === "income" ? incomeCategories : expenseCategories;
      const fallbackCategory = kind === "income" ? "Outras rendas" : "Outros gastos";
      const requestedCategory = String(raw.categoria || "").trim();
      const category = categories.find(item => normalizeText(item) === normalizeText(requestedCategory)) ||
        (categories.includes(fallbackCategory) ? fallbackCategory : categories[0]);

      if (requestedCategory && normalizeText(category) !== normalizeText(requestedCategory)) {
        warnings.push('Categoria "' + requestedCategory + '" não encontrada; usando "' + category + '"');
      }

      let card = null;
      if (kind === "expense" && String(raw.cartao || "").trim()) {
        card = matchByName(cards, raw.cartao);
        if (!card) warnings.push('Cartão "' + raw.cartao + '" não encontrado; lançamento ficará sem cartão');
      }

      let account = null;
      if (!card) {
        if (String(raw.conta || "").trim()) {
          account = matchByName(accounts, raw.conta);
          if (!account && fallbackAccount) {
            account = fallbackAccount;
            warnings.push('Conta "' + raw.conta + '" não encontrada; usando "' + fallbackAccount.name + '"');
          } else if (!account) {
            warnings.push('Conta "' + raw.conta + '" não encontrada; lançamento ficará sem conta');
          }
        } else if (fallbackAccount) {
          account = fallbackAccount;
        } else {
          warnings.push("Nenhuma conta definida para o lançamento");
        }
      }

      const row = {
        raw, sourceRow:source.sourceRow, kind, amount, date, description, category,
        accountId:account?.id || "", accountName:account?.name || "",
        cardId:card?.id || "", cardName:card?.name || "",
        notes:String(raw.observacao || "").trim().slice(0,500),
        warnings, errors
      };

      row.fingerprint = fingerprint(row);
      const duplicate = Boolean(row.fingerprint && (api.hasImportFingerprint(row.fingerprint) || seen.has(row.fingerprint)));
      if (row.fingerprint) seen.add(row.fingerprint);

      row.state = errors.length ? "error" : duplicate ? "duplicate" : warnings.length ? "warning" : "valid";
      return row;
    });
  }

  function renderPreview() {
    const total = previewRows.length;
    const ready = previewRows.filter(row => row.state === "valid").length;
    const warnings = previewRows.filter(row => row.state === "warning").length;
    const skipped = previewRows.filter(row => row.state === "error" || row.state === "duplicate").length;
    const importable = ready + warnings;

    document.getElementById("import-total").textContent = total;
    document.getElementById("import-ready").textContent = ready;
    document.getElementById("import-warnings").textContent = warnings;
    document.getElementById("import-skipped").textContent = skipped;
    confirmButton.disabled = importable === 0;
    confirmButton.textContent = importable ? "Importar " + importable + " movimentação(ões)" : "Importar movimentações";

    empty.hidden = total > 0;
    tableWrap.hidden = total === 0;

    const labels = {
      valid:["Pronto","valid"], warning:["Aviso","warning"],
      duplicate:["Duplicada","duplicate"], error:["Inválida","error"]
    };

    previewBody.innerHTML = previewRows.slice(0,250).map(row => {
      const [label, cls] = labels[row.state];
      const details = row.errors.length ? row.errors.join(" · ") :
        row.warnings.length ? row.warnings.join(" · ") :
        row.state === "duplicate" ? "Já existe uma movimentação com a mesma identificação." : "Pronta para importar.";

      const destination = row.cardName ? "Cartão: " + row.cardName :
        row.accountName ? "Conta: " + row.accountName : "Sem conta";

      return `
        <tr class="import-row ${cls}">
          <td><span class="import-status ${cls}">${label}</span><small title="${escapeHtml(details)}">${escapeHtml(details)}</small></td>
          <td>${row.date ? api.formatDate(row.date) : "—"}</td>
          <td><span class="transaction-type ${row.kind === "income" ? "income" : "expense"}">${row.kind === "income" ? "+" : "−"}</span> ${row.kind === "income" ? "Receita" : row.kind === "expense" ? "Gasto" : "—"}</td>
          <td><strong>${escapeHtml(row.description || "—")}</strong><small>Linha ${row.sourceRow}</small></td>
          <td><strong>${api.formatCurrency(row.amount)}</strong></td>
          <td>${escapeHtml(row.category || "—")}</td>
          <td>${escapeHtml(destination)}</td>
        </tr>
      `;
    }).join("");

    if (total > 250) {
      notify("A prévia mostra as primeiras 250 linhas. Todas as linhas válidas do arquivo serão consideradas.", "info");
    }
  }

  function renderHistory() {
    const history = api.getImportHistory().slice(0,8);
    const target = document.getElementById("import-history");
    target.innerHTML = history.length ? history.map(item => `
      <div class="import-history-row">
        <div class="import-history-icon">${String(item.format || "csv").toUpperCase().slice(0,3)}</div>
        <div>
          <strong>${escapeHtml(item.fileName)}</strong>
          <span>${item.importedCount} importada(s) · ${item.skippedCount} ignorada(s) · ${item.warningCount} com aviso</span>
        </div>
        <time>${new Intl.DateTimeFormat("pt-BR",{dateStyle:"short",timeStyle:"short"}).format(new Date(item.importedAt))}</time>
      </div>
    `).join("") : '<div class="mini-empty">Nenhuma importação realizada neste navegador.</div>';
  }

  async function processFile(file) {
    if (!file) return;
    const extension = (file.name.split(".").pop() || "").toLocaleLowerCase();
    const format = ["ofx","qfx"].includes(extension) ? "ofx" : "csv";
    const text = await file.text();

    let sourceRows;
    try {
      sourceRows = format === "ofx" ? parseOfx(text) : parseCsv(text);
    } catch (error) {
      clearFile(false);
      notify(format === "ofx"
        ? "Não encontrei movimentações válidas nesse OFX."
        : "Não consegui ler o CSV. Confira se ele possui cabeçalho e pelo menos uma linha.", "error");
      return;
    }

    currentFile = file;
    currentFormat = format;
    previewRows = prepareRows(sourceRows);

    document.getElementById("import-file-name").textContent = file.name;
    document.getElementById("import-file-format").textContent = format.toUpperCase();
    document.getElementById("import-file-summary").hidden = false;
    dropzone.classList.add("has-file");
    renderPreview();
  }

  function clearFile(clearInput = true) {
    currentFile = null;
    currentFormat = "";
    previewRows = [];
    if (clearInput) fileInput.value = "";
    document.getElementById("import-file-summary").hidden = true;
    dropzone.classList.remove("has-file");
    renderPreview();
  }

  fileInput.addEventListener("change", () => processFile(fileInput.files?.[0]));

  ["dragenter","dragover"].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.add("dragging");
  }));
  ["dragleave","drop"].forEach(type => dropzone.addEventListener(type, event => {
    event.preventDefault();
    dropzone.classList.remove("dragging");
  }));
  dropzone.addEventListener("drop", event => {
    const file = event.dataTransfer?.files?.[0];
    if (file) processFile(file);
  });

  accountSelect.addEventListener("change", () => {
    if (!currentFile) return;
    processFile(currentFile);
  });

  document.getElementById("clear-import-file").addEventListener("click", () => clearFile());

  confirmButton.addEventListener("click", () => {
    const rows = previewRows.filter(row => row.state === "valid" || row.state === "warning");
    if (!rows.length || !currentFile) return;

    const batchId = "import-" + Date.now();
    let imported = 0;

    rows.forEach(row => {
      api.upsertTransaction(row.kind, {
        description:row.description,
        amount:row.amount,
        date:row.date,
        category:row.category,
        notes:row.notes,
        accountId:row.accountId,
        cardId:row.cardId,
        importFingerprint:row.fingerprint,
        importBatchId:batchId
      });
      imported += 1;
    });

    const skipped = previewRows.length - imported;
    const warnings = previewRows.filter(row => row.state === "warning").length;
    api.addImportHistory({
      fileName:currentFile.name,
      format:currentFormat,
      importedCount:imported,
      skippedCount:skipped,
      warningCount:warnings
    });

    notify(imported + " movimentação(ões) importada(s). " + skipped + " linha(s) ignorada(s).", "success");
    clearFile();
    renderHistory();
    populateAccounts();
  });

  populateAccounts();
  renderPreview();
  renderHistory();
})();