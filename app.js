// ---------- Data Structures ----------
let accounts = JSON.parse(localStorage.getItem('mb_accounts')) || [
    { id: 'acc1', name: 'GCash', balance: 0 },
    { id: 'acc2', name: 'Maribank', balance: 0 },
    { id: 'acc3', name: 'Cash', balance: 0 }
];
let transactions = JSON.parse(localStorage.getItem('mb_transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('mb_budgets')) || {};
let savings = JSON.parse(localStorage.getItem('mb_savings')) || [];
let loans = JSON.parse(localStorage.getItem('mb_loans')) || [];
let bills = JSON.parse(localStorage.getItem('mb_bills')) || [];
let netWorthHistory = JSON.parse(localStorage.getItem('mb_networth_history')) || [];
let currentFilter = 'all';
let searchQuery = '';
let isDarkMode = localStorage.getItem('mb_theme') === 'dark';
let currentThemeStyle = localStorage.getItem('mb_theme_style') || 'glass';
let transparency = parseFloat(localStorage.getItem('mb_transparency')) || 0.65;
let currentPalette = localStorage.getItem('mb_palette') || 'default';
// NEW: Font size & density
let fontSize = localStorage.getItem('mb_font_size') || 'medium';
let density = localStorage.getItem('mb_density') || 'comfortable';
let notificationsEnabled = localStorage.getItem('mb_notifications') === 'true';
let lastKnownDate = new Date().toDateString(); // e.g., "Mon Aug 17 2026"
// Chart.js instances
let incomeExpenseChartInstance = null;
let categoryPieChartInstance = null;
let netWorthChartInstance = null;
let accountsDoughnutChartInstance = null;
let budgetChartInstance = null; // NEW

// ---------- Save Functions ----------
function saveAccounts() { localStorage.setItem('mb_accounts', JSON.stringify(accounts)); }
function saveTransactions() { localStorage.setItem('mb_transactions', JSON.stringify(transactions)); }
function saveBudgets() { localStorage.setItem('mb_budgets', JSON.stringify(budgets)); }
function saveSavings() { localStorage.setItem('mb_savings', JSON.stringify(savings)); }
function saveLoans() { localStorage.setItem('mb_loans', JSON.stringify(loans)); }
function saveBills() { localStorage.setItem('mb_bills', JSON.stringify(bills)); }
function saveNetWorthHistory() { localStorage.setItem('mb_networth_history', JSON.stringify(netWorthHistory)); }
function saveTheme() { localStorage.setItem('mb_theme', isDarkMode ? 'dark' : 'light'); }
function saveThemeStyle() { localStorage.setItem('mb_theme_style', currentThemeStyle); }
function saveTransparency() { localStorage.setItem('mb_transparency', transparency); }
function savePalette() { localStorage.setItem('mb_palette', currentPalette); }
function saveFontSize() { localStorage.setItem('mb_font_size', fontSize); }
function saveDensity() { localStorage.setItem('mb_density', density); }
function saveNotifications() { localStorage.setItem('mb_notifications', notificationsEnabled); }

// ---------- Utilities ----------
function formatCurrency(val) {
    return '₱' + Math.abs(val).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function getAmountClass(value) {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return '';
}

function formatCurrencyWithColor(val) {
    const cls = getAmountClass(val);
    const formatted = formatCurrency(val);
    const sign = val > 0 ? '+' : (val < 0 ? '-' : '');
    return `<span class="${cls}">${sign}${formatted}</span>`;
}

function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthKeyFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getSavingsTotalForAccount(accountId) {
    return savings
        .filter(s => s.accountId === accountId)
        .reduce((sum, s) => sum + (s.current || 0), 0);
}

// ---------- Toast Notifications (NEW) ----------
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) {
        const div = document.createElement('div');
        div.id = 'toast-container';
        div.className = 'toast-container';
        document.body.appendChild(div);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ---------- Theme & Settings ----------
function applyTheme() {
    // Dark mode
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>`;
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>`;
    }
    // UI Style
    document.body.setAttribute('data-theme', currentThemeStyle);
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeStyle === currentThemeStyle);
    });

    // Transparency
    document.documentElement.style.setProperty('--card-alpha', transparency);

    // Palette
    document.body.setAttribute('data-palette', currentPalette);
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palette === currentPalette);
    });

    // Font size & density
    document.body.setAttribute('data-font-size', fontSize);
    document.body.setAttribute('data-density', density);

    // Update UI controls
    const slider = document.getElementById('transparency-slider');
    if (slider) {
        slider.value = transparency;
        document.getElementById('transparency-value').textContent = transparency;
    }
    const fontSelect = document.getElementById('font-size-select');
    if (fontSelect) fontSelect.value = fontSize;
    const densitySelect = document.getElementById('density-select');
    if (densitySelect) densitySelect.value = density;
    const notifBtn = document.getElementById('enable-notifications-btn');
    if (notifBtn) {
        notifBtn.textContent = notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';
    }
    const notifStatus = document.getElementById('notification-status');
    if (notifStatus) {
        notifStatus.textContent = notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled';
    }
}

