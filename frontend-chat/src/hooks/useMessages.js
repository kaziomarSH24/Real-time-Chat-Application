// src/hooks/useMessages.js

import { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axios";
import echo from "../services/echo";
import { mapMessage } from "../utils/chatHelpers";

export const useMessages = (activeChat, setConversations) => {
  const [messages, setMessages] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const typingTimeoutRef = useRef(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch messages when activeChat changes
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(
          `/chat/conversations/${activeChat.id}/messages`,
        );
        const fetchedMessages = response.data.data.reverse().map(mapMessage);
        setMessages(fetchedMessages);

        // Check Laravel's pagination data to see if there are more pages
        const meta = response.data.meta;
        if (meta) {
          setHasMore(meta.current_page < meta.last_page);
        } else {
          // Fallback if Laravel doesn't wrap pagination in 'meta'
          setHasMore(response.data.current_page < response.data.last_page);
        }
        setPage(1);

        // Mark messages as read in backend
        await axiosInstance.post(`/chat/messages/read`, {
          conversation_id: activeChat.id,
        });

        // Update unread count in sidebar
        setConversations((prev) =>
          prev.map((c) => (c.id === activeChat.id ? { ...c, unread: 0 } : c)),
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [activeChat, setConversations]);

  //Load More (Older) Messages function
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !activeChat) return;

    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const response = await axiosInstance.get(
        `/chat/conversations/${activeChat.id}/messages?page=${nextPage}`,
      );
      const olderMessages = response.data.data.reverse().map(mapMessage);

      // Prepend older messages to the existing array
      setMessages((prev) => [...olderMessages, ...prev]);
      setPage(nextPage);

      const meta = response.data.meta;
      if (meta) {
        setHasMore(meta.current_page < meta.last_page);
      } else {
        setHasMore(response.data.current_page < response.data.last_page);
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // send message function
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

      // Update Sidebar instantly
      setConversations((prevConvos) =>
        prevConvos.map((c) => {
          if (c.id === activeChat.id) {
            return { ...c, lastMessage: mappedMsg.text, time: mappedMsg.time };
          }
          return c;
        }),
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  //  (Typing & Read Receipts)
  useEffect(() => {
    if (!activeChat) return;

    const channelName = `conversations.${activeChat.id}`;
    const currentUserId = Number(localStorage.getItem("current_user_id"));

    echo
      .private(channelName)
      .listen(".user.typing", (event) => {
        if (event.user.id === currentUserId) return;
        setTypingUser(event.user.name);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setTypingUser(null);
        }, 3000);
      })
      .listen(".messages.read", (event) => {
        console.log("🔥 Read Event Received:", event);
        // If the other user read the messages, update UI to double-tick
        if (event.user.id !== currentUserId) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.senderId === currentUserId ? { ...msg, isRead: true } : msg,
            ),
          );
        }
      });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      echo.leave(channelName);
    };
  }, [activeChat]);

  const triggerTyping = async () => {
    if (!activeChat) return;
    try {
      await axiosInstance.post(`/chat/conversations/${activeChat.id}/typing`, {
        conversation_id: activeChat.id,
      });
    } catch (error) {}
  };

  return {
    messages,
    setMessages, // Needed for global listener
    typingUser,
    setTypingUser, // Needed for global listener
    handleSendMessage,
    triggerTyping,
    loadMoreMessages,
    hasMore,
    isLoadingMore,
  };
};
