function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = '';

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = 'Вход...';
    submitBtn.disabled = true;

    try {
        const formData = {
            username: form.username.value,
            password: form.password.value
        };

        const response = await fetch('http://localhost:8000/api/auth/login/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken') || ''
            },
            body: JSON.stringify(formData),
            credentials: 'include'
        });

        const data = await response.json();

        if (!response.ok) {
            let errorMessage = 'Ошибка входа';
            if (data.detail) errorMessage = data.detail;
            else if (data.non_field_errors) errorMessage = data.non_field_errors.join(', ');
            else errorMessage = Object.entries(data).map(([field, errors]) => `${field}: ${errors}`).join('; ');
            throw new Error(errorMessage);
        }

        if (data.key) {
            localStorage.setItem('accessToken', data.key);
        } else if (data.access) {
            localStorage.setItem('accessToken', data.access);
            if (data.refresh) {
                localStorage.setItem('refreshToken', data.refresh);
            }
        }

        messageDiv.className = 'success';

        setTimeout(() => {
            window.location.href = 'http://localhost:63342/pythonProject16/frontend/dashboard.html';
        }, 10);

    } catch (error) {
        console.error('Login error:', error);
        messageDiv.textContent = error.message;
        messageDiv.className = 'error';
    } finally {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
    }
});