function setThemeStyle(style) {
    if (!['glass', 'neumorphism', 'normal'].includes(style)) return;
    currentThemeStyle = style;
    saveThemeStyle();
    applyTheme();
}

function setTransparency(value) {
    transparency = Math.min(0.9, Math.max(0.1, value));
    saveTransparency();
    applyTheme();
}

function setPalette(palette) {
    currentPalette = palette;
    savePalette();
    applyTheme();
}

function setFontSize(size) {
    if (!['small', 'medium', 'large'].includes(size)) return;
    fontSize = size;
    saveFontSize();
    applyTheme();
}

function setDensity(densityVal) {
    if (!['comfortable', 'compact'].includes(densityVal)) return;
    density = densityVal;
    saveDensity();
    applyTheme();
}

// ---------- Tab Switching ----------
function switchTab(tabId, activeNav = tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${activeNav}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    if (tabId === 'charts') {
        setTimeout(() => renderCharts(), 100);
    }
    if (tabId === 'budget') {
        setTimeout(() => renderBudgetChart(), 100);
    }
}

// ---------- Account Operations ----------
function addAccount(name) {
    const id = 'acc' + Date.now();
    accounts.push({ id, name, balance: 0 });
    saveAccounts();
    renderAll();
}

function deleteAccount(id) {
    if (accounts.length <= 1) {
        alert('Cannot delete the last account');
        return;
    }
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    renderAll();
}

// ---------- Savings Operations ----------
function addSavingsGoal(name, target, current, accountId) {
    const id = 'sav' + Date.now();
    // NEW: store createdAt and initialAmount for projection
    savings.push({ 
        id, name, target, current, accountId,
        createdAt: new Date().toISOString(),
        initialAmount: current || 0
    });
    saveSavings();
    renderAll();
}

function updateSavings(id, newCurrent) {
    const goal = savings.find(s => s.id === id);
    if (goal) {
        goal.current = Math.max(0, newCurrent);
        saveSavings();
        renderAll();
    }
}

function deleteSavingsGoal(id) {
    savings = savings.filter(s => s.id !== id);
    saveSavings();
    renderAll();
}

// ---------- Loans Operations ----------
function addLoan(name, amount, type) {
    const id = 'loan' + Date.now();
    loans.push({ id, name, amount, type });
    saveLoans();
    renderAll();
}

function deleteLoan(id) {
    loans = loans.filter(l => l.id !== id);
    saveLoans();
    renderAll();
}

// ---------- Bills Operations ----------
function addBill(name, amount, dueDate) {
    const id = 'bill' + Date.now();
    bills.push({ id, name, amount, dueDate, paid: false });
    saveBills();
    renderAll();
}

function deleteBill(id) {
    bills = bills.filter(b => b.id !== id);
    saveBills();
    renderAll();
}

function toggleBillPaid(id) {
    const bill = bills.find(b => b.id === id);
    if (bill) {
        bill.paid = !bill.paid;
        saveBills();
        renderAll();
    }
}

// ---------- Transaction Operations ----------
function addTransaction(description, amount, type, category, accountId, transferToAccountId = null) {
    if (type === 'transfer') {
        // Create two transactions: expense from source, income to destination
        const fromAccount = accounts.find(acc => acc.id === accountId);
        const toAccount = accounts.find(acc => acc.id === transferToAccountId);
        if (!fromAccount || !toAccount) {
            alert('Please select valid accounts for transfer.');
            return;
        }
        const transferAmount = Math.abs(amount);
        // Deduct from source
        const expenseTx = {
            id: Date.now(),
            description: `Transfer to ${toAccount.name}`,
            amount: -transferAmount,
            category: 'Transfer',
            accountId: fromAccount.id,
            date: new Date().toISOString()
        };
        // Add to destination
        const incomeTx = {
            id: Date.now() + 1,
            description: `Transfer from ${fromAccount.name}`,
            amount: transferAmount,
            category: 'Transfer',
            accountId: toAccount.id,
            date: new Date().toISOString()
        };
        transactions.push(expenseTx, incomeTx);
        fromAccount.balance -= transferAmount;
        toAccount.balance += transferAmount;
        saveTransactions();
        saveAccounts();
        renderAll();
        showToast('Transfer completed', 'success');
    } else {
        const signedAmount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
        const transaction = {
            id: Date.now(),
            description,
            amount: signedAmount,
            category,
            accountId,
            date: new Date().toISOString()
        };
        transactions.push(transaction);
        const account = accounts.find(acc => acc.id === accountId);
        if (account) account.balance += signedAmount;
        saveTransactions();
        saveAccounts();
        renderAll();
        // Budget notification check for expense
        if (type === 'expense') {
            checkBudgetAlerts(category);
        }
    }
}

function deleteTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        const account = accounts.find(acc => acc.id === transaction.accountId);
        if (account) account.balance -= transaction.amount;
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        saveAccounts();
        renderAll();
    }
}

function setBudget(category, limit) {
    const monthKey = getMonthKey();
    if (!budgets[monthKey]) budgets[monthKey] = {};
    budgets[monthKey][category] = limit;
    saveBudgets();
    renderAll();
    showToast('Budget set', 'success');
}

function getMonthlyIncomeExpense() {
    const monthKey = getMonthKey();
    let income = 0, expense = 0;
    transactions.forEach(t => {
        if (t.date.slice(0, 7) === monthKey) {
            if (t.amount > 0) income += t.amount;
            else expense += Math.abs(t.amount);
        }
    });
    return { income, expense, balance: income - expense };
}

function getCategorySpending(monthKey) {
    const spending = {};
    transactions.forEach(t => {
        if (t.date.slice(0, 7) === monthKey && t.amount < 0) {
            const cat = t.category || 'Other';
            spending[cat] = (spending[cat] || 0) + Math.abs(t.amount);
        }
    });
    return spending;
}

// ---------- Budget Alerts (NEW) ----------
function checkBudgetAlerts(category) {
    const monthKey = getMonthKey();
    const monthBudgets = budgets[monthKey] || {};
    if (!monthBudgets[category]) return;
    const limit = monthBudgets[category];
    const spent = getCategorySpending(monthKey)[category] || 0;
    if (spent >= limit) {
        showToast(`Budget exceeded for ${category}! Spent ${formatCurrency(spent)} of ${formatCurrency(limit)}.`, 'warning');
    } else if (spent >= 0.8 * limit) {
        showToast(`Approaching budget limit for ${category}. ${formatCurrency(limit - spent)} remaining.`, 'warning');
    }
}

// ---------- Net Worth ----------
function getNetWorth() {
    const accountTotal = accounts.reduce((sum, acc) => {
        return sum + acc.balance + getSavingsTotalForAccount(acc.id);
    }, 0);
    const lentTotal = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);
    const borrowedTotal = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
    return accountTotal + lentTotal - borrowedTotal;
}

function recordNetWorthSnapshot() {
    const today = new Date().toISOString().slice(0, 10);
    const lastEntry = netWorthHistory[netWorthHistory.length - 1];
    if (!lastEntry || lastEntry.date !== today) {
        netWorthHistory.push({ date: today, value: getNetWorth() });
        saveNetWorthHistory();
    } else {
        lastEntry.value = getNetWorth();
        saveNetWorthHistory();
    }
}

// ---------- Render Functions ----------
function renderAccounts() {
    const container = document.getElementById('accounts-list');
    container.innerHTML = '';
    if (accounts.length === 0) {
        container.innerHTML = `<div class="empty-state">No accounts yet. Add your first account.</div>`;
    } else {
        accounts.forEach(acc => {
            const effectiveBalance = acc.balance + getSavingsTotalForAccount(acc.id);
            const savingsText = getSavingsTotalForAccount(acc.id) > 0 ? ` (Savings: ${formatCurrency(getSavingsTotalForAccount(acc.id))})` : '';
            const div = document.createElement('div');
            div.className = 'account-item';
            div.innerHTML = `
                <div>
                    <span class="account-name">${acc.name}</span>
                    ${savingsText ? `<div class="transaction-meta">${savingsText}</div>` : ''}
                </div>
                <span class="account-balance ${getAmountClass(effectiveBalance)}">${formatCurrency(effectiveBalance)}</span>
                <button class="delete-btn" data-account-id="${acc.id}" aria-label="Delete account">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            `;
            div.querySelector('.delete-btn').addEventListener('click', () => deleteAccount(acc.id));
            container.appendChild(div);
        });
    }
    const accountSelect = document.getElementById('modal-account');
    if (accountSelect) {
        accountSelect.innerHTML = '';
        accounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.id;
            option.textContent = acc.name;
            accountSelect.appendChild(option);
        });
    }
    const savingsAccountSelect = document.getElementById('savings-account');
    if (savingsAccountSelect) {
        savingsAccountSelect.innerHTML = '';
        accounts.forEach(acc => {
            const option = document.createElement('option');
            option.value = acc.id;
            option.textContent = acc.name;
            savingsAccountSelect.appendChild(option);
        });
    }
    // Transfer selects
    const transferFrom = document.getElementById('transfer-from-account');
    const transferTo = document.getElementById('transfer-to-account');
    if (transferFrom && transferTo) {
        transferFrom.innerHTML = '';
        transferTo.innerHTML = '';
        accounts.forEach(acc => {
            const opt1 = document.createElement('option');
            opt1.value = acc.id;
            opt1.textContent = acc.name;
            transferFrom.appendChild(opt1);
            const opt2 = document.createElement('option');
            opt2.value = acc.id;
            opt2.textContent = acc.name;
            transferTo.appendChild(opt2);
        });
    }
}

