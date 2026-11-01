// ---------- Safe Data Loader ----------
function safeParse(key, fallback) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : fallback;
    } catch (e) {
        console.error("Corrupted data for", key, e);
        return fallback;
    }
}

// ---------- Data Structures ----------
let accounts = safeParse('mb_accounts', [
    { id: 'acc1', name: 'GCash', balance: 0 },
    { id: 'acc2', name: 'Maribank', balance: 0 },
    { id: 'acc3', name: 'Cash', balance: 0 }
]);
let transactions = safeParse('mb_transactions', []);
let budgets = safeParse('mb_budgets', {});
let savings = safeParse('mb_savings', []);
let loans = safeParse('mb_loans', []);
let bills = safeParse('mb_bills', []);
let netWorthHistory = safeParse('mb_networth_history', []);
let appPin = localStorage.getItem('mb_pin') || null;
let recurringTx = safeParse('mb_recurring', []);
let customCategories = safeParse('mb_custom_categories', []);

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Salary', 'Other Income', 'Other'];
function getAllCategories() {
    return [...DEFAULT_CATEGORIES, ...customCategories];
}
function saveCustomCategories() { localStorage.setItem('mb_custom_categories', JSON.stringify(customCategories)); }
let advFilters = { start: '', end: '', category: 'all', account: 'all' };

function saveRecurring() { localStorage.setItem('mb_recurring', JSON.stringify(recurringTx)); }

let currentFilter = 'all';
let searchQuery = '';
let isDarkMode = localStorage.getItem('mb_theme') === 'dark';
let transparency = parseFloat(localStorage.getItem('mb_transparency')) || 0.65;
let currentPalette = localStorage.getItem('mb_palette') || 'default';
let fontSize = localStorage.getItem('mb_font_size') || 'medium';
let density = localStorage.getItem('mb_density') || 'comfortable';
let notificationsEnabled = localStorage.getItem('mb_notifications') === 'true';
let lastKnownDate = new Date().toDateString();

let activeTab = 'home';
let currentFormType = null;

let incomeExpenseChartInstance = null;
let categoryPieChartInstance = null;
let netWorthChartInstance = null;
let accountsDoughnutChartInstance = null;
let budgetChartInstance = null;
let dailyIncomeExpenseChartInstance = null;

// ---------- Save Functions ----------
function saveAccounts() { localStorage.setItem('mb_accounts', JSON.stringify(accounts)); }
function saveTransactions() { localStorage.setItem('mb_transactions', JSON.stringify(transactions)); }
function saveBudgets() { localStorage.setItem('mb_budgets', JSON.stringify(budgets)); }
function saveSavings() { localStorage.setItem('mb_savings', JSON.stringify(savings)); }
function saveLoans() { localStorage.setItem('mb_loans', JSON.stringify(loans)); }
function saveBills() { localStorage.setItem('mb_bills', JSON.stringify(bills)); }
function saveNetWorthHistory() { localStorage.setItem('mb_networth_history', JSON.stringify(netWorthHistory)); }
function saveTheme() { localStorage.setItem('mb_theme', isDarkMode ? 'dark' : 'light'); }
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

