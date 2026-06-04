const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllForums = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const forums = await prisma.forumPost.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' }
  });

  return forums;
};

const createForumPost = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { title, content } = data;
  if (!title || !content) {
    const error = new Error('Missing title or content');
    error.status = 400;
    error.payload = {
      error: 'Missing title or content'
    };
    throw error;
  }

  const newPost = await prisma.forumPost.create({
    data: {
      title: title.trim(),
      content: content.trim(),
      authorId: userId
    },
    include: { author: true }
  });

  return newPost;
};

const createComment = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { id, content, parentId, repliedToName } = data;
  if (!content) {
    const error = new Error('Missing comment content');
    error.status = 400;
    error.payload = {
      error: 'Missing comment content'
    };
    throw error;
  }

  const postId = parseInt(id, 10);
  if (!id || Number.isNaN(postId)) {
    const error = new Error('Invalid post id');
    error.status = 400;
    error.payload = {
      error: 'Invalid post id'
    };
    throw error;
  }

  const newComment = await prisma.forumComment.create({
    data: {
      content: content.trim(),
      authorId: userId,
      postId,
      parentId: parentId || null,
      repliedToName: repliedToName || null
    },
    include: { author: true }
  });

  return newComment;
};

const getSpecificComments = async (data, userId) => {
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
      error: 'Post id is required'
    };
    throw error;
  }

  const postId = parseInt(id, 10);
  if (Number.isNaN(postId)) {
    const error = new Error('Invalid post id');
    error.status = 400;
    error.payload = {
      error: 'Invalid post id'
    };
    throw error;
  }

  const comments = await prisma.forumComment.findMany({
    where: { postId },
    include: { author: true },
    orderBy: { createdAt: 'asc' }
  });

  return comments;
};

module.exports = {
  getAllForums,
  createForumPost,
  createComment,
  getSpecificComments
};
