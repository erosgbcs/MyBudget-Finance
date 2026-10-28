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
let transparency = parseFloat(localStorage.getItem('mb_transparency')) || 0.65;
let currentPalette = localStorage.getItem('mb_palette') || 'default';
let fontSize = localStorage.getItem('mb_font_size') || 'medium';
let density = localStorage.getItem('mb_density') || 'comfortable';
let notificationsEnabled = localStorage.getItem('mb_notifications') === 'true';
let lastKnownDate = new Date().toDateString();

// Navigation & Modal States
let activeTab = 'home';
let currentFormType = null; // 'account', 'savings', 'loan', 'bill', 'budget'

// Chart.js instances
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
    if (notifBtn) {
        notifBtn.textContent = notificationsEnabled ? 'Disable Notifications' : 'Enable Notifications';
    }
    const notifStatus = document.getElementById('notification-status');
    if (notifStatus) {
        notifStatus.textContent = notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled';
    }
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

// ---------- Navigation ----------
const tabTitles = {
    home: 'MyBudget', transactions: 'Transactions', charts: 'Charts', more: 'More',
    accounts: 'Accounts', savings: 'Savings', loans: 'Loans', bills: 'Bills', budget: 'Budget', settings: 'Settings'
};
const subPages = ['accounts', 'savings', 'loans', 'bills', 'budget', 'settings'];
const addPages = ['accounts', 'savings', 'loans', 'bills', 'budget'];

function switchTab(tabId, activeNav = tabId) {
    activeTab = tabId;
    
    // Update Tab Content visibility
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    const targetTab = document.getElementById('tab-' + tabId);
    if (targetTab) targetTab.classList.add('active');

    // Update Bottom Nav active state
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    const activeNavItem = document.querySelector(`.nav-item[data-tab="${activeNav}"]`);
    if (activeNavItem) activeNavItem.classList.add('active');

    // Update Header UI
    document.getElementById('page-title').textContent = tabTitles[tabId] || 'MyBudget';
    
    const backBtn = document.getElementById('back-btn');
    if (subPages.includes(tabId)) {
        backBtn.style.display = 'flex';
    } else {
        backBtn.style.display = 'none';
    }

    const headerAddBtn = document.getElementById('header-add-btn');
    if (addPages.includes(tabId)) {
        headerAddBtn.style.display = 'flex';
    } else {
        headerAddBtn.style.display = 'none';
    }

    // Lazy Render Charts
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
        fieldsEl.innerHTML = `<input type="text" id="gf-name" placeholder="Account Name" required>`;
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
        fieldsEl.innerHTML = `
            <select id="gf-category">
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Health">Health</option>
                <option value="Other">Other</option>
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
function addAccount(name) {
    accounts.push({ id: 'acc' + Date.now(), name, balance: 0 });
    saveAccounts();
    renderAll();
    showToast('Account added', 'success');
}

function deleteAccount(id) {
    if (accounts.length <= 1) return alert('Cannot delete the last account');
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    renderAll();
}

function addSavingsGoal(name, target, current, accountId) {
    savings.push({
        id: 'sav' + Date.now(), name, target, current, accountId,
        createdAt: new Date().toISOString(), initialAmount: current || 0
    });
    saveSavings();
    renderAll();
    showToast('Savings goal added', 'success');
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

function addLoan(name, amount, type) {
    loans.push({ id: 'loan' + Date.now(), name, amount, type });
    saveLoans();
    renderAll();
    showToast('Loan added', 'success');
}

function deleteLoan(id) {
    loans = loans.filter(l => l.id !== id);
    saveLoans();
    renderAll();
}

function addBill(name, amount, dueDate) {
    bills.push({ id: 'bill' + Date.now(), name, amount, dueDate, paid: false });
    saveBills();
    renderAll();
    showToast('Bill added', 'success');
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

function setBudget(category, limit) {
    const monthKey = getMonthKey();
    if (!budgets[monthKey]) budgets[monthKey] = {};
    budgets[monthKey][category] = limit;
    saveBudgets();
    renderAll();
    showToast('Budget set', 'success');
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
        transactions.push({
            id: Date.now(), type, description, amount: signedAmount,
            category, accountId, date: new Date().toISOString()
        });
        
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
    const lent = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);
    const borrowed = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
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
    if (!accounts.length) {
        container.innerHTML = `<div class="empty-state">No accounts yet. Tap + to add.</div>`;
        return;
    }
    accounts.forEach(acc => {
        const effBal = acc.balance + getSavingsTotalForAccount(acc.id);
        const savText = getSavingsTotalForAccount(acc.id) > 0 ? ` (Savings: ${formatCurrency(getSavingsTotalForAccount(acc.id))})` : '';
        
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <div><span class="account-name">${acc.name}</span>${savText ? `<div class="transaction-meta">${savText}</div>` : ''}</div>
            <span class="account-balance ${getAmountClass(effBal)}">${formatCurrency(effBal)}</span>
            <button class="delete-btn" onclick="deleteAccount('${acc.id}')"><svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        `;
        container.appendChild(div);
    });
    
    // Repopulate Transaction Modal Account Selects
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
            <span class="account-summary-name">${acc.name}</span>
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

