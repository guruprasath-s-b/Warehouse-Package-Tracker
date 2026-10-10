class WarehouseManager {
    constructor() {
        this.packages = [];
        this.currentTab = 'all';
        this.searchQuery = '';
        this.init();
    }

    async init() {
        await this.fetchPackages();
        this.updateStats();
        this.renderPackages();
        this.initEventListeners();
    }

    initEventListeners() {
        // Search input listener
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value.toLowerCase();
                this.renderPackages();
            });
        }

        // Chat input listener
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleChatMessage(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Add initial chatbot message
        const chatMessages = document.getElementById('chatMessages');
        if (chatMessages) {
            chatMessages.innerHTML = `
                <div class="message bot-message">
                    <div class="message-content">
                        <p>Hello! I'm your AI package assistant. You can ask me questions like:</p>
                        <ul>
                            <li>"What's the status of package ABC123?"</li>
                            <li>"How many packages are in transit?"</li>
                            <li>"Show me packages from [sender name]"</li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }

    async fetchPackages() {
        try {
            const response = await fetch('/api/packages');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.packages = await response.json();
            this.updateStats();
            this.renderPackages();
        } catch (error) {
            console.error('Error fetching packages:', error);
            this.showToast('Failed to load packages. Please try again later.', 'error');
        }
    }

    updateStats() {
        const stats = {
            received: 0,
            'in-transit': 0,
            delivered: 0,
            total: this.packages.length
        };

        this.packages.forEach(pkg => {
            if (pkg.status in stats) {
                stats[pkg.status]++;
            }
        });

        // Update stats display
        document.getElementById('receivedCount').textContent = stats.received;
        document.getElementById('inTransitCount').textContent = stats['in-transit'];
        document.getElementById('deliveredCount').textContent = stats.delivered;
        document.getElementById('totalCount').textContent = stats.total;
    }

    getFilteredPackages() {
        let filtered = [...this.packages];
        
        if (this.searchQuery) {
            filtered = filtered.filter(pkg => 
                (pkg.packageId && pkg.packageId.toLowerCase().includes(this.searchQuery)) ||
                (pkg.sender && pkg.sender.toLowerCase().includes(this.searchQuery)) ||
                (pkg.receiver && pkg.receiver.toLowerCase().includes(this.searchQuery)) ||
                (pkg.description && pkg.description.toLowerCase().includes(this.searchQuery))
            );
        }
        
        if (this.currentTab !== 'all') {
            filtered = filtered.filter(pkg => pkg.status === this.currentTab);
        }
        
        return filtered;
    }

    renderPackages() {
        const packagesGrid = document.getElementById('packagesGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!packagesGrid || !emptyState) return;
        
        const filtered = this.getFilteredPackages();
        
        if (filtered.length === 0) {
            packagesGrid.style.display = 'none';
            emptyState.classList.remove('hidden');
            const emptyMessage = document.getElementById('emptyMessage');
            if (emptyMessage) {
                emptyMessage.textContent = this.searchQuery ? 
                    'No packages match your search' : 
                    'Add your first package to get started';
            }
        } else {
            packagesGrid.style.display = 'grid';
            emptyState.classList.add('hidden');
            packagesGrid.innerHTML = filtered.map(pkg => this.renderPackageCard(pkg)).join('');
        }
        
        this.updateStats();
    }

    renderPackageCard(pkg) {
        const statusConfig = {
            received: { icon: 'fas fa-box', label: 'Received', class: 'received' },
            'in-transit': { icon: 'fas fa-truck', label: 'In Transit', class: 'in-transit' },
            delivered: { icon: 'fas fa-check-circle', label: 'Delivered', class: 'delivered' }
        };

        const config = statusConfig[pkg.status] || statusConfig.received;
        
        let actions = '';
        if (pkg.status === 'received') {
            actions = `
                <button class="action-btn ship" onclick="warehouseManager.updatePackageStatus('${pkg._id}', 'in-transit')">
                    <i class="fas fa-truck"></i> Ship Package
                </button>
            `;
        } else if (pkg.status === 'in-transit') {
            actions = `
                <button class="action-btn deliver" onclick="warehouseManager.updatePackageStatus('${pkg._id}', 'delivered')">
                    <i class="fas fa-check-circle"></i> Mark Delivered
                </button>
            `;
        }

        return `
            <div class="package-card">
                <div class="package-header">
                    <div class="package-id">
                        <i class="fas fa-box"></i>
                        #${pkg.packageId || pkg._id}
                    </div>
                    <div class="status-badge ${config.class}">
                        <i class="${config.icon}"></i>
                        ${config.label}
                    </div>
                </div>
                <div class="package-details">
                    <div class="detail-item">
                        <label>Description</label>
                        <span>${pkg.description || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Weight</label>
                        <span>${pkg.weight ? pkg.weight + ' kg' : 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>From</label>
                        <span>${pkg.sender || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>To</label>
                        <span>${pkg.receiver || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Location</label>
                        <span>${pkg.location || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Mobile</label>
                        <span>${pkg.mobile || 'N/A'}</span>
                    </div>
                </div>
                ${actions ? `<div class="package-actions">${actions}</div>` : ''}
            </div>
        `;
    }

    async updatePackageStatus(packageId, newStatus) {
        try {
            console.log('Updating package status:', packageId, newStatus);
            const response = await fetch(`/api/packages/${packageId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedPackage = await response.json();
            console.log('Package updated:', updatedPackage);
            
            // Update the package in the local array
            const index = this.packages.findIndex(p => p._id === packageId);
            if (index !== -1) {
                this.packages[index] = updatedPackage;
            }

            // Refresh the display
            this.renderPackages();
            this.showToast(`Package status updated to ${newStatus}`);
        } catch (error) {
            console.error('Error updating package status:', error);
            this.showToast('Failed to update package status. Please try again.', 'error');
        }
    }

    async handleChatMessage(message) {
        if (!message.trim()) return;

        const chatMessages = document.getElementById('chatMessages');
        
        // Add user message
        chatMessages.insertAdjacentHTML('beforeend', `
            <div class="message user-message">
                <div class="message-content">
                    <p>${message}</p>
                </div>
            </div>
        `);

        // Generate and add bot response
        const response = await this.processAIQuery(message);
        chatMessages.insertAdjacentHTML('beforeend', `
            <div class="message bot-message">
                <div class="message-content">
                    <p>${response}</p>
                </div>
            </div>
        `);

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async processAIQuery(query) {
        query = query.toLowerCase();
        
        // Package status query
        if (query.includes('status') && query.includes('package')) {
            const packageId = query.match(/#?([a-zA-Z0-9]+)/)?.[1];
            if (packageId) {
                const pkg = this.packages.find(p => 
                    p.packageId && p.packageId.toLowerCase() === packageId.toLowerCase());
                if (pkg) {
                    return `Package #${pkg.packageId} is currently ${pkg.status}`;
                }
                return "Sorry, I couldn't find that package.";
            }
        }

        // Count queries
        if (query.includes('how many')) {
            if (query.includes('in transit')) {
                const count = this.packages.filter(p => p.status === 'in-transit').length;
                return `There are ${count} packages in transit.`;
            }
            if (query.includes('received')) {
                const count = this.packages.filter(p => p.status === 'received').length;
                return `There are ${count} packages received.`;
            }
            if (query.includes('delivered')) {
                const count = this.packages.filter(p => p.status === 'delivered').length;
                return `There are ${count} packages delivered.`;
            }
            return `There are ${this.packages.length} total packages.`;
        }

        // Search by sender
        if (query.includes('from')) {
            const senderName = query.split('from ')[1]?.trim().toLowerCase();
            if (senderName) {
                const packages = this.packages.filter(p => 
                    p.sender && p.sender.toLowerCase().includes(senderName));
                if (packages.length > 0) {
                    return `Found ${packages.length} packages from "${senderName}":\n` +
                        packages.map(p => `- Package #${p.packageId || p._id}: ${p.status}`).join('\n');
                }
                return `No packages found from "${senderName}".`;
            }
        }

        return `I can help you with:
            - Package status (e.g., "What's the status of package ABC123?")
            - Package counts (e.g., "How many packages are in transit?")
            - Search by sender (e.g., "Show packages from John")
            Just ask me what you want to know!`;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        if (toast && toastMessage) {
            toast.className = `toast ${type} show`;
            toastMessage.textContent = message;
            
            setTimeout(() => {
                toast.className = 'toast hidden';
            }, 3000);
        }
    }
}

// Global functions
function switchTab(tab) {
    const warehouseManager = window.warehouseManager;
    if (warehouseManager) {
        warehouseManager.currentTab = tab;
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
        });
        warehouseManager.renderPackages();
    }
}

function sendMessage() {
    const warehouseManager = window.warehouseManager;
    const chatInput = document.getElementById('chatInput');
    if (warehouseManager && chatInput) {
        const message = chatInput.value.trim();
        if (message) {
            warehouseManager.handleChatMessage(message);
            chatInput.value = '';
        }
    }
}

// Initialize when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.warehouseManager = new WarehouseManager();
});