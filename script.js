// State
let transactions = [];
let currentFilter = 'all';

// Load from localStorage
function loadTransactions() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        transactions = JSON.parse(stored);
    }
}

// Save to localStorage
function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Add new transaction
function addTransaction(description, amount) {
    const transaction = {
        id: Date.now(),
        description: description,
        amount: parseFloat(amount),
        date: new Date().toISOString()
    };
    transactions.push(transaction);
    saveTransactions();
    render();
}

// Delete transaction
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveTransactions();
    render();
}

// Calculate totals
function calculateTotals() {
    let income = 0, expense = 0, balance = 0;
    transactions.forEach(t => {
        if (t.amount > 0) income += t.amount;
        else expense += Math.abs(t.amount);
    });
    balance = income - expense;
    return { income, expense, balance };
}

// Format currency
function formatCurrency(value) {
    return '$' + value.toFixed(2);
}

// Render UI
function render() {
    const { income, expense, balance } = calculateTotals();
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('total-income').textContent = formatCurrency(income);
    document.getElementById('total-expense').textContent = formatCurrency(expense);

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

        li.innerHTML = `
            <div>
                <div class="transaction-desc">${t.description}</div>
                <small>${new Date(t.date).toLocaleDateString()}</small>
            </div>
            <div>
                <span class="transaction-amount ${t.amount > 0 ? 'income' : 'expense'}">
                    ${t.amount > 0 ? '+' : ''}${formatCurrency(t.amount)}
                </span>
                <button class="delete-btn" data-id="${t.id}">✕</button>
            </div>
        `;

        li.querySelector('.delete-btn').addEventListener('click', () => {
            deleteTransaction(t.id);
        });

        list.appendChild(li);
    });
}

// Event listeners
document.getElementById('add-btn').addEventListener('click', () => {
    const descInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const desc = descInput.value.trim();
    const amount = amountInput.value;

    if (desc === '' || amount === '') {
        alert('Please fill in both fields');
        return;
    }

    addTransaction(desc, amount);
    descInput.value = '';
    amountInput.value = '';
});

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });
});

// Initialize
loadTransactions();
render();