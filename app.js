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
let isDarkMode = localStorage.getItem('mb_theme') === 'dark';

// Chart.js instances
let incomeExpenseChartInstance = null;
let categoryPieChartInstance = null;
let netWorthChartInstance = null;

// ---------- Save Functions ----------
function saveAccounts() { localStorage.setItem('mb_accounts', JSON.stringify(accounts)); }
function saveTransactions() { localStorage.setItem('mb_transactions', JSON.stringify(transactions)); }
function saveBudgets() { localStorage.setItem('mb_budgets', JSON.stringify(budgets)); }
function saveSavings() { localStorage.setItem('mb_savings', JSON.stringify(savings)); }
function saveLoans() { localStorage.setItem('mb_loans', JSON.stringify(loans)); }
function saveBills() { localStorage.setItem('mb_bills', JSON.stringify(bills)); }
function saveNetWorthHistory() { localStorage.setItem('mb_networth_history', JSON.stringify(netWorthHistory)); }
function saveTheme() { localStorage.setItem('mb_theme', isDarkMode ? 'dark' : 'light'); }

// ---------- Utilities ----------
function formatCurrency(val) {
    return '₱' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
}

// ---------- Tab Switching ----------
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById('tab-' + tabId).classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.querySelector(`.menu-item[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById('main-menu').classList.remove('open');
    // If switching to charts, render charts (ensure they fit container)
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
function addSavingsGoal(name, target, current) {
    const id = 'sav' + Date.now();
    savings.push({ id, name, target, current });
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
        const tMonth = t.date.slice(0, 7);
        if (tMonth === monthKey) {
            if (t.amount > 0) income += t.amount;
            else expense += Math.abs(t.amount);
        }
    });
    return { income, expense, balance: income - expense };
}

function getCategorySpending(monthKey) {
    const spending = {};
    transactions.forEach(t => {
        const tMonth = t.date.slice(0, 7);
        if (tMonth === monthKey && t.amount < 0) {
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
        // Update today's value
        lastEntry.value = getNetWorth();
        saveNetWorthHistory();
    }
}

// ---------- Render Functions ----------
function renderAccounts() {
    const container = document.getElementById('accounts-list');
    container.innerHTML = '';
    accounts.forEach(acc => {
        const div = document.createElement('div');
        div.className = 'account-item';
        div.innerHTML = `
            <span class="account-name">${acc.name}</span>
            <span class="account-balance">${formatCurrency(acc.balance)}</span>
            <button class="delete-btn" data-account-id="${acc.id}">✕</button>
        `;
        div.querySelector('.delete-btn').addEventListener('click', () => deleteAccount(acc.id));
        container.appendChild(div);
    });
    const accountSelect = document.getElementById('account');
    accountSelect.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        accountSelect.appendChild(option);
    });
}

function renderSavings() {
    const container = document.getElementById('savings-list');
    container.innerHTML = '';
    savings.forEach(goal => {
        const percent = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0;
        const div = document.createElement('div');
        div.className = 'savings-item';
        div.innerHTML = `
            <div style="flex:1;">
                <div class="savings-name">${goal.name}</div>
                <div class="savings-progress">${formatCurrency(goal.current)} / ${formatCurrency(goal.target)}</div>
                <div class="progress-bar" style="width:100px;">
                    <div class="progress-fill ${percent >= 100 ? 'over' : ''}" style="width: ${percent}%"></div>
                </div>
            </div>
            <input type="number" class="savings-update" value="${goal.current}" step="0.01" style="width:80px;">
            <button class="delete-btn" data-savings-id="${goal.id}">✕</button>
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

function renderLoans() {
    const container = document.getElementById('loans-list');
    container.innerHTML = '';
    loans.forEach(loan => {
        const div = document.createElement('div');
        div.className = 'loan-item';
        const label = loan.type === 'borrowed' ? 'I Owe' : 'Owed to Me';
        div.innerHTML = `
            <span class="loan-name">${loan.name} <small>(${label})</small></span>
            <span class="loan-amount">${formatCurrency(loan.amount)}</span>
            <button class="delete-btn" data-loan-id="${loan.id}">✕</button>
        `;
        div.querySelector('.delete-btn').addEventListener('click', () => deleteLoan(loan.id));
        container.appendChild(div);
    });
}

function renderBills() {
    const container = document.getElementById('bills-list');
    container.innerHTML = '';
    // Sort bills by due date (closest first)
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
            <span class="bill-amount">${formatCurrency(bill.amount)}</span>
            <button class="delete-btn" data-bill-id="${bill.id}">✕</button>
            <button class="paid-btn" data-bill-id="${bill.id}">${bill.paid ? '↩️' : '✅'}</button>
        `;
        div.querySelector('.delete-btn').addEventListener('click', () => deleteBill(bill.id));
        div.querySelector('.paid-btn').addEventListener('click', () => toggleBillPaid(bill.id));
        container.appendChild(div);
    });
}

function renderSummary() {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const { income, expense } = getMonthlyIncomeExpense();
    document.getElementById('balance').textContent = formatCurrency(totalBalance);
    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expense').textContent = formatCurrency(expense);

    // Net Worth
    const netWorth = getNetWorth();
    document.getElementById('net-worth').textContent = formatCurrency(netWorth);
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
        if (currentFilter === 'income') return t.amount > 0;
        if (currentFilter === 'expense') return t.amount < 0;
        return true;
    });
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
            <span class="transaction-amount ${t.amount > 0 ? 'income' : 'expense'}">
                ${t.amount > 0 ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}
            </span>
            <button class="delete-btn" data-id="${t.id}">✕</button>
        `;
        li.querySelector('.delete-btn').addEventListener('click', () => deleteTransaction(t.id));
        list.appendChild(li);
    });
}

