document.addEventListener('DOMContentLoaded', function() {
    const audioFileInput = document.getElementById('audioFile');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadStatus = document.getElementById('uploadStatus');
    const exitButton = document.getElementById('ExitButton');

    const MAX_FILE_SIZE_MB = 50;
    const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/x-wav'];

    checkAuth();

    audioFileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', handleFileUpload);


    exitButton.addEventListener('click', function() {
        window.location.href = 'http://localhost:63342/pythonProject16/frontend/dashboard.html';
    });

    async function handleFileSelect() {
        uploadBtn.disabled = true;
        uploadStatus.textContent = '';

        if (!this.files || !this.files[0]) {
            showStatus('Файл не выбран', 'error');
            return;
        }

        const file = this.files[0];

        if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
            showStatus(`Неподдерживаемый формат: ${file.type}. Разрешены: MP3, WAV, OGG, M4A`, 'error');
            return;
        }

        if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
            showStatus(`Файл слишком большой (макс. ${MAX_FILE_SIZE_MB}MB)`, 'error');
            return;
        }

        uploadBtn.disabled = false;
        showStatus(`Выбран файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`, 'info');
    }

    async function handleFileUpload() {
        if (!audioFileInput.files[0]) {
            showStatus('Сначала выберите файл', 'error');
            return;
        }

        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                throw new Error('Требуется авторизация');
            }

            setUploadState(true);

            const formData = new FormData();
            formData.append('audio_file', audioFileInput.files[0]);

            // Получаем CSRF-токен
            const csrfToken = getCookie('csrftoken');
            if (!csrfToken) {
                throw new Error('CSRF-токен не найден. Перезагрузите страницу');
            }

            const response = await fetch('http://localhost:8000/api/audio/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': csrfToken
                },
                credentials: 'include',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || data.message || 'Ошибка сервера');
            }

            showStatus('Файл успешно загружен!', 'success');
            audioFileInput.value = '';

        } catch (error) {
            console.error('Upload error:', error);
            showStatus(`Ошибка: ${error.message}`, 'error');

            if (error.message.includes('401') || error.message.includes('авторизация')) {
                logout();
            }
        } finally {
            setUploadState(false);
        }
    }

    async function checkAuth() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            logout();
            return false;
        }

        try {
            const response = await fetch('http://localhost:8000/api/auth/user/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-CSRFToken': getCookie('csrftoken') || ''
                },
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Недействительный токен');
            }

            return true;
        } catch (error) {
            console.error('Auth check failed:', error);
            logout();
            return false;
        }
    }

    function logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = 'login.html';
    }

    function setUploadState(isUploading) {
        uploadBtn.disabled = isUploading;
        uploadBtn.textContent = isUploading ? 'Загрузка...' : 'Загрузить';
    }

    function showStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = type;

        if (type === 'error') {
            console.error(message);
        } else if (type === 'success') {
            console.log(message);
        }
    }

    function getCookie(name) {
        const cookieValue = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1];

        return cookieValue || null;
    }
});