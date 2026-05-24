import React from 'react';
import { Send } from 'lucide-react';
import MessageHeader from './MessageHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';

const ChatArea = ({ activeChat, messages, currentUser, onSendMessage, typingUser, onTyping }) => {

    
    // Show placeholder if no conversation is selected
    if (!activeChat) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 h-full hidden md:flex">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-10 h-10 text-blue-500 ml-1" />
                </div>
                <h2 className="text-xl font-semibold text-gray-700">Select Chat to send message.</h2>
            </div>
        );
    }

    return (
        <div className={`flex-1 flex flex-col h-full bg-white ${activeChat ? 'block' : 'hidden md:block'}`}>
            <MessageHeader activeChat={activeChat} />
            <MessageList messages={messages} activeChat={activeChat} currentUser={currentUser} typingUser={typingUser} />
            <MessageInput onSendMessage={onSendMessage} onTyping={onTyping}/>
        </div>
    );
};

export default ChatArea;