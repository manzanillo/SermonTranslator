const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllTranslations = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const translations = await prisma.translation.findMany({
    include: {
      session: true
    }
  });

  return translations;
};

const getTranslation = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { id } = data;

  if (!id) {
    const error = new Error('ID is required');
    error.status = 400;
    error.payload = {
      error: 'Translation id is required'
    };
    throw error;
  }

  const translationId = parseInt(id, 10);
  if (Number.isNaN(translationId)) {
    const error = new Error('Invalid id');
    error.status = 400;
    error.payload = {
      error: 'Invalid translation id'
    };
    throw error;
  }

  const translation = await prisma.translation.findUnique({
    where: { id: translationId },
    include: {
      session: true
    }
  });

  if (!translation) {
    const error = new Error('Translation not found');
    error.status = 404;
    error.payload = {
      error: 'Translation not found',
      id: translationId
    };
    throw error;
  }

  return translation;
};

const createTranslation = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { sessionId, originalText, translatedText, language } = data;
  const missingFields = [];

  if (!sessionId) missingFields.push('sessionId');
  if (!originalText) missingFields.push('originalText');
  if (!translatedText) missingFields.push('translatedText');
  if (!language) missingFields.push('language');

  if (missingFields.length > 0) {
    const error = new Error('Missing required fields');
    error.status = 400;
    error.payload = {
      error: 'Missing required fields',
      missingFields
    };
    throw error;
  }

  const session = await prisma.session.findUnique({
    where: { id: parseInt(sessionId, 10) }
  });

  if (!session) {
    const error = new Error('Invalid sessionId - session does not exist');
    error.status = 400;
    error.payload = {
      error: 'Invalid sessionId - session does not exist'
    };
    throw error;
  }

  if (session.imamId !== userId) {
    const error = new Error('Access denied - you can only add translations to your own sessions');
    error.status = 403;
    error.payload = {
      error: 'Access denied - you can only add translations to your own sessions'
    };
    throw error;
  }

  const newTranslation = await prisma.translation.create({
    data: {
      sessionId: parseInt(sessionId, 10),
      originalText: originalText.trim(),
      translatedText: translatedText.trim(),
      language: language.trim()
    },
    include: {
      session: true
    }
  });

  return newTranslation;
};

const replaceTranslation = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { id, sessionId, originalText, translatedText, language } = data;
  const missingFields = [];

  if (!id) missingFields.push('id');
  if (!sessionId) missingFields.push('sessionId');
  if (!originalText) missingFields.push('originalText');
  if (!translatedText) missingFields.push('translatedText');
  if (!language) missingFields.push('language');

  if (missingFields.length > 0) {
    const error = new Error('Missing required fields');
    error.status = 400;
    error.payload = {
      error: 'Missing required fields',
      missingFields
    };
    throw error;
  }

  const translationId = parseInt(id, 10);
  if (Number.isNaN(translationId)) {
    const error = new Error('Invalid id');
    error.status = 400;
    error.payload = {
      error: 'Invalid translation id'
    };
    throw error;
  }

  const translation = await prisma.translation.findUnique({
    where: { id: translationId },
    include: { session: true }
  });

  if (!translation) {
    const error = new Error('Translation not found');
    error.status = 404;
    error.payload = {
      error: 'Translation not found',
      id: translationId
    };
    throw error;
  }

  const targetSession = await prisma.session.findUnique({
    where: { id: parseInt(sessionId, 10) }
  });

  if (!targetSession) {
    const error = new Error('Invalid sessionId - session does not exist');
    error.status = 400;
    error.payload = {
      error: 'Invalid sessionId - session does not exist'
    };
    throw error;
  }

  if (targetSession.imamId !== userId) {
    const error = new Error('Access denied - you can only modify translations in your own sessions');
    error.status = 403;
    error.payload = {
      error: 'Access denied - you can only modify translations in your own sessions'
    };
    throw error;
  }

  const updatedTranslation = await prisma.translation.update({
    where: { id: translationId },
    data: {
      sessionId: parseInt(sessionId, 10),
      originalText: originalText.trim(),
      translatedText: translatedText.trim(),
      language: language.trim()
    },
    include: {
      session: true
    }
  });

  return updatedTranslation;
};

const deleteTranslation = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { id } = data;
  if (!id) {
    const error = new Error('ID is required');
    error.status = 400;
    error.payload = {
      error: 'Translation id is required'
    };
    throw error;
  }

  const translationId = parseInt(id, 10);
  if (Number.isNaN(translationId)) {
    const error = new Error('Invalid id');
    error.status = 400;
    error.payload = {
      error: 'Invalid translation id'
    };
    throw error;
  }

  const translation = await prisma.translation.findUnique({
    where: { id: translationId },
    include: { session: true }
  });

  if (!translation) {
    const error = new Error('Translation not found');
    error.status = 404;
    error.payload = {
      error: 'Translation not found',
      id: translationId
    };
    throw error;
  }

  if (translation.session.imamId !== userId) {
    const error = new Error('Access denied - you can only delete translations from your own sessions');
    error.status = 403;
    error.payload = {
      error: 'Access denied - you can only delete translations from your own sessions'
    };
    throw error;
  }

  await prisma.translation.delete({
    where: { id: translationId }
  });
};

module.exports = {
  getAllTranslations,
  getTranslation,
  createTranslation,
  replaceTranslation,
  deleteTranslation
};
