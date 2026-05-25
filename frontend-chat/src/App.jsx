// src/App.jsx
import React from 'react';
import Sidebar from './components/shared/Sidebar';
import ChatArea from './components/chat/ChatArea';
import { useChat } from './hooks/useChat';

const App = () => {
    const token = localStorage.getItem('auth_token');
    // console.log(localStorage);
    
    // Just call the hook to initialize background listeners and API calls.
    // We don't need to extract or pass any props anymore!
    useChat(token);

    return (
        <div className="flex h-screen bg-gray-100 font-sans">
            <Sidebar />
            <ChatArea />
        </div>
    );
};

export default App;