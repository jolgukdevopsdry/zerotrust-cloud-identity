/**
 * Azure Blob Storage integration for listing blobs
 * Uses MSAL.js for authentication with managed identity flow
 * 
 * Configuration:
 * - Storage Account: gdsblobstoragedemo
 * - Container: blobcontainer
 * - Authentication: Azure AD tokens with Storage.Blob.Read scope
 */

// Storage account configuration
const storageConfig = {
    storageAccountName: "gdsblobstoragedemo",
    containerName: "blobcontainer",
    storageUrl: "https://gdsblobstoragedemo.blob.core.windows.net"
};

/**
 * List blobs in the configured storage container
 * Uses Azure Storage REST API with Azure AD authentication
 */
async function listBlobs() {
    try {
        console.log('Starting blob listing operation...');
        
        // Show loading state
        const blobGridContainer = document.getElementById("blob-grid-container");
        const blobGridBody = document.getElementById("blob-grid-body");
        
        if (blobGridContainer) {
            blobGridContainer.style.display = 'block';
            blobGridBody.innerHTML = '<tr><td colspan="2">Loading storage files...</td></tr>';        }

        // Get access token for Azure Storage
        let account = myMSALObj.getActiveAccount();
        
        // If no active account, try to get all accounts and use the first one
        if (!account) {
            const accounts = myMSALObj.getAllAccounts();
            if (accounts.length === 0) {
                throw new Error('No accounts found. Please sign in first.');
            }
            account = accounts[0];
            myMSALObj.setActiveAccount(account);
        }        console.log('Using account:', account.username);

        // Request token for Azure Storage
        let tokenResponse;
        try {
            tokenResponse = await myMSALObj.acquireTokenSilent({
                scopes: ["https://storage.azure.com/.default"],
                account: account
            });
        } catch (error) {
            console.log('Silent token acquisition failed, trying interactive flow:', error);
            // If silent token acquisition fails, try interactive flow
            tokenResponse = await myMSALObj.acquireTokenRedirect({
                scopes: ["https://storage.azure.com/.default"],
                account: account
            });
            return; // Function will continue after redirect
        }

        console.log('Successfully acquired storage token');

        // Call Azure Storage REST API to list blobs
        const listBlobsUrl = `${storageConfig.storageUrl}/${storageConfig.containerName}?restype=container&comp=list`;
        
        const response = await fetch(listBlobsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${tokenResponse.accessToken}`,
                'x-ms-version': '2020-04-08',
                'Content-Type': 'application/xml'
            }
        });

        if (!response.ok) {
            throw new Error(`Storage API request failed: ${response.status} ${response.statusText}`);
        }

        const xmlText = await response.text();
        console.log('Storage API response received');

        // Parse XML response
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        
        // Extract blob information
        const blobs = xmlDoc.getElementsByTagName("Blob");
        const blobList = [];

        for (let i = 0; i < blobs.length; i++) {
            const blob = blobs[i];
            const name = blob.getElementsByTagName("Name")[0]?.textContent || 'Unknown';
            const propertiesNode = blob.getElementsByTagName("Properties")[0];
            const contentLength = propertiesNode?.getElementsByTagName("Content-Length")[0]?.textContent || '0';
            
            blobList.push({
                name: name,
                size: parseInt(contentLength, 10)
            });
        }

        console.log(`Found ${blobList.length} blobs in storage`);

        // Update UI with blob list
        updateBlobGrid(blobList);

    } catch (error) {
        console.error('Error listing blobs:', error);
        
        // Show error in UI
        const blobGridContainer = document.getElementById("blob-grid-container");
        const blobGridBody = document.getElementById("blob-grid-body");
        
        if (blobGridContainer && blobGridBody) {
            blobGridContainer.style.display = 'block';
            blobGridBody.innerHTML = `
                <tr>
                    <td colspan="2" class="text-danger">
                        Error loading storage files: ${error.message}
                        <br><small>Please ensure you're signed in and have appropriate permissions.</small>
                    </td>
                </tr>
            `;
        }
        
        // Re-throw for any additional error handling
        throw error;
    }
}

/**
 * Update the blob grid UI with the list of blobs
 * @param {Array} blobList - Array of blob objects with name and size properties
 */
function updateBlobGrid(blobList) {
    const blobGridBody = document.getElementById("blob-grid-body");
    const blobGridContainer = document.getElementById("blob-grid-container");
    
    if (!blobGridBody || !blobGridContainer) {
        console.error('Blob grid elements not found');
        return;
    }

    // Clear existing content
    blobGridBody.innerHTML = '';

    if (blobList.length === 0) {
        blobGridBody.innerHTML = `
            <tr>
                <td colspan="2" class="text-muted">
                    No files found in storage container '${storageConfig.containerName}'
                </td>
            </tr>
        `;
    } else {
        // Add each blob as a table row
        blobList.forEach(blob => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${escapeHtml(blob.name)}</td>
                <td>${formatFileSize(blob.size)}</td>
            `;
            blobGridBody.appendChild(row);
        });
    }

    // Show the container
    blobGridContainer.style.display = 'block';
}

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const formattedSize = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${formattedSize} ${sizes[i]}`;
}

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Initialize blob storage functionality when page loads
 */
function initializeBlobStorage() {
    console.log('Blob storage module initialized');
    
    // Add click handler for the list blobs button
    const listBlobsButton = document.getElementById("listBlobs");
    if (listBlobsButton) {
        listBlobsButton.addEventListener('click', listBlobs);
    }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBlobStorage);
} else {
    initializeBlobStorage();
}