import { prisma } from '../lib/prisma'

interface NotificationOptions {
  userId: string
  type:   string
  data:   Record<string, any>
}

export async function sendNotification({ userId, type, data }: NotificationOptions) {
  console.log(`[Notification] userId=${userId} type=${type}`, data)

  try {
    await prisma.notification.create({
      data: {
        userId,
        channel:  'push',
        type,
        body:     JSON.stringify(data),
        metadata: data,
      },
    })
  } catch (err) {
    console.error('[Notification] Failed to log:', err)
  }
}
