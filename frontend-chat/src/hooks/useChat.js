import { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axios";
import echo from "../services/echo";
import { mapMessage } from "../utils/chatHelpers";

export const useChat = (token) => {
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);
    const [onlineUsers, setOnlineUsers] = useState([]);

    const activeChatRef = useRef(null);
    const typingTimeoutRef = useRef(null);

    
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

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
                    otherUser: otherUser?.id
                };
            });
            setConversations(formattedConversations);
        } catch (error) {
            console.error("Error fetching conversations:", error);
        }
    };

    //real-time Online/offline traking
    useEffect(()=> {
        echo.join('online')
        //.here() gives the list of currently online users when we join the channel
            .here((users) => {
                setOnlineUsers(users.map(u => u.id));
            })
            //.joinging() and .leaving() are used to track users coming online or going offline in real-time
            .joining((user) => {
                setOnlineUsers((prev) => [...prev, user.id]);
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter(id => id !== user.id));
            });
        return () => {
            echo.leave('online');
        };
    }, [token]);
    

    // initial fetch of conversations when token is available
    useEffect(() => {
        if (!token) return;
        fetchConversations();
    }, [token]);

    const handleChatSelect = async (chat) => {
        setActiveChat(chat);
        try {
            const response = await axiosInstance.get(`/chat/conversations/${chat.id}/messages`);
            const fetchedMessages = response.data.data.reverse().map(mapMessage);
            setMessages(fetchedMessages);

            // Mark messages as read when opening the chat
            await axiosInstance.post(`/chat/messages/read`, { conversation_id: chat.id });
            
            setConversations(prev => prev.map(c => 
                c.id === chat.id ? { ...c, unread: 0 } : c
            ));
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    //1. Global message listener for all conversations (for real-time updates in sidebar and messages)
    useEffect(() => {
        if (conversations.length === 0) return;

        const currentUserId = Number(localStorage.getItem("current_user_id"));

        conversations.forEach((chat) => {
            const channelName = `conversations.${chat.id}`;

            echo.private(channelName).listen(".message.sent", (event) => {
                const msg = event.message;

                // ignore if the message is sent by the current user (since we already add it optimistically)
                if (msg.user_id === currentUserId || msg.sender?.id === currentUserId) return;

                // A. conversations list realtime update
                setConversations((prevConvos) => prevConvos.map((c) => {
                    if (c.id === chat.id) {
                        const isOpen = activeChatRef.current?.id === chat.id;
                        return {
                            ...c,
                            lastMessage: msg.body || msg.text || "Attachment",
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            unread: isOpen ? 0 : c.unread + 1 // if chat is open, don't increase unread count, else increase by 1
                        };
                    }
                    return c;
                }));

                // B. messages list realtime update (only if we are currently viewing this chat)
                if (activeChatRef.current?.id === chat.id) {
                    const mappedMsg = mapMessage(msg);
                    setMessages((prev) => {
                        const isDuplicate = prev.some((m) => m.id === mappedMsg.id);
                        if (isDuplicate) return prev;
                        return [...prev, mappedMsg];
                    });

                    // Clear typing indicator instantly when a new message arrives
                    setTypingUser(null);
                    if (typingTimeoutRef.current) {
                        clearTimeout(typingTimeoutRef.current);
                    }

                    // 
                    axiosInstance.post(`/chat/messages/read`, { conversation_id: chat.id }).catch(e => console.log(e));
                }
            });
        });

        return () => {
            conversations.forEach((chat) => echo.leave(`conversations.${chat.id}`));
        };
    }, [conversations.length]); // if new conversations are loaded, we need to set up listeners for them as well

    // Typing indicator listener (separate useEffect to avoid unnecessary re-subscriptions)
    useEffect(() => {
        if (!activeChat) return;

        const channelName = `conversations.${activeChat.id}`;
        const currentUserId = Number(localStorage.getItem("current_user_id"));

        echo.private(channelName).listen(".user.typing", (event) => {
            if (event.user.id === currentUserId) return;

            setTypingUser(event.user.name);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
                setTypingUser(null);
            }, 3000);
        });

        return () => {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        };
    }, [activeChat]);

    // send message function with optimistic UI update
    const handleSendMessage = async (text) => {
        if (!activeChat) return;
        try {
            const response = await axiosInstance.post("/chat/messages", {
                conversation_id: activeChat.id,
                body: text,
            });

            const newMsg = response.data.data;
            const mappedMsg = mapMessage(newMsg);

            setMessages((prev) => [...prev, mappedMsg]);
            
            // Update last message and time in conversations list immediately after sending a message
            setConversations((prevConvos) => prevConvos.map((c) => {
                if (c.id === activeChat.id) {
                    return { ...c, lastMessage: mappedMsg.text, time: mappedMsg.time };
                }
                return c;
            }));
            
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const triggerTyping = async () => {
        if (!activeChat) return;
        try {
            await axiosInstance.post(`/chat/conversations/${activeChat.id}/typing`, {
                conversation_id: activeChat.id
            });
        } catch (error) {}
    };

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