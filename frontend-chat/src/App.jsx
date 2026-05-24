import { useState, useEffect } from "react";
import Sidebar from "./components/Sidebar";
import ChatArea from "./components/ChatArea";
import Login from "./components/Login";
import axiosInstance from "./utils/axios";
import echo from "./utils/echo";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const storedUserId = localStorage.getItem("current_user_id");
  const storedUserName = localStorage.getItem("current_user_name");
  const storedUserAvatar = localStorage.getItem("current_user_avatar");
  const currentUser = {
    id: storedUserId ? Number(storedUserId) : null,
    name: storedUserName || "You",
    avatar: storedUserAvatar || "https://i.pravatar.cc/150?u=me",
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axiosInstance.get("/profile/me");
      const user = response?.data?.data;

      if (!user?.id) return;

      localStorage.setItem("current_user_id", String(user.id));
      localStorage.setItem("current_user_name", user.name || "You");
      localStorage.setItem(
        "current_user_avatar",
        user.avatar || `https://i.pravatar.cc/150?u=${user.id}`,
      );
    } catch (error) {
      console.error("Error fetching current user:", error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get("/chat/conversations");

      const formattedConversations = response.data.data.map((chat) => {
        const chatName = chat.display_name || chat.name || "Unknown Chat";

         const displayTime = chat.last_message_time || chat.latest_message?.sent_at_formatted || "";

        return {
          id: chat.id,
          name: chatName,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName)}&background=random`,
          lastMessage: chat.last_message_preview || "No messages yet...",
          time: displayTime,
          unread: chat.unread_count || 0,
          isOnline: true,
        };
      });

      setConversations(formattedConversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  useEffect(() => {
    if (!token) return;

    const loadInitialData = async () => {
      await Promise.all([fetchCurrentUser(), fetchConversations()]);
    };

    void loadInitialData();
  }, [token]);

  const mapMessage = (msg) => {
    const senderId = Number(
      msg.sender_id ?? msg.user_id ?? msg.sender?.id ?? 0,
    );
    const body = msg.body ?? msg.text ?? "";
    const createdAt = msg.created_at ?? msg.sent_at ?? new Date().toISOString();
    const parsedDate = new Date(createdAt);

    return {
      id: msg.id,
      senderId,
      text: body,
      time: !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "",
    };
  };

  const handleChatSelect = async (chat) => {
    console.log(chat);
    
    setActiveChat(chat);
    try {
      const response = await axiosInstance.get(
        `/chat/conversations/${chat.id}/messages`,
      );

      
      const fetchedMessages = response.data.data.reverse().map(mapMessage);

      setMessages(fetchedMessages);
      await axiosInstance.post(`/chat/messages/read`, {
        conversation_id: chat.id,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    if (!activeChat) return;

    const channelName = `conversations.${activeChat.id}`;

    echo.private(channelName).listen(".message.sent", (event) => {
      const msg = event.message;

      const mappedMsg = mapMessage(msg);

      setMessages((prevMessages) => {
        const isDuplicate = prevMessages.some((m) => m.id === mappedMsg.id);
        if (isDuplicate) return prevMessages;
        return [...prevMessages, mappedMsg];
      });
    });

    return () => {
      echo.leave(channelName);
    };
  }, [activeChat]);

  const handleSendMessage = async (text) => {
    try {
      const response = await axiosInstance.post("/chat/messages", {
        conversation_id: activeChat.id,
        body: text,
      });

      const newMsg = response.data.data;
      const mappedMsg = mapMessage(newMsg);

      setMessages((prev) => [...prev, mappedMsg]);
      fetchConversations(); //refresh sidebar to update last message and time
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!token) {
    return <Login onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <Sidebar
        conversations={conversations}
        activeChat={activeChat}
        onChatSelect={handleChatSelect}
      />

      <ChatArea
        activeChat={activeChat}
        messages={messages}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
