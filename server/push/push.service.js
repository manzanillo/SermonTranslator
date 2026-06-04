const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const savePushSubscription = async (data, userId) => {
  const subscription = data;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    const error = new Error('Invalid subscription object');
    error.status = 400;
    error.payload = {
      error: 'Invalid subscription object'
    };
    throw error;
  }

  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: subscription.endpoint }
  });

  if (existing) {
    if (existing.userId !== userId) {
      await prisma.pushSubscription.update({
        where: { endpoint: subscription.endpoint },
        data: {
          userId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth
        }
      });
    }
  } else {
    await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }
    });
  }

  return {
    message: 'Subscription saved successfully'
  };
};

module.exports = {
  savePushSubscription
};
