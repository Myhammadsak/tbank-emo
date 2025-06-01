document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const form = e.target;
    const messageDiv = document.getElementById('message');
    messageDiv.textContent = '';
    messageDiv.className = '';

    const submitButton = form.querySelector('button[type="submit"]');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Регистрация';
    submitButton.disabled = true;

    try {
        const formData = {
            username: form.username.value,
            email: form.email.value,
            password1: form.password1.value,
            password2: form.password2.value,
        };

        const response = await fetch('http://localhost:8000/api/auth/registration/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (!response.ok) {
            let errorDetails = '';

            if (typeof data === 'object' && data !== null) {
                for (const [field, errors] of Object.entries(data)) {
                    errorDetails += `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}\n`;
                }

                if (data.non_field_errors) {
                    errorDetails += data.non_field_errors.join('\n');
                }
            } else if (typeof data === 'string') {
                errorDetails = data;
            } else {
                errorDetails = 'Неизвестная ошибка сервера';
            }

            throw new Error(errorDetails || 'Ошибка регистрации');
        }


        setTimeout(() => {
            window.location.href = 'http://localhost:63342/pythonProject16/frontend/login.html';
        }, 10);

    } catch (error) {
        console.error('Error details:', error);

        let errorMessage = 'Ошибка регистрации';

        if (error.message.includes('username')) {
            errorMessage = 'Ошибка в имени пользователя: ' + error.message;
        } else if (error.message.includes('email')) {
            errorMessage = 'Ошибка в email: ' + error.message;
        } else if (error.message.includes('password')) {
            errorMessage = 'Ошибка в пароле: ' + error.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        messageDiv.innerHTML = errorMessage.split('\n').join('<br>');
        messageDiv.className = 'error';
        messageDiv.style.marginTop = '15px';
        messageDiv.style.padding = '10px';
        messageDiv.style.borderRadius = '4px';
        messageDiv.style.backgroundColor = '#ffeeee';

    } finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
});