function renderAccountBalances() {
    const container = document.getElementById('account-balances-list');
    if (!container) return;
    container.innerHTML = '';
    if (accounts.length === 0) {
        container.innerHTML = '<div class="empty-state">No accounts yet.</div>';
        return;
    }
    accounts.forEach(acc => {
        const effectiveBalance = acc.balance + getSavingsTotalForAccount(acc.id);
        const div = document.createElement('div');
        div.className = 'account-summary-item';
        div.innerHTML = `
            <span class="account-summary-name">${acc.name}</span>
            <span class="account-summary-balance ${getAmountClass(effectiveBalance)}">${formatCurrency(effectiveBalance)}</span>
        `;
        container.appendChild(div);
    });
}

function renderSavings() {
    const container = document.getElementById('savings-list');
    container.innerHTML = '';
    if (savings.length === 0) {
        container.innerHTML = `<div class="empty-state">No savings goals yet. Start saving!</div>`;
    } else {
        savings.forEach(goal => {
            const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
            const account = accounts.find(acc => acc.id === goal.accountId);
            const accountName = account ? account.name : 'No account';
            // Projection calculation (NEW)
            let projectionText = '';
            if (goal.createdAt && goal.initialAmount !== undefined && goal.target > goal.current) {
                const created = new Date(goal.createdAt);
                const now = new Date();
                const months = Math.max(1, (now - created) / (1000 * 60 * 60 * 24 * 30));
                const monthlyRate = (goal.current - goal.initialAmount) / months;
                if (monthlyRate > 0) {
                    const remaining = goal.target - goal.current;
                    const monthsNeeded = Math.ceil(remaining / monthlyRate);
                    projectionText = `<div class="transaction-meta">Projection: ~${monthsNeeded} month(s) to goal</div>`;
                }
            }
            const div = document.createElement('div');
            div.className = 'savings-item';
            div.innerHTML = `
                <div style="flex:1;">
                    <div class="savings-name">${goal.name} <small>(${accountName})</small></div>
                    <div class="savings-progress">
                        <span class="positive">${formatCurrency(goal.current)}</span> / ${formatCurrency(goal.target)}
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${percent >= 100 ? 'over' : ''}" style="width: ${percent}%"></div>
                    </div>
                    ${projectionText}
                </div>
                <input type="number" class="savings-update" value="${goal.current}" step="0.01" style="width:80px;">
                <button class="delete-btn" data-savings-id="${goal.id}" aria-label="Delete goal">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            `;
            const updateInput = div.querySelector('.savings-update');
            updateInput.addEventListener('change', () => {
                const newVal = parseFloat(updateInput.value);
                if (!isNaN(newVal) && newVal >= 0) {
                    updateSavings(goal.id, newVal);
                }
            });
            div.querySelector('.delete-btn').addEventListener('click', () => deleteSavingsGoal(goal.id));
            container.appendChild(div);
        });
    }
}

function renderLoans() {
    const container = document.getElementById('loans-list');
    container.innerHTML = '';
    if (loans.length === 0) {
        container.innerHTML = `<div class="empty-state">No loans recorded.</div>`;
    } else {
        loans.forEach(loan => {
            const div = document.createElement('div');
            div.className = 'loan-item';
            const label = loan.type === 'borrowed' ? 'I Owe' : 'Owed to Me';
            const loanValue = loan.type === 'borrowed' ? -loan.amount : loan.amount;
            div.innerHTML = `
                <span class="loan-name">${loan.name} <small>(${label})</small></span>
                <span class="loan-amount ${getAmountClass(loanValue)}">${formatCurrency(loan.amount)}</span>
                <button class="delete-btn" data-loan-id="${loan.id}" aria-label="Delete loan">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            `;
            div.querySelector('.delete-btn').addEventListener('click', () => deleteLoan(loan.id));
            container.appendChild(div);
        });
    }
}