// ---------- Account Logos ----------
function getAccountLogo(name, size = 36) {
    const n = (name || '').toLowerCase();
    
    if (n.includes('gcash')) {
        return `<svg class="account-logo" style="width:${size}px; height:${size}px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#007DFE"/><path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 5.2-3H12v-2h6.9A6.1 6.1 0 0 0 12 6z" fill="white"/></svg>`;
    }
    
    if (n.includes('maribank')) {
        return `<svg class="account-logo" style="width:${size}px; height:${size}px;" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="12" fill="#0056C6"/><path d="M7 15V9l5 3 5-3v6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }
    
    if (n.includes('cash')) {
        return `<svg class="account-logo" style="width:${size}px; height:${size}px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#34C759"/><path d="M12 6v12M15 9H10.5a2.5 2.5 0 0 0 0 5h3a2.5 2.5 0 0 1 0 5H9" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`;
    }
    
    return `<svg class="account-logo" style="width:${size}px; height:${size}px;" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="12" fill="#8E8E93"/><path d="M4 8h16v10H4z" stroke="white" stroke-width="2" stroke-linejoin="round"/><path d="M4 12h16" stroke="white" stroke-width="2"/></svg>`;
}

function getChartColors() {
    const isDark = document.body.classList.contains('dark-theme');
    return {
        income:  isDark ? '#30D158' : '#34C759',
        expense: isDark ? '#FF453A' : '#FF3B30',
        accent:  isDark ? '#0A84FF' : '#007AFF',
        purple:  isDark ? '#BF5AF2' : '#AF52DE',
        orange:  isDark ? '#FF9F0A' : '#FF9500',
        teal:    isDark ? '#40C8E0' : '#30B0C7',
        pink:    isDark ? '#FF375F' : '#FF2D55',
        gray:    isDark ? '#98989D' : '#8E8E93',
        label:        isDark ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)',
        labelPrimary: isDark ? '#FFFFFF' : '#000000',
        grid:         isDark ? 'rgba(84, 84, 88, 0.5)' : 'rgba(60, 60, 67, 0.29)',
        cellBg:       isDark ? '#1C1C1E' : '#FFFFFF'
    };
}

function withAlpha(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function getDayKeyFromDate(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function safeFormatDate(dateString) {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

function getMonthKeyFromTransaction(t) {
    if (!t || !t.date) return null;
    const d = new Date(t.date);
    return isNaN(d.getTime()) ? null : getMonthKeyFromDate(d);
}

// ---------- Toast Notifications ----------
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
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>`;
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').innerHTML = `
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>`;
    }

    document.body.setAttribute('data-palette', currentPalette);
    document.querySelectorAll('.palette-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.palette === currentPalette);
    });

    document.body.setAttribute('data-font-size', fontSize);
    document.body.setAttribute('data-density', density);

    const fontSelect = document.getElementById('font-size-select');
    if (fontSelect) fontSelect.value = fontSize;
    const densitySelect = document.getElementById('density-select');
    if (densitySelect) densitySelect.value = density;
    const notifBtn = document.getElementById('enable-notifications-btn');
    if (notifBtn) notifBtn.textContent = notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';
    
    const notifStatus = document.getElementById('notification-status');
    if (notifStatus) notifStatus.textContent = notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled';
}

function setPalette(palette) { currentPalette = palette; savePalette(); applyTheme(); }
function setFontSize(size) { if (!['small', 'medium', 'large'].includes(size)) return; fontSize = size; saveFontSize(); applyTheme(); }
function setDensity(densityVal) { if (!['comfortable', 'compact'].includes(densityVal)) return; density = densityVal; saveDensity(); applyTheme(); }

// ---------- Navigation ----------
const tabTitles = {
    home: 'MyBudget', transactions: 'Transactions', charts: 'Charts', more: 'More',
    accounts: 'Accounts', savings: 'Savings', loans: 'Loans', bills: 'Bills', budget: 'Budget', settings: 'Settings'
};
const subPages = ['accounts', 'savings', 'loans', 'bills', 'budget', 'settings'];
const addPages = ['accounts', 'savings', 'loans', 'bills', 'budget'];

function switchTab(tabId, activeNav = tabId) {
    activeTab = tabId;
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.add('active');

    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${activeNav}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    document.getElementById('page-title').textContent = tabTitles[tabId] || 'MyBudget';
    document.getElementById('back-btn').style.display = subPages.includes(tabId) ? 'flex' : 'none';
    document.getElementById('header-add-btn').style.display = addPages.includes(tabId) ? 'flex' : 'none';

    if (tabId === 'charts') setTimeout(() => renderCharts(), 100);
    if (tabId === 'budget') setTimeout(() => renderBudgetChart(), 100);
}

// ---------- Generic Form Modal Logic ----------
function openFormModal(type) {
    currentFormType = type;
    const titleEl = document.getElementById('form-modal-title');
    const fieldsEl = document.getElementById('form-fields');
    const form = document.getElementById('generic-form');
    form.reset();

    if (type === 'account') {
        titleEl.textContent = 'Add Account';
        fieldsEl.innerHTML = `<input type="text" id="gf-name" placeholder="Account Name (e.g. GCash, BPI)" required>`;
    } 
    else if (type === 'savings') {
        titleEl.textContent = 'Add Savings Goal';
        let accountOptions = accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        fieldsEl.innerHTML = `
            <input type="text" id="gf-name" placeholder="Goal name" required>
            <input type="number" id="gf-target" placeholder="Target amount" step="0.01" required>
            <input type="number" id="gf-current" placeholder="Already saved" step="0.01" value="0">
            <select id="gf-account">${accountOptions}</select>
        `;
    } 
    else if (type === 'loan') {
        titleEl.textContent = 'Add Loan';
        fieldsEl.innerHTML = `
            <input type="text" id="gf-name" placeholder="Loan description" required>
            <input type="number" id="gf-amount" placeholder="Amount" step="0.01" required>
            <select id="gf-type">
                <option value="borrowed">I Owe (Borrowed)</option>
                <option value="lent">Owed to Me (Lent)</option>
            </select>
        `;
    } 
    else if (type === 'bill') {
        titleEl.textContent = 'Add Bill';
        fieldsEl.innerHTML = `
            <input type="text" id="gf-name" placeholder="Bill description" required>
            <input type="number" id="gf-amount" placeholder="Amount" step="0.01" required>
            <input type="date" id="gf-due-date" required>
        `;
    } 
    else if (type === 'budget') {
        titleEl.textContent = 'Set Budget';
        const catOptions = getAllCategories().map(c => `<option value="${c}">${c}</option>`).join('');
        fieldsEl.innerHTML = `
            <select id="gf-category">
                ${catOptions}
            </select>
            <input type="number" id="gf-amount" placeholder="Budget limit" step="0.01" required>
        `;
    }

    document.getElementById('form-modal').classList.add('open');
}

function closeFormModal() {
    document.getElementById('form-modal').classList.remove('open');
    currentFormType = null;
}

// ---------- Operations ----------
function addAccount(name) { accounts.push({ id: 'acc' + Date.now(), name, balance: 0 }); saveAccounts(); renderAll(); showToast('Account added', 'success'); }
function deleteAccount(id) { if (accounts.length <= 1) return alert('Cannot delete the last account'); accounts = accounts.filter(acc => acc.id !== id); saveAccounts(); renderAll(); }
function addSavingsGoal(name, target, current, accountId) { savings.push({ id: 'sav' + Date.now(), name, target, current, accountId, createdAt: new Date().toISOString(), initialAmount: current || 0 }); saveSavings(); renderAll(); showToast('Savings goal added', 'success'); }
function updateSavings(id, newCurrent) { const goal = savings.find(s => s.id === id); if (goal) { goal.current = Math.max(0, newCurrent); saveSavings(); renderAll(); } }
function deleteSavingsGoal(id) { savings = savings.filter(s => s.id !== id); saveSavings(); renderAll(); }
function addLoan(name, amount, type) { loans.push({ id: 'loan' + Date.now(), name, amount, type, paid: 0 }); saveLoans(); renderAll(); showToast('Loan added', 'success'); }
function deleteLoan(id) { loans = loans.filter(l => l.id !== id); saveLoans(); renderAll(); }
function updateLoanPaid(id, newPaid) {
    const loan = loans.find(l => l.id === id);
    if (!loan) return;
    const val = parseFloat(newPaid);
    if (isNaN(val)) return;
    loan.paid = Math.max(0, Math.min(loan.amount, val));
    saveLoans();
    renderAll();
}
function addBill(name, amount, dueDate) { bills.push({ id: 'bill' + Date.now(), name, amount, dueDate, paid: false }); saveBills(); renderAll(); showToast('Bill added', 'success'); }
function deleteBill(id) { bills = bills.filter(b => b.id !== id); saveBills(); renderAll(); }
function toggleBillPaid(id) { const bill = bills.find(b => b.id === id); if (bill) { bill.paid = !bill.paid; saveBills(); renderAll(); } }
function setBudget(category, limit) { const monthKey = getMonthKey(); if (!budgets[monthKey]) budgets[monthKey] = {}; budgets[monthKey][category] = limit; saveBudgets(); renderAll(); showToast('Budget set', 'success'); }

function processRecurringTransactions() {
    const today = new Date();
    today.setHours(0,0,0,0);
    let processed = false;

    recurringTx.forEach(rt => {
        const nextDate = new Date(rt.nextDate);
        if (today >= nextDate) {
            const signedAmount = rt.type === 'income' ? Math.abs(rt.amount) : -Math.abs(rt.amount);
            transactions.push({ 
                id: Date.now() + Math.random(), 
                type: rt.type, description: rt.description, 
                amount: signedAmount, category: rt.category, 
                accountId: rt.accountId, date: new Date().toISOString() 
            });
            const account = accounts.find(acc => acc.id === rt.accountId);
            if (account) account.balance += signedAmount;

            nextDate.setMonth(nextDate.getMonth() + 1);
            rt.nextDate = nextDate.toISOString();
            processed = true;
        }
    });

    if (processed) {
        saveTransactions(); saveAccounts(); saveRecurring(); renderAll();
        showToast('Recurring transactions processed.', 'success');
    }
}

function addTransaction(description, amount, type, category, accountId, transferToAccountId = null) {
    if (type === 'transfer') {
        const fromAccount = accounts.find(acc => acc.id === accountId);
        const toAccount = accounts.find(acc => acc.id === transferToAccountId);
        if (!fromAccount || !toAccount || fromAccount.id === toAccount.id) return alert('Invalid transfer accounts.');

        const transferAmount = Math.abs(amount);
        const groupId = 'trf-' + Date.now();

        transactions.push({
            id: Date.now(), transferGroupId: groupId, type: 'transfer',
            description: `Transfer to ${toAccount.name}`, amount: -transferAmount,
            category: 'Transfer', accountId: fromAccount.id, date: new Date().toISOString()
        });
        transactions.push({
            id: Date.now() + 1, transferGroupId: groupId, type: 'transfer',
            description: `Transfer from ${fromAccount.name}`, amount: transferAmount,
            category: 'Transfer', accountId: toAccount.id, date: new Date().toISOString()
        });

        fromAccount.balance -= transferAmount;
        toAccount.balance += transferAmount;

        saveTransactions(); saveAccounts(); renderAll();
        showToast('Transfer completed', 'success');
    } else {
        const signedAmount = type === 'income' ? Math.abs(amount) : -Math.abs(amount);
        transactions.push({ id: Date.now(), type, description, amount: signedAmount, category, accountId, date: new Date().toISOString() });
        const account = accounts.find(acc => acc.id === accountId);
        if (account) account.balance += signedAmount;
        saveTransactions(); saveAccounts(); renderAll();
        showToast('Transaction added', 'success');
        if (type === 'expense') checkBudgetAlerts(category);
    }
}

function deleteTransaction(id) {
    const t = transactions.find(tx => tx.id === id);
    if (!t) return;
    if (t.transferGroupId) {
        transactions.filter(tx => tx.transferGroupId === t.transferGroupId).forEach(tx => {
            const acc = accounts.find(a => a.id === tx.accountId);
            if (acc) acc.balance -= tx.amount;
        });
        transactions = transactions.filter(tx => tx.transferGroupId !== t.transferGroupId);
    } else {
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) acc.balance -= t.amount;
        transactions = transactions.filter(tx => tx.id !== id);
    }
    saveTransactions(); saveAccounts(); renderAll();
}

function getMonthlyIncomeExpense() {
    const monthKey = getMonthKey();
    let income = 0, expense = 0;
    transactions.forEach(t => {
        if (getMonthKeyFromTransaction(t) !== monthKey) return;
        if (t.type === 'income') income += t.amount;
        else if (t.type === 'expense') expense += Math.abs(t.amount);
    });
    return { income, expense };
}

function getCategorySpending(monthKey) {
    const spending = {};
    transactions.forEach(t => {
        if (getMonthKeyFromTransaction(t) !== monthKey || t.type !== 'expense') return;
        spending[t.category || 'Other'] = (spending[t.category || 'Other'] || 0) + Math.abs(t.amount);
    });
    return spending;
}

function checkBudgetAlerts(category) {
    const monthBudgets = budgets[getMonthKey()] || {};
    if (!monthBudgets[category]) return;
    const limit = monthBudgets[category];
    const spent = getCategorySpending(getMonthKey())[category] || 0;
    if (spent >= limit) showToast(`Budget exceeded for ${category}!`, 'warning');
    else if (spent >= 0.8 * limit) showToast(`Approaching budget for ${category}.`, 'warning');
}

function getNetWorth() {
    const accountTotal = accounts.reduce((sum, acc) => sum + acc.balance + getSavingsTotalForAccount(acc.id), 0);
    const lent = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + Math.max(0, l.amount - (l.paid || 0)), 0);
    const borrowed = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + Math.max(0, l.amount - (l.paid || 0)), 0);
    return accountTotal + lent - borrowed;
}

function recordNetWorthSnapshot() {
    const now = new Date();
    const val = getNetWorth();
    const last = netWorthHistory[netWorthHistory.length - 1];
    if (last && now.getTime() - new Date(last.date).getTime() < 60000) {
        last.value = val; saveNetWorthHistory(); return;
    }
    netWorthHistory.push({ date: now.toISOString(), value: val });
    if (netWorthHistory.length > 100) netWorthHistory = netWorthHistory.slice(-100);
    saveNetWorthHistory();
}

// ---------- Render Functions ----------
function renderAccounts() {
    const container = document.getElementById('accounts-list');
    container.innerHTML = '';
    if (!accounts.length) { container.innerHTML = `<div class="empty-state">No accounts yet. Tap + to add.</div>`; return; }
    accounts.forEach(acc => {
        const effBal = acc.balance + getSavingsTotalForAccount(acc.id);
        const savText = getSavingsTotalForAccount(acc.id) > 0 ? ` (Savings: ${formatCurrency(getSavingsTotalForAccount(acc.id))})` : '';
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <div>
                ${getAccountLogo(acc.name, 36)}
                <div style="min-width: 0;">
                    <span class="account-name">${acc.name}</span>
                    ${savText ? `<div class="transaction-meta">${savText}</div>` : ''}
                </div>
            </div>
            <span class="account-balance ${getAmountClass(effBal)}">${formatCurrency(effBal)}</span>
            <button class="delete-btn" onclick="deleteAccount('${acc.id}')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        container.appendChild(div);
    });
    const optHtml = accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
    if(document.getElementById('modal-account')) document.getElementById('modal-account').innerHTML = optHtml;
    if(document.getElementById('transfer-from-account')) document.getElementById('transfer-from-account').innerHTML = optHtml;
    if(document.getElementById('transfer-to-account')) document.getElementById('transfer-to-account').innerHTML = optHtml;
}

function renderAccountBalances() {
    const container = document.getElementById('account-balances-list');
    if (!container) return;
    container.innerHTML = '';
    if (!accounts.length) { container.innerHTML = '<div class="empty-state">No accounts yet.</div>'; return; }
    accounts.forEach(acc => {
        const effBal = acc.balance + getSavingsTotalForAccount(acc.id);
        const div = document.createElement('div');
        div.className = 'account-summary-item';
        div.innerHTML = `
            <div>
                ${getAccountLogo(acc.name, 28)}
                <span class="account-summary-name">${acc.name}</span>
            </div>
            <span class="account-summary-balance ${getAmountClass(effBal)}">${formatCurrency(effBal)}</span>
        `;
        container.appendChild(div);
    });
}

function renderSavings() {
    const container = document.getElementById('savings-list');
    container.innerHTML = '';
    if (!savings.length) { container.innerHTML = `<div class="empty-state">No savings goals yet. Tap + to add.</div>`; return; }
    savings.forEach(goal => {
        const pct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
        const acc = accounts.find(a => a.id === goal.accountId);
        let proj = '';
        if (goal.createdAt && goal.target > goal.current) {
            const months = Math.max(1, (new Date() - new Date(goal.createdAt)) / (1000 * 60 * 60 * 24 * 30));
            const rate = (goal.current - goal.initialAmount) / months;
            if (rate > 0) proj = `<div class="transaction-meta">Projection: ~${Math.ceil((goal.target - goal.current) / rate)} months</div>`;
        }
        const div = document.createElement('div');
        div.className = 'savings-item';
        div.innerHTML = `
            <div style="flex:1;">
                <div class="savings-name">${goal.name} <small>(${acc ? acc.name : 'Unknown'})</small></div>
                <div class="savings-progress"><span class="positive">${formatCurrency(goal.current)}</span> / ${formatCurrency(goal.target)}</div>
                <div class="progress-bar"><div class="progress-fill ${pct >= 100 ? 'over' : ''}" style="width: ${pct}%"></div></div>
                ${proj}
            </div>
            <input type="number" class="savings-update" value="${goal.current}" step="0.01" onchange="updateSavings('${goal.id}', parseFloat(this.value))">
            <button class="delete-btn" onclick="deleteSavingsGoal('${goal.id}')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        container.appendChild(div);
    });
}

