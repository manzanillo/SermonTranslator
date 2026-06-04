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
const { createSession, getSession, joinSession, getAllSession, endSession } = require('./session/session.service');
const { createUser, getAllUser } = require('./users/users.service');
const { getAllTranslations, getTranslation, createTranslation, replaceTranslation, deleteTranslation } = require('./translations/translations.service');
const { getAllForums, createForumPost, createComment, getSpecificComments } = require('./forums/forums.service');
const { registerUser, loginUser, logoutUser, getCurrentUserInfo, requestPasswordChange, resetPasswordWithToken } = require('./auth/auth.service');
const { savePushSubscription } = require('./push/push.service');

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
  const requestData = { ...req.body };
  const userId = req.user?.userId;

  try {
    const newUser = await registerUser(requestData, userId);
    res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', loginLimiter, async (req, res) => {
  const requestData = { ...req.body };
  const userId = req.user?.userId;

  try {
    const user = await loginUser(requestData, userId);

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
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to login' });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', async (req, res) => {
  const requestData = { ...req.body };
  const userId = req.user?.userId;

  try {
    const result = await logoutUser(requestData, userId);
    res.clearCookie('token');
    res.status(200).json(result);
  } catch (error) {
    console.error('Logout error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// GET /api/auth/me - Get current user info
app.get('/api/auth/me', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const user = await getCurrentUserInfo(requestData, userId);
    res.status(200).json({ user });
  } catch (error) {
    console.error('Fetch current user info error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
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
  const requestData = { ...req.body };
  const userId = req.user.userId;

  try {
    const result = await requestPasswordChange(requestData, userId);
    sendPasswordResetEmail(result.email, result.resetUrl);
    res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Password reset request error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to request password change' });
  }
});

// POST /api/auth/reset-password-with-token
app.post('/api/auth/reset-password-with-token', async (req, res) => {
  const requestData = { ...req.body };
  const userId = null;

  try {
    const result = await resetPasswordWithToken(requestData, userId);
    res.status(200).json(result);
  } catch (error) {
    console.error('Password reset error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ============================================================================
// USER ROUTES
// ============================================================================

// POST /api/users - Create a new user
app.post('/api/users', authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const newUser = await createUser(req.body, userId);
    res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('User creation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// GET /api/users - Get all users
app.get('/api/users', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const users = await getAllUser(requestData, userId);
    res.status(200).json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ============================================================================
// SESSION ROUTES
// ============================================================================

// POST /api/sessions - Create a new session
app.post('/api/sessions', authenticate, async (req, res) => {
  const userId = req.user.userId;

  try {
    const newSession = await createSession(req.body, userId);
    res.status(201).json({
      message: 'Session created successfully',
      session: newSession
    });
  } catch (error) {
    console.error('Session creation error:', error);

    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }

    res.status(500).json({ error: 'Failed to create session' });
  }
});



// GET /api/sessions - Get all sessions
app.get('/api/sessions', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const sessionData = { ...req.body };

  try {
    const sessions = await getAllSession(sessionData, userId);
    res.status(200).json(sessions);
  } catch (error) {
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// POST /api/sessions/:id/join - Join a session (records participation)
app.post('/api/sessions/:id/join', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const sessionData = { ...req.body, id: req.params.id };

  try {
    const result = await joinSession(sessionData, userId);
    res.status(200).json(result);
  } catch (error) {
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to join session' });
  }
});

// POST /api/sessions/:id/end - End a session
app.post('/api/sessions/:id/end', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const sessionData = { ...req.body, id: req.params.id };

  try {
    const result = await endSession(sessionData, userId);

    io.emit('sessionStatus', { active: false });
    io.emit('sessionEnded');
    sessionActive = false;

    res.status(200).json(result);
  } catch (error) {
    console.error('Failed to end session via API:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to end session' });
  }
});

// GET /api/sessions/:id - Get session by ID
app.get('/api/sessions/:id', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const sessionData = { ...req.body, id: req.params.id };

  try {
    const session = await getSession(sessionData, userId);
    res.status(200).json(session);
  } catch (error) {
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ============================================================================
// TRANSLATION ROUTES
// ============================================================================

// GET /api/translations - Returns all translations
app.get('/api/translations', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const translations = await getAllTranslations(requestData, userId);
    res.status(200).json(translations);
  } catch (error) {
    console.error('Fetch translations error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch translations' });
  }
});

// GET /api/translations/:id - Returns a translation by ID
app.get('/api/translations/:id', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body, id: req.params.id };

  try {
    const translation = await getTranslation(requestData, userId);
    res.status(200).json(translation);
  } catch (error) {
    console.error('Fetch translation by id error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch translation' });
  }
});

// POST /api/translations - Creates a new translation
app.post('/api/translations', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const newTranslation = await createTranslation(requestData, userId);
    res.status(201).json({
      message: 'Translation created successfully',
      translation: newTranslation
    });
  } catch (error) {
    console.error('Create translation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to create translation' });
  }
});

// PUT /api/translations/:id - Completely replaces an existing translation
app.put('/api/translations/:id', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body, id: req.params.id };

  try {
    const updatedTranslation = await replaceTranslation(requestData, userId);
    res.status(200).json({
      message: 'Translation updated successfully',
      translation: updatedTranslation
    });
  } catch (error) {
    console.error('Replace translation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to update translation' });
  }
});

// DELETE /api/translations/:id - Deletes a translation
app.delete('/api/translations/:id', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { id: req.params.id };

  try {
    await deleteTranslation(requestData, userId);
    res.status(204).send();
  } catch (error) {
    console.error('Delete translation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to delete translation' });
  }
});

// ============================================================================
// FORUM ROUTES
// ============================================================================

// GET /api/forums - Get all forum posts
app.get('/api/forums', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const forums = await getAllForums(requestData, userId);
    res.status(200).json(forums);
  } catch (error) {
    console.error('Fetch forums error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch forums' });
  }
});

// POST /api/forums - Create a new forum post
app.post('/api/forums', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body };

  try {
    const newPost = await createForumPost(requestData, userId);
    res.status(201).json({
      message: 'Forum post created successfully',
      post: newPost
    });
  } catch (error) {
    console.error('Forum post creation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to create forum post' });
  }
});

// GET /api/forums/:id/comments - Get comments for a specific forum post
app.get('/api/forums/:id/comments', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body, id: req.params.id };

  try {
    const comments = await getSpecificComments(requestData, userId);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Fetch specific comments error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// POST /api/forums/:id/comments - Create a new comment
app.post('/api/forums/:id/comments', authenticate, async (req, res) => {
  const userId = req.user.userId;
  const requestData = { ...req.body, id: req.params.id };

  try {
    const newComment = await createComment(requestData, userId);
    res.status(201).json({
      message: 'Comment created successfully',
      comment: newComment
    });
  } catch (error) {
    console.error('Comment creation error:', error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
    res.status(500).json({ error: 'Failed to create comment' });
  }
});
// ============================================================================
// PUSH NOTIFICATIONS ROUTES
// ============================================================================
app.post('/api/push/subscribe', authenticate, async (req, res) => {
  const requestData = { ...req.body };
  const userId = req.user?.userId;

  try {
    const result = await savePushSubscription(requestData, userId);
    res.status(201).json(result);
  } catch (error) {
    console.error('Failed to save push subscription:', error && error.stack ? error.stack : error);
    if (error.status && error.payload) {
      return res.status(error.status).json(error.payload);
    }
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