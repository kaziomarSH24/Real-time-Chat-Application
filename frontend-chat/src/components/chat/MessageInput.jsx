import React, { useState, useRef } from "react";
import { Paperclip, Smile, Send, X, Loader2 } from "lucide-react"; // Added Loader2
import { useMessages } from "../../hooks/useMessages";

const MessageInput = () => {
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSending, setIsSending] = useState(false); // New loading state
  const fileInputRef = useRef(null);

  const { handleSendMessage, triggerTyping } = useMessages();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl("file-placeholder");
      }
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (newMessage.trim() || selectedFile) {
      setIsSending(true); // Start loading spinner

      try {
        if (selectedFile) {
          const formData = new FormData();
          formData.append("media", selectedFile);
          if (newMessage.trim()) {
            formData.append("body", newMessage.trim());
          }
          // Await the send function to finish
          await handleSendMessage(formData);
        } else {
          await handleSendMessage(newMessage.trim());
        }

        // Clear inputs on success
        setNewMessage("");
        removeFile();
      } catch (error) {
        console.error("Failed to send message", error);
      } finally {
        setIsSending(false); // Stop loading spinner regardless of success or failure
      }
    }
  };

  const handleKeyDown = (e) => {
    // Trigger typing event when user presses a key (but not Enter)
    if (e.key !== "Enter") {
      triggerTyping();
    }
  };

  return (
    <div className="p-4 bg-white border-t border-gray-200 flex-shrink-0 z-10 relative">
      {/* Preview Section Remains Unchanged */}
      {previewUrl && (
        <div className="mb-3 relative inline-block">
          {selectedFile?.type.startsWith("image/") ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-20 w-auto rounded-lg border border-gray-300 object-cover"
            />
          ) : (
            <div className="h-20 w-32 bg-gray-100 flex items-center justify-center rounded-lg border border-gray-300">
              <span className="text-sm text-gray-500 truncate px-2">
                {selectedFile.name}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={removeFile}
            disabled={isSending}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex items-center space-x-2 lg:space-x-4 max-w-6xl mx-auto"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf"
          disabled={isSending}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSending}
          className="p-2.5 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block disabled:opacity-50"
        >
          <Paperclip className="w-5 h-5 lg:w-6 lg:h-6" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isSending}
            className="w-full bg-gray-100 text-gray-800 rounded-full py-2.5 lg:py-3 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200 disabled:opacity-60"
          />
        </div>

        {/* Dynamic Send Button with Spinner */}
        <button
          type="submit"
          disabled={(!newMessage.trim() && !selectedFile) || isSending}
          className="p-2.5 lg:p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
        >
          {isSending ? (
            <Loader2 className="w-5 h-5 lg:w-6 lg:h-6 animate-spin" />
          ) : (
            <Send className="w-5 h-5 lg:w-6 lg:h-6" />
          )}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
