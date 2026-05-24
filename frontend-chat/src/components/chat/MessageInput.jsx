import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Smile, Paperclip, Send } from 'lucide-react';

const MessageInput = ({ onSendMessage, onTyping }) => {
    const [newMessage, setNewMessage] = useState('');
    const lastTypingTime = useRef(null);

    // Trigger typing event with debounce
    const handleTyping = (e) => {
        setNewMessage(e.target.value);
        const now = Date.now();
        if(!lastTypingTime.current || now - lastTypingTime.current > 2000) {
            onTyping();
            lastTypingTime.current = now;
        }
    };

    // Handle form submission and dispatch the message
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        
        onSendMessage(newMessage.trim());
        setNewMessage('');
    };

    return (
        <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-end space-x-2">
                {/* Attachment buttons */}
                <div className="flex space-x-1 pb-2 text-blue-500 hidden sm:flex">
                    <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition"><Paperclip className="w-5 h-5" /></button>
                    <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition"><ImageIcon className="w-5 h-5" /></button>
                </div>
                
                {/* Input field */}
                <div className="flex-1 relative bg-gray-100 rounded-3xl border border-transparent focus-within:border-gray-300 transition-colors">
                    <input
                        type="text"
                        value={newMessage}
                        // onChange={(e) => setNewMessage(e.target.value)}
                        onChange={handleTyping} 
                        placeholder="Write your message..."
                        className="w-full bg-transparent text-gray-900 px-4 py-2.5 rounded-3xl focus:outline-none"
                    />
                    <button type="button" className="absolute right-2 top-2 p-1 text-gray-400 hover:text-blue-500 transition">
                        <Smile className="w-5 h-5" />
                    </button>
                </div>
                
                {/* Submit button */}
                <button 
                    type="submit" 
                    disabled={!newMessage.trim()}
                    className={`p-2.5 rounded-full transition ${newMessage.trim() ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                    <Send className="w-5 h-5" />
                </button>
            </form>
        </div>
    );
};

export default MessageInput;