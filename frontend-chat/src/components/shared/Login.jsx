import React, { useState } from 'react';
import axiosInstance from '../../services/axios';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('kaziomar@yopmail.com'); // Default test email
    const [password, setPassword] = useState('11111111'); // Default test password

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await axiosInstance.post('/auth/login', { email, password });
            const token = response.data.data.access_token;
            localStorage.setItem('auth_token', token);
            onLoginSuccess(token);
        } catch (error) {
            // Check if server responded with an error (e.g., 400, 401, 422)
            if (error.response) {
                console.error("Server Error:", error.response.data);
                alert(error.response.data.message || 'Login failed!');
            } 
            // Check if request failed entirely (e.g., CORS or server down)
            else if (error.request) {
                console.error("Network/CORS Error:", error.message);
                alert('Network Error. Please check CORS or Server status.');
            } 
            else {
                console.error("Error:", error.message);
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100">
            <form onSubmit={handleLogin} className="p-8 bg-white rounded shadow-md w-96">
                <h2 className="text-2xl mb-4 font-bold">Login to Chat</h2>
                <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                    placeholder="Email"
                />
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                    placeholder="Password"
                />
                <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
                    Login
                </button>
            </form>
        </div>
    );
};

export default Login;