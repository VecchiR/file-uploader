// variable to store the current move operation details
let currentMoveOperation = {
    itemType: null,
    itemId: null,
    originalFolder: null,
    targetFolder: null
};

function toggleContextMenu(id) {
    // Close all other menus first
    document.querySelectorAll('.context-menu.show').forEach(menu => {
        if (menu.id !== id) {
            menu.classList.remove('show');
        }
    });

    // Toggle the clicked menu
    const menu = document.getElementById(id);
    menu.classList.toggle('show');
}

// Close context menus when clicking outside
document.addEventListener('click', (event) => {
    if (!event.target.closest('.context-button') && !event.target.closest('.context-menu')) {
        document.querySelectorAll('.context-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }
});

function showRenameInput(itemType, itemId, currentName) {
    // Hide the context menu
    const menuId = `${itemType}-${itemId}`;
    const menu = document.getElementById(menuId);
    menu.classList.remove('show');

    // Show the rename form
    const renameForm = document.getElementById(`rename-${itemType}-${itemId}`);
    renameForm.style.display = 'block';

    // Focus the input and select the text
    const input = renameForm.querySelector('input[name="new_name"]');
    input.focus();
    input.select();
}

function hideRenameInput(itemType, itemId) {
    const renameForm = document.getElementById(`rename-${itemType}-${itemId}`);
    renameForm.style.display = 'none';
}

function deleteItem(itemType, itemId) {
    if (confirm(`Are you sure you want to delete this ${itemType}?`)) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/storage/${itemType}/${itemId}/delete`;
        document.body.appendChild(form);
        form.submit();
    }
}


async function showMoveItemModal(itemType, itemId, parentFolderId) {
    // Hide context menu first
    const menuId = `${itemType}-${itemId}`;
    const menu = document.getElementById(menuId);
    menu.classList.remove('show');

    // Store current operation details
    currentMoveOperation = {
        itemType,
        itemId,
        originalFolder: parentFolderId,
        targetFolder: parentFolderId,
    };

 
    document.getElementById('move-dialog-title').textContent = `Move ${itemType}`;
    const confirmBtn = document.getElementById('move-confirm-btn');
    confirmBtn.onclick = () => moveItem(currentMoveOperation.itemType, currentMoveOperation.itemId);


    // Show dialog and fetch data
    const dialog = document.getElementById('move-dialog');
    dialog.showModal();

    // Fetch and populate initial data
    await fetchAndUpdateModalContent(parentFolderId);
}

function closeMoveDialog() {
    document.getElementById('move-dialog').close();
    currentMoveOperation = { itemType: null, itemId: null, targetFolder: null, originalFolder: null };
}

async function fetchAndUpdateModalContent(folderId = null) {
    try {

        const param = folderId ? `?folderId=${folderId}` : "";
        const url = `/storage/getMoveData${param}`;

        const response = await fetch(url);
        const data = await response.json();
        updateModalContent(data);
    } catch (err) {
        console.error('Error fetching folder data:', err);
    }
}

function updateModalContent(data) {
    const pathContainer = document.getElementById('move-folder-path');
    const listContainer = document.getElementById('move-folder-list');

    let path = "";
    data.currentPath.forEach(folder => {
        path = path + `<span 
            onclick="handleFolderClick('${encodeURIComponent(JSON.stringify(folder))}')"
            style="cursor: pointer;"
        >${folder.name}/</span>`;
    });

    let folderList = "";
    if (data.availableFolders.length < 1) {
        folderList = 'No folders here';
    } else {
        data.availableFolders.forEach(folder => {
            folderList = folderList + `
            <div onclick="handleFolderClick('${encodeURIComponent(JSON.stringify(folder))}')"
            style="cursor: pointer;">
                ${folder.name}
            </div>
            `;
        });
    }

    // Update specific containers instead of entire dialog
    pathContainer.innerHTML = path;
    listContainer.innerHTML = folderList;
}

function handleFolderClick(encodedFolder) {
    const folder = JSON.parse(decodeURIComponent(encodedFolder));
    console.log('clicked path', folder);

    // Fetch new data for this folder
    fetchAndUpdateModalContent(folder.id);

    currentMoveOperation.targetFolder = folder.id;
}

async function moveItem(itemType, itemId) {
    const targetFolderId = currentMoveOperation.targetFolder || 'null';
    try {
        // Create a form to submit
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = `/storage/${itemType}/${itemId}/move/${targetFolderId}`;
        document.body.appendChild(form);

        // Submit the form (this will handle the redirect with errors if any)
        form.submit();
    } catch (err) {
        console.error('Error moving item:', err);
        window.location.reload(); // Fallback to reload on error
    }
}