// src/store/chatStore.js
import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
    // Global States
    conversations: [],
    activeChat: null,
    messages: [],
    onlineUsers: [],
    typingUser: null,
    hasMore: false,
    isLoadingMore: false,

    // Actions to update the states
    setConversations: (conversations) => set({ conversations }),
    setActiveChat: (chat) => set({ activeChat: chat }),
    setMessages: (messages) => set({ messages }),
    
    // Add a single message ensuring no duplicates
    addMessage: (message) => set((state) => {
        const isDuplicate = state.messages.some(m => m.id === message.id);
        if (isDuplicate) return state;
        return { messages: [...state.messages, message] };
    }),

    // Update read status for double-tick feature
    markMessagesAsRead: (senderId) => set((state) => ({
        messages: state.messages.map(msg => 
            msg.senderId === senderId ? { ...msg, isRead: true } : msg
        )
    })),

    // Presence channel actions
    setOnlineUsers: (users) => set({ onlineUsers: users }),
    addOnlineUser: (userId) => set((state) => ({ onlineUsers: [...state.onlineUsers, userId] })),
    removeOnlineUser: (userId) => set((state) => ({ onlineUsers: state.onlineUsers.filter(id => id !== userId) })),
    
    setTypingUser: (user) => set({ typingUser: user }),
    setPagination: (hasMore, isLoadingMore) => set({ hasMore, isLoadingMore }),

    // Update sidebar dynamically without full API reload
    updateConversationSidebar: (chatId, lastMessage, time, unreadCount) => set((state) => ({
        conversations: state.conversations.map(c => {
            if (c.id === chatId) {
                return { 
                    ...c, 
                    lastMessage: lastMessage || c.lastMessage, 
                    time: time || c.time, 
                    unread: unreadCount !== undefined ? unreadCount : c.unread 
                };
            }
            return c;
        })
    }))
}));