let userId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('userId')) {
        userId = localStorage.getItem('userId');
        loadTuitionData();
        showDashboard();
    }
});

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const error = document.getElementById('login-error');

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            error.textContent = data.error;
        } else {
            userId = data.userId;
            localStorage.setItem('userId', userId);
            loadTuitionData();
            showDashboard();
            error.textContent = '';
        }
    })
    .catch(() => error.textContent = 'Server error');
}

function handleLogout() {
    userId = null;
    localStorage.removeItem('userId');
    document.getElementById('login-page').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

function loadTuitionData() {
    fetch(`http://localhost:3000/tuition/${userId}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('balance').textContent = data.balance;
            document.getElementById('days-left').textContent = data.daysLeft;
        });
}

function addPayment() {
    const payment = parseInt(document.getElementById('payment-input').value);
    if (payment && payment > 0) {
        const daysLeft = payment / 1000;
        fetch(`http://localhost:3000/tuition/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ balance: payment, daysLeft })
        })
        .then(response => response.json())
        .then(data => {
            document.getElementById('balance').textContent = data.balance;
            document.getElementById('days-left').textContent = data.daysLeft;
            document.getElementById('payment-input').value = '';
        });
    }
}

function markTuitionDone() {
    fetch(`http://localhost:3000/tuition/${userId}`)
        .then(response => response.json())
        .then(data => {
            if (data.daysLeft > 0) {
                const newBalance = data.balance - 1000;
                const newDaysLeft = data.daysLeft - 1;
                fetch(`http://localhost:3000/tuition/${userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ balance: newBalance, daysLeft: newDaysLeft })
                })
                .then(response => response.json())
                .then(updatedData => {
                    document.getElementById('balance').textContent = updatedData.balance;
                    document.getElementById('days-left').textContent = updatedData.daysLeft;
                });
            }
        });
}

function showDashboard() {
    document.getElementById('login-page').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
}