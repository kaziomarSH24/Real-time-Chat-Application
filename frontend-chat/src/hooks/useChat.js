// src/hooks/useChat.js
import { useEffect, useRef } from "react";
import axiosInstance from "../services/axios";
import echo from "../services/echo";
import { mapMessage, generatePreviewText } from "../utils/chatHelpers";
import { useChatStore } from "../store/chatStore";
import { usePresence } from "./usePresence";
import { useMessages } from "./useMessages";

export const useChat = (token) => {
    // 1. Initialize the other hooks so they run their background listeners
    usePresence(token);
    const { handleSendMessage, triggerTyping, loadMoreMessages } = useMessages(token);

    // 2. Fetch required states and actions from Zustand store
    const conversations = useChatStore((state) => state.conversations);
    const setConversations = useChatStore((state) => state.setConversations);
    const activeChat = useChatStore((state) => state.activeChat);
    const updateConversationSidebar = useChatStore((state) => state.updateConversationSidebar);

    // Keep a ref of activeChat for the global WebSocket listener
    const activeChatRef = useRef(null);
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // 3. Fetch initial conversations
    useEffect(() => {
        if (!token) return;

        const fetchConversations = async () => {
            try {
                const response = await axiosInstance.get("/chat/conversations");
                const formattedConversations = response.data.data.map((chat) => {
                    const chatName = chat.display_name || chat.name || "Unknown Chat";
                    const displayTime = chat.last_message_time || chat.latest_message?.sent_at_formatted || "";

                    const currentUserId = Number(localStorage.getItem("current_user_id"));
                    const otherUser = chat.users?.find(u => u.id !== currentUserId);

                    return {
                        id: chat.id,
                        name: chatName,
                        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`,
                        lastMessage: chat.last_message_preview || "No messages yet...",
                        time: displayTime,
                        unread: chat.unread_count || 0,
                        otherUser: otherUser?.id,
                    };
                });
                
                // Save directly to the store
                setConversations(formattedConversations);
            } catch (error) {
                console.error("Error fetching conversations:", error);
            }
        };

        fetchConversations();
    }, [token, setConversations]);

    // 4. Global Listener for incoming messages
    useEffect(() => {
        if (conversations.length === 0) return;

        const currentUserId = Number(localStorage.getItem("current_user_id"));

        conversations.forEach((chat) => {
            const channelName = `conversations.${chat.id}`;

            echo.private(channelName).listen(".message.sent", (event) => {
                const msg = event.message;

                // Ignore own messages
                if (msg.user_id === currentUserId || msg.sender?.id === currentUserId) return;

                const isOpen = activeChatRef.current?.id === chat.id;

                // Update sidebar instantly via store without reloading everything
                const currentConvo = useChatStore.getState().conversations.find(c => c.id === chat.id);
                const newUnread = isOpen ? 0 : (currentConvo?.unread || 0) + 1;

                // Format the incoming raw message for our helper
                const tempMappedMsg = mapMessage(msg);
                const sidebarLastMessage = generatePreviewText(tempMappedMsg, currentUserId);
                
                updateConversationSidebar(
                    chat.id, 
                    sidebarLastMessage, 
                    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    newUnread
                );

                // If chat is open, add message to screen and mark as read
                if (isOpen) {
                    const mappedMsg = mapMessage(msg);
                    
                    // Directly access store to update states
                    useChatStore.getState().addMessage(mappedMsg);
                    useChatStore.getState().setTypingUser(null);

                    axiosInstance.post(`/chat/messages/read`, { conversation_id: chat.id }).catch(e => console.log(e));
                }
            });
        });

        return () => {
            conversations.forEach((chat) => echo.leave(`conversations.${chat.id}`));
        };
    }, [conversations.length, updateConversationSidebar]);

    // Only return the trigger functions. States are now handled globally!
    return {
        handleSendMessage,
        triggerTyping,
        loadMoreMessages
    };
};