function renderLoans() {
    const container = document.getElementById('loans-list');
    container.innerHTML = '';
    if (!loans.length) { container.innerHTML = `<div class="empty-state">No loans recorded. Tap + to add.</div>`; return; }
    
    loans.forEach(loan => {
        const lbl = loan.type === 'borrowed' ? 'I Owe' : 'Owed to Me';
        const val = loan.type === 'borrowed' ? -loan.amount : loan.amount;
        const div = document.createElement('div');
        div.className = 'loan-item';
        div.innerHTML = `
            <span class="loan-name">${loan.name} <small>(${lbl})</small></span>
            <span class="loan-amount ${getAmountClass(val)}">${formatCurrency(loan.amount)}</span>
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
    const lent = loans.filter(l => l.type === 'lent').reduce((s, l) => s + l.amount, 0);
    const borrowed = loans.filter(l => l.type === 'borrowed').reduce((s, l) => s + l.amount, 0);
    document.getElementById('net-worth-breakdown').textContent = `Accounts: ${formatCurrency(totalBal)} + Lent: ${formatCurrency(lent)} - Borrowed: ${formatCurrency(borrowed)}`;
}

function renderTransactionList() {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    
    const filtered = transactions.filter(t => {
        const matchF = currentFilter === 'all' || (currentFilter === 'income' && t.type === 'income') || (currentFilter === 'expense' && t.type === 'expense');
        const q = searchQuery.toLowerCase();
        const matchS = t.description.toLowerCase().includes(q) || (t.category && t.category.toLowerCase().includes(q));
        return matchF && matchS;
    });

    if (!filtered.length) { list.innerHTML = `<li><div class="empty-state">No transactions found.</div></li>`; return; }

    filtered.forEach(t => {
        const li = document.createElement('li');
        li.className = t.type;
        const acc = accounts.find(a => a.id === t.accountId);
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${acc ? acc.name : 'Unknown'} • ${safeFormatDate(t.date)}</div>
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
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${safeFormatDate(t.date)}</div>
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

// ---------- Unified Render ----------
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

// ---------- Bill Badge ----------
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
    const data = {
        accounts, transactions, budgets, savings, loans, bills, netWorthHistory,
        settings: { isDarkMode, transparency, currentPalette, fontSize, density, notificationsEnabled }
    };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    a.download = `mybudget-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('Backup downloaded!', 'success');
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
    document.getElementById('modal-description').focus();
    document.getElementById('modal-type').value = 'expense';
    toggleTransferFields();
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
    container.innerHTML = PALETTES.map(p => `
        <button class="palette-btn" data-palette="${p.id}">
            <span class="palette-swatch" style="background: ${p.swatch};"></span>${p.name}
        </button>
    `).join('');
    
    container.querySelectorAll('.palette-btn').forEach(btn => {
        btn.addEventListener('click', () => setPalette(btn.dataset.palette));
    });
}

// ---------- Event Listeners ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    saveTheme(); applyTheme();
    if (activeTab === 'charts') setTimeout(renderCharts, 50);
    if (activeTab === 'budget') setTimeout(renderBudgetChart, 50);
});

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab, item.dataset.tab));
});

document.querySelectorAll('.more-item').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tabTarget, 'more'));
});

document.getElementById('back-btn').addEventListener('click', () => switchTab('more', 'more'));

// Contextual Header Add Button
document.getElementById('header-add-btn').addEventListener('click', () => {
    if (activeTab === 'transactions') openTransactionModal();
    else if (activeTab === 'accounts') openFormModal('account');
    else if (activeTab === 'savings') openFormModal('savings');
    else if (activeTab === 'loans') openFormModal('loan');
    else if (activeTab === 'bills') openFormModal('bill');
    else if (activeTab === 'budget') openFormModal('budget');
});

// Transaction Modal Actions
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
        addTransaction(desc, amount, type, document.getElementById('modal-category').value, document.getElementById('modal-account').value);
    }
    closeTransactionModal();
});

// Unified Form Modal Actions
document.getElementById('close-form-modal').addEventListener('click', closeFormModal);
document.getElementById('form-modal').addEventListener('click', (e) => { if (e.target === document.getElementById('form-modal')) closeFormModal(); });

document.getElementById('generic-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentFormType === 'account') {
        addAccount(document.getElementById('gf-name').value.trim());
    } else if (currentFormType === 'savings') {
        addSavingsGoal(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-target').value), parseFloat(document.getElementById('gf-current').value) || 0, document.getElementById('gf-account').value);
    } else if (currentFormType === 'loan') {
        addLoan(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-amount').value), document.getElementById('gf-type').value);
    } else if (currentFormType === 'bill') {
        addBill(document.getElementById('gf-name').value.trim(), parseFloat(document.getElementById('gf-amount').value), document.getElementById('gf-due-date').value);
    } else if (currentFormType === 'budget') {
        setBudget(document.getElementById('gf-category').value, parseFloat(document.getElementById('gf-amount').value));
    }
    closeFormModal();
});

// Search & Filters
document.getElementById('search-transactions').addEventListener('input', (e) => { searchQuery = e.target.value; renderTransactionList(); });
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active'); currentFilter = btn.dataset.filter; renderTransactionList();
    });
});

// Settings
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
document.getElementById('restore-data-btn').addEventListener('click', () => document.getElementById('restore-file-input').click());
document.getElementById('restore-file-input').addEventListener('change', (e) => { if (e.target.files[0]) restoreData(e.target.files[0]); e.target.value = ''; });

// Date Change Checker
setInterval(() => {
    const now = new Date().toDateString();
    if (now !== lastKnownDate) { lastKnownDate = now; renderAll(); }
}, 60000);

// ---------- Initialize ----------
function initialize() {
    generatePaletteButtons();
    applyTheme();
    renderAll();
    switchTab('home', 'home'); // Set default UI state
    
    if (document.getElementById('tab-charts').classList.contains('active')) renderCharts();
    if (document.getElementById('tab-budget').classList.contains('active')) renderBudgetChart();
    updateBillBadge();
}

initialize();