async function addPackage(event) {
    event.preventDefault();
    
    const packageData = {
        description: document.getElementById('description').value,
        weight: document.getElementById('weight').value,
        sender: document.getElementById('sender').value,
        receiver: document.getElementById('receiver').value,
        location: document.getElementById('location').value,
        mobile: document.getElementById('mobile').value || '',
        notes: document.getElementById('notes').value || '',
        status: 'received'
    };

    try {
        console.log('Sending package data:', packageData);
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
        console.log('Package added successfully:', newPackage);

        // Clear form
        event.target.reset();
        // Hide form
        document.getElementById('addPackageForm').classList.add('hidden');

        // Show success message
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = 'Package added successfully';
            toast.className = 'toast success show';
            setTimeout(() => {
                toast.className = 'toast hidden';
            }, 3000);
        }

        // Refresh the package list if warehouseManager exists
        if (window.warehouseManager && typeof window.warehouseManager.fetchPackages === 'function') {
            await window.warehouseManager.fetchPackages();
        } else {
            // If no warehouse manager, reload the page
            window.location.reload();
        }

    } catch (error) {
        console.error('Error adding package:', error);
        // Show error message
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
            toastMessage.textContent = 'Failed to add package. Please try again.';
            toast.className = 'toast error show';
            setTimeout(() => {
                toast.className = 'toast hidden';
            }, 3000);
        }
    }
}

function toggleAddForm() {
    const form = document.getElementById('addPackageForm');
    form.classList.toggle('hidden');
}