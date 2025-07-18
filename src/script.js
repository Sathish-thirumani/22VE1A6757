// Logging middleware simulation
const logEvent = (eventName, data = {}) => {
    console.log(`[LOGGING_SIMULATION] Event: ${eventName}`, data);
};

// DOM Element References
const shortenerTabBtn = document.getElementById('shortenerTabBtn');
const statisticsTabBtn = document.getElementById('statisticsTabBtn');
const shortenerView = document.getElementById('shortenerView');
const statisticsView = document.getElementById('statisticsView');

const originalUrlInput = document.getElementById('originalUrlInput');
const validityInput = document.getElementById('validityInput');
const shortcodeInput = document.getElementById('shortcodeInput');
const shortenUrlBtn = document.getElementById('shortenUrlBtn');

const errorMessage = document.getElementById('errorMessage');
const loadingMessage = document.getElementById('loadingMessage');
const resultBox = document.getElementById('resultBox');
const shortenedLink = document.getElementById('shortenedLink');
const expiresAtText = document.getElementById('expiresAtText');
const copyLinkBtn = document.getElementById('copyLinkBtn');

const noUrlsMessage = document.getElementById('noUrlsMessage');
const statisticsTableContainer = document.getElementById('statisticsTableContainer');
const statisticsTableBody = document.getElementById('statisticsTableBody');

let allShortenedUrls = []; // Global array to store all shortened URLs

// View Management Functions
function showView(viewName) {
    logEvent('NavigationView', { view: viewName });
    shortenerView.style.display = viewName === 'shortener' ? 'block' : 'none';
    statisticsView.style.display = viewName === 'statistics' ? 'block' : 'none';
    shortenerTabBtn.classList.toggle('active', viewName === 'shortener');
    statisticsTabBtn.classList.toggle('active', viewName === 'statistics');
    if (viewName === 'statistics') {
        renderStatistics();
    }
}

// Data Persistence Functions (localStorage)
function loadUrlsFromLocalStorage() {
    logEvent('UrlsLoadedFromLocalStorage');
    try {
        allShortenedUrls = JSON.parse(localStorage.getItem('shortenedUrls')) || [];
        logEvent('UrlsLoadedSuccess', { count: allShortenedUrls.length });
    } catch (error) {
        console.error("Failed to load URLs from localStorage:", error);
        logEvent('LocalStorageLoadError', { error: error.message });
    }
}

function saveUrlsToLocalStorage() {
    try {
        localStorage.setItem('shortenedUrls', JSON.stringify(allShortenedUrls));
        logEvent('UrlsSavedToLocalStorage', { count: allShortenedUrls.length });
    } catch (error) {
        console.error("Failed to save URLs to localStorage:", error);
        logEvent('LocalStorageSaveError', { error: error.message });
    }
}

// Utility Functions
function displayMessage(element, message, type) {
    element.textContent = message;
    element.className = `message ${type}`;
    element.style.display = message ? 'block' : 'none';
}

function isValidUrl(url) {
    try { new URL(url); return true; } catch (e) { return false; }
}

function generateUniqueShortcode() {
    let newShortcode;
    let isUnique = false;
    do {
        newShortcode = Math.random().toString(36).substring(2, 8);
        isUnique = !allShortenedUrls.some(url => url.shortcode === newShortcode);
        logEvent('ShortcodeGenAttempt', { shortcode: newShortcode, unique: isUnique });
    } while (!isUnique);
    return newShortcode;
}

function isExpired(expiresAt) {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

// Simulate Backend API Call for Shortening
async function simulateShortenApi(urlData) {
    logEvent('SimulatingShortenApiCall', { urlData });
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const { originalUrl, validity, shortcode: preferredShortcode } = urlData;
            let generatedShortcode = preferredShortcode;
            if (!generatedShortcode) {
                generatedShortcode = generateUniqueShortcode();
            } else {
                if (allShortenedUrls.some(url => url.shortcode === preferredShortcode)) {
                    logEvent('ShortcodeCollision', { preferredShortcode });
                    return reject(new Error('Preferred shortcode is already in use. Please choose another.'));
                }
            }
            const minutes = validity ? Number(validity) : 30;
            const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
            const shortenedUrl = `http://localhost:3000/${generatedShortcode}`;
            logEvent('ShortenApiSuccess', { shortenedUrl, expiresAt });
            resolve({ shortenedUrl, expiresAt, shortcode: generatedShortcode });
        }, 1000);
    });
}