function renderTransactionPreview() {
    const list = document.getElementById('transaction-list-preview');
    list.innerHTML = '';
    const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    recent.forEach(t => {
        const li = document.createElement('li');
        li.className = t.amount > 0 ? 'income' : 'expense';
        li.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-desc">${t.description}</div>
                <div class="transaction-meta">${t.category} • ${new Date(t.date).toLocaleDateString()}</div>
            </div>
            <span class="transaction-amount ${t.amount > 0 ? 'income' : 'expense'}">
                ${t.amount > 0 ? '+' : '-'}${formatCurrency(Math.abs(t.amount))}
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
    for (const [category, limit] of Object.entries(monthBudgets)) {
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
    }
}

// ---------- Charts ----------
function renderCharts() {
    // Destroy existing charts to avoid memory leaks
    if (incomeExpenseChartInstance) incomeExpenseChartInstance.destroy();
    if (categoryPieChartInstance) categoryPieChartInstance.destroy();
    if (netWorthChartInstance) netWorthChartInstance.destroy();

    // Prepare data for income/expense chart (last 6 months)
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

    // Income/Expense chart
    const ctx1 = document.getElementById('incomeExpenseChart').getContext('2d');
    incomeExpenseChartInstance = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(22, 163, 74, 0.6)',
                    borderColor: 'rgba(22, 163, 74, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: 'rgba(220, 38, 38, 0.6)',
                    borderColor: 'rgba(220, 38, 38, 1)',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { callback: value => '₱' + value }
                }
            }
        }
    });

    // Category pie chart for current month
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
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)',
                    'rgba(75, 192, 192, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(201, 203, 207, 0.7)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Net worth history chart
    if (netWorthHistory.length > 0) {
        const dates = netWorthHistory.map(entry => entry.date);
        const values = netWorthHistory.map(entry => entry.value);
        const ctx3 = document.getElementById('netWorthChart').getContext('2d');
        netWorthChartInstance = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Net Worth',
                    data: values,
                    borderColor: 'rgba(139, 92, 246, 1)',
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    fill: true,
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { callback: value => '₱' + value }
                    }
                }
            }
        });
    }
}

function renderAll() {
    renderAccounts();
    renderSavings();
    renderLoans();
    renderBills();
    renderSummary();
    renderTransactionList();
    renderTransactionPreview();
    renderBudgets();
    // Note: charts are rendered when Charts tab is active, or can be rendered here if needed.
    // We'll render charts on demand in switchTab and also after data changes if Charts tab is active.
    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
}

// ---------- Event Listeners ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    saveTheme();
    applyTheme();
});

document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('main-menu').classList.toggle('open');
});

document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.dataset.tab;
        switchTab(tabId);
    });
});

document.getElementById('view-all-transactions').addEventListener('click', () => {
    switchTab('transactions');
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
    if (name && !isNaN(target) && target > 0) {
        addSavingsGoal(name, target, current);
        document.getElementById('savings-name').value = '';
        document.getElementById('savings-target').value = '';
        document.getElementById('savings-current').value = '';
    } else {
        alert('Please enter a valid goal name and target amount.');
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

document.getElementById('add-transaction-btn').addEventListener('click', () => {
    const desc = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const accountId = document.getElementById('account').value;
    if (!desc || isNaN(amount) || amount <= 0) {
        alert('Please enter a valid description and amount');
        return;
    }
    addTransaction(desc, amount, type, category, accountId);
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
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

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const menu = document.getElementById('main-menu');
    const toggle = document.getElementById('menu-toggle');
    if (!menu.contains(e.target) && e.target !== toggle) {
        menu.classList.remove('open');
    }
});

// ---------- Initialize ----------
function initialize() {
    applyTheme();
    renderAll();
    // Record net worth snapshot for today
    recordNetWorthSnapshot();
    // If charts tab is active initially, render charts (unlikely, but safe)
    if (document.getElementById('tab-charts').classList.contains('active')) {
        renderCharts();
    }
}

initialize();