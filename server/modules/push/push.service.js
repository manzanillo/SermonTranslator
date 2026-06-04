const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const savePushSubscription = async (data, userId) => {
  if (!userId) {
    const error = new Error('User must be authenticated');
    error.status = 401;
    error.payload = {
      error: 'User must be authenticated'
    };
    throw error;
  }

  const { endpoint, keys } = data;
  const missingFields = [];

  if (!endpoint) missingFields.push('endpoint');
  if (!keys || !keys.p256dh || !keys.auth) missingFields.push('keys');

  if (missingFields.length > 0) {
    const error = new Error('Missing required fields');
    error.status = 400;
    error.payload = {
      error: 'Missing required fields',
      missingFields
    };
    throw error;
  }

  const subscriptionData = {
    userId,
    endpoint: endpoint.trim(),
    p256dh: keys.p256dh,
    auth: keys.auth
  };

  const existingSubscription = await prisma.pushSubscription.findFirst({
    where: {
      userId,
      endpoint: endpoint.trim()
    }
  });

  if (existingSubscription) {
    const updatedSubscription = await prisma.pushSubscription.update({
      where: { id: existingSubscription.id },
      data: subscriptionData
    });
    return updatedSubscription;
  }

  const newSubscription = await prisma.pushSubscription.create({
    data: subscriptionData
  });
  return newSubscription;
};

module.exports = {
  savePushSubscription
};
