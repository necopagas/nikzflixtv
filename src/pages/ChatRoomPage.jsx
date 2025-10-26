// src/pages/ChatRoomPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';

export const ChatRoomPage = () => {
    const { currentUser } = useAuth();
    const { messages, sendMessage, loading } = useChat();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '') return;
        sendMessage(newMessage);
        setNewMessage('');
    };

    const renderTimestamp = (timestamp) => {
        if (timestamp && timestamp.seconds) {
            return new Date(timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return 'sending...';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="player-loading"></div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20 text-center">
                <h2 className="text-3xl font-bold mb-4">Chat Room Access Denied</h2>
                <p className="text-lg text-[var(--text-secondary)] mb-6">You need to be logged in to join the conversation.</p>
                <button onClick={() => navigate('/auth')} className="px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700">
                    Login
                </button>
            </div>
        );
    }

    return (
        <div className="chat-room-container pt-28 pb-20 px-4 sm:px-8 md:px-16">
            <h1 className="text-3xl font-bold mb-8 text-center">NikzFlix Public Chat</h1>
            <div className="chat-messages-wrapper">
                <div className="chat-messages">
                    {messages.length === 0 && !loading && (
                        <div className="text-center text-[var(--text-secondary)] p-8">
                            <p className="text-lg">Welcome to the chat!</p>
                            <p>Be the first to send a message.</p>
                        </div>
                    )}

                    {/* --- GI-UPDATE ANG MESSAGE LOOP --- */}
                    {messages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.uid === currentUser.uid ? 'current-user' : ''}`}>
                            {/* --- BAG-O: AVATAR --- */}
                            <div className="chat-avatar" title={msg.displayName || 'User'}>
                                {(msg.displayName || 'User').charAt(0)}
                            </div>
                            
                            {/* --- BAG-O: Wrapper para sa message body --- */}
                            <div className="message-body">
                                <div className="message-details">
                                    <span className="message-sender">{msg.uid === currentUser.uid ? 'You' : (msg.displayName || 'User')}</span>
                                    <span className="message-timestamp">{renderTimestamp(msg.timestamp)}</span>
                                </div>
                                <div className="message-content">
                                    <p>{msg.text}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {/* --- END SA UPDATE --- */}

                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="chat-form">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message here..."
                        className="chat-input"
                    />
                    <button type="submit" className="chat-send-btn" title="Send Message">
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </form>
            </div>
        </div>
    );
};