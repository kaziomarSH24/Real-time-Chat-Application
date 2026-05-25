// src/hooks/useMessages.js
import { useState, useEffect, useRef } from "react";
import axiosInstance from "../services/axios";
import echo from "../services/echo";
import { mapMessage, generatePreviewText } from "../utils/chatHelpers";
import { useChatStore } from "../store/chatStore";

export const useMessages = (token) => {
  // Fetch states and actions from Zustand store
  const activeChat = useChatStore((state) => state.activeChat);
  const setMessages = useChatStore((state) => state.setMessages);
  const setTypingUser = useChatStore((state) => state.setTypingUser);
  const setPagination = useChatStore((state) => state.setPagination);
  const updateConversationSidebar = useChatStore(
    (state) => state.updateConversationSidebar,
  );

  const hasMore = useChatStore((state) => state.hasMore);
  const isLoadingMore = useChatStore((state) => state.isLoadingMore);

  const [page, setPage] = useState(1);
  const typingTimeoutRef = useRef(null);

  // 1. Fetch Initial Messages
  useEffect(() => {
    if (!activeChat) return;

    const fetchMessages = async () => {
      try {
        const response = await axiosInstance.get(
          `/chat/conversations/${activeChat.id}/messages?page=1`,
        );
        const fetchedMessages = response.data.data.reverse().map(mapMessage);
        setMessages(fetchedMessages);

        const meta = response.data.meta;
        if (meta) {
          setPagination(meta.current_page < meta.last_page, false);
        } else {
          setPagination(
            response.data.current_page < response.data.last_page,
            false,
          );
        }
        setPage(1);

        // Mark messages as read in backend
        await axiosInstance.post(`/chat/messages/read`, {
          conversation_id: activeChat.id,
        });

        // Update unread count in sidebar to 0
        updateConversationSidebar(activeChat.id, undefined, undefined, 0);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [activeChat, setMessages, setPagination, updateConversationSidebar]);

  // 2. Load More (Older) Messages function
  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !activeChat) return;

    setPagination(hasMore, true);
    try {
      const nextPage = page + 1;
      const response = await axiosInstance.get(
        `/chat/conversations/${activeChat.id}/messages?page=${nextPage}`,
      );
      const olderMessages = response.data.data.reverse().map(mapMessage);

      // Prepend older messages directly using state setter callback in store
      useChatStore.setState((state) => ({
        messages: [...olderMessages, ...state.messages],
      }));
      setPage(nextPage);

      const meta = response.data.meta;
      if (meta) {
        setPagination(meta.current_page < meta.last_page, false);
      } else {
        setPagination(
          response.data.current_page < response.data.last_page,
          false,
        );
      }
    } catch (error) {
      console.error("Error loading more messages:", error);
      setPagination(hasMore, false);
    }
  };

  // 3. Send Message
  // 3. Send Message
  const handleSendMessage = async (messageData) => {
    if (!activeChat) return;

    try {
      let dataToSend;
      let config = {};

      // Check if the input is FormData (contains file) or plain string
      if (messageData instanceof FormData) {
        dataToSend = messageData;
        dataToSend.append("conversation_id", activeChat.id);

        // Set multipart header for file upload
        config.headers = {
          "Content-Type": "multipart/form-data",
        };
      } else {
        dataToSend = {
          conversation_id: activeChat.id,
          body: messageData,
        };
      }

      // Make sure the endpoint matches your actual routing ("/chat/messages" or "/messages")
      const response = await axiosInstance.post(
        "/chat/messages",
        dataToSend,
        config,
      );

      const newMsg = response.data.data;

      // Use your existing mapping function
      const mappedMsg = mapMessage(newMsg);

      // Add to Zustand store
      useChatStore.getState().addMessage(mappedMsg);

      // Prepare sidebar text 
      const userCurrenID = Number(localStorage.getItem("current_user_id"));
      const sidebarLastMessage = generatePreviewText(mappedMsg, userCurrenID);

      // Update Sidebar instantly using your existing function
      updateConversationSidebar(
        activeChat.id,
        sidebarLastMessage,
        mappedMsg.time,
      );
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // 4. Current Chat Event Listener (Typing & Read Receipts)
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
        if (event.user.id !== currentUserId) {
          useChatStore.getState().markMessagesAsRead(currentUserId);
        }
      });

    //Cleanup function to leave channel and clear timeout
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      // echo.leave(channelName);
      echo
        .private(channelName)
        .stopListening(".user.typing")
        .stopListening(".messages.read");
    };
  }, [activeChat, setTypingUser]);

  // 5. Trigger Typing Event
  const triggerTyping = async () => {
    if (!activeChat) return;
    try {
      await axiosInstance.post(`/chat/conversations/${activeChat.id}/typing`, {
        conversation_id: activeChat.id,
      });
    } catch (error) {}
  };

  // Only return functions that components will call directly
  return {
    handleSendMessage,
    triggerTyping,
    loadMoreMessages,
  };
};
