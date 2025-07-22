let currentUser = null;
let currentBoard = null;
let authToken = null;

// Check for token in URL (Google OAuth redirect)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('token')) {
    authToken = urlParams.get('token');
    localStorage.setItem('authToken', authToken);
    window.history.replaceState({}, document.title, '/');
}

// Check for stored token
authToken = localStorage.getItem('authToken');
if (authToken) {
    showMainContent();
    loadBoards();
}

// Auth functions
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            authToken = data.token;
            currentUser = data.user;
            localStorage.setItem('authToken', authToken);
            showMainContent();
            loadBoards();
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Login failed');
    }
});

document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        if (response.ok) {
            alert('Registration successful! Please login.');
        } else {
            alert(data.error);
        }
    } catch (error) {
        alert('Registration failed');
    }
});

function logout() {
    authToken = null;
    currentUser = null;
    currentBoard = null;
    localStorage.removeItem('authToken');
    document.getElementById('auth-section').style.display = 'block';
    document.getElementById('main-content').style.display = 'none';
    document.getElementById('user-info').style.display = 'none';
}

function showMainContent() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('main-content').style.display = 'block';
    document.getElementById('user-info').style.display = 'block';
    
    // Add New Board button event listener
    document.getElementById('new-board-btn').addEventListener('click', createBoard);
    
    // Add task button event listeners
    document.querySelectorAll('.add-task-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const status = e.target.dataset.status;
            addTask(status);
        });
    });
}

// Board functions
async function loadBoards() {
    if (!authToken) {
        console.log('No auth token, skipping board load');
        return;
    }
    
    try {
        const apiUrl = window.currentConfig?.apiUrl || window.location.origin;
        console.log('Loading boards from:', apiUrl + '/api/boards');
        const response = await fetch(apiUrl + '/api/boards', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch boards:', response.status);
            if (response.status === 401) {
                alert('Session expired. Please login again.');
                logout();
            }
            return;
        }
        
        const boards = await response.json();
        console.log('Loaded boards:', boards);
        
        const select = document.getElementById('board-select');
        if (!select) {
            console.error('Board select element not found');
            return;
        }
        
        select.innerHTML = '<option value="">Select a board</option>';
        
        if (boards.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No boards - Create one!';
            option.disabled = true;
            select.appendChild(option);
        } else {
            boards.forEach(board => {
                const option = document.createElement('option');
                option.value = board.id;
                option.textContent = `${board.name} (${board.type})`;
                select.appendChild(option);
            });
        }
        
        // Remove existing event listener
        select.onchange = null;
        select.addEventListener('change', (e) => {
            if (e.target.value) {
                currentBoard = boards.find(b => b.id == e.target.value);
                console.log('Selected board:', currentBoard);
                loadTasks();
            }
        });
    } catch (error) {
        console.error('Network error loading boards:', error);
        alert('Cannot connect to server. Make sure it\'s running on port 3000.');
    }
}

async function createBoard() {
    console.log('Create board clicked, token:', authToken ? 'exists' : 'missing');
    
    if (!authToken) {
        alert('Please login first');
        return;
    }
    
    const name = prompt('Board name:');
    if (!name) return;
    
    const type = prompt('Board type:\n1. challenges\n2. hackathons\n3. certifications');
    if (!type || !['challenges', 'hackathons', 'certifications'].includes(type)) {
        alert('Please enter: challenges, hackathons, or certifications');
        return;
    }
    
    try {
        const apiUrl = window.currentConfig?.apiUrl || window.location.origin;
        console.log('Sending board creation request to:', apiUrl + '/api/boards');
        const response = await fetch(apiUrl + '/api/boards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name, type })
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            alert('Server error: ' + response.status);
            return;
        }
        
        const result = await response.json();
        console.log('Response data:', result);
        
        alert('Board created successfully!');
        await loadBoards();
    } catch (error) {
        console.error('Network error:', error);
        alert('Network error: Check if server is running on port 3000');
    }
}

// Task functions
async function loadTasks() {
    if (!currentBoard) return;
    
    try {
        const response = await fetch(`/api/boards/${currentBoard.id}/tasks`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const tasks = await response.json();
        
        // Clear existing tasks
        document.getElementById('todo-tasks').innerHTML = '';
        document.getElementById('in_progress-tasks').innerHTML = '';
        document.getElementById('done-tasks').innerHTML = '';
        
        // Populate tasks
        tasks.forEach(task => {
            const taskElement = createTaskElement(task);
            document.getElementById(`${task.status}-tasks`).appendChild(taskElement);
        });
    } catch (error) {
        console.error('Failed to load tasks:', error);
    }
}

function createTaskElement(task) {
    const div = document.createElement('div');
    div.className = 'task';
    div.draggable = true;
    div.dataset.taskId = task.id;
    
    div.innerHTML = `
        <h4>${task.title}</h4>
        <p>${task.description || ''}</p>
        <div class="task-actions">
            <button class="edit-btn" onclick="editTask(${task.id})">Edit</button>
            <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
        </div>
    `;
    
    // Drag and drop
    div.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
    });
    
    return div;
}

async function addTask(status) {
    if (!currentBoard) {
        alert('Please select a board first');
        return;
    }
    
    const title = prompt('Task title:');
    if (!title) return;
    
    const description = prompt('Task description (optional):') || '';
    
    try {
        console.log('Creating task:', { title, description, status, boardId: currentBoard.id });
        
        const response = await fetch(`/api/boards/${currentBoard.id}/tasks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ title, description, status })
        });
        
        const result = await response.json();
        console.log('Task creation result:', result);
        
        if (response.ok) {
            alert('Task created successfully!');
            await loadTasks();
        } else {
            alert('Error: ' + (result.error || 'Failed to create task'));
        }
    } catch (error) {
        console.error('Task creation error:', error);
        alert('Failed to create task: ' + error.message);
    }
}

async function editTask(taskId) {
    const title = prompt('New title:');
    const description = prompt('New description:');
    
    if (title) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify({ title, description, status: 'todo' })
            });
            
            if (response.ok) {
                loadTasks();
            }
        } catch (error) {
            alert('Failed to update task');
        }
    }
}

async function deleteTask(taskId) {
    if (confirm('Delete this task?')) {
        try {
            const response = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            if (response.ok) {
                loadTasks();
            }
        } catch (error) {
            alert('Failed to delete task');
        }
    }
}

// Initialize drag and drop after DOM loads
function initializeDragAndDrop() {
    document.querySelectorAll('.tasks').forEach(column => {
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            const taskId = e.dataTransfer.getData('text/plain');
            const newStatus = e.target.closest('.column').dataset.status;
            
            console.log('Dropping task:', taskId, 'to status:', newStatus);
            
            try {
                const response = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ status: newStatus })
                });
                
                if (response.ok) {
                    console.log('Task status updated successfully');
                    await loadTasks();
                } else {
                    console.error('Failed to update task status');
                }
            } catch (error) {
                console.error('Failed to update task status:', error);
            }
        });
    });
}

// Call after DOM loads
document.addEventListener('DOMContentLoaded', initializeDragAndDrop);