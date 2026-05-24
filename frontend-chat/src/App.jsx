import { useState, useEffect } from "react";
import Sidebar from "./components/shared/Sidebar";
import Login from "./components/shared/Login";
import ChatArea from "./components/chat/ChatArea";
import axiosInstance from "./services/axios";
import { useChat } from "./hooks/useChat";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));

  // কারেন্ট ইউজারের লজিকটা আমরা আপাতত এখানেই রাখলাম
  const storedUserId = localStorage.getItem("current_user_id");
  const storedUserName = localStorage.getItem("current_user_name");
  const storedUserAvatar = localStorage.getItem("current_user_avatar");

  const currentUser = {
    id: storedUserId ? Number(storedUserId) : null,
    name: storedUserName || "You",
    avatar: storedUserAvatar || "https://i.pravatar.cc/150?u=me",
  };

  useEffect(() => {
    if (!token) return;
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
    fetchCurrentUser();
  }, [token]);

  // আমাদের তৈরি করা কাস্টম হুকটি কল করছি
  const {
    conversations,
    activeChat,
    messages,
    handleChatSelect,
    handleSendMessage,
    typingUser, 
    triggerTyping,
  } = useChat(token);

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
        typingUser={typingUser}
        onTyping={triggerTyping}
      />
    </div>
  );
}
