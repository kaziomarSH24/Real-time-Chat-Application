// src/components/chat/MessageInput.jsx
import React, { useState } from 'react';
import { Paperclip, Smile, Send } from 'lucide-react';
import { useMessages } from '../../hooks/useMessages'; // Need this for the action functions

// No props needed!
const MessageInput = () => {
    const [newMessage, setNewMessage] = useState('');
    
    // Fetch the actions from our custom hook
    const { handleSendMessage, triggerTyping } = useMessages();

    const onSubmit = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            handleSendMessage(newMessage); // Call the hook function directly
            setNewMessage('');
        }
    };

    const handleKeyDown = (e) => {
        // Trigger typing event when user presses a key (but not Enter)
        if (e.key !== 'Enter') {
            triggerTyping();
        }
    };

    return (
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 z-10 relative">
            <form onSubmit={onSubmit} className="flex items-center space-x-2 lg:space-x-4 max-w-6xl mx-auto">
                <button type="button" className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <Paperclip className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="w-full bg-gray-100 text-gray-800 rounded-full py-2.5 lg:py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
                    />
                    <button type="button" className="absolute right-2 top-2 lg:top-2.5 p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <Smile className="w-5 h-5 lg:w-6 lg:h-6" />
                    </button>
                </div>
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2.5 lg:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    <Send className="w-5 h-5 lg:w-6 lg:h-6" />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;