function renderBills() {
    const container = document.getElementById('bills-list');
    container.innerHTML = '';
    if (bills.length === 0) {
        container.innerHTML = `<div class="empty-state">No upcoming bills.</div>`;
    } else {
        const sortedBills = [...bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        sortedBills.forEach(bill => {
            const div = document.createElement('div');
            div.className = 'bill-item';
            const dueDate = new Date(bill.dueDate + 'T00:00:00');
            const dueFormatted = dueDate.toLocaleDateString();
            const isPast = dueDate < new Date() && !bill.paid;
            div.innerHTML = `
                <div style="flex:1;">
                    <div class="bill-name">${bill.name} ${isPast ? '<span class="dot over"></span>' : ''}</div>
                    <div class="bill-due">Due: ${dueFormatted}</div>
                </div>
                <span class="bill-amount negative">-${formatCurrency(bill.amount)}</span>
                <button class="paid-btn" data-bill-id="${bill.id}" aria-label="Toggle paid">
                    ${bill.paid ? 
                        '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' :
                        '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'
                    }
                </button>
                <button class="delete-btn" data-bill-id="${bill.id}" aria-label="Delete bill">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <line x1="10" y1="11" x2="10" y2="17"/>
                        <line x1="14" y1="11" x2="14" y2="17"/>
                    </svg>
                </button>
            `;
            div.querySelector('.delete-btn').addEventListener('click', () => deleteBill(bill.id));
            div.querySelector('.paid-btn').addEventListener('click', () => toggleBillPaid(bill.id));
            container.appendChild(div);
        });
    }
}

function renderSummary() {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance + getSavingsTotalForAccount(acc.id), 0);
    const { income, expense } = getMonthlyIncomeExpense();
    document.getElementById('balance').innerHTML = formatCurrencyWithColor(totalBalance);
    document.getElementById('total-income').innerHTML = formatCurrencyWithColor(income);
    document.getElementById('total-expense').innerHTML = formatCurrencyWithColor(-expense);

    const netWorth = getNetWorth();
    document.getElementById('net-worth').innerHTML = formatCurrencyWithColor(netWorth);
    const accountTotal = totalBalance;
    const lentTotal = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);
    const borrowedTotal = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
    document.getElementById('net-worth-breakdown').textContent = 
        `Accounts (incl. savings): ${formatCurrency(accountTotal)} + Lent: ${formatCurrency(lentTotal)} - Borrowed: ${formatCurrency(borrowedTotal)}`;
}

function renderTransactionList() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    const filtered = transactions.filter(t => {
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'income' && t.amount > 0) || 
            (currentFilter === 'expense' && t.amount < 0);
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = t.description.toLowerCase().includes(searchLower) || 
                              (t.category && t.category.toLowerCase().includes(searchLower));
        return matchesFilter && matchesSearch;
    });

    if (filtered.length === 0) {
        list.innerHTML = `<li><div class="empty-state">No transactions found.</div></li>`;
        return;
    }

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = t.amount > 0 ? 'income' : 'expense';
        const account = accounts.find(acc => acc.id === t.accountId);
        const accountName = account ? account.name : 'Unknown';
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${accountName} • ${new Date(t.date).toLocaleDateString()}</div>
            </div>
            <span class="transaction-amount ${getAmountClass(t.amount)}">
                ${formatCurrencyWithColor(t.amount)}
            </span>
            <button class="delete-btn" data-id="${t.id}" aria-label="Delete transaction">
                <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    <line x1="10" y1="11" x2="10" y2="17"/>
                    <line x1="14" y1="11" x2="14" y2="17"/>
                </svg>
            </button>
        `;
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(t.id));
        list.appendChild(li);
    });
}

function renderTransactionPreview() {
    const list = document.getElementById('transaction-list-preview');
    list.innerHTML = '';
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (recent.length === 0) {
        list.innerHTML = `<li><div class="empty-state">No transactions yet.</div></li>`;
        return;
    }
    recent.forEach(t => {
        const li = document.createElement('li');
        li.className = t.amount > 0 ? 'income' : 'expense';
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${new Date(t.date).toLocaleDateString()}</div>
            </div>
            <span class="transaction-amount ${getAmountClass(t.amount)}">
                ${formatCurrencyWithColor(t.amount)}
            </span>
        `;
        list.appendChild(li);
    });
}

