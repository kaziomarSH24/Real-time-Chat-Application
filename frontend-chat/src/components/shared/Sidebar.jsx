// src/components/chat/Sidebar.jsx
import React from "react";
import { Search } from "lucide-react";
import { useChatStore } from "../../store/chatStore"; // Import the store

const Sidebar = () => {
  // Fetch directly from Zustand store
  const conversations = useChatStore((state) => state.conversations);
  const activeChat = useChatStore((state) => state.activeChat);
  const setActiveChat = useChatStore((state) => state.setActiveChat);
  const onlineUsers = useChatStore((state) => state.onlineUsers);
  return (
    <div className="w-full md:w-80 lg:w-96 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full">
      {/* Header */}
      <div className="p-4 lg:p-6 border-b border-gray-200 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-800">Messages</h1>
        <div className="mt-4 relative">
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full bg-gray-100 text-gray-700 rounded-full py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((chat) => (
          <div
            key={chat.id}
            // Use setActiveChat directly from store
            onClick={() => setActiveChat(chat)}
            className={`flex items-center p-4 lg:p-5 cursor-pointer transition-colors duration-150 ${
              activeChat?.id === chat.id
                ? "bg-blue-50/80 border-l-4 border-blue-500"
                : "hover:bg-gray-50 border-l-4 border-transparent"
            }`}
          >
            <div className="relative flex-shrink-0">
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              {/* Check online status using otherUser */}
              {onlineUsers.includes(chat.otherUser) && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
              )}
            </div>
            <div className="ml-4 flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {chat.name}
                </h2>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {chat.time}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600 truncate">
                  {chat.lastMessage}
                </p>
                {chat.unread > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
