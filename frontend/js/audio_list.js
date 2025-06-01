document.addEventListener('DOMContentLoaded', function() {
    const exitButton = document.getElementById('exitButton');
    const audioGrid = document.getElementById('audioGrid');
    const loadingStatus = document.getElementById('loadingStatus');
    const searchInput = document.getElementById('searchInput');
    const dateInput = document.getElementById('dateInput');
    const emptyState = document.querySelector('.empty-state');

    const API_BASE_URL = 'http://localhost:8000/api';
    const DASHBOARD_URL = 'http://localhost:63342/pythonProject16/frontend/dashboard.html';
    const LOGIN_URL = 'login.html';

    let audioFiles = [];
    let filteredFiles = [];

    init();

    function init() {
        setupEventListeners();
        checkAuthAndLoad();
    }

    function setupEventListeners() {
        exitButton.addEventListener('click', () => redirectTo(DASHBOARD_URL));
        searchInput.addEventListener('input', handleSearch);
        dateInput.addEventListener('change', handleDateFilter);
    }

    async function checkAuthAndLoad() {
        if (!checkAuth()) {
            showError('Требуется авторизация. Перенаправление...');
            setTimeout(() => redirectTo(LOGIN_URL), 2000);
            return;
        }
        await loadAudioFiles();
    }

    function checkAuth() {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            console.error('Access token not found');
            return false;
        }
        return true;
    }

    async function loadAudioFiles() {
        showLoading('Загрузка аудиофайлов...');

        try {
            const response = await makeRequest(`${API_BASE_URL}/audio/list/`, 'GET');

            if (!response.ok) {
                const error = await parseError(response);
                throw error;
            }

            const data = await response.json();
            console.log('Получены данные:', data);

            audioFiles = data;
            filteredFiles = [...audioFiles];
            displayAudioFiles(filteredFiles);

        } catch (error) {
            handleError(error);
        } finally {
            hideLoading();
        }
    }

    function displayAudioFiles(files) {
        if (!files || !Array.isArray(files)) {
            showError('Некорректный формат данных');
            return;
        }

        audioGrid.innerHTML = '';

        if (files.length === 0) {
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        files.forEach(file => {
            const card = createAudioCard(file);
            audioGrid.appendChild(card);
        });
    }

    function createAudioCard(file) {
        const card = document.createElement('div');
        card.className = 'audio-card';

        card.dataset.fileId = file.id;

        const fullPath = file.audio_file || '';
        const fileName = fullPath.split('/').pop() || 'Без названия';

        const dateTime = formatDateTime(file.created_at);
        const emoCli = file.grade.emotions_client;
        const cWS = file.grade.compliance_with_script;
        const eOD = file.grade.effectiveness_of_dialogue;
        const iS = file.grade.improvement_suggestions;

        const size = file.size ? formatFileSize(file.size) : 'Неизвестно';

        card.innerHTML = `
            <div class="audio-title" title="${escapeHtml(fileName)}">${escapeHtml(fileName)}</div>
            <div class="audio-meta">
                <span class="audio-date">${dateTime}</span>
            </div>
            <br>
            <div class="audio-emo">Эмоции клиента: ${emoCli}</div>
            <br>
            <div class="audio-emo">Соблюдение скрипта сотрудником: ${cWS}</div>
            <br>
            <div class="audio-emo">Эффективность диалога: ${eOD}</div>
            <br>
            <div class="audio-emo">Совет: ${iS}</div>
        `;

        return card;
    }

    function formatDateTime(dateString) {
        if (!dateString) return 'Неизвестно';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Неизвестно' :
                date.toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });
        } catch {
            return 'Неизвестно';
        }
    }

    function handleSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        applyFilters(searchTerm, dateInput.value);
    }

    function handleDateFilter() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        applyFilters(searchTerm, dateInput.value);
    }

    function applyFilters(searchTerm, dateFilter) {
        filteredFiles = audioFiles.filter(file => {
            const matchesSearch = searchTerm === '' ||
                (file.audio_file && file.audio_file.toLowerCase().includes(searchTerm));

            // Фильтрация по дате
            let matchesDate = true;
            if (dateFilter) {
                const fileDate = new Date(file.created_at).toISOString().split('T')[0];
                matchesDate = fileDate === dateFilter;
            }

            return matchesSearch && matchesDate;
        });

        displayAudioFiles(filteredFiles);
    }

    function formatDate(dateString) {
        if (!dateString) return 'Неизвестно';
        try {
            const date = new Date(dateString);
            return isNaN(date.getTime()) ? 'Неизвестно' :
                date.toLocaleDateString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
        } catch {
            return 'Неизвестно';
        }
    }


    async function makeRequest(url, method, body = null) {
        const headers = {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Accept': 'application/json'
        };

        const config = {
            method,
            headers,
            credentials: 'include'
        };

        if (body) {
            config.body = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
        }

        return await fetch(url, config);
    }

    async function parseError(response) {
        try {
            const errorData = await response.json();
            return new Error(errorData.detail || errorData.message || `HTTP error! status: ${response.status}`);
        } catch {
            return new Error(`HTTP error! status: ${response.status}`);
        }
    }

    function handleError(error) {
        console.error('Произошла ошибка:', error);

        if (error.message.includes('401') || error.message.includes('авторизация')) {
            showError('Сессия истекла. Перенаправление на страницу входа...');
            setTimeout(() => redirectTo(LOGIN_URL), 2000);
        } else {
            showError(error.message);
        }
    }

    function showLoading(message) {
        loadingStatus.textContent = message;
        loadingStatus.classList.remove('error', 'hidden');
        loadingStatus.classList.add('visible');
    }

    function hideLoading() {
        loadingStatus.classList.add('hidden');
    }

    function showError(message) {
        loadingStatus.textContent = message;
        loadingStatus.classList.remove('hidden');
        loadingStatus.classList.add('error', 'visible');
    }

    function redirectTo(url) {
        window.location.href = url;
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});