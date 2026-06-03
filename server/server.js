require('dotenv').config();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const { Resend } = require('resend');
const React = require('react');
const { render } = require('@react-email/render');
const { Html, Body, Container, Text, Heading, Button } = require('@react-email/components');
const webpush = require('web-push');

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Initialize Prisma client
const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE
// ============================================================================
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());

// ============================================================================
// RATE LIMITING
// ============================================================================
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 12 : 1000, // Allow more in dev for Cypress
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'production' ? 12 : 1000, // Allow more in dev for Cypress
  message: 'Too many registrations, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
const validatePassword = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

async function translateText(text, targetLang) {
  try {
    const response = await axios.post('https://libretranslate.com/translate', {
      q: text,
      source: 'tr',
      target: targetLang,
      format: 'text'
    });
    return response.data.translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // fallback
  }
}

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================
const authenticate = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ============================================================================
// SOCKET.IO EVENTS
// ============================================================================
let connectedClients = 0;
let sessionActive = false;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`A user connected. Total clients: ${connectedClients}`);

  // Send current status to new client
  socket.emit('listenerCount', connectedClients);
  socket.emit('sessionStatus', { active: sessionActive });

  socket.on('disconnect', () => {
    connectedClients--;
    console.log(`User disconnected. Total clients: ${connectedClients}`);
    io.emit('listenerCount', connectedClients);
  });

  // Handle speech input and translation
  socket.on('speech', async (data) => {
    if (sessionActive && data.sessionId) {
      try {
        const german = await translateText(data.text, 'de');
        const english = await translateText(data.text, 'en');
        
        // Save to DB
        await prisma.translation.create({
          data: { sessionId: data.sessionId, originalText: data.text, translatedText: german, language: 'de' }
        });
        await prisma.translation.create({
          data: { sessionId: data.sessionId, originalText: data.text, translatedText: english, language: 'en' }
        });

        io.emit('translation', { original: data.text, german, english });
      } catch (err) {
        console.error('Failed to translate and save speech:', err);
      }
    }
  });

  // Handle session management
  socket.on('startSession', (data) => {
    sessionActive = true;
    io.emit('sessionStatus', { active: true });
    console.log(`Session started: ${data?.sessionId}`);
  });

  socket.on('endSession', async (data) => {
    sessionActive = false;
    io.emit('sessionStatus', { active: false });
    io.emit('sessionEnded');
    
    if (data?.sessionId) {
      try {
        const translationsCount = await prisma.translation.count({
          where: { sessionId: data.sessionId }
        });

        if (translationsCount === 0) {
          await prisma.session.delete({
            where: { id: data.sessionId }
          });
          console.log(`Session ${data.sessionId} deleted (no content).`);
        } else {
          await prisma.session.update({
            where: { id: data.sessionId },
            data: { isActive: false }
          });
          console.log(`Session ${data.sessionId} ended and stored.`);
        }
      } catch (err) {
        console.error('Failed to end session in DB:', err);
      }
    }
  });
});

