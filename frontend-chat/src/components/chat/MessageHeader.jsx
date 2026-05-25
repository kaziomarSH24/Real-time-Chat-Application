// src/components/chat/MessageHeader.jsx
import React from 'react';
import { Phone, Video, Info } from 'lucide-react';
import { useChatStore } from '../../store/chatStore'; // Import the store

const MessageHeader = () => {
    // 1. Fetch data directly from the Zustand store instead of props!
    const activeChat = useChatStore((state) => state.activeChat);
    const onlineUsers = useChatStore((state) => state.onlineUsers);

    // If no active chat, don't render anything (failsafe)
    if (!activeChat) return null;

    // 2. Check if the other user's ID is in the onlineUsers array
    const isOnline = onlineUsers.includes(activeChat.otherUser);

    return (
        <div className="h-[72px] border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 bg-white/90 backdrop-blur-sm z-10">
            <div className="flex items-center cursor-pointer">
                <div className="relative">
                    <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                    {/* Green dot for online status */}
                    {isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div className="ml-3">
                    <h2 className="font-semibold text-gray-900 leading-tight">{activeChat.name}</h2>
                    <p className="text-xs text-gray-500">{isOnline ? 'Active now' : 'Offline'}</p>
                </div>
            </div>
            
            <div className="flex items-center space-x-2 lg:space-x-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                    <Info className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default MessageHeader;