// Event Handler for Shorten URL Button
async function handleShortenUrl() {
    logEvent('ShortenUrlInitiated');
    const urlData = {
        originalUrl: originalUrlInput.value.trim(),
        validity: validityInput.value.trim(),
        shortcode: shortcodeInput.value.trim()
    };

    if (!urlData.originalUrl) { displayMessage(errorMessage, 'URL cannot be empty.', 'error'); return; }
    if (!isValidUrl(urlData.originalUrl)) { displayMessage(errorMessage, 'Invalid URL format (e.g., https://example.com).', 'error'); return; }
    if (urlData.validity !== '' && (isNaN(urlData.validity) || !Number.isInteger(Number(urlData.validity)) || Number(urlData.validity) <= 0)) {
        displayMessage(errorMessage, 'Validity must be a positive integer in minutes.', 'error'); return;
    }
    if (urlData.shortcode !== '' && !/^[a-zA-Z0-9]{3,15}$/.test(urlData.shortcode)) {
        displayMessage(errorMessage, 'Shortcode must be 3-15 alphanumeric characters.', 'error'); return;
    }

    shortenUrlBtn.disabled = true;
    displayMessage(loadingMessage, '', 'loading');
    resultBox.style.display = 'none';
    displayMessage(errorMessage, '', '');

    try {
        const { shortenedUrl, expiresAt, shortcode } = await simulateShortenApi(urlData);
        allShortenedUrls.push({ originalUrl: urlData.originalUrl, shortenedUrl, shortcode, expiresAt, createdAt: new Date().toISOString() });
        saveUrlsToLocalStorage();

        shortenedLink.href = shortenedUrl;
        shortenedLink.textContent = shortenedUrl;
        expiresAtText.textContent = new Date(expiresAt).toLocaleString();
        resultBox.style.display = 'block';
        displayMessage(loadingMessage, '', '');
        logEvent('UrlShorteningCompleted', { shortcode });

        originalUrlInput.value = '';
        validityInput.value = '';
        shortcodeInput.value = '';
    } catch (err) {
        console.error("Error shortening URL:", err);
        displayMessage(errorMessage, err.message || 'Failed to shorten URL.', 'error');
        displayMessage(loadingMessage, '', '');
        logEvent('UrlShorteningFailed', { error: err.message });
    } finally {
        shortenUrlBtn.disabled = false;
    }
}

// Render Statistics Table
function renderStatistics() {
    statisticsTableBody.innerHTML = '';
    if (allShortenedUrls.length === 0) {
        noUrlsMessage.style.display = 'block';
        statisticsTableContainer.style.display = 'none';
    } else {
        noUrlsMessage.style.display = 'none';
        statisticsTableContainer.style.display = 'block';
        allShortenedUrls.forEach(url => {
            const row = statisticsTableBody.insertRow();
            const expired = isExpired(url.expiresAt);
            if (expired) { row.classList.add('expired'); }
            row.innerHTML = `
                <td class="max-w-xs"><a href="${url.originalUrl}" target="_blank" rel="noopener noreferrer">${url.originalUrl}</a></td>
                <td class="max-w-xs"><a href="${url.shortenedUrl}" target="_blank" rel="noopener noreferrer">${url.shortenedUrl}</a></td>
                <td>${url.shortcode}</td>
                <td>${url.expiresAt ? new Date(url.expiresAt).toLocaleString() : 'Never'}</td>
                <td><span class="status-badge ${expired ? 'expired' : 'active'}">${expired ? 'Expired' : 'Active'}</span></td>
                <td>
                    <button class="table-action-btn" onclick="handleRedirect('${url.shortcode}')">Redirect</button>
                    <button class="table-action-btn copy-btn" onclick="copyToClipboard('${url.shortenedUrl}')">Copy</button>
                </td>
            `;
        });
    }
}

// Event Handler for Redirect Button in Statistics
function handleRedirect(shortcode) {
    logEvent('RedirectAttempt', { shortcode });
    const urlToRedirect = allShortenedUrls.find(url => url.shortcode === shortcode);
    if (urlToRedirect) {
        window.open(urlToRedirect.originalUrl, '_blank');
        logEvent('RedirectSuccess', { originalUrl: urlToRedirect.originalUrl });
    } else {
        alert('Shortened URL not found!');
        logEvent('RedirectNotFound', { shortcode });
    }
}

// Utility Function to Copy Text to Clipboard
function copyToClipboard(text) {
    const tempInput = document.createElement('textarea');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    alert('Shortened URL copied to clipboard!');
    logEvent('UrlCopied', { url: text });
}

// Initialization on Window Load
window.onload = function() {
    loadUrlsFromLocalStorage();
    showView('shortener');

    shortenerTabBtn.addEventListener('click', () => showView('shortener'));
    statisticsTabBtn.addEventListener('click', () => showView('statistics'));
    shortenUrlBtn.addEventListener('click', handleShortenUrl);
    copyLinkBtn.addEventListener('click', () => copyToClipboard(shortenedLink.href));
};