// ============================================================================
// STATUS ENDPOINT
// ============================================================================
app.get('/status', (req, res) => {
  res.json({ status: 'running', clients: connectedClients, sessionActive });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// POST /api/auth/register
app.post('/api/auth/register', registerLimiter, async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validate required fields
  if (!name || !email || !password || !role) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'email', 'password', 'role']
    });
  }

  // Validate role
  if (!['imam', 'listener'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be "imam" or "listener"'
    });
  }

  // Validate password strength
  if (!validatePassword(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters and contain uppercase letter, lowercase letter, number, and special character (@$!%*?&)'
    });
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role.trim()
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  // Validate required fields
  if (!email || !password) {
    return res.status(400).json({
      error: 'Email and password are required'
    });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Check if user exists and password is correct
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ============================================================================
// PASSWORD RESET HELPER
// ============================================================================
const sendPasswordResetEmail = async (email, resetUrl) => {
  try {
    const emailHtml = await render(
      React.createElement(Html, null,
        React.createElement(Body, { style: { backgroundColor: '#F4F8F5', fontFamily: 'sans-serif' } },
          React.createElement(Container, { style: { padding: '40px 20px', textAlign: 'center' } },
            React.createElement(Heading, { style: { color: '#0C3B28', fontSize: '24px' } }, "Password Reset Request"),
            React.createElement(Text, { style: { color: '#4C6E4E', fontSize: '16px', marginBottom: '24px' } }, 
              "You recently requested to change your password for your Sermon Translator account. Click the button below to proceed."
            ),
            React.createElement(Button, { 
              href: resetUrl, 
              style: { backgroundColor: '#288C49', color: 'white', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' } 
            }, "Change Password"),
            React.createElement(Text, { style: { color: '#4C6E4E', fontSize: '14px', marginTop: '24px' } }, 
              "If you did not request a password change, please ignore this email."
            )
          )
        )
      )
    );

    console.log('\n======================================================');
    console.log(`[TESTING MODE] Password Reset Link for ${email}:`);
    console.log(resetUrl);
    console.log('======================================================\n');

    await resend.emails.send({
      from: 'Sermon Translator <onboarding@resend.dev>', // Use onboarding@resend.dev for testing unless domain is verified
      to: email,
      subject: 'Change Your Password',
      html: emailHtml
    });
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
};

// POST /api/auth/request-password-change
app.post('/api/auth/request-password-change', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate token valid for 15 minutes, using current password hash as part of the secret
    const secret = process.env.JWT_SECRET + user.password;
    const token = jwt.sign({ userId: user.id }, secret, { expiresIn: '15m' });

    const resetUrl = `http://localhost:5173/settings?token=${token}`;

    // Send email without blocking the response
    sendPasswordResetEmail(user.email, resetUrl);

    res.status(200).json({ message: 'Password reset email sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Failed to request password change' });
  }
});

// POST /api/auth/reset-password-with-token
app.post('/api/auth/reset-password-with-token', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token and new password are required' });
  }

  try {
    // Decode token without verification to get userId
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.userId) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify token
    const secret = process.env.JWT_SECRET + user.password;
    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Validate new password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters and contain uppercase letter, lowercase letter, number, and special character (@$!%*?&)'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update in database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

// POST /api/users - Create a new user
app.post('/api/users', authenticate, async (req, res) => {
  const { name, role } = req.body;

  // Validate required fields
  if (!name || !role) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['name', 'role']
    });
  }

  // Validate role
  if (!['imam', 'listener'].includes(role)) {
    return res.status(400).json({
      error: 'Invalid role. Must be "imam" or "listener"'
    });
  }

  try {
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        role: role.trim()
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users - Get all users
app.get('/api/users', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================================================
// SESSION ROUTES
// ============================================================================

// POST /api/sessions - Create a new session
app.post('/api/sessions', authenticate, async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user.userId;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['title', 'description']
    });
  }

  try {
    // Verify user exists and is an imam
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(400).json({
        error: 'User does not exist'
      });
    }

    if (user.role !== 'imam') {
      return res.status(403).json({
        error: 'Only imams can create sessions'
      });
    }

    const newSession = await prisma.session.create({
      data: {
        imamId: userId,
        title: title.trim(),
        description: description.trim()
      },
      include: {
        imam: true,
        participants: true,
        translations: true
      }
    });


    res.status(201).json({
      message: 'Session created successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Session creation error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});



// GET /api/sessions - Get all sessions
app.get('/api/sessions', authenticate, async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        imam: true,
        participants: true,
        translations: true
      }
    });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions/:id/join - Join a session (records participation)
