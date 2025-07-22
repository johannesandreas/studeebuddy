// Quick API test - run this to test board creation
const token = 'YOUR_JWT_TOKEN_HERE'; // Get this from browser localStorage

fetch('http://localhost:3000/api/boards', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ 
        name: 'Test Board', 
        type: 'challenges' 
    })
})
.then(res => res.json())
.then(data => console.log('Board creation result:', data))
.catch(err => console.error('Error:', err));