function renderCustomCategories() {
    const list = document.getElementById('custom-categories-list');
    if (!list) return;
    list.innerHTML = customCategories.map(c => `
        <span style="background: var(--fill-3); padding: 4px 10px; border-radius: 12px; font-size: 13px; display:flex; align-items:center; gap:6px;">
            ${c} <button onclick="deleteCategory('${c}')" style="background:none; border:none; color:var(--expense-color); font-weight:bold; cursor:pointer;">&times;</button>
        </span>
    `).join('');
}

function deleteCategory(cat) {
    customCategories = customCategories.filter(c => c !== cat);
    saveCustomCategories();
    renderCustomCategories();
    showToast('Category removed', 'success');
}

function calculateDebtPayoff() {
    const extra = parseFloat(document.getElementById('extra-payment-input').value) || 0;
    const activeLoans = loans.filter(l => l.type === 'borrowed' && (l.amount - (l.paid || 0)) > 0);
    
    if (!activeLoans.length) {
        document.getElementById('debt-result').textContent = "You have no active debts! 🎉";
        return;
    }

    // Sort by remaining balance (Snowball method)
    activeLoans.sort((a, b) => (a.amount - (a.paid||0)) - (b.amount - (b.paid||0)));
    
    let totalDebt = activeLoans.reduce((sum, l) => sum + (l.amount - (l.paid||0)), 0);
    let months = 0;
    let simulatedBalance = totalDebt;

    // Assume a minimum payment of 1000/mo per loan + extra (Simplified)
    const monthlyPayment = (activeLoans.length * 1000) + extra;

    while (simulatedBalance > 0 && months < 600) {
        simulatedBalance -= monthlyPayment;
        months++;
    }

    if (months >= 600) {
        document.getElementById('debt-result').textContent = "Payment is too low to ever pay off the debt.";
        document.getElementById('debt-result').style.color = "var(--expense-color)";
    } else {
        document.getElementById('debt-result').innerHTML = `You will be debt-free in <span style="font-size:20px;">${months} months</span>!`;
        document.getElementById('debt-result').style.color = "var(--income-color)";
    }
}

