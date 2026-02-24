import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { PrivacyLevel } from '@ile-ase/common';
import * as crypto from 'crypto';

@Injectable()
export class MessagingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get encryption key from environment
   * Throws error if not configured
   */
  private getEncryptionKey(): Buffer {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    if (encryptionKey.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }
    return Buffer.from(encryptionKey, 'utf8');
  }

  /**
   * Encrypt message content
   * NOTE: In production, use a proper encryption key management system
   */
  private encryptContent(content: string): string {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(content, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return encrypted content with IV and auth tag (base64 encoded)
    return JSON.stringify({
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    });
  }

  /**
   * Decrypt message content
   */
  private decryptContent(encryptedData: string): string {
    const algorithm = 'aes-256-gcm';
    const key = this.getEncryptionKey();

    const data = JSON.parse(encryptedData);
    const iv = Buffer.from(data.iv, 'hex');
    const authTag = Buffer.from(data.authTag, 'hex');

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async sendMessage(senderId: string, dto: CreateMessageDto, currentUser: CurrentUserPayload) {
    // Only sender can send messages
    if (currentUser.id !== senderId) {
      throw new ForbiddenException('You can only send messages as yourself');
    }

    // Verify relationship exists (Babalawo-Client relationship)
    const relationship = await this.prisma.babalawoClient.findFirst({
      where: {
        OR: [
          { babalawoId: senderId, clientId: dto.receiverId, status: 'ACTIVE' },
          { babalawoId: dto.receiverId, clientId: senderId, status: 'ACTIVE' },
        ],
      },
    });

    if (!relationship) {
      throw new ForbiddenException('You can only message your assigned Babalawo or client');
    }

    // Encrypt content (always encrypt for security)
    const encryptedContent = this.encryptContent(dto.content);

    // Calculate auto-delete date if specified
    let autoDeleteAt: Date | null = null;
    if (dto.autoDeleteDays && dto.autoDeleteDays > 0) {
      autoDeleteAt = new Date();
      autoDeleteAt.setDate(autoDeleteAt.getDate() + dto.autoDeleteDays);
    }

    // If confidential, ensure privacy level is CONFIDENTIAL
    const privacyLevel = dto.confidential
      ? PrivacyLevel.CONFIDENTIAL
      : dto.privacyLevel || PrivacyLevel.PRIVATE;

    // Create message
    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        content: encryptedContent,
        encrypted: true,
        confidential: dto.confidential || false,
        privacyLevel,
        autoDeleteDays: dto.autoDeleteDays || null,
        autoDeleteAt,
        attachments: dto.attachments ? (dto.attachments as any) : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Remove encrypted content from response (decrypt on demand)
    return {
      ...message,
      content: dto.content, // Return plain text for the sender
    };
  }

  /**
   * Send a system generated message (e.g. Welcome message)
   * Bypasses sender/relationship checks
   */
  async sendSystemMessage(senderId: string, receiverId: string, content: string) {
    // Encrypt content
    const encryptedContent = this.encryptContent(content);

    // Create message directly
    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content: encryptedContent,
        encrypted: true,
        confidential: false,
        privacyLevel: PrivacyLevel.PRIVATE,
        read: false,
      },
    });
  }

  async getConversation(userId: string, otherUserId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId && currentUser.id !== otherUserId) {
      throw new ForbiddenException('You can only view your own conversations');
    }

    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
        deletedAt: null, // Exclude soft-deleted messages
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Decrypt messages for current user
    const decryptedMessages = messages.map((msg: any) => {
      if (msg.encrypted && (msg.senderId === currentUser.id || msg.receiverId === currentUser.id)) {
        try {
          return {
            ...msg,
            content: this.decryptContent(msg.content),
          };
        } catch (error) {
          // If decryption fails, return encrypted content
          return msg;
        }
      }
      return msg;
    });

    return decryptedMessages;
  }

  async getInbox(userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only view your own inbox');
    }

    // Get all conversations with last message (exclude deleted and confidential if not participant)
    const conversations = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        deletedAt: null, // Exclude soft-deleted messages
        // Confidential messages are only visible to participants (already filtered by OR clause)
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['senderId', 'receiverId'],
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            yorubaName: true,
            avatar: true,
          },
        },
      },
    });

    // Get unread count for each conversation
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (msg: any) => {
        const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId;

        const unreadCount = await this.prisma.message.count({
          where: {
            senderId: otherUserId,
            receiverId: userId,
            read: false,
          },
        });

        return {
          ...msg,
          otherUser: msg.senderId === userId ? msg.receiver : msg.sender,
          unreadCount,
        };
      })
    );

    return conversationsWithUnread;
  }

  async markAsRead(messageId: string, userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only mark your own messages as read');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('You can only mark messages sent to you as read');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return updated;
  }

  async markConversationAsRead(
    otherUserId: string,
    userId: string,
    currentUser: CurrentUserPayload
  ) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only mark your own conversations as read');
    }

    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Delete a message from the sender's perspective
   * This is a soft delete that sets deletedAt timestamp
   */
  async deleteMessage(messageId: string, userId: string, currentUser: CurrentUserPayload) {
    if (currentUser.id !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Users can only delete messages they sent
    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete messages you sent');
    }

    // Perform soft delete by setting deletedAt timestamp
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        deletedAt: new Date(),
      },
    });

    return updated;
  }
}
