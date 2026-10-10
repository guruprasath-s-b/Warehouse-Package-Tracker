function initializeChatbot() {
    // Add initial bot message
    const chatMessages = document.getElementById('chatMessages');
    const initialMessage = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Hello! I'm your AI package assistant. You can ask me questions like:</p>
                <ul>
                    <li>"What's the status of package ABC123?"</li>
                    <li>"How many packages are in transit?"</li>
                    <li>"Show me packages from [sender name]"</li>
                    <li>"Show packages to [receiver name]"</li>
                </ul>
            </div>
        </div>
    `;
    chatMessages.innerHTML = initialMessage;
}

async function processAIQuery(query, packages) {
    query = query.toLowerCase();
    
    // Package status query
    if (query.includes('status') && query.includes('package')) {
        const packageId = query.match(/#?([a-zA-Z0-9]+)/)?.[1];
        if (packageId) {
            const pkg = packages.find(p => p.packageId.toLowerCase() === packageId.toLowerCase());
            if (pkg) {
                return `Package #${pkg.packageId} is currently ${pkg.status}`;
            }
            return "Sorry, I couldn't find that package.";
        }
    }

    // Count queries
    if (query.includes('how many')) {
        if (query.includes('in transit')) {
            const count = packages.filter(p => p.status === 'in-transit').length;
            return `There are ${count} packages in transit.`;
        }
        if (query.includes('received')) {
            const count = packages.filter(p => p.status === 'received').length;
            return `There are ${count} packages received.`;
        }
        if (query.includes('delivered')) {
            const count = packages.filter(p => p.status === 'delivered').length;
            return `There are ${count} packages delivered.`;
        }
        if (query.includes('total') || query.includes('packages')) {
            return `There are ${packages.length} total packages.`;
        }
    }

    // Search by sender
    if (query.includes('from') || query.includes('sender')) {
        const senderName = query.replace(/.*(?:from|sender)\\s+/i, '').trim();
        const matchingPackages = packages.filter(p => 
            p.sender && p.sender.toLowerCase().includes(senderName)
        );
        if (matchingPackages.length > 0) {
            return `Found ${matchingPackages.length} packages from ${senderName}:\\n` +
                matchingPackages.map(p => `- Package #${p.packageId}: ${p.status}`).join('\\n');
        }
        return `No packages found from ${senderName}.`;
    }

    // Search by receiver
    if (query.includes('to') || query.includes('receiver')) {
        const receiverName = query.replace(/.*(?:to|receiver)\\s+/i, '').trim();
        const matchingPackages = packages.filter(p => 
            p.receiver && p.receiver.toLowerCase().includes(receiverName)
        );
        if (matchingPackages.length > 0) {
            return `Found ${matchingPackages.length} packages to ${receiverName}:\\n` +
                matchingPackages.map(p => `- Package #${p.packageId}: ${p.status}`).join('\\n');
        }
        return `No packages found to ${receiverName}.`;
    }

    return "I can help you with:\\n" +
        "- Package status (e.g., 'What's the status of package ABC123?')\\n" +
        "- Package counts (e.g., 'How many packages are in transit?')\\n" +
        "- Search by sender (e.g., 'Show packages from John')\\n" +
        "- Search by receiver (e.g., 'Show packages to Jane')";
}

async function sendChatMessage(message, packages) {
    const chatMessages = document.getElementById('chatMessages');
    
    // Add user message
    const userMessageHtml = `
        <div class="message user-message">
            <div class="message-content">
                <p>${message}</p>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', userMessageHtml);

    // Process the message and generate response
    const response = await processAIQuery(message, packages);

    // Add AI response
    const botMessageHtml = `
        <div class="message bot-message">
            <div class="message-content">
                <p>${response}</p>
            </div>
        </div>
    `;
    chatMessages.insertAdjacentHTML('beforeend', botMessageHtml);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}