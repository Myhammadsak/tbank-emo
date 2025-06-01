document.addEventListener('DOMContentLoaded', async function() {
    console.log('Dashboard initialization started');

    try {
        const isAuthenticated = await verifyAuthentication();
        if (!isAuthenticated) {
            console.log('User not authenticated, redirecting...');
            redirectToLogin();
            return;
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        redirectToLogin();
        return;
    }


    async function verifyAuthentication() {
        if (localStorage.getItem('accessToken')) {
            console.log('Access token exists');
            return true;
        }

        if (localStorage.getItem('refreshToken')) {
            console.log('Attempting silent refresh...');
            try {
                const newToken = await refreshToken();
                if (newToken) {
                    console.log('Silent refresh successful');
                    return true;
                }
            } catch (error) {
                console.log('Silent refresh failed:', error);
            }
        }

        return false;
    }

    async function loadUserData() {
        try {
            console.log('Loading user data...');
            const response = await fetch('http://localhost:8000/api/auth/user/', {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (response.status === 401) {
                console.log('Token expired, attempting refresh...');
                const newToken = await refreshToken();
                if (newToken) {
                    return loadUserData();
                }
                throw new Error('Refresh failed');
            }

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const userData = await response.json();
            updateProfileUI(userData);
            console.log('User data loaded successfully');
        } catch (error) {
            console.error('Failed to load user data:', error);
            showError('Не удалось загрузить данные профиля');
        }
    }

    async function loadAudioStats() {
        try {
            console.log('Loading audio stats...');
            const response = await fetch('http://localhost:8000/api/audio/count/', {
                method: 'GET',
                headers: getAuthHeaders(),
                credentials: 'include'
            });

            if (response.status === 401) {
                const newToken = await refreshToken();
                if (newToken) {
                    return loadAudioStats();
                }
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            updateAudioStatsUI(data);
            console.log('Audio stats loaded successfully');
        } catch (error) {
            console.error('Failed to load audio stats:', error);
            showError('Не удалось загрузить статистику');
        }
    }

    function setupCallButton() {
        const callBtn = document.getElementById('CallButton');
        if (!callBtn) return;

        callBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const token = localStorage.getItem('accessToken');
            if (!token) {
                showStatus('Требуется авторизация', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            window.location.href = 'call_load.html';
        });
    }

     function setupAudioButton() {
        const callBtn = document.getElementById('AudioButton');
        if (!callBtn) return;

        callBtn.addEventListener('click', function(e) {
            e.preventDefault();

            const token = localStorage.getItem('accessToken');
            if (!token) {
                showStatus('Требуется авторизация', 'error');
                setTimeout(() => window.location.href = 'login.html', 1500);
                return;
            }

            window.location.href = 'audio_list.html';
        });
    }

    async function setupLogoutButton() {
        const logoutBtn = document.querySelector('.action-btn.logout');
        if (!logoutBtn) {
            console.error('Logout button not found');
            return;
        }

        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            if (!confirm('Вы уверены, что хотите выйти?')) return;

            try {
                logoutBtn.disabled = true;
                const originalText = logoutBtn.innerHTML;
                logoutBtn.innerHTML = '<span class="btn-icon">⏳</span><span>Выход...</span>';

                await performLogout();

                clearAuthData();

                setTimeout(redirectToLogin, 300);
            } catch (error) {
                console.error('Logout error:', error);
                logoutBtn.innerHTML = originalText;
                logoutBtn.disabled = false;

                if (error.message.includes('401')) {
                    clearAuthData();
                    redirectToLogin();
                } else {
                    showError(`Ошибка выхода: ${error.message}`);
                }
            }
        });
    }

    async function performLogout() {
        const csrfToken = getCookie('csrftoken');
        const response = await fetch('http://localhost:8000/api/auth/logout/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                'Content-Type': 'application/json',
                'X-CSRFToken': csrfToken || ''
            },
            credentials: 'include'
        });

        if (!response.ok && response.status !== 401) {
            throw new Error(`Server error: ${response.status}`);
        }
    }

    async function refreshToken() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token');

            const response = await fetch('http://localhost:8000/api/auth/token/refresh/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ refresh: refreshToken })
            });

            if (!response.ok) throw new Error('Refresh failed');

            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            return data.access;
        } catch (error) {
            console.error('Token refresh error:', error);
            throw error;
        }
    }

    function getAuthHeaders() {
        const token = localStorage.getItem('accessToken');
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    function updateProfileUI(userData) {
        try {
            const nameElement = document.querySelector('.user-details h2');
            const emailElement = document.querySelector('.user-email');
            const roleElement = document.querySelector('.user-role');

            if (nameElement) nameElement.textContent = userData.full_name || userData.username || 'Не указано';
            if (emailElement) emailElement.textContent = userData.email || 'Не указан';
            if (roleElement) roleElement.textContent = userData.role || 'Менеджер';
        } catch (error) {
            console.error('Error updating profile UI:', error);
        }
    }

    function updateAudioStatsUI(data) {
        try {
            const statElement = document.querySelector('.stat-value');
            if (statElement) {
                statElement.textContent = data?.count ?? 0;
            }
        } catch (error) {
            console.error('Error updating stats UI:', error);
        }
    }

    function clearAuthData() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        document.cookie.split(';').forEach(cookie => {
            const [name] = cookie.trim().split('=');
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });
    }

    function redirectToLogin() {
        window.location.href = 'http://localhost:63342/pythonProject16/frontend/login.html';
    }

    function showError(message) {
        try {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = message;
            document.querySelector('.profile-box')?.prepend(errorDiv);
            setTimeout(() => errorDiv.remove(), 5000);
        } catch (error) {
            console.error('Error showing error:', error);
        }
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }

    try {
        console.log('Starting application initialization...');
        await Promise.all([
            loadUserData(),
            loadAudioStats()
        ]);
        setupLogoutButton();
        setupCallButton();
        setupAudioButton();
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Initialization failed:', error);
    }
});