function renderBudgets() {
    const monthKey = getMonthKey();
    const spending = getCategorySpending(monthKey);
    const container = document.getElementById('budget-progress');
    container.innerHTML = '';
    const monthBudgets = budgets[monthKey] || {};
    const categories = Object.keys(monthBudgets);
    if (categories.length === 0) {
        container.innerHTML = `<div class="empty-state">No budgets set for this month.</div>`;
        return;
    }
    categories.forEach(category => {
        const limit = monthBudgets[category];
        const spent = spending[category] || 0;
        const percent = limit > 0 ? (spent / limit) * 100 : 0;
        const over = percent >= 100;
        const warning = percent >= 80 && percent < 100;
        const div = document.createElement('div');
        div.className = 'budget-item';
        div.innerHTML = `
            <div class="budget-header">
                <span>${category} ${over ? '<span class="dot over"></span>' : warning ? '<span class="dot warning"></span>' : ''}</span>
                <span>${formatCurrency(spent)} / ${formatCurrency(limit)} (${Math.round(percent)}%)</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${over ? 'over' : warning ? 'warning' : ''}" style="width: ${Math.min(100, percent)}%"></div>
            </div>
        `;
        container.appendChild(div);
    });
}

// ---------- Charts ----------
function renderCharts() {
    if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();
    if (categoryPieChartInstance) categoryPieChartInstance.destroy();
    if (netWorthChartInstance) netWorthChartInstance.destroy();
    if (accountsDoughnutChartInstance) accountsDoughnutChartInstance.destroy();

    // 1. Income vs Expense Bar Chart
    const months = [];
    const incomeData = [];
    const expenseData = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const monthKey = getMonthKeyFromDate(d);
        months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            if (t.date.slice(0, 7) === monthKey) {
                if (t.amount > 0) inc += t.amount;
                else exp += Math.abs(t.amount);
            }
        });
        incomeData.push(inc);
        expenseData.push(exp);
    }

    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChartInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '₱' + value, color: getComputedStyle(document.body).getPropertyValue('--text-secondary') },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
            }
        }
    });

    // 2. Category Spending Doughnut
    const currentMonthKey = getMonthKey();
    const categorySpending = getCategorySpending(currentMonthKey);
    const categories = Object.keys(categorySpending);
    const amounts = Object.values(categorySpending);
    const ctx2 = document.getElementById('categoryPieChart').getContext('2d');
    categoryPieChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: [
                    'rgba(239, 68, 68, 0.7)',
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(107, 114, 128, 0.7)',
                    'rgba(245, 158, 11, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }
        }
    });

    // 3. Accounts Distribution Doughnut
    const accountLabels = accounts.map(acc => acc.name);
    const accountBalances = accounts.map(acc => acc.balance + getSavingsTotalForAccount(acc.id));
    const ctx3 = document.getElementById('accountsDoughnutChart').getContext('2d');
    accountsDoughnutChartInstance = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: accountLabels,
            datasets: [{
                data: accountBalances,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',
                    'rgba(16, 185, 129, 0.7)',
                    'rgba(245, 158, 11, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(107, 114, 128, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } }
        }
    });

    // 4. Net Worth Line Chart
    if (netWorthHistory.length > 0) {
        const dates = netWorthHistory.map(entry => entry.date);
        const values = netWorthHistory.map(entry => entry.value);
        const ctx4 = document.getElementById('netWorthChart').getContext('2d');
        netWorthChartInstance = new Chart(ctx4, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Net Worth',
                    data: values,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { callback: value => '₱' + value, color: getComputedStyle(document.body).getPropertyValue('--text-secondary') },
                        grid: { color: 'rgba(0,0,0,0.1)' }
                    },
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
                }
            }
        });
    }
}

// NEW: Render Budget vs Actual Bar Chart
function renderBudgetChart() {
    if (budgetChartInstance) budgetChartInstance.destroy();
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const monthKey = getMonthKey();
    const monthBudgets = budgets[monthKey] || {};
    const categories = Object.keys(monthBudgets);
    if (categories.length === 0) {
        return;
    }
    const spending = getCategorySpending(monthKey);
    const budgetData = categories.map(cat => monthBudgets[cat]);
    const actualData = categories.map(cat => spending[cat] || 0);

    const ctx = canvas.getContext('2d');
    budgetChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                },
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '₱' + value, color: getComputedStyle(document.body).getPropertyValue('--text-secondary') },
                    grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-secondary') } }
            }
        }
    });
}

function renderAll() {
    renderAccounts();
    renderAccountBalances();
    renderSavings();
    renderLoans();
    renderBills();
    renderSummary();
    renderTransactionList();
    renderTransactionPreview();
    renderBudgets();
    recordNetWorthSnapshot();
    updateBillBadge(); // NEW

    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
    if (document.getElementById('tab-budget').classList.contains('active')) {
        renderBudgetChart();
    }
}

