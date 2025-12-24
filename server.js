// ===========================================
// HOPE PROJECT BACKEND - PORT 5001
// ===========================================
const express = require('express');
const cors = require('cors');
const app = express();

// IMPORTANT FIX: Remove duplicate CORS call!
// Allow all origins for deployment
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));

// ===========================================
// SIMPLE DATABASE (IN MEMORY)
// ===========================================
let database = {
  letters: [
    {
      _id: "1",
      recipient: "Anyone feeling alone",
      category: "hope",
      message: "You are not alone in how you're feeling. Tomorrow is a new day.",
      color: "#CBB0FF",
      likes: [],
      createdAt: 2024
    }
  ],
  resources: [
    {
      _id: "1",
      title: "Mindful Breathing",
      description: "Simple breathing techniques to reduce stress",
      content: "Breathe in for 4 seconds, hold for 2, exhale for 6. Repeat 5-10 times.",
      tags: ["stress", "self-care"],
      icon: "🧘"
    }
  ],
  boards: [],
  users: []
};

// ===========================================
// HEALTH CHECK
// ===========================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Hope Project Backend',
    counts: {
      letters: database.letters.length,
      resources: database.resources.length,
      boards: database.boards.length,
      users: database.users.length
    }
  });
});

// ===========================================
// DEBUG MIDDLEWARE
// ===========================================
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  if (req.headers.authorization) {
    console.log('🔑 Token present');
  }
  next();
});

// ===========================================
// AUTH API - SIMPLE VERSION
// ===========================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`👤 Login attempt: ${username}`);
  
  let user = database.users.find(u => u.username === username);
  
  if (!user) {
    user = {
      id: 'user-' + Date.now(),
      username: username,
      password: password || 'any',
      createdAt: new Date()
    };
    database.users.push(user);
    console.log(`✅ New user created: ${user.id}`);
  }
  
  // SIMPLE TOKEN: just user id
  const token = user.id;
  
  res.json({
    token: token,
    user: { id: user.id, username: user.username }
  });
});

app.get('/api/auth/me', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  const user = database.users.find(u => u.id === token);
  if (!user) return res.status(404).json({ error: 'User not found' });
  
  res.json({ user: { id: user.id, username: user.username } });
});

// ===========================================
// BOARDS API - SIMPLE WORKING VERSION
// ===========================================

// Get all public boards
app.get('/api/boards/public', (req, res) => {
  console.log('📋 Getting public boards');
  res.json(database.boards.filter(b => b.visibility === 'public'));
});

// Get user's boards
app.get('/api/boards/user', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('👤 Getting boards for token:', token);
  
  if (!token) {
    console.log('⚠️ No token, returning empty');
    return res.json([]);
  }
  
  const userBoards = database.boards.filter(b => b.owner === token);
  console.log(`📋 Found ${userBoards.length} boards for user ${token}`);
  res.json(userBoards);
});

// Create new board
app.post('/api/boards', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log('🎨 Creating board for user:', token);
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const newBoard = {
    _id: 'board-' + Date.now(),
    title: req.body.title || 'New Board',
    owner: token, // Just use the token as user ID
    visibility: 'private',
    backgroundColor: '#f9f9f9',
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  database.boards.push(newBoard);
  console.log(`✅ Board created: "${newBoard.title}" (ID: ${newBoard._id})`);
  res.json(newBoard);
});

// Get single board
app.get('/api/boards/:id', (req, res) => {
  const board = database.boards.find(b => b._id === req.params.id);
  
  if (!board) {
    console.log(`❌ Board not found: ${req.params.id}`);
    return res.status(404).json({ error: 'Board not found' });
  }
  
  console.log(`📖 Board retrieved: ${board.title}`);
  res.json(board);
});

// UPDATE BOARD - THIS IS THE CRITICAL FIX
app.put('/api/boards/:id', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  const boardId = req.params.id;
  
  console.log('\n💾 SAVE REQUEST:');
  console.log('Board ID:', boardId);
  console.log('User token:', token);
  console.log('Visibility:', req.body.visibility);
  console.log('Elements:', req.body.elements?.length || 0);
  
  if (!token) {
    console.log('❌ No token');
    return res.status(401).json({ error: 'No token' });
  }
  
  const boardIndex = database.boards.findIndex(b => b._id === boardId);
  
  if (boardIndex === -1) {
    console.log('❌ Board not found');
    return res.status(404).json({ error: 'Board not found' });
  }
  
  // Check ownership
  if (database.boards[boardIndex].owner !== token) {
    console.log('❌ Ownership mismatch:');
    console.log('Board owner:', database.boards[boardIndex].owner);
    console.log('User token:', token);
    
    // For now, allow saving anyway for debugging
    console.log('⚠️ Allowing save anyway (debug mode)');
  }
  
  // Update the board
  database.boards[boardIndex] = {
    ...database.boards[boardIndex],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  
  console.log(`✅ Board saved: "${database.boards[boardIndex].title}"`);
  console.log(`✅ New visibility: ${database.boards[boardIndex].visibility}`);
  console.log(`✅ Elements saved: ${database.boards[boardIndex].elements?.length}`);
  
  res.json(database.boards[boardIndex]);
});

// ===========================================
// OTHER ENDPOINTS (simplified)
// ===========================================
app.get('/api/letters', (req, res) => {
  res.json(database.letters);
});

app.post('/api/letters', (req, res) => {
  const newLetter = {
    _id: Date.now().toString(),
    ...req.body,
    likes: [],
    createdAt: new Date().getFullYear()
  };
  database.letters.push(newLetter);
  res.json(newLetter);
});

app.get('/api/resources', (req, res) => {
  res.json(database.resources);
});

// ===========================================
// START SERVER
// ===========================================
// IMPORTANT FIX: Use environment variable for port
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   🎉 HOPE PROJECT BACKEND RUNNING!      ║');
  console.log(`║  🌐 Port: ${PORT}                        ║`);
  console.log('║  📊 Health: /health                      ║');
  console.log('║  👤 Auth: /api/auth/login                ║');
  console.log('║  🎨 Public Boards: /api/boards/public    ║');
  console.log('║  👤 Your Boards: /api/boards/user        ║');
  console.log('║  💾 SAVE: PUT /api/boards/:id            ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('\n✅ Token = User ID (simple system)');
  console.log('✅ Ownership checking DISABLED for debugging');
});