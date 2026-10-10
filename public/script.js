class WarehouseManager {
    constructor() {
        this.packages = []; // Initialize as empty, data will be fetched from backend
        this.currentTab = 'all';
        this.searchQuery = '';
        this.init();
        initializeChatbot(); // Initialize the chatbot
    }

    async init() {
        await this.fetchPackages();
        this.updateStats();
        this.renderPackages();
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderPackages();
        });

        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });
    }

    async fetchPackages() {
        try {
            const response = await fetch('/api/packages');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.packages = await response.json();
        } catch (error) {
            console.error('Error fetching packages:', error);
            this.showToast('Failed to load packages. Please try again later.', 'error');
        }
    }

    updateStats() {
        const stats = this.packages.reduce((acc, pkg) => {
            acc[pkg.status] = (acc[pkg.status] || 0) + 1;
            acc.total++;
            return acc;
        }, { received: 0, 'in-transit': 0, delivered: 0, total: 0 });

        document.getElementById('receivedCount').textContent = stats.received;
        document.getElementById('inTransitCount').textContent = stats['in-transit'];
        document.getElementById('deliveredCount').textContent = stats.delivered;
        document.getElementById('totalCount').textContent = stats.total;
        const filteredPackages = this.getFilteredPackages();
        document.getElementById('allCount').textContent = filteredPackages.length;
        document.getElementById('receivedTabCount').textContent = filteredPackages.filter(p => p.status === 'received').length;
        document.getElementById('inTransitTabCount').textContent = filteredPackages.filter(p => p.status === 'in-transit').length;
        document.getElementById('deliveredTabCount').textContent = filteredPackages.filter(p => p.status === 'delivered').length;
    }

    getFilteredPackages() {
        let filtered = this.packages;
        
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
        const emptyMessage = document.getElementById('emptyMessage');
        
        const filteredPackages = this.getFilteredPackages();
        
        if (filteredPackages.length === 0) {
            packagesGrid.style.display = 'none';
            emptyState.classList.remove('hidden');
            emptyMessage.textContent = this.searchQuery ? 
                'Try adjusting your search terms' : 
                'Add your first package to get started';
        } else {
            packagesGrid.style.display = 'grid';
            emptyState.classList.add('hidden');
            
            packagesGrid.innerHTML = filteredPackages.map(pkg => this.renderPackageCard(pkg)).join('');
        }
        
        this.updateStats();
    }

    renderPackageCard(pkg) {
        const statusConfig = {
            received: { icon: 'fas fa-box', label: 'Received', class: 'received' },
            'in-transit': { icon: 'fas fa-truck', label: 'In Transit', class: 'in-transit' },
            delivered: { icon: 'fas fa-check-circle', label: 'Delivered', class: 'delivered' }
        };

        const config = statusConfig[pkg.status];
        const date = new Date(pkg.createdAt).toLocaleDateString();
        
        let actions = '';
        if (pkg.status === 'received') {
            actions = `<button class="action-btn ship" onclick="warehouseManager.updateStatus('${pkg._id}', 'in-transit')">
                <i class="fas fa-truck"></i> Ship Package
            </button>`;
        } else if (pkg.status === 'in-transit') {
            actions = `<button class="action-btn deliver" onclick="warehouseManager.updateStatus('${pkg._id}', 'delivered')">
                <i class="fas fa-check-circle"></i> Mark Delivered
            </button>`;
        }
        return `
            <div class="package-card">
                <div class="package-header">
                    <div class="package-id">
                        <i class="fas fa-box"></i>
                        #${pkg.packageId}
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
                        <span>${pkg.weight || 'N/A'} kg</span>
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
                        <label>Created</label>
                        <span><i class="fas fa-clock"></i> ${date}</span>
                    </div>
                </div>
                ${actions ? `<div class="package-actions">${actions}</div>` : ''}
            </div>
        `;
    }

    async addPackage(packageData) {
        try {
            const response = await fetch('/api/packages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(packageData)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const newPackage = await response.json();
            this.packages.unshift(newPackage);
            this.renderPackages();
            this.showToast(`Package #${newPackage.packageId} has been successfully added to the warehouse.`);
            return true;
        } catch (error) {
            console.error('Error adding package:', error);
            this.showToast('Failed to add package. Please try again.', 'error');
            return false;
        }
    }

    async updateStatus(packageId, newStatus) {
        try {
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
            const packageIndex = this.packages.findIndex(pkg => pkg.id === id);
            if (packageIndex !== -1) {
                this.packages[packageIndex] = updatedPackage;
            }
            
            this.renderPackages();
            
            const statusMessages = {
                'in-transit': 'shipped',
                'delivered': 'marked as delivered'
            };
            
            this.showToast(`Package #${id} has been ${statusMessages[newStatus]}.`);
        } catch (error) {
            console.error('Error updating package status:', error);
            this.showToast('Failed to update package status. Please try again.', 'error');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        const toastIcon = toast.querySelector('i');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toastIcon.className = type === 'error' ? 'fas fa-times-circle' : 'fas fa-check-circle';
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    async processQuery(query) {
        try {
            const response = await fetch('/chatbot', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query: query })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error processing chatbot query:', error);
            return 'I am sorry, I am having trouble processing your request right now.';
        }
    }
}

let warehouseManager;

function toggleAddForm() {
    const form = document.getElementById('addPackageForm');
    form.classList.toggle('hidden');
    
    if (!form.classList.contains('hidden')) {
        document.getElementById('description').focus();
    }
}

async function addPackage(event) {
    event.preventDefault();
    
    const formData = {
        description: document.getElementById('description').value,
        weight: parseFloat(document.getElementById('weight').value),
        sender: document.getElementById('sender').value,
        recipient: document.getElementById('recipient').value,
        location: document.getElementById('location').value
    };
    
    await warehouseManager.addPackage(formData);
    
    event.target.reset();
    toggleAddForm();
}

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    warehouseManager.currentTab = tab;
    warehouseManager.renderPackages();
}

async function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    const chatMessages = document.getElementById('chatMessages');
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.innerHTML = `<div class="message-content">${message}</div>`;
    chatMessages.appendChild(userMessage);
    

    const response = await warehouseManager.processQuery(message);

    setTimeout(() => {
        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        botMessage.innerHTML = `<div class="message-content">${response}</div>`;
        chatMessages.appendChild(botMessage);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 500);
    input.value = '';
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
document.addEventListener('DOMContentLoaded', () => {
    warehouseManager = new WarehouseManager();
});
