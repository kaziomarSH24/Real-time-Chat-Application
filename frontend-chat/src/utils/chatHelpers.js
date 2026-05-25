// src/utils/chatHelpers.js

export const mapMessage = (msg) => {
    const senderId = Number(msg.sender_id ?? msg.user_id ?? msg.sender?.id ?? 0);
    const body = msg.body ?? msg.text ?? "";
    const createdAt = msg.created_at ?? msg.sent_at ?? new Date().toISOString();
    const parsedDate = new Date(createdAt);

    return {
        id: msg.id,
        senderId,
        text: body,
        time: !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
            : "",
        isRead: msg.is_read || false,
    };
};