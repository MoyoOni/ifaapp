import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/shared/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/shared/utils/logger';

const SOCKET_URL = (((import.meta as any).env.VITE_API_URL as string) || 'http://localhost:3000').replace('/api', '');

export const useMessageSocket = (userId: string) => {
    const socketRef = useRef<Socket | null>(null);
    const token = localStorage.getItem('accessToken');
    useAuth(); // Trigger re-render on auth state change
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!token || !userId) return;

        // Initialize Socket
        socketRef.current = io(`${SOCKET_URL}/messaging`, {
            auth: {
                token: `Bearer ${token}`
            },
            query: {
                token
            }
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            logger.log('Connected to Messaging Socket');
        });

        socket.on('new_message', (message: any) => {
            logger.log('New Message Received:', message);

            const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;

            // Update Conversation Cache Optimistically
            queryClient.setQueryData(['message-conversation', userId, otherUserId], (oldData: any[]) => {
                if (!oldData) return [message];
                // Deduplicate
                if (oldData.some(m => m.id === message.id)) return oldData;
                return [...oldData, message];
            });

            // Invalidate Inbox to show new message preview/count
            queryClient.invalidateQueries({ queryKey: ['message-inbox', userId] });
        });

        // Listen for own sent messages (confirmation/sync)
        socket.on('message_sent', (message: any) => {
            const otherUserId = message.receiverId;
            queryClient.setQueryData(['message-conversation', userId, otherUserId], (oldData: any[]) => {
                if (!oldData) return [message];
                if (oldData.some(m => m.id === message.id)) return oldData;
                return [...oldData, message];
            });
        });

        return () => {
            socket.disconnect();
        };
    }, [userId, token, queryClient]);

    return socketRef.current;
};
