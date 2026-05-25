// src/hooks/useChat.js

import { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axios";
import echo from "../services/echo";
import { mapMessage } from "../utils/chatHelpers";
import { usePresence } from "./usePresence";
import { useMessages } from "./useMessages";

export const useChat = (token) => {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const activeChatRef = useRef(null);

    // Keep a reference to the active chat for the global listener
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // 1. Get online users from usePresence hook
    const onlineUsers = usePresence(token);

    // 2. Get message functionalities from useMessages hook
    const {
        messages,
        setMessages,
        typingUser,
        setTypingUser,
        handleSendMessage,
        triggerTyping
    } = useMessages(activeChat, setConversations);

    // 3. Fetch initial conversations
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
            setConversations(formattedConversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    useEffect(() => {
        if (!token) return;
        fetchConversations();
    }, [token]);

    const handleChatSelect = (chat) => {
        setActiveChat(chat);
    };

    // 4. Global Listener for incoming messages
    useEffect(() => {
        if (conversations.length === 0) return;

        const currentUserId = Number(localStorage.getItem("current_user_id"));

        conversations.forEach((chat) => {
            const channelName = `conversations.${chat.id}`;

            echo.private(channelName).listen(".message.sent", (event) => {
                const msg = event.message;

                // Ignore messages sent by the current user
                if (msg.user_id === currentUserId || msg.sender?.id === currentUserId) return;

                // Update sidebar instantly
                setConversations((prevConvos) => prevConvos.map((c) => {
                    if (c.id === chat.id) {
                        const isOpen = activeChatRef.current?.id === chat.id;
                        return {
                            ...c,
                            lastMessage: msg.body || msg.text || "Attachment",
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: isOpen ? 0 : c.unread + 1
                        };
                    }
                    return c;
                }));

                // If the chat is currently open, add the message to the screen
                if (activeChatRef.current?.id === chat.id) {
                    const mappedMsg = mapMessage(msg);
                    setMessages((prev) => {
                        const isDuplicate = prev.some((m) => m.id === mappedMsg.id);
                        if (isDuplicate) return prev;
                        return [...prev, mappedMsg];
                    });

                    // Clear typing indicator
                    setTypingUser(null);

                    // Mark as read instantly
                    axiosInstance.post(`/chat/messages/read`, { conversation_id: chat.id }).catch(e => console.log(e));
                }
            });
        });

        // Cleanup listeners
        return () => {
            conversations.forEach((chat) => echo.leave(`conversations.${chat.id}`));
        };
    }, [conversations.length, setMessages, setTypingUser]);

    return {
        conversations,
        activeChat,
        messages,
        typingUser,
        onlineUsers,
        handleChatSelect,
        handleSendMessage,
        triggerTyping
    };
};