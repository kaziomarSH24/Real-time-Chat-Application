import React from 'react';
import { Phone, Video, Info } from 'lucide-react';

const MessageHeader = ({ activeChat }) => {
    return (
        <div className="h-[72px] border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 bg-white/90 backdrop-blur-sm z-10">
            {/* Active user information */}
            <div className="flex items-center cursor-pointer">
                <div className="relative">
                    <img src={activeChat.avatar} alt={activeChat.name} className="w-10 h-10 rounded-full object-cover" />
                    {activeChat.isOnline && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                </div>
                <div className="ml-3">
                    <h2 className="font-semibold text-gray-900 leading-tight">{activeChat.name}</h2>
                    <p className="text-xs text-gray-500">{activeChat.isOnline ? 'Active Now' : 'Offline'}</p>
                </div>
            </div>
            
            {/* Action buttons for call, video, and info */}
            <div className="flex items-center space-x-3 lg:space-x-4 text-blue-500">
                <button className="p-2 hover:bg-gray-100 rounded-full transition"><Phone className="w-5 h-5" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition"><Video className="w-6 h-6" /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition hidden sm:block"><Info className="w-5 h-5" /></button>
            </div>
        </div>
    );
};

export default MessageHeader;