// ---------- Bill Reminders & Badge (NEW) ----------
function getUpcomingBills(days = 3) {
    const today = new Date();
    const future = new Date(today);
    future.setDate(today.getDate() + days);
    return bills.filter(bill => {
        if (bill.paid) return false;
        const due = new Date(bill.dueDate + 'T00:00:00');
        return due >= today && due <= future;
    });
}

function updateBillBadge() {
    const upcoming = getUpcomingBills();
    const badge = document.getElementById('more-badge');
    if (badge) {
        if (upcoming.length > 0) {
            badge.textContent = upcoming.length;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }
    }
    // Show toast/notification if enabled and there are upcoming bills
    if (notificationsEnabled && upcoming.length > 0) {
        const message = `You have ${upcoming.length} bill(s) due within 3 days.`;
        showToast(message, 'info');
        // Also use Notification API if permission granted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('MyBudget Bill Reminder', { body: message });
        }
    }
}
function checkForDateChange() {
    const now = new Date();
    const todayString = now.toDateString();
    if (todayString !== lastKnownDate) {
        // Day or month changed
        lastKnownDate = todayString;
        // Re-render everything to reflect new month/day
        renderAll();
        // Also update bill reminders (badge, notifications)
        updateBillBadge();
        // If charts tab is active, refresh charts
        if (document.getElementById('tab-charts').classList.contains('active')) {
            renderCharts();
        }
        if (document.getElementById('tab-budget').classList.contains('active')) {
            renderBudgetChart();
        }
        console.log('Date changed, refreshed app at', now.toLocaleString());
    }
}
// ---------- Modal Functions ----------
function openTransactionModal() {
    document.getElementById('transaction-modal').classList.add('open');
    document.getElementById('modal-description').focus();
    // Reset type to expense
    document.getElementById('modal-type').value = 'expense';
    toggleTransferFields();
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.remove('open');
    document.getElementById('transaction-form').reset();
}

// NEW: Toggle transfer fields based on type
function toggleTransferFields() {
    const type = document.getElementById('modal-type').value;
    const transferFields = document.getElementById('transfer-fields');
    const regularAccount = document.getElementById('modal-account');
    if (type === 'transfer') {
        transferFields.style.display = 'block';
        regularAccount.style.display = 'none';
    } else {
        transferFields.style.display = 'none';
        regularAccount.style.display = 'block';
    }
}

// ---------- Settings UI Generation ----------
const PALETTES = [
    { id: 'default', name: 'Default', swatch: '#3b82f6' },
    { id: 'rose', name: 'Rose', swatch: '#ec4899' },
    { id: 'lavender', name: 'Lavender', swatch: '#8b5cf6' },
    { id: 'ocean', name: 'Ocean', swatch: '#0ea5e9' },
    { id: 'forest', name: 'Forest', swatch: '#10b981' },
    { id: 'sunset', name: 'Sunset', swatch: '#f97316' },
    { id: 'cherry', name: 'Cherry', swatch: '#e11d48' },
    { id: 'slate', name: 'Slate', swatch: '#64748b' }
];

function generatePaletteButtons() {
    const container = document.getElementById('palette-grid');
    if (!container) return;
    container.innerHTML = '';
    PALETTES.forEach(palette => {
        const btn = document.createElement('button');
        btn.className = 'palette-btn';
        btn.dataset.palette = palette.id;
        btn.innerHTML = `
            <span class="palette-swatch" style="background: ${palette.swatch};"></span>
            ${palette.name}
        `;
        btn.addEventListener('click', () => setPalette(palette.id));
        container.appendChild(btn);
    });
}

// ---------- Event Listeners ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    saveTheme();
    applyTheme();
});

document.querySelectorAll('.theme-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setThemeStyle(btn.dataset.themeStyle);
    });
});

document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.dataset.tab;
        switchTab(tabId, tabId);
    });
});

document.getElementById('fab-add-transaction').addEventListener('click', openTransactionModal);
document.getElementById('open-modal-btn').addEventListener('click', openTransactionModal);
document.getElementById('close-modal').addEventListener('click', closeTransactionModal);
document.getElementById('transaction-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('transaction-modal')) closeTransactionModal();
});

document.getElementById('transaction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('modal-description').value.trim();
    const amount = parseFloat(document.getElementById('modal-amount').value);
    const type = document.getElementById('modal-type').value;
    const category = document.getElementById('modal-category').value;
    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }
    if (type === 'transfer') {
        const fromAccountId = document.getElementById('transfer-from-account').value;
        const toAccountId = document.getElementById('transfer-to-account').value;
        if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
            alert('Please select different accounts for transfer.');
            return;
        }
        addTransaction(desc, amount, type, 'Transfer', fromAccountId, toAccountId);
    } else {
        const accountId = document.getElementById('modal-account').value;
        addTransaction(desc, amount, type, category, accountId);
    }
    closeTransactionModal();
});