function renderLoans() {
    const container = document.getElementById('loans-list');
    container.innerHTML = '';
    if (!loans.length) { container.innerHTML = `<div class="empty-state">No loans recorded. Tap + to add.</div>`; return; }
    loans.forEach(loan => {
        const lbl = loan.type === 'borrowed' ? 'I Owe' : 'Owed to Me';
        const paid = loan.paid || 0;
        const remaining = Math.max(0, loan.amount - paid);
        const pct = loan.amount > 0 ? Math.min(100, (paid / loan.amount) * 100) : 0;
        const isComplete = loan.amount > 0 && paid >= loan.amount;
        const div = document.createElement('div');
        div.className = 'loan-item';
        div.innerHTML = `
            <div style="flex:1;">
                <div class="loan-name">${loan.name} <small>(${lbl})</small></div>
                <div class="savings-progress"><span class="positive">${formatCurrency(paid)}</span> / ${formatCurrency(loan.amount)} ${isComplete ? '✓ Settled' : 'paid'}</div>
                <div class="progress-bar"><div class="progress-fill" style="width: ${pct}%; ${isComplete ? 'background: var(--income-color);' : ''}"></div></div>
                <div class="transaction-meta">Remaining: ${formatCurrency(remaining)}</div>
            </div>
            <input type="number" class="savings-update" value="${paid}" step="0.01" min="0" max="${loan.amount}" onchange="updateLoanPaid('${loan.id}', parseFloat(this.value))">
            <button class="delete-btn" onclick="deleteLoan('${loan.id}')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        container.appendChild(div);
    });
}

function renderBills() {
    const container = document.getElementById('bills-list');
    container.innerHTML = '';
    if (!bills.length) { container.innerHTML = `<div class="empty-state">No upcoming bills. Tap + to add.</div>`; return; }
    [...bills].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)).forEach(bill => {
        const due = new Date(bill.dueDate + 'T00:00:00');
        const isPast = due < new Date() && !bill.paid;
        const div = document.createElement('div');
        div.className = 'bill-item';
        div.innerHTML = `
            <div style="flex:1;">
                <div class="bill-name">${bill.name} ${isPast ? '<span class="dot over"></span>' : ''}</div>
                <div class="bill-due">Due: ${due.toLocaleDateString()}</div>
            </div>
            <span class="bill-amount negative">-${formatCurrency(bill.amount)}</span>
            <button class="paid-btn" onclick="toggleBillPaid('${bill.id}')">
                ${bill.paid ? '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>' : '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>'}
            </button>
            <button class="delete-btn" onclick="deleteBill('${bill.id}')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        container.appendChild(div);
    });
}

function renderSummary() {
    const totalBal = accounts.reduce((sum, acc) => sum + acc.balance + getSavingsTotalForAccount(acc.id), 0);
    const { income, expense } = getMonthlyIncomeExpense();
    document.getElementById('balance').innerHTML = formatCurrencyWithColor(totalBal);
    document.getElementById('total-income').innerHTML = formatCurrencyWithColor(income);
    document.getElementById('total-expense').innerHTML = formatCurrencyWithColor(-expense);
    const nw = getNetWorth();
    document.getElementById('net-worth').innerHTML = formatCurrencyWithColor(nw);
    const lent = loans.filter(l => l.type === 'lent').reduce((s, l) => s + Math.max(0, l.amount - (l.paid || 0)), 0);
    const borrowed = loans.filter(l => l.type === 'borrowed').reduce((s, l) => s + Math.max(0, l.amount - (l.paid || 0)), 0);
    document.getElementById('net-worth-breakdown').textContent = `Accounts: ${formatCurrency(totalBal)} + Lent: ${formatCurrency(lent)} - Borrowed: ${formatCurrency(borrowed)}`;
}

function renderTransactionList() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    const filtered = transactions.filter(t => {
        const matchF = currentFilter === 'all' || (currentFilter === 'income' && t.type === 'income') || (currentFilter === 'expense' && t.type === 'expense');
        const q = searchQuery.toLowerCase();
        const matchS = t.description.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q));
        
        let matchAdv = true;
        if (advFilters.start && t.date.slice(0,10) < advFilters.start) matchAdv = false;
        if (advFilters.end && t.date.slice(0,10) > advFilters.end) matchAdv = false;
        if (advFilters.category !== 'all' && t.category !== advFilters.category) matchAdv = false;
        if (advFilters.account !== 'all' && t.accountId !== advFilters.account) matchAdv = false;

        return matchF && matchS && matchAdv;
    });
    if (!filtered.length) { list.innerHTML = `<li><div class="empty-state">No transactions found.</div></li>`; return; }
    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = t.type;
        const acc = accounts.find(a => a.id === t.accountId);
        const accName = acc ? acc.name : 'Unknown';
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">
                    ${t.category} • 
                    <span class="logo-wrap">${getAccountLogo(accName, 14)} ${accName}</span> • 
                    ${safeFormatDate(t.date)}
                </div>
            </div>
            <span class="transaction-amount ${getAmountClass(t.amount)}">${formatCurrencyWithColor(t.amount)}</span>
            <button class="delete-btn" onclick="deleteTransaction(${t.id})"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        list.appendChild(li);
    });
}

