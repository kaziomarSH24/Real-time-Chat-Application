import React from 'react';
import { Search, MoreHorizontal } from 'lucide-react';

const Sidebar = ({ conversations, activeChat, onChatSelect }) => {
    return (
        <div className="w-full md:w-[350px] lg:w-[400px] border-r border-gray-200 flex flex-col h-full bg-white flex-shrink-0">
            {/* Sidebar header containing title and options */}
            <div className="p-4 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Chats</h1>
                <div className="flex space-x-2">
                    <button className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition">
                        <MoreHorizontal className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Search input field */}
            <div className="px-4 mb-4">
                <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full bg-gray-100 text-gray-900 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* List of ongoing conversations */}
            <div className="flex-1 overflow-y-auto px-2">
                {conversations.map((chat) => (
                    <div 
                        key={chat.id}
                        onClick={() => onChatSelect(chat)}
                        className={`flex items-center p-3 rounded-lg cursor-pointer mb-1 transition duration-150 ${activeChat?.id === chat.id ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                    >
                        <div className="relative">
                            <img src={chat.avatar} alt={chat.name} className="w-14 h-14 rounded-full object-cover" />
                            {chat.isOnline && (
                                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                        </div>
                        
                        <div className="ml-3 flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                                <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{chat.time}</span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <p className={`text-sm truncate ${chat.unread > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                                    {chat.lastMessage}
                                </p>
                                {chat.unread > 0 && (
                                    <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
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