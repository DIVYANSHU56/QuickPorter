const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bookingRoutes = require('./routes/bookingRoutes');
const authRoutes = require('./routes/authRoutes');
const jwt = require('jsonwebtoken');
const customerRoutes = require('./routes/customerRoutes');
const customerOffersRoutes = require('./routes/customerOffers');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();
const app = express();

const cors = require('cors');

app.use(cors());

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).send({ success: false, message: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send({ success: false, message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).send({ success: false, message: 'Invalid token' });
  }
}

// Use auth routes
app.use('/api/auth', authRoutes);

// Protect booking routes with auth middleware
app.use('/api/bookings', authMiddleware, bookingRoutes);

// Protect user routes with auth middleware
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', authMiddleware, userRoutes);

// Protect pricing routes with auth middleware
const pricingRoutes = require('./routes/pricingRoutes');
app.use('/api/pricing', authMiddleware, pricingRoutes);

// Add customer offers routes without auth middleware
app.use('/api/customer', customerOffersRoutes);

// Protect report routes with auth middleware
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/reports', authMiddleware, reportRoutes);

// Serve admin.html with auth protection
app.get('/admin', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Serve dashboard.html with auth protection
app.get('/dashboard', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map(); // Map of porterId to WebSocket

wss.on('connection', (ws, req) => {
  // Expect client to send porterId after connection
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'register' && data.porterId) {
        clients.set(data.porterId, ws);
        ws.porterId = data.porterId;
      }
    } catch (err) {
      console.error('Invalid message from client:', message);
    }
  });

  ws.on('close', () => {
    if (ws.porterId) {
      clients.delete(ws.porterId);
    }
  });
});

// Export a function to broadcast booking updates to a porter
function notifyPorter(porterId, booking) {
  const ws = clients.get(porterId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'bookingUpdate', booking }));
  }
}

app.locals.notifyPorter = notifyPorter;

server.listen(3000, () => console.log('Server running on port 3000'));