function renderTransactionPreview() {
    const list = document.getElementById('transaction-list-preview');
    list.innerHTML = '';
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    if (!recent.length) { list.innerHTML = `<li><div class="empty-state">No transactions yet.</div></li>`; return; }
    recent.forEach(t => {
        const li = document.createElement('li');
        li.className = t.type;
        const acc = accounts.find(a => a.id === t.accountId);
        const accName = acc ? acc.name : 'Unknown';
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">
                    ${t.category} • 
                    <span class="logo-wrap">${getAccountLogo(accName, 14)} ${accName}</span> • 
                    ${safeFormatDate(t.date)}
                </div>
            </div>
            <span class="transaction-amount ${getAmountClass(t.amount)}">${formatCurrencyWithColor(t.amount)}</span>
        `;
        list.appendChild(li);
    });
}

function renderBudgets() {
    const mk = getMonthKey();
    const spend = getCategorySpending(mk);
    const container = document.getElementById('budget-progress');
    container.innerHTML = '';
    const b = budgets[mk] || {};
    if (!Object.keys(b).length) { container.innerHTML = `<div class="empty-state">No budgets set for this month. Tap + to add.</div>`; return; }
    Object.keys(b).forEach(cat => {
        const lim = b[cat], sp = spend[cat] || 0, pct = lim > 0 ? (sp / lim) * 100 : 0;
        const over = pct >= 100, warn = pct >= 80 && pct < 100;
        const div = document.createElement('div');
        div.className = 'budget-item';
        div.innerHTML = `
            <div class="budget-header">
                <span>${cat} ${over ? '<span class="dot over"></span>' : warn ? '<span class="dot warning"></span>' : ''}</span>
                <span>${formatCurrency(sp)} / ${formatCurrency(lim)} (${Math.round(pct)}%)</span>
            </div>
            <div class="progress-bar"><div class="progress-fill ${over ? 'over' : warn ? 'warning' : ''}" style="width: ${Math.min(100, pct)}%"></div></div>
        `;
        container.appendChild(div);
    });
}

// ---------- Charts ----------
function renderCharts() {
    if (dailyIncomeExpenseChartInstance) dailyIncomeExpenseChartInstance.destroy();
    if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();
    if (categoryPieChartInstance) categoryPieChartInstance.destroy();
    if (netWorthChartInstance) netWorthChartInstance.destroy();
    if (accountsDoughnutChartInstance) accountsDoughnutChartInstance.destroy();

    const c = getChartColors();
    const months = [], incData = [], expData = [];
    const today = new Date();

    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const mk = getMonthKeyFromDate(d);
        months.push(d.toLocaleString('default', { month: 'short', year: '2-digit' }));
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            if (t.date.slice(0, 7) === mk) {
                if (t.amount > 0) inc += t.amount; else exp += Math.abs(t.amount);
            }
        });
        incData.push(inc); expData.push(exp);
    }

    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChartInstance = new Chart(ctx1, {
        type: 'bar',
        data: { labels: months, datasets: [
            { label: 'Income', data: incData, backgroundColor: withAlpha(c.income, 0.7), borderColor: c.income, borderWidth: 1, borderRadius: 6 },
            { label: 'Expense', data: expData, backgroundColor: withAlpha(c.expense, 0.7), borderColor: c.expense, borderWidth: 1, borderRadius: 6 }
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: c.labelPrimary } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₱' + v, color: c.label }, grid: { color: c.grid } }, x: { ticks: { color: c.label }, grid: { display: false } } } }
    });

    const days = [], dInc = [], dExp = [];
    const td = new Date();
    for (let i = 6; i >= 0; i--) {
        const d = new Date(td); d.setDate(td.getDate() - i);
        days.push(d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
        let inc = 0, exp = 0;
        transactions.forEach(t => {
            if (t.date.slice(0, 10) === getDayKeyFromDate(d)) { if (t.amount > 0) inc += t.amount; else exp += Math.abs(t.amount); }
        });
        dInc.push(inc); dExp.push(exp);
    }

    const ctxD = document.getElementById('dailyIncomeExpenseChart').getContext('2d');
    dailyIncomeExpenseChartInstance = new Chart(ctxD, {
        type: 'bar',
        data: { labels: days, datasets: [
            { label: 'Income', data: dInc, backgroundColor: withAlpha(c.income, 0.7), borderColor: c.income, borderWidth: 1, borderRadius: 6 },
            { label: 'Expense', data: dExp, backgroundColor: withAlpha(c.expense, 0.7), borderColor: c.expense, borderWidth: 1, borderRadius: 6 }
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: c.labelPrimary } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₱' + v, color: c.label }, grid: { color: c.grid } }, x: { ticks: { color: c.label }, grid: { display: false } } } }
    });

    const catSp = getCategorySpending(getMonthKey());
    const ctx2 = document.getElementById('categoryPieChart').getContext('2d');
    categoryPieChartInstance = new Chart(ctx2, {
        type: 'doughnut',
        data: { labels: Object.keys(catSp), datasets: [{ data: Object.values(catSp), backgroundColor: [withAlpha(c.expense, .75), withAlpha(c.accent, .75), withAlpha(c.income, .75), withAlpha(c.orange, .75), withAlpha(c.purple, .75), withAlpha(c.pink, .75), withAlpha(c.gray, .75)], borderColor: c.cellBg, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: c.labelPrimary } } } }
    });

    const ctx3 = document.getElementById('accountsDoughnutChart').getContext('2d');
    accountsDoughnutChartInstance = new Chart(ctx3, {
        type: 'doughnut',
        data: { labels: accounts.map(a => a.name), datasets: [{ data: accounts.map(a => a.balance + getSavingsTotalForAccount(a.id)), backgroundColor: [withAlpha(c.accent, .75), withAlpha(c.income, .75), withAlpha(c.orange, .75), withAlpha(c.purple, .75), withAlpha(c.pink, .75), withAlpha(c.teal, .75)], borderColor: c.cellBg, borderWidth: 2 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: c.labelPrimary } } } }
    });

    if (netWorthHistory.length > 0) {
        const ctx4 = document.getElementById('netWorthChart').getContext('2d');
        netWorthChartInstance = new Chart(ctx4, {
            type: 'line',
            data: { labels: netWorthHistory.map(e => new Date(e.date).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })), datasets: [{ label: 'Net Worth', data: netWorthHistory.map(e => e.value), borderColor: c.accent, backgroundColor: withAlpha(c.accent, 0.15), fill: true, tension: 0.3, pointRadius: 3, pointBackgroundColor: c.accent }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: c.labelPrimary } } }, scales: { y: { beginAtZero: false, ticks: { callback: v => '₱' + v, color: c.label }, grid: { color: c.grid } }, x: { ticks: { color: c.label, maxRotation: 45, autoSkip: true, maxTicksLimit: 10 }, grid: { display: false } } } }
        });
    }
}

function renderBudgetChart() {
    if (budgetChartInstance) budgetChartInstance.destroy();
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const b = budgets[getMonthKey()] || {};
    if (!Object.keys(b).length) return;
    const sp = getCategorySpending(getMonthKey());
    const c = getChartColors();
    budgetChartInstance = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: { labels: Object.keys(b), datasets: [
            { label: 'Budget', data: Object.values(b), backgroundColor: withAlpha(c.accent, 0.7), borderColor: c.accent, borderWidth: 1, borderRadius: 6 },
            { label: 'Actual', data: Object.keys(b).map(k => sp[k] || 0), backgroundColor: withAlpha(c.expense, 0.7), borderColor: c.expense, borderWidth: 1, borderRadius: 6 }
        ]},
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: c.labelPrimary } } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '₱' + v, color: c.label }, grid: { color: c.grid } }, x: { ticks: { color: c.label }, grid: { display: false } } } }
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
    updateBillBadge();
    if (document.getElementById('tab-charts').classList.contains('active')) renderCharts();
    if (document.getElementById('tab-budget').classList.contains('active')) renderBudgetChart();
}

function updateBillBadge() {
    const today = new Date(), future = new Date(today);
    future.setDate(today.getDate() + 3);
    const upcoming = bills.filter(b => !b.paid && new Date(b.dueDate + 'T00:00:00') >= today && new Date(b.dueDate + 'T00:00:00') <= future);
    const badge = document.getElementById('more-badge');
    if (badge) {
        if (upcoming.length > 0) {
            badge.textContent = upcoming.length;
            badge.style.display = 'flex';
            if (notificationsEnabled && Notification.permission === 'granted') {
                new Notification('MyBudget Reminder', { body: `You have ${upcoming.length} bill(s) due within 3 days.` });
            }
        } else {
            badge.style.display = 'none';
        }
    }
}

// ---------- Backup & Restore ----------
function backupData() {
    const data = { accounts, transactions, budgets, savings, loans, bills, netWorthHistory, settings: { isDarkMode, transparency, currentPalette, fontSize, density, notificationsEnabled } };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `mybudget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Backup downloaded!', 'success');
}

function exportCSV() {
    if (!transactions.length) return showToast('No transactions to export.', 'warning');
    
    const headers = ['Date', 'Description', 'Type', 'Category', 'Amount', 'Account'];
    const rows = transactions.map(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        return [
            new Date(t.date).toLocaleDateString(),
            `"${t.description.replace(/"/g, '""')}"`,
            t.type,
            t.category,
            t.amount,
            `"${acc ? acc.name : 'Unknown'}"`
        ].join(',');
    });
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mybudget-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('CSV exported successfully!', 'success');
}

function clearAllData() {
    const confirm1 = confirm("Are you sure you want to delete ALL data? This cannot be undone.");
    if (confirm1) {
        const confirm2 = confirm("FINAL WARNING: This will permanently delete all your accounts, transactions, and settings. Are you absolutely sure?");
        if (confirm2) {
            localStorage.clear();
            location.reload();
        }
    }
}

function restoreData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!data.accounts || !data.transactions || !confirm('Overwrite current data?')) return;
            accounts = data.accounts; transactions = data.transactions;
            budgets = data.budgets || {}; savings = data.savings; loans = data.loans;
            bills = data.bills; netWorthHistory = data.netWorthHistory || [];
            if (data.settings) {
                isDarkMode = data.settings.isDarkMode || false;
                transparency = data.settings.transparency || 0.65;
                currentPalette = data.settings.currentPalette || 'default';
                fontSize = data.settings.fontSize || 'medium';
                density = data.settings.density || 'comfortable';
                notificationsEnabled = data.settings.notificationsEnabled || false;
            }
            saveAccounts(); saveTransactions(); saveBudgets(); saveSavings(); saveLoans(); saveBills(); saveNetWorthHistory();
            saveTheme(); saveTransparency(); savePalette(); saveFontSize(); saveDensity(); saveNotifications();
            applyTheme(); renderAll();
            showToast('Data restored!', 'success');
        } catch (err) { alert('Error restoring: ' + err.message); }
    };
    reader.readAsText(file);
}

