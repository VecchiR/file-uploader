// Global variable to store the current move operation details
let currentMoveOperation = {
    itemType: null,
    itemId: null,
    dialog: null
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
        dialog: document.createElement('dialog')
    };

    // Setup dialog
    currentMoveOperation.dialog.id = `move-modal-${itemType}-${itemId}`;
    currentMoveOperation.dialog.style.position = 'absolute';
    currentMoveOperation.dialog.style.top = '50%';
    currentMoveOperation.dialog.style.transform = 'translateY(-50%)';

    // Add to DOM and show
    document.body.appendChild(currentMoveOperation.dialog);
    currentMoveOperation.dialog.showModal();

    // Fetch and populate initial data
    await fetchAndUpdateModalContent(parentFolderId);
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
    if (!currentMoveOperation.dialog) return;

    let path = "";
    data.currentPath.forEach(folder => {
        path = path + `<span 
            onclick="handlePathClick('${encodeURIComponent(JSON.stringify(folder))}')"
            style="cursor: pointer;"
        >${folder.name}/</span>`;
    });

    let folderList = "";
    if (data.availableFolders.length < 1) {
        folderList = 'No folders here';
    } else {
        data.availableFolders.forEach(folder => {
            folderList = folderList + `
            <div>
                ${folder.name}
            </div>
            `;
        });
    }

    // Update modal content
    currentMoveOperation.dialog.innerHTML = `
        <h3>Move ${currentMoveOperation.itemType}</h3>
        <div id="folder-path">${path}</div>
        <div id="folder-list">${folderList}</div>
        <form method="dialog">
            <button type="button" onclick="moveItem('${currentMoveOperation.itemType}', ${currentMoveOperation.itemId})">Move here</button>
            <button type="button" onclick="this.closest('dialog').close()">Cancel</button>
        </form>
    `;
}

function handlePathClick(encodedFolder) {
    const folder = JSON.parse(decodeURIComponent(encodedFolder));
    console.log('clicked path', folder);

    // Fetch new data for this folder
    fetchAndUpdateModalContent(folder.id);
}
