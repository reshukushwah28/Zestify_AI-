import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AnimatedBackground } from './components/AnimatedBackground';
import { generateAIResponse } from './services/geminiService';
import type { Message } from './types';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: trimmed,
      isUser: true,
      timestamp: new Date(),
    };

    const typingMsg: Message = {
      id: 'typing',
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };

    // Add user message + typing indicator in one update
    setMessages(prev => [...prev, userMsg, typingMsg]);
    setIsLoading(true);

    const response = await generateAIResponse(trimmed);

    setMessages(prev => {
      const withoutTyping = prev.filter(m => m.id !== 'typing');
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        content: response.error ? `❌ ${response.error}` : response.text,
        isUser: false,
        timestamp: new Date(),
      };
      return [...withoutTyping, aiMsg];
    });

    setIsLoading(false);
  }, [isLoading]);

  const handleClearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ background: '#0e0c0a' }}>
      <AnimatedBackground />

      <Header
        onClearChat={handleClearChat}
        hasMessages={messages.length > 0}
      />

      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full relative z-10">
        {messages.length === 0 ? (
          <WelcomeScreen onExampleClick={handleSendMessage} />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        <div className="px-4 pb-4 pt-0">
          <ChatInput onSendMessage={handleSendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}