// ---------- Modal Handlers ----------
function openTransactionModal() {
    document.getElementById('transaction-modal').classList.add('open');
    const descInput = document.getElementById('modal-description');
    descInput.focus();
    document.getElementById('modal-type').value = 'expense';
    toggleTransferFields();

    // Populate dynamic categories
    const catOptions = getAllCategories().map(c => `<option value="${c}">${c}</option>`).join('');
    document.getElementById('modal-category').innerHTML = catOptions;

    // Remove old listener if it exists to avoid duplicates
    descInput.removeEventListener('input', handleAICategorization);
    // Add the new AI listener
    descInput.addEventListener('input', handleAICategorization);

    // SMART ADD Listener
    const smartInput = document.getElementById('smart-add-input');
    smartInput.value = ''; // clear it
    smartInput.onchange = async (e) => {
        const text = e.target.value.trim();
        if (!text) return;
        smartInput.style.opacity = '0.5';
        try {
            const parsed = await parseNaturalLanguage(text, accounts);
            
            if (parsed.amount) document.getElementById('modal-amount').value = parsed.amount;
            if (parsed.description) document.getElementById('modal-description').value = parsed.description;
            if (parsed.type) {
                document.getElementById('modal-type').value = parsed.type;
                toggleTransferFields();
            }
            if (parsed.category) document.getElementById('modal-category').value = parsed.category;
            
            if (parsed.accountName) {
                const acc = accounts.find(a => a.name.toLowerCase() === parsed.accountName.toLowerCase());
                if (acc) document.getElementById('modal-account').value = acc.id;
            }
        } catch (err) {
            console.warn('Smart Add failed:', err);
        } finally {
            smartInput.style.opacity = '1';
        }
    };
}

// The AI Debounce Function
function handleAICategorization(e) {
    const desc = e.target.value.trim();
    if (desc.length < 3) return; // Wait until there are at least 3 characters

    clearTimeout(window._aiTimer);
    window._aiTimer = setTimeout(async () => {
        const catSelect = document.getElementById('modal-category');
        if (!catSelect) return;
        
        try {
            // Optional: You could change the select visually to show loading here
            const aiCategory = await categorizeTransaction(desc);
            if (aiCategory) {
                catSelect.value = aiCategory;
                console.log(`🤖 AI categorized "${desc}" as: ${aiCategory}`);
            }
        } catch (err) {
            console.warn('AI categorization skipped:', err.message);
        }
    }, 800); // Wait 800ms after user stops typing
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.remove('open');
    document.getElementById('transaction-form').reset();
}

function toggleTransferFields() {
    const isTransfer = document.getElementById('modal-type').value === 'transfer';
    document.getElementById('transfer-fields').style.display = isTransfer ? 'block' : 'none';
    document.getElementById('modal-account').style.display = isTransfer ? 'none' : 'block';
}

// ---------- Settings Logic ----------
const PALETTES = [
    { id: 'default',  name: 'Default',  swatch: '#007AFF' },
    { id: 'rose',     name: 'Rose',     swatch: '#FF2D55' },
    { id: 'lavender', name: 'Lavender', swatch: '#AF52DE' },
    { id: 'ocean',    name: 'Ocean',    swatch: '#30B0C7' },
    { id: 'forest',   name: 'Forest',   swatch: '#34C759' },
    { id: 'sunset',   name: 'Sunset',   swatch: '#FF9500' },
    { id: 'cherry',   name: 'Cherry',   swatch: '#FF3B30' },
    { id: 'slate',    name: 'Slate',    swatch: '#8E8E93' }
];

function generatePaletteButtons() {
    const container = document.getElementById('palette-grid');
    if (!container) return;
    container.innerHTML = PALETTES.map(p => `<button class="palette-btn" data-palette="${p.id}"><span class="palette-swatch" style="background: ${p.swatch};"></span>${p.name}</button>`).join('');
    container.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.dataset.palette));
    });
}

// ---------- Event Listeners ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode; saveTheme(); applyTheme();
    if (activeTab === 'charts') setTimeout(renderCharts, 50);
    if (activeTab === 'budget') setTimeout(renderBudgetChart, 50);
});

document.querySelectorAll('.nav-item').forEach(item => { item.addEventListener('click', () => switchTab(item.dataset.tab, item.dataset.tab)); });
document.querySelectorAll('.more-item').forEach(item => { item.addEventListener('click', () => switchTab(item.dataset.tabTarget, 'more')); });
document.getElementById('back-btn').addEventListener('click', () => switchTab('more', 'more'));

