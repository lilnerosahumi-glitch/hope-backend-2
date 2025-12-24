// worker.js - Cloudflare Worker version
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS - allow all origins
app.use('/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}))

// SIMPLE DATABASE (IN MEMORY)
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
}

// HEALTH CHECK
app.get('/health', (c) => {
  return c.json({ 
    status: 'OK', 
    message: 'Hope Project Backend on Cloudflare',
    counts: {
      letters: database.letters.length,
      resources: database.resources.length,
      boards: database.boards.length,
      users: database.users.length
    }
  })
})

// AUTH ENDPOINTS
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  let user = database.users.find(u => u.username === username)
  
  if (!user) {
    user = {
      id: 'user-' + Date.now(),
      username: username,
      password: password || 'any',
      createdAt: new Date()
    }
    database.users.push(user)
  }
  
  const token = user.id
  
  return c.json({
    token: token,
    user: { id: user.id, username: user.username }
  })
})

app.get('/api/auth/me', (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]
  
  if (!token) return c.json({ error: 'No token' }, 401)
  
  const user = database.users.find(u => u.id === token)
  if (!user) return c.json({ error: 'User not found' }, 404)
  
  return c.json({ user: { id: user.id, username: user.username } })
})

// BOARDS ENDPOINTS
app.get('/api/boards/public', (c) => {
  return c.json(database.boards.filter(b => b.visibility === 'public'))
})

app.get('/api/boards/user', (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]
  
  if (!token) return c.json([])
  
  const userBoards = database.boards.filter(b => b.owner === token)
  return c.json(userBoards)
})

app.post('/api/boards', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]
  
  if (!token) return c.json({ error: 'No token provided' }, 401)
  
  const body = await c.req.json()
  const newBoard = {
    _id: 'board-' + Date.now(),
    title: body.title || 'New Board',
    owner: token,
    visibility: 'private',
    backgroundColor: '#f9f9f9',
    elements: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  
  database.boards.push(newBoard)
  return c.json(newBoard)
})

app.get('/api/boards/:id', (c) => {
  const boardId = c.req.param('id')
  const board = database.boards.find(b => b._id === boardId)
  
  if (!board) return c.json({ error: 'Board not found' }, 404)
  return c.json(board)
})

app.put('/api/boards/:id', async (c) => {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.split(' ')[1]
  const boardId = c.req.param('id')
  
  if (!token) return c.json({ error: 'No token' }, 401)
  
  const boardIndex = database.boards.findIndex(b => b._id === boardId)
  if (boardIndex === -1) return c.json({ error: 'Board not found' }, 404)
  
  const body = await c.req.json()
  database.boards[boardIndex] = {
    ...database.boards[boardIndex],
    ...body,
    updatedAt: new Date().toISOString()
  }
  
  return c.json(database.boards[boardIndex])
})

// OTHER ENDPOINTS
app.get('/api/letters', (c) => c.json(database.letters))

app.post('/api/letters', async (c) => {
  const body = await c.req.json()
  const newLetter = {
    _id: Date.now().toString(),
    ...body,
    likes: [],
    createdAt: new Date().getFullYear()
  }
  database.letters.push(newLetter)
  return c.json(newLetter)
})

app.get('/api/resources', (c) => c.json(database.resources))

export default app