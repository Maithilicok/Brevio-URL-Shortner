document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const shortenForm = document.getElementById('shorten-form');
    const longUrlInput = document.getElementById('long-url');
    const submitBtn = document.getElementById('submit-btn');
    const submitBtnText = submitBtn.querySelector('span');
    const submitBtnIcon = submitBtn.querySelector('.btn-icon');
    const submitBtnSpinner = submitBtn.querySelector('.btn-spinner');
    
    const resultCard = document.getElementById('result-card');
    const shortUrlVal = document.getElementById('short-url-val');
    const copyBtn = document.getElementById('copy-btn');
    const qrCodeImg = document.getElementById('qr-code-img');
    const downloadQrBtn = document.getElementById('download-qr-btn');
    const origUrlLink = document.getElementById('orig-url-link');
    
    const historyEmpty = document.getElementById('history-empty');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    
    const analyticsCard = document.getElementById('analytics-card');
    const closeAnalyticsBtn = document.getElementById('close-analytics');
    const analyticsShortUrl = document.getElementById('analytics-short-url');
    const analyticsClicks = document.getElementById('analytics-clicks');
    const clicksLogList = document.getElementById('clicks-log-list');
    
    // Initialize Lucide Icons
    lucide.createIcons();

    // Chart.js instance
    let clicksChart = null;

    // Toast Notification Helper
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const iconName = type === 'success' ? 'check-circle' : 'alert-circle';
        toast.innerHTML = `
            <i data-lucide="${iconName}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        lucide.createIcons();
        
        // Remove toast after animation
        setTimeout(() => {
            toast.style.animation = 'toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) reverse forwards';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }

    // Load History from localStorage
    let linkHistory = JSON.parse(localStorage.getItem('brevio_history')) || [];

    // Save History
    function saveHistory() {
        localStorage.setItem('brevio_history', JSON.stringify(linkHistory));
    }

    // Render History UI
    async function renderHistory() {
        if (linkHistory.length === 0) {
            historyEmpty.classList.remove('hidden');
            historyList.classList.add('hidden');
            clearHistoryBtn.classList.add('hidden');
            return;
        }

        historyEmpty.classList.add('hidden');
        historyList.classList.remove('hidden');
        clearHistoryBtn.classList.remove('hidden');

        historyList.innerHTML = '';
        
        for (const item of linkHistory) {
            const shortUrl = `${window.location.origin}/${item.shortId}`;
            
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item animate-fade-in';
            
            historyItem.innerHTML = `
                <div class="item-left">
                    <a href="${shortUrl}" target="_blank" class="item-short-url">${window.location.host}/${item.shortId}</a>
                    <span class="item-long-url" title="${item.longUrl}">${item.longUrl}</span>
                </div>
                <div class="item-right">
                    <span class="click-badge" id="badge-${item.shortId}">
                        <i data-lucide="bar-chart-2"></i>
                        <span class="badge-count">${item.clicks || 0}</span> clicks
                    </span>
                    <div class="history-item-actions">
                        <button class="btn btn-icon-only copy-history-btn" data-url="${shortUrl}" title="Copy Link">
                            <i data-lucide="copy"></i>
                        </button>
                        <button class="btn btn-icon-only stats-history-btn" data-id="${item.shortId}" title="View Stats">
                            <i data-lucide="chart-line"></i>
                        </button>
                    </div>
                </div>
            `;
            
            historyList.appendChild(historyItem);
            
            // Try to fetch updated clicks for this item asynchronously
            fetchUpdatedClicks(item.shortId);
        }

        lucide.createIcons();
        setupHistoryActions();
    }

    // Fetch updated clicks from backend
    async function fetchUpdatedClicks(shortId) {
        try {
            const response = await fetch(`/url/analytics/${shortId}`);
            if (response.ok) {
                const data = await response.json();
                const badge = document.getElementById(`badge-${shortId}`);
                if (badge) {
                    badge.querySelector('.badge-count').textContent = data.totalClicks;
                }
                
                // Update internal history cache
                const index = linkHistory.findIndex(i => i.shortId === shortId);
                if (index !== -1) {
                    linkHistory[index].clicks = data.totalClicks;
                    saveHistory();
                }
            }
        } catch (error) {
            console.error('Error fetching updated clicks:', error);
        }
    }

    // Setup Event Listeners for History buttons
    function setupHistoryActions() {
        // Copy buttons
        document.querySelectorAll('.copy-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = btn.getAttribute('data-url');
                navigator.clipboard.writeText(url).then(() => {
                    showToast('Short URL copied to clipboard!');
                }).catch(() => {
                    showToast('Failed to copy link', 'danger');
                });
            });
        });

        // Stats buttons
        document.querySelectorAll('.stats-history-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const shortId = btn.getAttribute('data-id');
                loadAndShowAnalytics(shortId);
            });
        });
    }

    // Load and Render Analytics Card
    async function loadAndShowAnalytics(shortId) {
        analyticsCard.classList.add('hidden'); // Refresh card load
        
        try {
            const response = await fetch(`/url/analytics/${shortId}`);
            if (!response.ok) {
                throw new Error('Analytics not found');
            }

            const data = await response.json();
            const shortUrl = `${window.location.origin}/${shortId}`;
            
            // Update Card details
            analyticsShortUrl.textContent = `${window.location.host}/${shortId}`;
            analyticsShortUrl.href = shortUrl;
            analyticsClicks.textContent = data.totalClicks;

            // Render Log List
            clicksLogList.innerHTML = '';
            if (data.analytics.length === 0) {
                clicksLogList.innerHTML = '<div class="log-item">No clicks recorded yet</div>';
            } else {
                // Show latest clicks first
                const sortedHistory = [...data.analytics].reverse();
                sortedHistory.forEach((visit, index) => {
                    const clickDate = new Date(visit.timestamp);
                    const logItem = document.createElement('div');
                    logItem.className = 'log-item';
                    logItem.innerHTML = `
                        <span>
                            <span class="log-item-num">#${sortedHistory.length - index}</span> 
                            clicked at ${clickDate.toLocaleTimeString()}
                        </span>
                        <span>${clickDate.toLocaleDateString()}</span>
                    `;
                    clicksLogList.appendChild(logItem);
                });
            }

            // Create/Update Chart
            renderAnalyticsChart(data.analytics);

            // Display card
            analyticsCard.classList.remove('hidden');
            analyticsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        } catch (error) {
            console.error('Error fetching analytics:', error);
            showToast('Failed to fetch link stats', 'danger');
        }
    }

    // Render line chart of clicks
    function renderAnalyticsChart(analytics) {
        const ctx = document.getElementById('clicks-chart').getContext('2d');
        
        // Group clicks by date
        const clicksByDate = {};
        
        // Pre-fill last 7 days to show empty states or clean history
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            clicksByDate[dateStr] = 0;
        }

        // Add real visits
        analytics.forEach(visit => {
            const dateStr = new Date(visit.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            // Only group if within last 7 days scope, otherwise just insert
            clicksByDate[dateStr] = (clicksByDate[dateStr] || 0) + 1;
        });

        const labels = Object.keys(clicksByDate);
        const values = Object.values(clicksByDate);

        // Destroy previous chart if exists
        if (clicksChart) {
            clicksChart.destroy();
        }

        clicksChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Clicks',
                    data: values,
                    borderColor: '#00f0ff',
                    backgroundColor: 'rgba(0, 240, 255, 0.05)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointBackgroundColor: '#00f0ff',
                    pointBorderColor: '#050811',
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#00f0ff',
                    pointHoverBorderColor: '#050811',
                    pointHoverBorderWidth: 2,
                    pointRadius: 3,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: '#0b132b',
                        titleColor: '#00f0ff',
                        bodyColor: '#f1f5f9',
                        borderColor: 'rgba(0, 240, 255, 0.3)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 4,
                        displayColors: false,
                        callbacks: {
                            label: function(context) {
                                return `${context.parsed.y} click${context.parsed.y !== 1 ? 's' : ''}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#94a3b8',
                            font: {
                                family: 'Share Tech Mono',
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 240, 255, 0.04)'
                        },
                        ticks: {
                            color: '#94a3b8',
                            stepSize: 1,
                            font: {
                                family: 'Share Tech Mono',
                                size: 11
                            }
                        }
                    }
                }
            }
        });
    }

    // Shorten Form Submit Handler
    shortenForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const longUrl = longUrlInput.value.trim();
        if (!longUrl) return;

        // Button Loading State
        submitBtn.disabled = true;
        submitBtnText.style.opacity = '0';
        submitBtnIcon.style.opacity = '0';
        submitBtnSpinner.classList.remove('hidden');

        try {
            const response = await fetch('/url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: longUrl })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to shorten URL');
            }

            const data = await response.json();
            const shortUrl = `${window.location.origin}/${data.shortId}`;

            // Populate Result
            shortUrlVal.value = shortUrl;
            origUrlLink.href = longUrl;
            origUrlLink.textContent = longUrl;
            
            // Generate QR code on the fly
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shortUrl)}`;
            qrCodeImg.src = qrUrl;
            
            // Show result card
            resultCard.classList.remove('hidden');
            resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Store in LocalStorage History
            const newLink = {
                shortId: data.shortId,
                longUrl: longUrl,
                clicks: 0,
                createdAt: Date.now()
            };
            
            linkHistory.unshift(newLink);
            saveHistory();
            renderHistory();

            // Reset input
            longUrlInput.value = '';
            showToast('URL successfully shortened!');

        } catch (error) {
            console.error('Error shortening URL:', error);
            showToast(error.message || 'An error occurred. Please try again.', 'danger');
        } finally {
            // Restore Button State
            submitBtn.disabled = false;
            submitBtnText.style.opacity = '1';
            submitBtnIcon.style.opacity = '1';
            submitBtnSpinner.classList.add('hidden');
        }
    });

    // Copy to Clipboard Action
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(shortUrlVal.value).then(() => {
            showToast('Short URL copied to clipboard!');
            
            // Trigger temporary visual success state
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `<i data-lucide="check"></i> <span>Copied!</span>`;
            lucide.createIcons();
            
            setTimeout(() => {
                copyBtn.classList.remove('copied');
                copyBtn.innerHTML = `<i data-lucide="copy"></i> <span>Copy</span>`;
                lucide.createIcons();
            }, 2000);

        }).catch((err) => {
            console.error('Could not copy text: ', err);
            showToast('Failed to copy URL', 'danger');
        });
    });

    // Download QR Code Action
    downloadQrBtn.addEventListener('click', async () => {
        const qrUrl = qrCodeImg.src;
        if (!qrUrl) return;

        try {
            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `brevio-qr-${shortUrlVal.value.split('/').pop()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
            
            showToast('QR Code download started!');
        } catch (error) {
            console.error('Failed to download QR code', error);
            showToast('Failed to download QR Code. Try right-clicking it.', 'danger');
        }
    });

    // Clear History Action
    clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear your local short link history?')) {
            linkHistory = [];
            saveHistory();
            renderHistory();
            analyticsCard.classList.add('hidden');
            showToast('History cleared.');
        }
    });

    // Close Analytics Card Action
    closeAnalyticsBtn.addEventListener('click', () => {
        analyticsCard.classList.add('hidden');
    });

    // Init Render
    renderHistory();
});