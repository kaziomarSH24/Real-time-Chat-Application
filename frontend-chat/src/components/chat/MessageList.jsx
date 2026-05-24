import React, { useRef, useEffect } from "react";

const MessageList = ({ messages, activeChat, currentUser, typingUser }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to the bottom when new messages are added
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUser]); // Whenever messages or typing status changes, scroll to bottom

  // Render empty state if there are no messages
  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50 flex flex-col items-center justify-center text-gray-500">
        <img
          src={activeChat.avatar}
          className="w-24 h-24 rounded-full mb-4 opacity-50"
          alt=""
        />
        <p>No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 bg-gray-50">
      {messages.map((msg, index) => {
        const isOwnMessage = msg.senderId === currentUser.id;
        // Check previous message sender to group avatars appropriately
        const prevMsg = index > 0 ? messages[index - 1] : null;
        const isConsecutive = prevMsg && prevMsg.senderId === msg.senderId;

        return (
          <div
            key={msg.id}
            className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} ${isConsecutive ? "mt-1" : "mt-4"}`}
          >
            {/* Display avatar for incoming messages */}
            {!isOwnMessage && !isConsecutive && (
              <img
                src={activeChat.avatar}
                alt=""
                className="w-7 h-7 rounded-full mr-2 self-end mb-1"
              />
            )}
            {!isOwnMessage && isConsecutive && (
              <div className="w-7 mr-2"></div> // Spacer to align consecutive messages
            )}

            <div
              className={`max-w-[75%] lg:max-w-[60%] px-4 py-2 ${
                isOwnMessage
                  ? "bg-blue-500 text-white rounded-2xl rounded-br-sm"
                  : "bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm"
              }`}
            >
              <p className="text-[15px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        );
      })}
      {/* Typing Indicator */}
      {typingUser && (
        <div className="flex justify-start mt-4">
          <img
            src={activeChat.avatar}
            alt=""
            className="w-7 h-7 rounded-full mr-2 self-end mb-1"
          />
          <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-bl-sm shadow-sm px-4 py-3 flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
          </div>
        </div>
      )}
      {/* Dummy div to attach the scroll ref */}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
