// ---------- Data Structures ----------
let accounts = JSON.parse(localStorage.getItem('mb_accounts')) || [
    { id: 'acc1', name: 'GCash', balance: 0 },
    { id: 'acc2', name: 'Bank', balance: 0 }
];
let transactions = JSON.parse(localStorage.getItem('mb_transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('mb_budgets')) || {}; // { monthKey: { category: limit } }
let currentFilter = 'all';
let isDarkMode = localStorage.getItem('mb_theme') === 'dark';

// ---------- Save Functions ----------
function saveAccounts() {
    localStorage.setItem('mb_accounts', JSON.stringify(accounts));
}
function saveTransactions() {
    localStorage.setItem('mb_transactions', JSON.stringify(transactions));
}
function saveBudgets() {
    localStorage.setItem('mb_budgets', JSON.stringify(budgets));
}
function saveTheme() {
    localStorage.setItem('mb_theme', isDarkMode ? 'dark' : 'light');
}

// ---------- Utilities ----------
function formatCurrency(val) {
    return '₱' + val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

// ---------- Theme Toggle ----------
function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark-theme');
        document.getElementById('theme-toggle').textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        document.getElementById('theme-toggle').textContent = '🌙';
    }
}

// ---------- Core Operations ----------
function addAccount(name) {
    const id = 'acc' + Date.now();
    accounts.push({ id, name, balance: 0 });
    saveAccounts();
    renderAccounts();
}

function deleteAccount(id) {
    if (accounts.length <= 1) {
        alert('Cannot delete the last account');
        return;
    }
    accounts = accounts.filter(acc => acc.id !== id);
    saveAccounts();
    renderAccounts();
}

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
    // Update account balance
    const account = accounts.find(acc => acc.id === accountId);
    if (account) {
        account.balance += signedAmount;
    }
    saveTransactions();
    saveAccounts();
    renderAll();
}

function deleteTransaction(id) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        // Reverse balance change
        const account = accounts.find(acc => acc.id === transaction.accountId);
        if (account) {
            account.balance -= transaction.amount;
        }
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        saveAccounts();
        renderAll();
    }
}

function setBudget(category, limit) {
    const monthKey = getMonthKey();
    if (!budgets[monthKey]) {
        budgets[monthKey] = {};
    }
    budgets[monthKey][category] = limit;
    saveBudgets();
    renderBudgets();
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
    // Update account select in transaction form
    const accountSelect = document.getElementById('account');
    accountSelect.innerHTML = '';
    accounts.forEach(acc => {
        const option = document.createElement('option');
        option.value = acc.id;
        option.textContent = acc.name;
        accountSelect.appendChild(option);
    });
}

function renderSummary() {
    const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const { income, expense } = getMonthlyIncomeExpense();
    document.getElementById('balance').textContent = formatCurrency(totalBalance);
    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expense').textContent = formatCurrency(expense);
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

function renderBudgets() {
    const monthKey = getMonthKey();
    const spending = getCategorySpending(monthKey);
    const container = document.getElementById('budget-progress');
    container.innerHTML = '';
    const monthBudgets = budgets[monthKey] || {};
    for (const [category, limit] of Object.entries(monthBudgets)) {
        const spent = spending[category] || 0;
        const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        const over = spent > limit;
        const div = document.createElement('div');
        div.className = 'budget-item';
        div.innerHTML = `
            <div class="budget-header">
                <span>${category}</span>
                <span>${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill ${over ? 'over' : ''}" style="width: ${percent}%"></div>
            </div>
        `;
        container.appendChild(div);
    }
}

function renderAll() {
    renderAccounts();
    renderSummary();
    renderTransactionList();
    renderBudgets();
}

// ---------- Event Listeners ----------
document.getElementById('theme-toggle').addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    saveTheme();
    applyTheme();
});

document.getElementById('add-account-btn').addEventListener('click', () => {
    const nameInput = document.getElementById('new-account-name');
    const name = nameInput.value.trim();
    if (name) {
        addAccount(name);
        nameInput.value = '';
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

// ---------- Initialize ----------
applyTheme();
renderAll();