document.getElementById('header-add-btn').addEventListener('click', () => {
    if (activeTab === 'transactions') openTransactionModal();
    else if (activeTab === 'accounts') openFormModal('account');
    else if (activeTab === 'savings') openFormModal('savings');
    else if (activeTab === 'loans') openFormModal('loan');
    else if (activeTab === 'bills') openFormModal('bill');
    else if (activeTab === 'budget') openFormModal('budget');
});

document.getElementById('fab-add-transaction').addEventListener('click', openTransactionModal);
document.getElementById('open-modal-btn').addEventListener('click', openTransactionModal);
document.getElementById('close-modal').addEventListener('click', closeTransactionModal);
document.getElementById('modal-type').addEventListener('change', toggleTransferFields);
document.getElementById('transaction-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('transaction-modal')) closeTransactionModal(); });

document.getElementById('transaction-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const desc = document.getElementById('modal-description').value.trim();
    const amount = parseFloat(document.getElementById('modal-amount').value);
    const type = document.getElementById('modal-type').value;
    if (!desc || isNaN(amount) || amount <= 0) return alert('Valid description and amount required.');
    if (type === 'transfer') {
        const from = document.getElementById('transfer-from-account').value;
        const to = document.getElementById('transfer-to-account').value;
        if (from === to) return alert('Accounts must be different.');
        addTransaction(desc, amount, type, 'Transfer', from, to);
    } else {
        const cat = document.getElementById('modal-category').value;
        const accId = document.getElementById('modal-account').value;
        addTransaction(desc, amount, type, cat, accId);

        if (document.getElementById('modal-recurring').checked) {
            const nextM = new Date();
            nextM.setMonth(nextM.getMonth() + 1);
            recurringTx.push({ 
                id: 'rec' + Date.now(), description: desc, amount, type, 
                category: cat, accountId: accId, nextDate: nextM.toISOString() 
            });
            saveRecurring();
            showToast('Recurring transaction saved!', 'success');
        }
    }
    closeTransactionModal();
});

document.getElementById('close-form-modal').addEventListener('click', closeFormModal);
document.getElementById('form-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('form-modal')) closeFormModal(); });
document.getElementById('generic-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentFormType === 'account') addAccount(document.getElementById('gf-name').value.trim());
    else if (currentFormType === 'savings') addSavingsGoal(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-target').value), parseFloat(document.getElementById('gf-current').value) || 0, document.getElementById('gf-account').value);
    else if (currentFormType === 'loan') addLoan(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-amount').value), document.getElementById('gf-type').value);
    else if (currentFormType === 'bill') addBill(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-amount').value), document.getElementById('gf-due-date').value);
    else if (currentFormType === 'budget') setBudget(document.getElementById('gf-category').value, parseFloat(document.getElementById('gf-amount').value));
    closeFormModal();
});

document.getElementById('search-transactions').addEventListener('input', (e) => { searchQuery = e.target.value; renderTransactionList(); });
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentFilter = btn.dataset.filter; renderTransactionList();
    });
});

document.getElementById('font-size-select').addEventListener('change', (e) => setFontSize(e.target.value));
document.getElementById('density-select').addEventListener('change', (e) => setDensity(e.target.value));
document.getElementById('enable-notifications-btn').addEventListener('click', async () => {
    if (!('Notification' in window)) return alert('Notifications unsupported.');
    if (Notification.permission === 'granted') {
        notificationsEnabled = !notificationsEnabled; saveNotifications(); applyTheme();
    } else {
        const perm = await Notification.requestPermission();
        if (perm === 'granted') { notificationsEnabled = true; saveNotifications(); applyTheme(); }
    }
});

document.getElementById('backup-data-btn').addEventListener('click', backupData);
document.getElementById('export-csv-btn').addEventListener('click', exportCSV);
document.getElementById('restore-data-btn').addEventListener('click', () => document.getElementById('restore-file-input').click());
document.getElementById('restore-file-input').addEventListener('change', (e) => { if (e.target.files[0]) restoreData(e.target.files[0]); e.target.value = ''; });
document.getElementById('clear-data-btn').addEventListener('click', clearAllData);

// Custom Categories
document.getElementById('add-category-btn').addEventListener('click', () => {
    const input = document.getElementById('new-category-input');
    const val = input.value.trim();
    if (val && !getAllCategories().includes(val)) {
        customCategories.push(val);
        saveCustomCategories();
        renderCustomCategories();
        input.value = '';
        showToast('Category added', 'success');
    }
});

// Debt Calculator
document.getElementById('calc-debt-btn').addEventListener('click', calculateDebtPayoff);

// Receipt Scanning
document.getElementById('scan-receipt-btn').addEventListener('click', () => document.getElementById('receipt-file-input').click());
document.getElementById('receipt-file-input').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
        const base64String = ev.target.result.split(',')[1];
        const btn = document.getElementById('scan-receipt-btn');
        btn.textContent = '⏳ Scanning...';
        
        try {
            const parsed = await parseReceiptImage(base64String);
            if (parsed.amount) document.getElementById('modal-amount').value = parsed.amount;
            if (parsed.description) document.getElementById('modal-description').value = parsed.description;
            if (parsed.category) document.getElementById('modal-category').value = parsed.category;
            document.getElementById('modal-type').value = 'expense';
            toggleTransferFields();
            showToast('Receipt scanned!', 'success');
        } catch (err) {
            showToast('Failed to read receipt', 'warning');
        } finally {
            btn.textContent = '📸 Scan Receipt';
            e.target.value = '';
        }
    };
    reader.readAsDataURL(file);
});

setInterval(() => { const now = new Date().toDateString(); if (now !== lastKnownDate) { lastKnownDate = now; renderAll(); } }, 60000);

// ---------- Offline/Online Listeners ----------
window.addEventListener('online', () => showToast('You are back online', 'success'));
window.addEventListener('offline', () => showToast('You are offline. App will continue to work.', 'warning'));

// ---------- AI Chat Assistant ----------
// 1. JS does the math for predictions
function calculateCashFlowForecast() {
    const totalBal = accounts.reduce((sum, acc) => sum + acc.balance + getSavingsTotalForAccount(acc.id), 0);
    
    // Get unpaid bills for the rest of this month
    const today = new Date();
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const upcomingBillsTotal = bills
        .filter(b => !b.paid && new Date(b.dueDate) >= today && new Date(b.dueDate) <= endOfMonth)
        .reduce((sum, b) => sum + b.amount, 0);

    // Calculate average daily spending this month
    const { expense } = getMonthlyIncomeExpense();
    const daysPassed = today.getDate();
    const avgDailySpend = daysPassed > 0 ? (expense / daysPassed) : 0;

    // Days left in month
    const daysLeft = endOfMonth.getDate() - today.getDate();
    
    // Projected low point: Balance - Bills - (Daily Spend * Days Left)
    const projectedLow = totalBal - upcomingBillsTotal - (avgDailySpend * daysLeft);
    
    // Safe to spend per day
    const safeToSpendDaily = daysLeft > 0 ? Math.max(0, (totalBal - upcomingBillsTotal) / daysLeft) : 0;

    return {
        projectedLowBalance: projectedLow,
        safeToSpendPerDay: safeToSpendDaily,
        upcomingBillsTotal: upcomingBillsTotal,
        avgDailySpend: avgDailySpend
    };
}

