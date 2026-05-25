// src/components/chat/MessageList.jsx
import React, { useRef, useEffect, useLayoutEffect } from "react";
import { Check, CheckCheck, Loader2 } from "lucide-react";
import { useChatStore } from "../../store/chatStore"; // Import the store
import { useMessages } from "../../hooks/useMessages"; // Need this for loadMoreMessages function

// No props needed anymore!
const MessageList = () => {
  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevScrollHeightRef = useRef(0);

  // 1. Fetch ALL required data directly from Zustand store
  const activeChat = useChatStore((state) => state.activeChat);
  const messages = useChatStore((state) => state.messages);
  const typingUser = useChatStore((state) => state.typingUser);
  const hasMore = useChatStore((state) => state.hasMore);
  const isLoadingMore = useChatStore((state) => state.isLoadingMore);

  // 2. We need the loadMore function from our custom hook
  const { loadMoreMessages } = useMessages();
  
  // Get current user ID from local storage for comparing senderId
  const currentUserId = Number(localStorage.getItem("current_user_id"));

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!containerRef.current) return;

    if (containerRef.current.scrollTop === 0 && hasMore && !isLoadingMore) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      loadMoreMessages();
    }
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (prevScrollHeightRef.current > 0) {
      container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0; 
    } else {
      scrollToBottom();
    }
  }, [messages]); 

  useEffect(() => {
    if (typingUser) scrollToBottom();
  }, [typingUser]);

  // Failsafe if activeChat is null
  if (!activeChat) return null;

  if (messages.length === 0 && !isLoadingMore) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 flex flex-col items-center justify-center text-gray-500">
        <img src={activeChat.avatar} className="w-24 h-24 rounded-full mb-4 opacity-50" alt="" />
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div 
      className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gray-50"
      ref={containerRef}
      onScroll={handleScroll}
    >
      {isLoadingMore && (
        <div className="flex justify-center py-2 overflow-hidden">
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
        </div>
      )}

      {messages.map((msg, index) => {
        const isOwnMessage = msg.senderId === currentUserId; // Changed to use local storage ID
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

        return (
          <div key={msg.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-1" : "mt-4"}`}>
            {!isOwnMessage && !isConsecutive && (
              <img src={activeChat.avatar} alt="" className="w-7 h-7 rounded-full mr-2 self-end mb-1" />
            )}
            {!isOwnMessage && isConsecutive && (
              <div className="w-7 mr-2"></div>
            )}

            <div className={`max-w-[75%] lg:max-w-[60%] px-4 py-2 ${isOwnMessage ? "bg-blue-500 text-white rounded-2xl rounded-br-sm" : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"}`}>
              <p className="text-[15px] leading-relaxed">{msg.text}</p>
              
              <div className={`flex items-center justify-end mt-1 space-x-1 text-[11px] ${isOwnMessage ? "text-blue-100" : "text-gray-400"}`}>
                <span>{msg.time}</span>
                {isOwnMessage && (
                  msg.isRead ? <CheckCheck className="w-4 h-4 text-white" /> : <Check className="w-4 h-4" />
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {typingUser && (
        <div className="flex justify-start mt-4">
          <img src={activeChat.avatar} alt="" className="w-7 h-7 rounded-full mr-2 self-end mb-1" />
          <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;