// NEW: Toggle transfer fields on type change
document.getElementById('modal-type').addEventListener('change', toggleTransferFields);

document.querySelectorAll('.more-item').forEach(item => {
    item.addEventListener('click', () => {
        const target = item.dataset.tabTarget;
        switchTab(target, 'more');
    });
});

document.getElementById('view-all-transactions').addEventListener('click', () => {
    switchTab('transactions');
});

document.getElementById('search-transactions').addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderTransactionList();
});

document.getElementById('add-account-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('new-account-name');
    const name = nameInput.value.trim();
    if (name) {
        addAccount(name);
        nameInput.value = '';
    }
});

document.getElementById('add-savings-btn').addEventListener('click', () => {
    const name = document.getElementById('savings-name').value.trim();
    const target = parseFloat(document.getElementById('savings-target').value);
    const current = parseFloat(document.getElementById('savings-current').value) || 0;
    const accountId = document.getElementById('savings-account').value;
    if (name && !isNaN(target) && target > 0 && accountId) {
        addSavingsGoal(name, target, current, accountId);
        document.getElementById('savings-name').value = '';
        document.getElementById('savings-target').value = '';
        document.getElementById('savings-current').value = '';
    } else {
        alert('Please enter a valid goal name, target amount, and select an account.');
    }
});

document.getElementById('add-loan-btn').addEventListener('click', () => {
    const name = document.getElementById('loan-name').value.trim();
    const amount = parseFloat(document.getElementById('loan-amount').value);
    const type = document.getElementById('loan-type').value;
    if (name && !isNaN(amount) && amount > 0) {
        addLoan(name, amount, type);
        document.getElementById('loan-name').value = '';
        document.getElementById('loan-amount').value = '';
    } else {
        alert('Please enter a valid loan description and amount.');
    }
});

document.getElementById('add-bill-btn').addEventListener('click', () => {
    const name = document.getElementById('bill-name').value.trim();
    const amount = parseFloat(document.getElementById('bill-amount').value);
    const dueDate = document.getElementById('bill-due-date').value;
    if (name && !isNaN(amount) && amount > 0 && dueDate) {
        addBill(name, amount, dueDate);
        document.getElementById('bill-name').value = '';
        document.getElementById('bill-amount').value = '';
        document.getElementById('bill-due-date').value = '';
    } else {
        alert('Please fill in all bill fields correctly.');
    }
});

document.getElementById('set-budget-btn').addEventListener('click', () => {
    const category = document.getElementById('budget-category').value;
    const limit = parseFloat(document.getElementById('budget-amount').value);
    if (isNaN(limit) || limit <= 0) {
        alert('Please enter a valid budget amount');
        return;
    }
    setBudget(category, limit);
    document.getElementById('budget-amount').value = '';
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTransactionList();
    });
});

// NEW: Settings event listeners
document.getElementById('transparency-slider').addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    document.getElementById('transparency-value').textContent = val.toFixed(2);
    setTransparency(val);
});

document.getElementById('font-size-select').addEventListener('change', (e) => {
    setFontSize(e.target.value);
});

document.getElementById('density-select').addEventListener('change', (e) => {
    setDensity(e.target.value);
});

document.getElementById('enable-notifications-btn').addEventListener('click', async () => {
    if (!('Notification' in window)) {
        alert('This browser does not support notifications.');
        return;
    }
    if (Notification.permission === 'granted') {
        notificationsEnabled = !notificationsEnabled; // toggle
        saveNotifications();
        applyTheme();
        if (notificationsEnabled) {
            showToast('Notifications enabled', 'success');
        } else {
            showToast('Notifications disabled', 'info');
        }
    } else {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
            notificationsEnabled = true;
            saveNotifications();
            applyTheme();
            showToast('Notifications enabled', 'success');
        } else {
            alert('Permission denied.');
        }
    }
});

// ---------- Initialize ----------
function initialize() {
    generatePaletteButtons();
    // Ensure existing savings have createdAt and initialAmount if missing
    savings.forEach(s => {
        if (!s.createdAt) {
            s.createdAt = new Date().toISOString();
        }
        if (s.initialAmount === undefined) {
            s.initialAmount = s.current || 0;
        }
    });
    saveSavings();
    applyTheme();
    renderAll();
    setInterval(checkForDateChange, 60 * 1000);
    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
    if (document.getElementById('tab-budget').classList.contains('active')) {
        renderBudgetChart();
    }
    // Check bill reminders on load
    updateBillBadge();
}

initialize();