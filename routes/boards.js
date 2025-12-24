// Boards functionality with API
document.addEventListener('DOMContentLoaded', async function() {
    const createBoardBtn = document.getElementById('create-board-btn');
    const createMyBoardBtn = document.getElementById('create-my-board-btn');
    const publicBoardsGrid = document.getElementById('public-boards-grid');
    const myBoardsGrid = document.getElementById('my-boards-grid');
    const boardEditor = document.getElementById('board-editor');
    const backToBoardsBtn = document.getElementById('back-to-boards-btn');
    const saveBoardBtn = document.getElementById('save-board-btn');
    const boardCanvas = document.getElementById('board-canvas');
    const toolButtons = document.querySelectorAll('.tool-btn');
    const imageUpload = document.getElementById('image-upload');
    const gifUpload = document.getElementById('gif-upload');
    const boardVisibility = document.getElementById('board-visibility');
    const shareSection = document.getElementById('share-section');
    const shareLink = document.getElementById('share-link');
    const copyLinkBtn = document.getElementById('copy-link-btn');
    const loginPrompt = document.getElementById('login-prompt');
    const loginPromptBtn = document.getElementById('login-prompt-btn');
    const loginModal = document.getElementById('login-modal');
    const closeModalBtn = document.querySelector('.close-modal');
    const loginForm = document.getElementById('login-form');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const publicBoardsSection = document.getElementById('public-boards-section');
    const myBoardsSection = document.getElementById('my-boards-section');
    
    // Enhanced toolbar elements
    const fontFamilySelect = document.getElementById('font-family');
    const fontSizeInput = document.getElementById('font-size');
    const fontColorPicker = document.getElementById('font-color');
    const boldBtn = document.getElementById('bold-btn');
    const italicBtn = document.getElementById('italic-btn');
    const underlineBtn = document.getElementById('underline-btn');
    const alignLeftBtn = document.getElementById('align-left-btn');
    const alignCenterBtn = document.getElementById('align-center-btn');
    const alignRightBtn = document.getElementById('align-right-btn');
    const backgroundColorPicker = document.getElementById('background-color');
    const applyBgColorBtn = document.getElementById('apply-bg-color');
    
    // Text background color picker
    const textBgColorPicker = document.getElementById('text-bg-color');
    
    // Spotify modal elements
    const spotifyModal = document.getElementById('spotify-modal');
    const spotifyForm = document.getElementById('spotify-form');
    const spotifyLinkInput = document.getElementById('spotify-link');
    
    let currentBoard = null;
    let isDragging = false;
    let isResizing = false;
    let currentElement = null;
    let offsetX, offsetY;
    let selectedTextElement = null;
    let currentTab = 'public';
    let resizeHandle = null;
    let startWidth, startHeight, startX, startY;
    
    // Check if user is logged in
    async function checkLoginStatus() {
        const user = await api.checkAuth();
        
        if (user) {
            // User is logged in
            loginPrompt.classList.add('hidden');
            usernameDisplay.textContent = user.username;
            
            // Show My Boards tab content if selected
            if (currentTab === 'my-boards') {
                myBoardsSection.classList.remove('hidden');
                publicBoardsSection.classList.add('hidden');
                await loadUserBoards();
            }
        } else {
            // User is not logged in
            usernameDisplay.textContent = '';
            
            // If on My Boards tab, switch to Public
            if (currentTab === 'my-boards') {
                await switchTab('public');
            }
        }
        
        // Always load public boards
        await loadPublicBoards();
    }
    
    // Tab switching
    tabButtons.forEach(tab => {
        tab.addEventListener('click', async function() {
            const tabName = this.getAttribute('data-tab');
            await switchTab(tabName);
        });
    });
    
    async function switchTab(tabName) {
        currentTab = tabName;
        
        // Update tab buttons
        tabButtons.forEach(tab => {
            if (tab.getAttribute('data-tab') === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Check if user is logged in for My Boards tab
        const user = await api.checkAuth();
        
        if (tabName === 'my-boards') {
            if (user) {
                myBoardsSection.classList.remove('hidden');
                publicBoardsSection.classList.add('hidden');
                await loadUserBoards();
            } else {
                // Show login prompt if not logged in
                loginPrompt.classList.remove('hidden');
                publicBoardsSection.classList.add('hidden');
                myBoardsSection.classList.add('hidden');
            }
        } else {
            publicBoardsSection.classList.remove('hidden');
            myBoardsSection.classList.add('hidden');
            loginPrompt.classList.add('hidden');
            await loadPublicBoards();
        }
    }
    
    // Load public boards from API
    async function loadPublicBoards() {
        try {
            const publicBoards = await api.getPublicBoards();
            
            publicBoardsGrid.innerHTML = '';
            
            if (publicBoards.length === 0) {
                publicBoardsGrid.innerHTML = `
                    <div class="empty-boards">
                        <p>No public boards yet. Be the first to create one!</p>
                    </div>
                `;
                return;
            }
            
            publicBoards.forEach(board => {
                const boardElement = document.createElement('div');
                boardElement.className = 'board-card';
                boardElement.setAttribute('data-id', board._id);
                
                boardElement.innerHTML = `
                    <div class="board-thumbnail">
                        <p>${board.elements?.length || 0} items</p>
                    </div>
                    <div class="board-info">
                        <div class="board-title">${board.title}</div>
                        <div class="board-meta">
                            <span>${formatDate(board.updatedAt)}</span>
                            <span class="board-author">by ${board.owner?.username || 'Anonymous'}</span>
                        </div>
                    </div>
                `;
                
                boardElement.addEventListener('click', function() {
                    openBoard(board._id, false); // false = view mode (not editable)
                });
                
                publicBoardsGrid.appendChild(boardElement);
            });
        } catch (error) {
            console.error('Error loading public boards:', error);
            publicBoardsGrid.innerHTML = `
                <div class="empty-boards">
                    <p>Error loading boards. Please try again later.</p>
                </div>
            `;
        }
    }
    
    // Load user's boards from API
    async function loadUserBoards() {
        try {
            const userBoards = await api.getUserBoards();
            
            myBoardsGrid.innerHTML = '';
            
            if (userBoards.length === 0) {
                myBoardsGrid.innerHTML = `
                    <div class="empty-boards">
                        <p>You don't have any boards yet. Create your first one!</p>
                    </div>
                `;
                return;
            }
            
            userBoards.forEach(board => {
                const boardElement = document.createElement('div');
                boardElement.className = 'board-card';
                boardElement.setAttribute('data-id', board._id);
                
                boardElement.innerHTML = `
                    <div class="board-thumbnail">
                        <p>${board.elements?.length || 0} items</p>
                    </div>
                    <div class="board-info">
                        <div class="board-title">${board.title}</div>
                        <div class="board-meta">
                            <span>${formatDate(board.updatedAt)}</span>
                            <span>${board.visibility}</span>
                        </div>
                    </div>
                `;
                
                boardElement.addEventListener('click', function() {
                    openBoard(board._id, true); // true = edit mode
                });
                
                myBoardsGrid.appendChild(boardElement);
            });
        } catch (error) {
            console.error('Error loading user boards:', error);
            if (error.message === 'Not authenticated') {
                // User is not logged in
                await switchTab('public');
            } else {
                myBoardsGrid.innerHTML = `
                    <div class="empty-boards">
                        <p>Error loading your boards. Please try again later.</p>
                    </div>
                `;
            }
        }
    }
    
    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return 'Unknown date';
        
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid date';
            
            return date.toLocaleDateString();
        } catch (error) {
            return 'Invalid date';
        }
    }
    
    // Create new board with API
    async function createNewBoard() {
        const user = await api.checkAuth();
        
        if (!user) {
            // Show login modal if not logged in
            loginModal.style.display = 'block';
            return;
        }
        
        const title = prompt('Enter a title for your new board:');
        if (!title || title.trim() === '') return;
        
        try {
            const newBoard = await api.createBoard(title.trim());
            await openBoard(newBoard._id, true);
        } catch (error) {
            console.error('Error creating board:', error);
            alert('Failed to create board. Please try again.');
        }
    }
    
    createBoardBtn.addEventListener('click', createNewBoard);
    createMyBoardBtn.addEventListener('click', createNewBoard);
    
    // Open board editor
    async function openBoard(boardId, editable) {
        try {
            const boardData = await api.getBoard(boardId);
            
            if (!boardData) {
                alert('Board not found');
                return;
            }
            
            currentBoard = boardData;
            
            // Hide all sections and show editor
            publicBoardsSection.classList.add('hidden');
            myBoardsSection.classList.add('hidden');
            loginPrompt.classList.add('hidden');
            boardEditor.classList.remove('hidden');
            
            document.getElementById('board-title').textContent = currentBoard.title;
            boardVisibility.value = currentBoard.visibility;
            
            // Check if user is owner for editing permissions
            const user = await api.checkAuth();
            const isOwner = user && currentBoard.owner && 
                           (currentBoard.owner._id === user.id || currentBoard.owner === user.id);
            
            // Enable or disable editing based on user and permissions
            saveBoardBtn.disabled = !editable || !isOwner;
            boardVisibility.disabled = !editable || !isOwner;
            
            // Update share section
            updateShareSection();
            
            // Load board elements
            await loadBoardElements(editable);
        } catch (error) {
            console.error('Error opening board:', error);
            alert('Failed to load board. Please try again.');
        }
    }
    
    // Load elements onto canvas
    async function loadBoardElements(editable) {
        boardCanvas.innerHTML = '';
        
        // Set background color if saved
        if (currentBoard.backgroundColor) {
            boardCanvas.style.backgroundColor = currentBoard.backgroundColor;
            backgroundColorPicker.value = currentBoard.backgroundColor;
        }
        
        // Load elements
        if (currentBoard.elements && Array.isArray(currentBoard.elements)) {
            currentBoard.elements.forEach(element => {
                const elementDiv = createElementDiv(element, editable);
                boardCanvas.appendChild(elementDiv);
            });
        }
        
        // If editable and no elements, add a welcome message
        if (editable && (!currentBoard.elements || currentBoard.elements.length === 0)) {
            const welcomeElement = {
                id: 'welcome-' + Date.now(),
                type: 'text',
                content: 'Welcome to your board! Start adding elements.',
                x: 50,
                y: 50,
                zIndex: 1,
                width: '300px',
                fontFamily: 'Merriweather',
                fontSize: 20,
                color: '#555'
            };
            
            const elementDiv = createElementDiv(welcomeElement, editable);
            boardCanvas.appendChild(elementDiv);
        }
    }
    
    // Create HTML element from data
    function createElementDiv(element, editable) {
        const div = document.createElement('div');
        div.className = 'draggable';
        div.setAttribute('data-id', element.id || element._id || Date.now());
        div.style.left = `${element.x || 50}px`;
        div.style.top = `${element.y || 50}px`;
        div.style.zIndex = element.zIndex || 1;
        
        // Set width and height for all elements
        if (element.width) div.style.width = element.width;
        if (element.height) div.style.height = element.height;
        
        switch (element.type) {
            case 'text':
                div.className += ' draggable-text';
                div.contentEditable = editable;
                div.textContent = element.content || 'Double click to edit';
                
                // Apply saved styles
                if (element.fontFamily) div.style.fontFamily = element.fontFamily;
                if (element.fontSize) div.style.fontSize = `${element.fontSize}px`;
                if (element.color) div.style.color = element.color;
                if (element.fontWeight) div.style.fontWeight = element.fontWeight;
                if (element.fontStyle) div.style.fontStyle = element.fontStyle;
                if (element.textDecoration) div.style.textDecoration = element.textDecoration;
                if (element.textAlign) div.style.textAlign = element.textAlign;
                if (element.backgroundColor) div.style.backgroundColor = element.backgroundColor;
                
                // Add event listener for text selection
                if (editable) {
                    div.addEventListener('click', function() {
                        selectedTextElement = div;
                        updateTextToolbar(div);
                    });
                }
                break;
                
            case 'image':
                const img = document.createElement('img');
                img.src = element.content || 'https://via.placeholder.com/200';
                img.draggable = false;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                div.appendChild(img);
                break;
                
            case 'gif':
                const gif = document.createElement('img');
                gif.src = element.content || 'https://via.placeholder.com/200';
                gif.draggable = false;
                gif.style.width = '100%';
                gif.style.height = '100%';
                gif.style.objectFit = 'contain';
                div.appendChild(gif);
                break;
                
            case 'sticker':
                div.className += ' draggable-sticker';
                div.innerHTML = element.content || '⭐';
                div.style.fontSize = '3rem';
                div.style.display = 'flex';
                div.style.justifyContent = 'center';
                div.style.alignItems = 'center';
                break;
                
            case 'music':
                div.className += ' draggable-music';
                // Handle Spotify embed
                if (element.content && element.content.includes('spotify')) {
                    div.innerHTML = `
                        <iframe src="${element.content}" width="100%" height="80" frameBorder="0" 
                                allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; 
                                fullscreen; picture-in-picture" loading="lazy"></iframe>
                    `;
                } else {
                    div.innerHTML = `
                        <div class="music-placeholder">
                            <i class="fas fa-music"></i>
                            <p>Music: ${element.content || 'Custom Music'}</p>
                        </div>
                    `;
                }
                break;
                
            case 'shape':
                div.className += ' draggable-shape';
                div.style.backgroundColor = element.color || '#CBB0FF';
                div.style.borderRadius = element.shape === 'circle' ? '50%' : '0';
                break;
        }
        
        // Add controls if editable
        if (editable) {
            const controls = document.createElement('div');
            controls.className = 'draggable-controls';
            controls.innerHTML = `
                <button class="bring-forward" title="Bring Forward">↑</button>
                <button class="send-backward" title="Send Backward">↓</button>
                <button class="delete-element" title="Delete">×</button>
            `;
            div.appendChild(controls);
            
            // Add resize handle for all elements
            const resizeHandle = document.createElement('div');
            resizeHandle.className = 'resize-handle';
            div.appendChild(resizeHandle);
            
            // Add drag functionality
            makeDraggable(div);
            
            // Add resize functionality
            makeResizable(div);
        }
        
        return div;
    }
    
    // Make elements draggable
    function makeDraggable(element) {
        element.addEventListener('mousedown', function(e) {
            if (e.target.closest('.draggable-controls') || e.target.classList.contains('resize-handle')) return;
            
            isDragging = true;
            currentElement = element;
            
            // Calculate offset
            const rect = element.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;
            
            // Bring to front
            const allElements = document.querySelectorAll('.draggable');
            let maxZ = 0;
            allElements.forEach(el => {
                const z = parseInt(el.style.zIndex || 1);
                if (z > maxZ) maxZ = z;
            });
            element.style.zIndex = maxZ + 1;
            
            document.addEventListener('mousemove', dragElement);
            document.addEventListener('mouseup', stopDrag);
        });
    }
    
    // Make elements resizable
    function makeResizable(element) {
        const handle = element.querySelector('.resize-handle');
        
        handle.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            isResizing = true;
            currentElement = element;
            
            const rect = element.getBoundingClientRect();
            startX = e.clientX;
            startY = e.clientY;
            startWidth = rect.width;
            startHeight = rect.height;
            
            document.addEventListener('mousemove', resizeElement);
            document.addEventListener('mouseup', stopResize);
        });
    }
    
    // Resize element
    function resizeElement(e) {
        if (!isResizing || !currentElement) return;
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        const newWidth = Math.max(50, startWidth + dx);
        const newHeight = Math.max(50, startHeight + dy);
        
        currentElement.style.width = `${newWidth}px`;
        currentElement.style.height = `${newHeight}px`;
    }
    
    // Stop resizing
    function stopResize() {
        isResizing = false;
        currentElement = null;
        
        document.removeEventListener('mousemove', resizeElement);
        document.removeEventListener('mouseup', stopResize);
    }
    
    // Drag element
    function dragElement(e) {
        if (!isDragging || !currentElement) return;
        
        e.preventDefault();
        
        const canvasRect = boardCanvas.getBoundingClientRect();
        let x = e.clientX - canvasRect.left - offsetX;
        let y = e.clientY - canvasRect.top - offsetY;
        
        // Constrain to canvas
        x = Math.max(0, Math.min(x, canvasRect.width - currentElement.offsetWidth));
        y = Math.max(0, Math.min(y, canvasRect.height - currentElement.offsetHeight));
        
        currentElement.style.left = `${x}px`;
        currentElement.style.top = `${y}px`;
    }
    
    // Stop dragging
    function stopDrag() {
        isDragging = false;
        currentElement = null;
        
        document.removeEventListener('mousemove', dragElement);
        document.removeEventListener('mouseup', stopDrag);
    }
    
    // Back to boards list
    backToBoardsBtn.addEventListener('click', async function() {
        boardEditor.classList.add('hidden');
        
        // Return to the appropriate tab
        if (currentTab === 'my-boards') {
            myBoardsSection.classList.remove('hidden');
            await loadUserBoards();
        } else {
            publicBoardsSection.classList.remove('hidden');
            await loadPublicBoards();
        }
        
        currentBoard = null;
        selectedTextElement = null;
    });
    
    // Save board to API
    saveBoardBtn.addEventListener('click', async function() {
        if (!currentBoard) return;
        
        // Update elements positions and content
        const elements = [];
        const draggables = document.querySelectorAll('.draggable');
        
        draggables.forEach(draggable => {
            const elementId = draggable.getAttribute('data-id');
            const type = draggable.classList.contains('draggable-text') ? 'text' :
                        draggable.classList.contains('draggable-sticker') ? 'sticker' :
                        draggable.classList.contains('draggable-music') ? 'music' :
                        draggable.classList.contains('draggable-shape') ? 'shape' : 
                        draggable.querySelector('img') && (draggable.querySelector('img').src.includes('.gif') || 
                        draggable.querySelector('img').style.objectFit === 'contain') ? 'gif' : 'image';
            
            let content = '';
            let elementData = {
                id: elementId,
                type: type,
                x: parseInt(draggable.style.left) || 50,
                y: parseInt(draggable.style.top) || 50,
                zIndex: parseInt(draggable.style.zIndex) || 1,
                width: draggable.style.width || '200px',
                height: draggable.style.height || '200px'
            };
            
            if (type === 'text') {
                content = draggable.textContent;
                elementData.content = content;
                elementData.fontFamily = draggable.style.fontFamily;
                elementData.fontSize = parseInt(draggable.style.fontSize) || 16;
                elementData.color = draggable.style.color || '#000000';
                elementData.fontWeight = draggable.style.fontWeight || 'normal';
                elementData.fontStyle = draggable.style.fontStyle || 'normal';
                elementData.textDecoration = draggable.style.textDecoration || 'none';
                elementData.textAlign = draggable.style.textAlign || 'left';
                elementData.backgroundColor = draggable.style.backgroundColor || 'transparent';
            } else if (type === 'image' || type === 'gif') {
                content = draggable.querySelector('img').src;
                elementData.content = content;
            } else if (type === 'sticker') {
                content = draggable.innerHTML;
                elementData.content = content;
            } else if (type === 'music') {
                const iframe = draggable.querySelector('iframe');
                content = iframe ? iframe.src : 'Custom Music';
                elementData.content = content;
            } else if (type === 'shape') {
                elementData.color = draggable.style.backgroundColor || '#CBB0FF';
                elementData.shape = draggable.style.borderRadius === '50%' ? 'circle' : 'rectangle';
            }
            
            elements.push(elementData);
        });
        
        try {
            await api.updateBoard(currentBoard._id, {
                title: document.getElementById('board-title').textContent,
                visibility: boardVisibility.value,
                backgroundColor: boardCanvas.style.backgroundColor,
                elements: elements
            });
            
            alert('Board saved successfully!');
        } catch (error) {
            console.error('Error saving board:', error);
            alert('Failed to save board. Please try again.');
        }
    });
    
    // Tool buttons functionality
    toolButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            
            // Handle music button click (show Spotify modal)
            if (type === 'music') {
                spotifyModal.style.display = 'block';
                return;
            }
            
            addElementToBoard(type);
        });
    });
    
    // Handle Spotify form submission
    spotifyForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const spotifyLink = spotifyLinkInput.value.trim();
        if (!spotifyLink) return;
        
        // Convert Spotify URL to embed format
        let embedUrl = spotifyLink;
        if (spotifyLink.includes('open.spotify.com')) {
            const parts = spotifyLink.split('/');
            if (parts.length >= 5) {
                const type = parts[3];
                const id = parts[4].split('?')[0];
                embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
            }
        }
        
        // Add to board
        const elementId = Date.now().toString();
        const elementData = {
            id: elementId,
            type: 'music',
            content: embedUrl,
            x: 50,
            y: 50,
            zIndex: 1,
            width: '300px',
            height: '80px'
        };
        
        // Add to current board elements array
        if (!currentBoard.elements) {
            currentBoard.elements = [];
        }
        currentBoard.elements.push(elementData);
        
        // Create and add visual element
        const elementDiv = createElementDiv(elementData, true);
        boardCanvas.appendChild(elementDiv);
        
        // Close modal and reset form
        spotifyModal.style.display = 'none';
        spotifyLinkInput.value = '';
    });
    
    // Add element to board
    function addElementToBoard(type) {
        if (!currentBoard) return;
        
        const elementId = Date.now().toString();
        let elementData = {
            id: elementId,
            type: type,
            x: 50,
            y: 50,
            zIndex: 1,
            width: '200px',
            height: type === 'text' ? 'auto' : '200px'
        };
        
        switch (type) {
            case 'text':
                elementData.content = 'Double click to edit';
                elementData.fontFamily = 'Merriweather';
                elementData.fontSize = 16;
                elementData.color = '#000000';
                elementData.backgroundColor = '#ffffff';
                elementData.height = 'auto';
                break;
            case 'sticker':
                const stickers = ['⭐', '❤️', '🌸', '✨', '😊', '🌈'];
                elementData.content = stickers[Math.floor(Math.random() * stickers.length)];
                break;
            case 'music':
                elementData.content = 'Inspiring Track';
                elementData.width = '300px';
                elementData.height = '80px';
                break;
            case 'shape':
                elementData.color = '#CBB0FF';
                elementData.shape = 'rectangle';
                break;
            case 'image':
            case 'gif':
                // Handled by file upload
                if (type === 'gif') {
                    gifUpload.click();
                } else {
                    imageUpload.click();
                }
                return;
        }
        
        // Add to current board elements array
        if (!currentBoard.elements) {
            currentBoard.elements = [];
        }
        currentBoard.elements.push(elementData);
        
        // Create and add visual element
        const elementDiv = createElementDiv(elementData, true);
        boardCanvas.appendChild(elementDiv);
        
        // If it's a text element, select it
        if (type === 'text') {
            selectedTextElement = elementDiv;
            updateTextToolbar(elementDiv);
        }
    }
    
    // Image upload handling
    imageUpload.addEventListener('change', function(e) {
        if (!currentBoard) return;
        
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const elementId = Date.now().toString();
            const elementData = {
                id: elementId,
                type: 'image',
                content: event.target.result,
                x: 50,
                y: 50,
                zIndex: 1,
                width: '200px',
                height: '200px'
            };
            
            // Add to current board elements array
            if (!currentBoard.elements) {
                currentBoard.elements = [];
            }
            currentBoard.elements.push(elementData);
            
            // Create and add visual element
            const elementDiv = createElementDiv(elementData, true);
            boardCanvas.appendChild(elementDiv);
        };
        
        reader.readAsDataURL(file);
        this.value = ''; // Reset input
    });
    
    // GIF upload handling
    gifUpload.addEventListener('change', function(e) {
        if (!currentBoard) return;
        
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const elementId = Date.now().toString();
            const elementData = {
                id: elementId,
                type: 'gif',
                content: event.target.result,
                x: 50,
                y: 50,
                zIndex: 1,
                width: '200px',
                height: '200px'
            };
            
            // Add to current board elements array
            if (!currentBoard.elements) {
                currentBoard.elements = [];
            }
            currentBoard.elements.push(elementData);
            
            // Create and add visual element
            const elementDiv = createElementDiv(elementData, true);
            boardCanvas.appendChild(elementDiv);
        };
        
        reader.readAsDataURL(file);
        this.value = ''; // Reset input
    });
    
    // Handle element controls (delete, z-index)
    boardCanvas.addEventListener('click', function(e) {
        if (!e.target.matches('.delete-element, .bring-forward, .send-backward')) return;
        
        const control = e.target;
        const element = control.closest('.draggable');
        const elementId = element.getAttribute('data-id');
        
        if (control.classList.contains('delete-element')) {
            // Remove from DOM
            element.remove();
            
            // Remove from board data
            if (currentBoard && currentBoard.elements) {
                currentBoard.elements = currentBoard.elements.filter(el => 
                    (el.id !== elementId && el._id !== elementId)
                );
            }
            
            // If deleted element was the selected text, clear selection
            if (selectedTextElement === element) {
                selectedTextElement = null;
            }
        } else if (control.classList.contains('bring-forward')) {
            // Increase z-index
            const currentZ = parseInt(element.style.zIndex || 1);
            element.style.zIndex = currentZ + 1;
            
            // Update in board data
            if (currentBoard && currentBoard.elements) {
                const elementData = currentBoard.elements.find(el => 
                    (el.id === elementId || el._id === elementId)
                );
                if (elementData) {
                    elementData.zIndex = currentZ + 1;
                }
            }
        } else if (control.classList.contains('send-backward')) {
            // Decrease z-index (minimum 1)
            const currentZ = parseInt(element.style.zIndex || 1);
            if (currentZ > 1) {
                element.style.zIndex = currentZ - 1;
                
                // Update in board data
                if (currentBoard && currentBoard.elements) {
                    const elementData = currentBoard.elements.find(el => 
                        (el.id === elementId || el._id === elementId)
                    );
                    if (elementData) {
                        elementData.zIndex = currentZ - 1;
                    }
                }
            }
        }
    });
    
    // Text formatting functionality
    fontFamilySelect.addEventListener('change', function() {
        if (selectedTextElement) {
            selectedTextElement.style.fontFamily = this.value;
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    fontSizeInput.addEventListener('change', function() {
        if (selectedTextElement) {
            selectedTextElement.style.fontSize = `${this.value}px`;
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    fontColorPicker.addEventListener('input', function() {
        if (selectedTextElement) {
            selectedTextElement.style.color = this.value;
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    // Text background color functionality
    textBgColorPicker.addEventListener('input', function() {
        if (selectedTextElement) {
            selectedTextElement.style.backgroundColor = this.value;
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    boldBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.fontWeight = 
                selectedTextElement.style.fontWeight === 'bold' ? 'normal' : 'bold';
            this.classList.toggle('active', selectedTextElement.style.fontWeight === 'bold');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    italicBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.fontStyle = 
                selectedTextElement.style.fontStyle === 'italic' ? 'normal' : 'italic';
            this.classList.toggle('active', selectedTextElement.style.fontStyle === 'italic');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    underlineBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.textDecoration = 
                selectedTextElement.style.textDecoration === 'underline' ? 'none' : 'underline';
            this.classList.toggle('active', selectedTextElement.style.textDecoration === 'underline');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    // Text alignment
    alignLeftBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.textAlign = 'left';
            updateAlignmentButtons('left');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    alignCenterBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.textAlign = 'center';
            updateAlignmentButtons('center');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    alignRightBtn.addEventListener('click', function() {
        if (selectedTextElement) {
            selectedTextElement.style.textAlign = 'right';
            updateAlignmentButtons('right');
            
            // Update in board data
            updateSelectedTextInBoardData();
        }
    });
    
    function updateAlignmentButtons(alignment) {
        alignLeftBtn.classList.toggle('active', alignment === 'left');
        alignCenterBtn.classList.toggle('active', alignment === 'center');
        alignRightBtn.classList.toggle('active', alignment === 'right');
    }
    
    // Update selected text in board data
    function updateSelectedTextInBoardData() {
        if (!selectedTextElement || !currentBoard || !currentBoard.elements) return;
        
        const elementId = selectedTextElement.getAttribute('data-id');
        const elementData = currentBoard.elements.find(el => 
            (el.id === elementId || el._id === elementId)
        );
        
        if (elementData && elementData.type === 'text') {
            elementData.content = selectedTextElement.textContent;
            elementData.fontFamily = selectedTextElement.style.fontFamily;
            elementData.fontSize = parseInt(selectedTextElement.style.fontSize);
            elementData.color = selectedTextElement.style.color;
            elementData.fontWeight = selectedTextElement.style.fontWeight;
            elementData.fontStyle = selectedTextElement.style.fontStyle;
            elementData.textDecoration = selectedTextElement.style.textDecoration;
            elementData.textAlign = selectedTextElement.style.textAlign;
            elementData.backgroundColor = selectedTextElement.style.backgroundColor;
        }
    }
    
    // Update text toolbar based on selected element
    function updateTextToolbar(element) {
        if (!element) return;
        
        // Update font family
        const fontFamily = element.style.fontFamily || 'Merriweather';
        fontFamilySelect.value = fontFamily.includes('Merriweather') ? 'Merriweather' : 
                               fontFamily.includes('Arial') ? 'Arial' :
                               fontFamily.includes('Georgia') ? 'Georgia' :
                               fontFamily.includes('Courier') ? 'Courier New' :
                               fontFamily.includes('Verdana') ? 'Verdana' : 'Merriweather';
        
        // Update font size
        const fontSize = parseInt(element.style.fontSize) || 16;
        fontSizeInput.value = fontSize;
        
        // Update font color
        const color = element.style.color || '#000000';
        fontColorPicker.value = rgbToHex(color);
        
        // Update text background color
        const bgColor = element.style.backgroundColor || '#ffffff';
        textBgColorPicker.value = rgbToHex(bgColor);
        
        // Update style buttons
        boldBtn.classList.toggle('active', element.style.fontWeight === 'bold');
        italicBtn.classList.toggle('active', element.style.fontStyle === 'italic');
        underlineBtn.classList.toggle('active', element.style.textDecoration === 'underline');
        
        // Update alignment buttons
        const align = element.style.textAlign || 'left';
        updateAlignmentButtons(align);
    }
    
    // Convert RGB to hex
    function rgbToHex(rgb) {
        if (rgb.startsWith('#')) return rgb;
        
        const result = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/.exec(rgb);
        if (!result) return '#ffffff';
        
        const r = parseInt(result[1]);
        const g = parseInt(result[2]);
        const b = parseInt(result[3]);
        
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    // Background color
    applyBgColorBtn.addEventListener('click', function() {
        boardCanvas.style.backgroundColor = backgroundColorPicker.value;
    });
    
    // Update visibility and share section
    boardVisibility.addEventListener('change', function() {
        if (!currentBoard) return;
        
        currentBoard.visibility = this.value;
        updateShareSection();
    });
    
    function updateShareSection() {
        if (currentBoard && currentBoard.visibility === 'public') {
            shareSection.classList.remove('hidden');
            // Use shareToken if available, otherwise use board ID
            const shareToken = currentBoard.shareToken || currentBoard._id;
            shareLink.value = `${window.location.origin}${window.location.pathname}?share=${shareToken}`;
        } else {
            shareSection.classList.add('hidden');
        }
    }
    
    // Copy share link
    copyLinkBtn.addEventListener('click', function() {
        shareLink.select();
        shareLink.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            alert('Link copied to clipboard!');
        } catch (err) {
            // Fallback for newer browsers
            navigator.clipboard.writeText(shareLink.value)
                .then(() => alert('Link copied to clipboard!'))
                .catch(() => alert('Failed to copy link. Please copy manually.'));
        }
    });
    
    // Login functionality
    loginPromptBtn.addEventListener('click', function() {
        loginModal.style.display = 'block';
    });
    
    closeModalBtn.addEventListener('click', function() {
        loginModal.style.display = 'none';
    });
    
    // Close Spotify modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        if (btn.closest('#spotify-modal')) {
            btn.addEventListener('click', function() {
                spotifyModal.style.display = 'none';
            });
        }
    });
    
    window.addEventListener('click', function(e) {
        if (e.target === loginModal || e.target === spotifyModal) {
            e.target.style.display = 'none';
        }
    });
    
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const recoveryNote = document.getElementById('recovery-note').value;
        
        const result = await api.login(username, password, recoveryNote);
        
        if (result.success) {
            loginModal.style.display = 'none';
            await checkLoginStatus();
            alert(`Welcome${result.data.user.username ? ', ' + result.data.user.username : ''}!`);
        } else {
            alert(result.data?.message || 'Login failed. Please try again.');
        }
    });
    
    // Logout functionality
    logoutBtn.addEventListener('click', function() {
        api.removeToken();
        localStorage.removeItem('hope_user');
        checkLoginStatus();
        alert('You have been logged out successfully.');
    });
    
    // Initialize the page
    await checkLoginStatus();
    
    // Add event listener for text content changes
    boardCanvas.addEventListener('input', function(e) {
        if (e.target.classList.contains('draggable-text')) {
            updateSelectedTextInBoardData();
        }
    });
    
    // Add event listener for clicking on text elements
    boardCanvas.addEventListener('click', function(e) {
        const textElement = e.target.closest('.draggable-text');
        if (textElement) {
            selectedTextElement = textElement;
            updateTextToolbar(textElement);
        }
    });
});