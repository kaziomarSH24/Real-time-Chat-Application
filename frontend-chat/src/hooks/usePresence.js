// src/hooks/usePresence.js

import { useState, useEffect } from "react";
import echo from "../services/echo";

export const usePresence = (token) => {
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!token) return;

        echo.join('online')
            .here((users) => {
                setOnlineUsers(users.map(u => u.id));
            })
            .joining((user) => {
                setOnlineUsers((prev) => [...prev, user.id]);
            })
            .leaving((user) => {
                setOnlineUsers((prev) => prev.filter(id => id !== user.id));
            });

        return () => {
            echo.leave('online');
        };
    }, [token]);

    return onlineUsers;
};