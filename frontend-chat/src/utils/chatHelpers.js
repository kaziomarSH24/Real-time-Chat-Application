// src/utils/chatHelpers.js

export const mapMessage = (msg) => {
  const senderId = Number(msg.sender_id ?? msg.user_id ?? msg.sender?.id ?? 0);
  const body = msg.body ?? msg.text ?? "";
  const createdAt = msg.created_at ?? msg.sent_at ?? new Date().toISOString();
  const parsedDate = new Date(createdAt);

  return {
    id: msg.id,
    senderId,
    senderName: msg.sender?.name || msg.user?.name || "User",
    text: body,
    time: !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "",
    isRead: msg.is_read || false,
    media_url: msg.media_url,
    media_type: msg.media_type,
  };
};

// Helper function to generate real-time preview text mirroring backend logic
export const generatePreviewText = (msg, currentUserId) => {
  // 1. If the last message was sent by the authenticated user
  if (msg.senderId === currentUserId) {
    if (msg.media_type) {
      const mediaText =
        {
          image: "sent a photo",
          video: "sent a video",
          audio: "sent an audio",
        }[msg.media_type] || "sent a file";

      return `You ${mediaText}`;
    }
    return `You: ${msg.text ? msg.text.substring(0, 30) : ""}`;
  }

  // 2. If the last message was sent by another user
  const firstName = msg.senderName.split(" ")[0]; // Extract first name (Omar faruk -> Omar)

  if (msg.media_type) {
    const mediaText =
      {
        image: "sent a photo",
        video: "sent a video",
        audio: "sent an audio",
      }[msg.media_type] || "sent a file";

    return `${firstName} ${mediaText}`;
  }

  return msg.text ? msg.text.substring(0, 30) : "";
};
