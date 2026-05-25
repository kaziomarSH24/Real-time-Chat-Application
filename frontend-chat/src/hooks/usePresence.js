// src/hooks/usePresence.js
import { useEffect } from "react";
import echo from "../services/echo";
import { useChatStore } from "../store/chatStore";

export const usePresence = (token) => {
    // Fetch store actions
    const setOnlineUsers = useChatStore((state) => state.setOnlineUsers);
    const addOnlineUser = useChatStore((state) => state.addOnlineUser);
    const removeOnlineUser = useChatStore((state) => state.removeOnlineUser);

    useEffect(() => {
        if (!token) return;

        echo.join('online')
            .here((users) => {
                setOnlineUsers(users.map(u => u.id));
            })
            .joining((user) => {
                addOnlineUser(user.id);
            })
            .leaving((user) => {
                removeOnlineUser(user.id);
            });

        return () => {
            echo.leave('online');
        };
    }, [token, setOnlineUsers, addOnlineUser, removeOnlineUser]);
};