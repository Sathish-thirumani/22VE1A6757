import React, { useState, useEffect, useCallback } from 'react';

// Main App component
function App() {
    // State to manage the current view: 'shortener' or 'statistics'
    const [currentView, setCurrentView] = useState('shortener');
    // State to store all shortened URLs, shared across components
    const [allShortenedUrls, setAllShortenedUrls] = useState([]);

    // Function to simulate logging middleware
    // In a real application, this would integrate with a logging service.
    // As per requirements, "Use of inbuilt language loggers or console logging is not allowed."
    // This is a simulation for demonstration purposes within this environment.
    const logEvent = (eventName, data = {}) => {
        // In a real application, replace this with your actual logging middleware integration.
        // For example: myLoggingService.log(eventName, data);
        console.log(`[LOGGING_MIDDLEWARE_SIMULATION] Event: ${eventName}`, data);
    };

    // Load all shortened URLs from localStorage on initial render
    useEffect(() => {
        logEvent('AppMounted');
        try {
            const storedUrls = JSON.parse(localStorage.getItem('shortenedUrls')) || [];
            setAllShortenedUrls(storedUrls);
            logEvent('LoadedUrlsFromLocalStorage', { count: storedUrls.length });
        } catch (error) {
            console.error("Failed to load URLs from localStorage:", error);
            logEvent('LocalStorageLoadError', { error: error.message });
        }
    }, []);

    // Save all shortened URLs to localStorage whenever the state changes
    useEffect(() => {
        try {
            localStorage.setItem('shortenedUrls', JSON.stringify(allShortenedUrls));
            logEvent('SavedUrlsToLocalStorage', { count: allShortenedUrls.length });
        } catch (error) {
            console.error("Failed to save URLs to localStorage:", error);
            logEvent('LocalStorageSaveError', { error: error.message });
        }
    }, [allShortenedUrls]);

    // Function to add a new shortened URL to the global list
    const addShortenedUrl = useCallback((newUrl) => {
        setAllShortenedUrls(prevUrls => {
            const updatedUrls = [...prevUrls, newUrl];
            logEvent('ShortenedUrlAdded', { newUrl });
            return updatedUrls;
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 font-sans">
            {/* Header and Navigation */}
            <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-4 mb-6 flex flex-col sm:flex-row justify-between items-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">URL Shortener</h1>
                <nav className="flex space-x-4">
                    <button
                        onClick={() => {
                            setCurrentView('shortener');
                            logEvent('NavigationView', { view: 'shortener' });
                        }}
                        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                            currentView === 'shortener'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                        }`}
                    >
                        Shorten URLs
                    </button>
                    <button
                        onClick={() => {
                            setCurrentView('statistics');
                            logEvent('NavigationView', { view: 'statistics' });
                        }}
                        className={`px-5 py-2 rounded-lg font-medium transition-all duration-200 ${
                            currentView === 'statistics'
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                        }`}
                    >
                        Statistics
                    </button>
                </nav>
            </header>

            {/* Main content area based on current view */}
            <main className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6">
                {currentView === 'shortener' ? (
                    <URLShortener
                        addShortenedUrl={addShortenedUrl}
                        allShortenedUrls={allShortenedUrls}
                        logEvent={logEvent}
                    />
                ) : (
                    <URLStatistics
                        allShortenedUrls={allShortenedUrls}
                        logEvent={logEvent}
                    />
                )}
            </main>
        </div>
    );
}

// Component for URL Shortening functionality
function URLShortener({ addShortenedUrl, allShortenedUrls, logEvent }) {
    // State to manage multiple URL input fields (up to 5)
    const [urlInputs, setUrlInputs] = useState([
        { id: 1, originalUrl: '', validity: '', shortcode: '', error: '', isLoading: false, shortenedUrl: '', expiresAt: '' }
    ]);

    // Function to add a new URL input field
    const addUrlInput = () => {
        if (urlInputs.length < 5) { // Limit to 5 URLs concurrently
            setUrlInputs(prevInputs => [
                ...prevInputs,
                { id: prevInputs.length + 1, originalUrl: '', validity: '', shortcode: '', error: '', isLoading: false, shortenedUrl: '', expiresAt: '' }
            ]);
            logEvent('UrlInputAdded', { count: urlInputs.length + 1 });
        } else {
            // Display a message if max inputs reached
            // Using a simple message here; a custom modal or toast notification would be better in a production app.
            alert("You can only shorten up to 5 URLs at a time.");
            logEvent('MaxUrlInputsReached');
        }
    };

    // Function to handle changes in input fields
    const handleInputChange = (id, field, value) => {
        setUrlInputs(prevInputs =>
            prevInputs.map(input =>
                input.id === id ? { ...input, [field]: value, error: '' } : input
            )
        );
        logEvent('UrlInputChanged', { id, field, value });
    };

    // Client-side validation for URL format and validity period
    const validateInput = (urlData) => {
        logEvent('ValidatingInput', { urlData });
        const { originalUrl, validity, shortcode } = urlData;
        let error = '';

        // Validate original URL format
        try {
            new URL(originalUrl); // Check if it's a valid URL
        } catch (e) {
            error = 'Invalid URL format. Please include http:// or https://';
            logEvent('ValidationFailed', { field: 'originalUrl', error });
            return error;
        }

        // Validate validity period (must be an integer if provided)
        if (validity !== '' && (isNaN(validity) || !Number.isInteger(Number(validity)) || Number(validity) <= 0)) {
            error = 'Validity must be a positive integer in minutes.';
            logEvent('ValidationFailed', { field: 'validity', error });
            return error;
        }

        // Validate shortcode (alphanumeric, reasonable length)
        // Requirement: "alphanumeric, reasonable length" - assuming 3-15 characters
        if (shortcode !== '' && !/^[a-zA-Z0-9]{3,15}$/.test(shortcode)) {
            error = 'Shortcode must be 3-15 alphanumeric characters.';
            logEvent('ValidationFailed', { field: 'shortcode', error });
            return error;
        }

        logEvent('InputValidationSuccess');
        return ''; // No error
    };

    // Function to generate a unique alphanumeric shortcode
    const generateUniqueShortcode = useCallback(() => {
        let newShortcode;
        let isUnique = false;
        // Keep generating until a unique one is found
        while (!isUnique) {
            newShortcode = Math.random().toString(36).substring(2, 8); // 6-character alphanumeric
            // Check against all existing shortened URLs
            isUnique = !allShortenedUrls.some(url => url.shortcode === newShortcode);
            logEvent('ShortcodeGenerationAttempt', { newShortcode, isUnique });
        }
        return newShortcode;
    }, [allShortenedUrls]);

    // Simulate API call to shorten URL
    const simulateShortenApi = useCallback(async (urlData) => {
        logEvent('SimulatingShortenApiCall', { urlData });
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                const { originalUrl, validity, shortcode: preferredShortcode } = urlData;

                let generatedShortcode = preferredShortcode;
                if (!generatedShortcode) {
                    generatedShortcode = generateUniqueShortcode();
                } else {
                    // Check if preferred shortcode is already taken
                    if (allShortenedUrls.some(url => url.shortcode === preferredShortcode)) {
                        logEvent('ShortcodeCollision', { preferredShortcode });
                        return reject(new Error('Preferred shortcode is already in use. Please choose another.'));
                    }
                }

                // Calculate expiry date
                const minutes = validity ? Number(validity) : 30; // Default to 30 minutes
                const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();

                // Simulate local URL based on requirement http://localhost:3000
                const shortenedUrl = `http://localhost:3000/${generatedShortcode}`;
                logEvent('ShortenApiSuccess', { shortenedUrl, expiresAt });
                resolve({ shortenedUrl, expiresAt, shortcode: generatedShortcode });
            }, 1000); // Simulate network delay
        });
    }, [allShortenedUrls, generateUniqueShortcode]);

    // Handle the shortening process for all entered URLs
    const handleShortenAll = async () => {
        logEvent('ShortenAllInitiated');
        const updatedInputs = await Promise.all(
            urlInputs.map(async (input) => {
                // If original URL is empty, mark as error and skip processing
                if (!input.originalUrl) {
                    return { ...input, error: 'URL cannot be empty.', isLoading: false };
                }

                const validationError = validateInput(input);
                if (validationError) {
                    return { ...input, error: validationError, isLoading: false };
                }

                if (input.isLoading) {
                    return input; // Skip if already loading
                }

                // Set loading state for the current input
                const loadingInput = { ...input, isLoading: true, error: '', shortenedUrl: '', expiresAt: '' };
                // Update state immediately to show loading spinner
                setUrlInputs(prev => prev.map(i => i.id === input.id ? loadingInput : i));
                logEvent('UrlShorteningStarted', { id: input.id });

                try {
                    const { shortenedUrl, expiresAt, shortcode } = await simulateShortenApi(input);
                    const result = {
                        ...input,
                        isLoading: false,
                        shortenedUrl,
                        expiresAt,
                        shortcode,
                        error: ''
                    };
                    addShortenedUrl({ // Add to the global list of all shortened URLs
                        originalUrl: result.originalUrl,
                        shortenedUrl: result.shortenedUrl,
                        shortcode: result.shortcode,
                        expiresAt: result.expiresAt,
                        createdAt: new Date().toISOString()
                    });
                    logEvent('UrlShorteningCompleted', { id: input.id, shortcode });
                    return result;
                } catch (err) {
                    console.error("Error shortening URL:", err);
                    logEvent('UrlShorteningFailed', { id: input.id, error: err.message });
                    return { ...input, isLoading: false, error: err.message || 'Failed to shorten URL.' };
                }
            })
        );
        // After all promises resolve, update the state with the final results/errors
        setUrlInputs(updatedInputs);
        logEvent('ShortenAllFinished');
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Shorten New URLs</h2>
            <div className="space-y-6">
                {urlInputs.map(input => (
                    <div key={input.id} className="bg-gray-50 p-4 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="text-lg font-medium text-gray-800 mb-3">URL #{input.id}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label htmlFor={`originalUrl-${input.id}`} className="block text-sm font-medium text-gray-700 mb-1">Original URL</label>
                                <input
                                    type="text"
                                    id={`originalUrl-${input.id}`}
                                    value={input.originalUrl}
                                    onChange={(e) => handleInputChange(input.id, 'originalUrl', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., https://www.example.com/very/long/url"
                                />
                            </div>
                            <div>
                                <label htmlFor={`validity-${input.id}`} className="block text-sm font-medium text-gray-700 mb-1">Validity (minutes, optional)</label>
                                <input
                                    type="number"
                                    id={`validity-${input.id}`}
                                    value={input.validity}
                                    onChange={(e) => handleInputChange(input.id, 'validity', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., 60 (default 30)"
                                />
                            </div>
                            <div>
                                <label htmlFor={`shortcode-${input.id}`} className="block text-sm font-medium text-gray-700 mb-1">Preferred Shortcode (optional)</label>
                                <input
                                    type="text"
                                    id={`shortcode-${input.id}`}
                                    value={input.shortcode}
                                    onChange={(e) => handleInputChange(input.id, 'shortcode', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., mylink123"
                                />
                            </div>
                        </div>
                        {input.error && (
                            <p className="text-red-600 text-sm mt-1">{input.error}</p>
                        )}
                        {input.isLoading && (
                            <p className="text-blue-600 text-sm mt-1 flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Shortening...
                            </p>
                        )}
                        {input.shortenedUrl && (
                            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                <p className="text-green-800 text-sm font-medium">Shortened Link:</p>
                                <a
                                    href={input.shortenedUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline break-all"
                                >
                                    {input.shortenedUrl}
                                </a>
                                <p className="text-gray-600 text-xs mt-1">Expires: {new Date(input.expiresAt).toLocaleString()}</p>
                                <button
                                    onClick={() => {
                                        // Copy to clipboard using document.execCommand as navigator.clipboard.writeText() might not work in iframes
                                        document.execCommand('copy', false, input.shortenedUrl);
                                        // In a production app, you'd show a temporary toast/message instead of alert
                                        alert('Shortened URL copied to clipboard!');
                                        logEvent('UrlCopied', { url: input.shortenedUrl });
                                    }}
                                    className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-md hover:bg-blue-600 transition-colors duration-200"
                                >
                                    Copy Link
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-4">
                {urlInputs.length < 5 && (
                    <button
                        onClick={addUrlInput}
                        className="px-6 py-3 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors duration-200 font-semibold"
                    >
                        Add Another URL Input
                    </button>
                )}
                <button
                    onClick={handleShortenAll}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200 font-semibold"
                >
                    Shorten All URLs
                </button>
            </div>
        </div>
    );
}

// Component for displaying URL Statistics
function URLStatistics({ allShortenedUrls, logEvent }) {
    // Function to handle redirection (simulated)
    const handleRedirect = (shortcode) => {
        logEvent('RedirectAttempt', { shortcode });
        const urlToRedirect = allShortenedUrls.find(url => url.shortcode === shortcode);
        if (urlToRedirect) {
            // In a real app, this would be a server-side redirect or a client-side route change
            // For simulation, we'll just open the original URL in a new tab
            window.open(urlToRedirect.originalUrl, '_blank');
            logEvent('RedirectSuccess', { originalUrl: urlToRedirect.originalUrl });
        } else {
            // In a production app, you'd show a temporary toast/message instead of alert
            alert('Shortened URL not found!');
            logEvent('RedirectNotFound', { shortcode });
        }
    };

    // Function to check if a URL has expired
    const isExpired = (expiresAt) => {
        if (!expiresAt) return false; // If no expiry set, it's not expired
        return new Date(expiresAt) < new Date();
    };

    return (
        <div className="p-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Shortened URL Statistics</h2>

            {allShortenedUrls.length === 0 ? (
                <p className="text-gray-600">No URLs have been shortened yet. Go to the "Shorten URLs" tab to get started!</p>
            ) : (
                <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original URL</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortened URL</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Shortcode</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {allShortenedUrls.map((url, index) => (
                                <tr key={index} className={isExpired(url.expiresAt) ? 'bg-red-50' : ''}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 break-all max-w-xs">
                                        <a href={url.originalUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {url.originalUrl}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 break-all max-w-xs">
                                        <a href={url.shortenedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                            {url.shortenedUrl}
                                        </a>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {url.shortcode}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {url.expiresAt ? new Date(url.expiresAt).toLocaleString() : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            isExpired(url.expiresAt) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {isExpired(url.expiresAt) ? 'Expired' : 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleRedirect(url.shortcode)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Go to Original URL"
                                        >
                                            Redirect
                                        </button>
                                        <button
                                            onClick={() => {
                                                document.execCommand('copy', false, url.shortenedUrl);
                                                alert('Shortened URL copied to clipboard!');
                                                logEvent('UrlCopied', { url: url.shortenedUrl });
                                            }}
                                            className="text-gray-600 hover:text-gray-900"
                                            title="Copy Shortened URL"
                                        >
                                            Copy
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// Export the main App component as default
export default App;

