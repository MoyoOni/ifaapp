import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotificationService,
  NotificationType,
  NotificationCategory,
} from '../notifications/notification.service';

// F9-602 admin notification helper, shared by ForumService and
// ForumElderService. Non-blocking: never interrupts the member's action.
export async function notifyForumAdmins(
  prisma: PrismaService,
  notificationService: NotificationService,
  logger: Logger,
  title: string,
  message: string,
  data: Record<string, unknown>
): Promise<void> {
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
      take: 5,
    });
    admins.forEach(({ id }) => {
      notificationService
        .createNotification({
          userId: id,
          type: NotificationType.SYSTEM,
          category: NotificationCategory.WARNING,
          title,
          message,
          data,
        })
        .catch((err) => logger.error(`Failed to notify admin ${id}: ${title}`, err));
    });
  } catch {
    // Non-blocking; never interrupt the user flow
  }
}
