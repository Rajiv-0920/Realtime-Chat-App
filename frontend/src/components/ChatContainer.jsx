import React, { useEffect, useRef } from 'react'
import { useChatStore } from '../store/useChatStore'
import ChatHeader from './ChatHeader';
import MessageInput from './MessageInput';
import MessageSkeleton from './skeletons/MessageSkeleton';
import { useAuthStore } from '../store/useAuthStore';
import { formatMessageTime } from '../lib/utils';

const ChatContainer = () => {
    const { messages, selectedUser, isMessagesLoading, getMessages, subscribeToMessages, unsubscribeFromMessages } = useChatStore();
    const { authUser } = useAuthStore();
    const messageEndRef = useRef(null);

    useEffect(() => {
        getMessages(selectedUser._id)
        subscribeToMessages();
        return () => unsubscribeFromMessages();
    }, [selectedUser._id, getMessages, subscribeToMessages, unsubscribeFromMessages])

    useEffect(() => {
        if (messageEndRef.current && messages) {
            messageEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages])

    if (isMessagesLoading) {
        return <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />
            <MessageSkeleton />
            <MessageInput />
        </div>
    }

    return (
        <div className="flex-1 flex flex-col overflow-auto">
            <ChatHeader />
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                    <div key={message._id} ref={messageEndRef} className={`chat ${message.sender === authUser._id ? "chat-end" : "chat-start"}`}>
                        <div className="chat-image avatar">
                            <div className="size-10 rounded-full border">
                                <img src={message.sender === authUser._id ? authUser.profilePic || "/avatar.png" : selectedUser.profilePic || "/avatar.png"} alt="profile pic" />
                            </div>
                        </div>
                        <div className="chat-header mb-1">
                            <time className="text-xs opacity-50 ml-1">{formatMessageTime(message.createdAt)}</time>
                        </div>
                        <div className={`chat-bubble flex flex-col ${message.sender === authUser._id ? "bg-primary text-primary-content" : "bg-base-200 text-base-content"}`}>
                            {message.image && (<img src={message.image} alt="Attachment" className="mb-2 sm:max-w-[200px] rounded-md md-2" />)}
                            {message.text && <p>{message.text}</p>}
                        </div>
                    </div>
                ))}
            </div>
            <MessageInput />
        </div>
    )
}

export default ChatContainer