app.post('/api/sessions/:id/join', authenticate, async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);
  if (Number.isNaN(sessionId)) return res.status(400).json({ error: 'Invalid session ID' });

  try {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (!session) return res.status(404).json({ error: 'Session not found' });

    await prisma.session.update({
      where: { id: sessionId },
      data: { participants: { connect: { id: req.user.userId } } }
    });

    res.status(200).json({ message: 'Joined session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// POST /api/sessions/:id/end - End a session
app.post('/api/sessions/:id/end', authenticate, async (req, res) => {
  const sessionId = parseInt(req.params.id, 10);

  if (Number.isNaN(sessionId)) {
    return res.status(400).json({ error: 'Invalid session ID' });
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { 
        translations: true,
        participants: {
          include: { pushSubscriptions: true }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.imamId !== req.user.userId) {
      return res.status(403).json({ error: 'Only the session imam can end this session' });
    }

    if (session.translations.length === 0) {
      await prisma.session.delete({ where: { id: sessionId } });
    } else {
      await prisma.session.update({
        where: { id: sessionId },
        data: { isActive: false }
      });
    }

    io.emit('sessionStatus', { active: false });
    io.emit('sessionEnded');
    sessionActive = false;

    // Send push notifications to participants
    if (session.participants && session.participants.length > 0) {
      const payload = JSON.stringify({
        title: 'Session Ended',
        body: `The session "${session.title}" has ended.`,
        url: '/listener'
      });

      const pushPromises = [];
      for (const participant of session.participants) {
        for (const sub of participant.pushSubscriptions) {
          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };
          
          pushPromises.push(
            webpush.sendNotification(pushSubscription, payload).catch(async (err) => {
              if (err.statusCode === 410 || err.statusCode === 404) {
                console.log('Push subscription expired. Deleting from DB.');
                await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
              } else {
                console.error('Error sending push notification:', err);
              }
            })
          );
        }
      }
      await Promise.all(pushPromises);
    }

    res.status(200).json({ message: 'Session ended successfully' });
  } catch (error) {
    console.error('Failed to end session via API:', error);
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /api/sessions/:id - Get session by ID
app.get('/api/sessions/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const session = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        imam: true,
        participants: true,
        translations: true
      }
    });

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        id: parseInt(id)
      });
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ============================================================================
// TRANSLATION ROUTES
// ============================================================================

// GET /api/translations - Returns all translations
app.get('/api/translations', authenticate, async (req, res) => {
  try {
    const translations = await prisma.translation.findMany({
      include: {
        session: true
      }
    });
    res.status(200).json(translations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// GET /api/translations/:id - Returns a translation by ID
app.get('/api/translations/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const translation = await prisma.translation.findUnique({
      where: { id: parseInt(id) },
      include: {
        session: true
      }
    });

    if (!translation) {
      return res.status(404).json({
        error: 'Translation not found',
        id: parseInt(id)
      });
    }

    res.status(200).json(translation);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch translation' });
  }
});

// POST /api/translations - Creates a new translation
app.post('/api/translations', authenticate, async (req, res) => {
  const { sessionId, originalText, translatedText, language } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!sessionId) missingFields.push('sessionId');
  if (!originalText) missingFields.push('originalText');
  if (!translatedText) missingFields.push('translatedText');
  if (!language) missingFields.push('language');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missingFields
    });
  }

  try {
    // Verify session exists and user has access
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      return res.status(400).json({
        error: 'Invalid sessionId - session does not exist'
      });
    }

    // Check if user is the imam of this session
    if (session.imamId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied - you can only add translations to your own sessions'
      });
    }

    // Create new translation
    const newTranslation = await prisma.translation.create({
      data: {
        sessionId: parseInt(sessionId),
        originalText: originalText.trim(),
        translatedText: translatedText.trim(),
        language: language.trim()
      },
      include: {
        session: true
      }
    });

    res.status(201).json({
      message: 'Translation created successfully',
      translation: newTranslation
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create translation' });
  }
});

// PUT /api/translations/:id - Completely replaces an existing translation
app.put('/api/translations/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  const { sessionId, originalText, translatedText, language } = req.body;

  // Validate required fields
  const missingFields = [];
  if (!sessionId) missingFields.push('sessionId');
  if (!originalText) missingFields.push('originalText');
  if (!translatedText) missingFields.push('translatedText');
  if (!language) missingFields.push('language');

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Missing required fields',
      missingFields
    });
  }

  try {
    // Verify session exists and user has access
    const session = await prisma.session.findUnique({
      where: { id: parseInt(sessionId) }
    });

    if (!session) {
      return res.status(400).json({
        error: 'Invalid sessionId - session does not exist'
      });
    }

    // Check if user is the imam of this session
    if (session.imamId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied - you can only modify translations in your own sessions'
      });
    }

    // Update the translation
    const updatedTranslation = await prisma.translation.update({
      where: { id: parseInt(id) },
      data: {
        sessionId: parseInt(sessionId),
        originalText: originalText.trim(),
        translatedText: translatedText.trim(),
        language: language.trim()
      },
      include: {
        session: true
      }
    });

    res.status(200).json({
      message: 'Translation updated successfully',
      translation: updatedTranslation
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Translation not found',
        id: parseInt(id)
      });
    }
    res.status(500).json({ error: 'Failed to update translation' });
  }
});

