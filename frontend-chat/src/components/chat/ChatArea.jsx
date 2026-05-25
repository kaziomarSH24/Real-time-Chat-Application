// src/components/chat/ChatArea.jsx
import React from 'react';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import { useChatStore } from '../../store/chatStore';

const ChatArea = () => {
    // স্টোর থেকে শুধু চেক করছি কোনো চ্যাট ওপেন করা আছে কি না
    const activeChat = useChatStore((state) => state.activeChat);

    // যদি কোনো চ্যাট সিলেক্ট করা না থাকে
    if (!activeChat) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-blue-500 text-3xl">💬</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-700">Welcome to Messages</h2>
                    <p className="text-gray-500 mt-2">Select a conversation to start chatting</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white relative">
            {/* দেখুন, কোনো কম্পোনেন্টেই আর কোনো প্রপস পাস করার দরকার নেই! */}
            <MessageHeader />
            <MessageList />
            <MessageInput />
        </div>
    );
};

export default ChatArea;