// Format AI text with colors, bold, and line breaks
function formatAIText(text) {
    if (!text) return '';
    let formatted = text;
    
    // Convert Bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong style="color: var(--text-primary); font-weight: 600;">$1</strong>');
    
    // Convert [green]text[/green]
    formatted = formatted.replace(/\[green\](.*?)\[\/green\]/g, '<span style="color: var(--income-color); font-weight: 600;">$1</span>');
    
    // Convert [red]text[/red]
    formatted = formatted.replace(/\[red\](.*?)\[\/red\]/g, '<span style="color: var(--expense-color); font-weight: 600;">$1</span>');
    
    // Convert [blue]text[/blue] (in case the AI uses it)
    formatted = formatted.replace(/\[blue\](.*?)\[\/blue\]/g, '<span style="color: var(--accent); font-weight: 600;">$1</span>');
    
    // Convert Line Breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
}

// 2. Feed the math to the AI Chat
function generateFinancialContext() {
    const totalBal = accounts.reduce((sum, acc) => sum + acc.balance + getSavingsTotalForAccount(acc.id), 0);
    const { income, expense } = getMonthlyIncomeExpense();
    const spending = getCategorySpending(getMonthKey());
    
    return {
        totalBalance: totalBal,
        netWorth: getNetWorth(),
        monthlyIncome: income,
        monthlyExpense: expense,
        spendingByCategory: spending,
        activeBills: bills.filter(b => !b.paid).map(b => ({ name: b.name, amount: b.amount })),
        // ADD THE PREDICTIONS HERE
        forecast: calculateCashFlowForecast() 
    };
}

function setupChat() {
    const chatModal = document.getElementById('chat-modal');
    const chatInput = document.getElementById('chat-input');
    const chatMessages = document.getElementById('chat-messages');
    
    document.getElementById('chat-toggle-btn').onclick = () => chatModal.classList.add('open');
    document.getElementById('close-chat-modal').onclick = () => chatModal.classList.remove('open');

    const sendMessage = async () => {
        const text = chatInput.value.trim();
        if (!text) return;
        chatInput.value = '';
        
        chatMessages.innerHTML += `<div style="background: var(--accent); color: white; padding: 10px 14px; border-radius: 12px; border-bottom-right-radius: 2px; align-self: flex-end; max-width: 85%; font-size: 15px;">${text}</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        const loadingId = 'loading-' + Date.now();
        chatMessages.innerHTML += `<div id="${loadingId}" style="color: var(--text-secondary); font-size: 13px; align-self: flex-start; padding: 4px;">Thinking...</div>`;
        chatMessages.scrollTop = chatMessages.scrollHeight;

        try {
            const context = generateFinancialContext();
            const response = await askBudgetQuestion(text, context);
            document.getElementById(loadingId).remove();
            const formattedResponse = formatAIText(response.text);
            chatMessages.innerHTML += `<div style="background: var(--fill-3); padding: 12px 16px; border-radius: 16px; border-bottom-left-radius: 2px; align-self: flex-start; max-width: 85%; font-size: 15px; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">${formattedResponse}</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (err) {
            document.getElementById(loadingId).remove();
            chatMessages.innerHTML += `<div style="color: var(--expense-color); font-size: 13px; align-self: flex-start; padding: 4px;">Error: ${err.message}</div>`;
        }
    };

    document.getElementById('chat-send-btn').onclick = sendMessage;
    chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(); };
}

// ---------- Security, Filters & Lock ----------
function checkLockScreen() {
    if (appPin) {
        document.getElementById('lock-screen').style.display = 'flex';
        document.getElementById('unlock-pin-input').focus();
    }
}

function setupSecurity() {
    const setupInput = document.getElementById('setup-pin-input');
    const unlockInput = document.getElementById('unlock-pin-input');
    const pinError = document.getElementById('pin-error');

    document.getElementById('save-pin-btn').onclick = () => {
        const pin = setupInput.value.trim();
        if (pin.length === 4 && !isNaN(pin)) {
            appPin = pin;
            localStorage.setItem('mb_pin', appPin);
            showToast('PIN successfully set!', 'success');
            setupInput.value = '';
        } else {
            alert('Please enter exactly 4 numbers.');
        }
    };

    document.getElementById('remove-pin-btn').onclick = () => {
        if (confirm('Are you sure you want to remove the PIN lock?')) {
            appPin = null;
            localStorage.removeItem('mb_pin');
            showToast('PIN removed', 'success');
        }
    };

    document.getElementById('unlock-btn').onclick = () => {
        if (unlockInput.value === appPin) {
            document.getElementById('lock-screen').style.display = 'none';
            unlockInput.value = '';
            pinError.style.display = 'none';
        } else {
            pinError.style.display = 'block';
            unlockInput.value = '';
        }
    };
}

function setupFilters() {
    const modal = document.getElementById('filter-modal');
    document.getElementById('open-filter-btn').onclick = () => {
        const cats = getAllCategories();
        document.getElementById('filter-category').innerHTML = '<option value="all">All Categories</option>' + cats.map(c => `<option value="${c}">${c}</option>`).join('');
        document.getElementById('filter-account').innerHTML = '<option value="all">All Accounts</option>' + accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
        
        document.getElementById('filter-start-date').value = advFilters.start;
        document.getElementById('filter-end-date').value = advFilters.end;
        document.getElementById('filter-category').value = advFilters.category;
        document.getElementById('filter-account').value = advFilters.account;
        
        modal.classList.add('open');
    };

    document.getElementById('close-filter-modal').onclick = () => modal.classList.remove('open');
    
    document.getElementById('apply-filter-btn').onclick = () => {
        advFilters.start = document.getElementById('filter-start-date').value;
        advFilters.end = document.getElementById('filter-end-date').value;
        advFilters.category = document.getElementById('filter-category').value;
        advFilters.account = document.getElementById('filter-account').value;
        modal.classList.remove('open');
        renderTransactionList();
    };

    document.getElementById('clear-filter-btn').onclick = () => {
        advFilters = { start: '', end: '', category: 'all', account: 'all' };
        document.getElementById('filter-start-date').value = '';
        document.getElementById('filter-end-date').value = '';
        document.getElementById('filter-category').value = 'all';
        document.getElementById('filter-account').value = 'all';
        renderTransactionList();
        modal.classList.remove('open');
    };
}

// ---------- Initialize & Service Worker ----------
function initialize() {
    renderCustomCategories();
    
    // Show Debt Calculator if there are borrowed loans
    if (loans.some(l => l.type === 'borrowed' && (l.amount - (l.paid||0)) > 0)) {
        document.getElementById('debt-calculator-section').style.display = 'block';
    }
    generatePaletteButtons();
    applyTheme();
    renderAll();
    switchTab('home', 'home');
    
    if (document.getElementById('tab-charts').classList.contains('active')) renderCharts();
    if (document.getElementById('tab-budget').classList.contains('active')) renderBudgetChart();
    updateBillBadge();

    // ADD THIS LINE TO INITIALIZE CHAT
    setupChat();
    
    setupSecurity();
    checkLockScreen();
    processRecurringTransactions();
    setupFilters();

    // Register Service Worker for offline caching
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js')
                .then(reg => console.log('Service Worker registered'))
                .catch(err => console.log('Service Worker error:', err));
        });
    }
}

initialize();