// DELETE /api/translations/:id - Deletes a translation
app.delete('/api/translations/:id', authenticate, async (req, res) => {
  const { id } = req.params;

  try {
    // First, find the translation to check ownership
    const translation = await prisma.translation.findUnique({
      where: { id: parseInt(id) },
      include: { session: true }
    });

    if (!translation) {
      return res.status(404).json({
        error: 'Translation not found',
        id: parseInt(id)
      });
    }

    // Check if user is the imam of the session
    if (translation.session.imamId !== req.user.userId) {
      return res.status(403).json({
        error: 'Access denied - you can only delete translations from your own sessions'
      });
    }

    await prisma.translation.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({
        error: 'Translation not found',
        id: parseInt(id)
      });
    }
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// ============================================================================
// FORUM ROUTES
// ============================================================================

// GET /api/forums - Get all forum posts
app.get('/api/forums', authenticate, async (req, res) => {
  try {
    const forums = await prisma.forumPost.findMany({
      include: { author: true },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(forums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

// POST /api/forums - Create a new forum post
app.post('/api/forums', authenticate, async (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Missing title or content' });
  }

  try {
    const newPost = await prisma.forumPost.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: req.user.userId
      },
      include: { author: true }
    });



    res.status(201).json({
      message: 'Forum post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Forum post creation error:', error);
    res.status(500).json({ error: 'Failed to create forum post' });
  }
});

// GET /api/forums/:id/comments - Get comments for a specific forum post
app.get('/api/forums/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const comments = await prisma.forumComment.findMany({
      where: { postId: parseInt(id) },
      include: { author: true },
      orderBy: { createdAt: 'asc' }
    });
    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/forums/:id/comments - Create a new comment
app.post('/api/forums/:id/comments', authenticate, async (req, res) => {
  const { id } = req.params;
  const { content, parentId, repliedToName } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Missing comment content' });
  }

  try {
    const newComment = await prisma.forumComment.create({
      data: {
        content: content.trim(),
        authorId: req.user.userId,
        postId: parseInt(id),
        parentId: parentId || null,
        repliedToName: repliedToName || null
      },
      include: { author: true }
    });



    res.status(201).json({
      message: 'Comment created successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// (Note: 404 handler moved to the end of the file after all route definitions)

// ============================================================================
// PUSH NOTIFICATIONS ROUTES
// ============================================================================
app.post('/api/push/subscribe', authenticate, async (req, res) => {
  const subscription = req.body;

  console.log('Received push subscription request from user', req.user?.userId);
  console.log('Subscription payload (raw):', JSON.stringify(subscription));

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint: subscription.endpoint }
    });

    if (existing) {
      if (existing.userId !== req.user.userId) {
        await prisma.pushSubscription.update({
          where: { endpoint: subscription.endpoint },
          data: { userId: req.user.userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }
        });
      }
    } else {
      await prisma.pushSubscription.create({
        data: {
          userId: req.user.userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });
    }

    res.status(201).json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Failed to save push subscription:', error && error.stack ? error.stack : error);
    // include minimal hint for the client during debugging
    res.status(500).json({ error: 'Failed to save subscription', details: (error && error.message) ? error.message : null });
  }
});

// ============================================================================
// START SERVER
// ============================================================================
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`
✓ Socket.IO server ready
✓ Express API ready

Available endpoints:
  GET    /status                    - Server status
  POST   /api/auth/register         - Register user
  POST   /api/auth/login            - Login user
  POST   /api/auth/logout           - Logout user
  GET    /api/auth/me               - Get current user
  GET    /api/users                 - Get all users
  POST   /api/users                 - Create user
  POST   /api/sessions              - Create session
  GET    /api/sessions              - Get all sessions
  GET    /api/sessions/:id          - Get session by ID
  GET    /api/translations          - Get all translations
  GET    /api/translations/:id      - Get translation by ID
  POST   /api/translations          - Create translation
  PUT    /api/translations/:id      - Update translation
  DELETE /api/translations/:id      - Delete translation
  `);
});

// Error handling for undefined routes (placed after all routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});