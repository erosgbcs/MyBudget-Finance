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

// Chart.js instances
let incomeExpenseChartInstance = null;
let categoryPieChartInstance = null;
let netWorthChartInstance = null;
let accountsDoughnutChartInstance = null; // NEW

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

// ---------- Theme ----------
function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').textContent = '🌙';
    }

    document.body.setAttribute('data-theme', currentThemeStyle);
    document.querySelectorAll('.theme-option-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeStyle === currentThemeStyle);
    });
}

function setThemeStyle(style) {
    if (!['glass', 'neumorphism', 'normal'].includes(style)) return;
    currentThemeStyle = style;
    saveThemeStyle();
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
    savings.push({ id, name, target, current, accountId });
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
function addTransaction(description, amount, type, category, accountId) {
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

// ---------- Net Worth ----------
function getNetWorth() {
    const accountTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const savingsTotal = savings.reduce((sum, s) => sum + s.current, 0);
    const lentTotal = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);
    const borrowedTotal = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
    return accountTotal + savingsTotal + lentTotal - borrowedTotal;
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
            const div = document.createElement('div');
            div.className = 'account-item';
            div.innerHTML = `
                <span class="account-name">${acc.name}</span>
                <span class="account-balance ${getAmountClass(acc.balance)}">${formatCurrency(acc.balance)}</span>
                <button class="delete-btn" data-account-id="${acc.id}" aria-label="Delete account">✕</button>
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
}

// NEW: Render Account Balances on Home
function renderAccountBalances() {
    const container = document.getElementById('account-balances-list');
    if (!container) return;
    container.innerHTML = '';
    if (accounts.length === 0) {
        container.innerHTML = '<div class="empty-state">No accounts yet.</div>';
        return;
    }
    accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account-summary-item';
        div.innerHTML = `
            <span class="account-summary-name">${acc.name}</span>
            <span class="account-summary-balance ${getAmountClass(acc.balance)}">${formatCurrency(acc.balance)}</span>
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
                </div>
                <input type="number" class="savings-update" value="${goal.current}" step="0.01" style="width:80px;">
                <button class="delete-btn" data-savings-id="${goal.id}" aria-label="Delete goal">✕</button>
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
                <button class="delete-btn" data-loan-id="${loan.id}" aria-label="Delete loan">✕</button>
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
                    <div class="bill-name">${bill.name} ${isPast ? '⚠️' : ''}</div>
                    <div class="bill-due">Due: ${dueFormatted}</div>
                </div>
                <span class="bill-amount negative">-${formatCurrency(bill.amount)}</span>
                <button class="paid-btn" data-bill-id="${bill.id}" aria-label="Toggle paid">${bill.paid ? '↩️' : '✅'}</button>
                <button class="delete-btn" data-bill-id="${bill.id}" aria-label="Delete bill">✕</button>
            `;
            div.querySelector('.delete-btn').addEventListener('click', () => deleteBill(bill.id));
            div.querySelector('.paid-btn').addEventListener('click', () => toggleBillPaid(bill.id));
            container.appendChild(div);
        });
    }
}

function renderSummary() {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const { income, expense } = getMonthlyIncomeExpense();
    document.getElementById('balance').innerHTML = formatCurrencyWithColor(totalBalance);
    document.getElementById('total-income').innerHTML = formatCurrencyWithColor(income);
    document.getElementById('total-expense').innerHTML = formatCurrencyWithColor(-expense);

    const netWorth = getNetWorth();
    document.getElementById('net-worth').innerHTML = formatCurrencyWithColor(netWorth);
    const accountTotal = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const savingsTotal = savings.reduce((sum, s) => sum + s.current, 0);
    const lentTotal = loans.filter(l => l.type === 'lent').reduce((sum, l) => sum + l.amount, 0);
    const borrowedTotal = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
    document.getElementById('net-worth-breakdown').textContent = 
        `Accounts: ${formatCurrency(accountTotal)} + Savings: ${formatCurrency(savingsTotal)} + Lent: ${formatCurrency(lentTotal)} - Borrowed: ${formatCurrency(borrowedTotal)}`;
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
            <button class="delete-btn" data-id="${t.id}" aria-label="Delete transaction">✕</button>
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
                <span>${category} ${over ? '🔴' : warning ? '🟠' : ''}</span>
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
    // Destroy existing charts
    if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();
    if (categoryPieChartInstance) categoryPieChartInstance.destroy();
    if (netWorthChartInstance) netWorthChartInstance.destroy();
    if (accountsDoughnutChartInstance) accountsDoughnutChartInstance.destroy(); // NEW

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

    // 3. NEW: Accounts Distribution Doughnut
    const accountLabels = accounts.map(acc => acc.name);
    const accountBalances = accounts.map(acc => Math.abs(acc.balance)); // Use absolute for chart, but color-coded separately if negative
    const ctx3 = document.getElementById('accountsDoughnutChart').getContext('2d');
    accountsDoughnutChartInstance = new Chart(ctx3, {
        type: 'doughnut',
        data: {
            labels: accountLabels,
            datasets: [{
                data: accountBalances,
                backgroundColor: [
                    'rgba(59, 130, 246, 0.7)',   // blue
                    'rgba(16, 185, 129, 0.7)',   // green
                    'rgba(245, 158, 11, 0.7)',   // amber
                    'rgba(139, 92, 246, 0.7)',   // purple
                    'rgba(236, 72, 153, 0.7)',   // pink
                    'rgba(107, 114, 128, 0.7)'   // gray
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

function renderAll() {
    renderAccounts();
    renderAccountBalances(); // NEW
    renderSavings();
    renderLoans();
    renderBills();
    renderSummary();
    renderTransactionList();
    renderTransactionPreview();
    renderBudgets();
    recordNetWorthSnapshot();

    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
}

// ---------- Modal Functions ----------
function openTransactionModal() {
    document.getElementById('transaction-modal').classList.add('open');
    document.getElementById('modal-description').focus();
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').classList.remove('open');
    document.getElementById('transaction-form').reset();
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
    const accountId = document.getElementById('modal-account').value;
    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }
    addTransaction(desc, amount, type, category, accountId);
    closeTransactionModal();
});

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

// ---------- Initialize ----------
function initialize() {
    if (accounts.length > 0) {
        savings.forEach(s => {
            if (!s.accountId) {
                s.accountId = accounts[0].id;
            }
        });
        saveSavings();
    }
    applyTheme();
    renderAll();
    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
}

initialize();