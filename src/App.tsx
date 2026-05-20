import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { MessageBubble } from './components/MessageBubble';
import { ChatInput } from './components/ChatInput';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AnimatedBackground } from './components/AnimatedBackground';
import { askZestify } from './services/geminiService';
import type { Message } from './types';

function parseDataUrl(dataUrl?: string): { base64Data: string; mimeType: string } | undefined {
  if (!dataUrl || !dataUrl.startsWith('data:')) return undefined;
  try {
    const parts = dataUrl.split(';base64,');
    const mimeType = parts[0].replace('data:', '');
    const base64Data = parts[1];
    return { base64Data, mimeType };
  } catch {
    return undefined;
  }
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (
    content: string,
    imageFile?: { base64Data: string; mimeType: string },
    previewUrl?: string
  ) => {
    const trimmed = content.trim() || (imageFile ? 'Analyze this image in detail and provide a useful explanation.' : '');
    if (isLoading || !trimmed) return;

    setIsLoading(true);

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      content: trimmed,
      isUser: true,
      timestamp: new Date(),
      imageUrl: previewUrl,
    };

    const typingMsg: Message = {
      id: 'typing',
      content: '',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };

    setMessages(prev => [...prev, userMsg, typingMsg]);

    try {
      const response = await askZestify(trimmed, imageFile);

      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        let finalContent = '';
        let isGenerated = false;

        if (response.error) {
          finalContent = `⚠️ Oops! Something went wrong: ${response.error}. Let's try again.`;
        } else {
          finalContent = response.text;
          isGenerated = !!response.isImageGen;
        }

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          content: finalContent,
          isUser: false,
          timestamp: new Date(),
          isGeneratedImage: isGenerated,
        };
        return [...withoutTyping, aiMsg];
      });

    } catch (err: any) {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          content: `⚠️ Oops! Something went wrong: ${err.message || 'Unknown error'}. Let's try again.`,
          isUser: false,
          timestamp: new Date(),
        };
        return [...withoutTyping, aiMsg];
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleEditMessage = useCallback(async (messageId: string, newContent: string) => {
    if (isLoading) return;

    const msgToEdit = messages.find(m => m.id === messageId);
    const originalPreview = msgToEdit?.imageUrl;
    const imageFile = parseDataUrl(originalPreview);

    setMessages(prev => {
      const index = prev.findIndex(m => m.id === messageId);
      if (index === -1) return prev;

      const updatedMsg: Message = {
        ...prev[index],
        content: newContent,
        timestamp: new Date(),
      };

      const typingMsg: Message = {
        id: 'typing',
        content: '',
        isUser: false,
        timestamp: new Date(),
        isTyping: true,
      };

      return [...prev.slice(0, index), updatedMsg, typingMsg];
    });

    setIsLoading(true);

    try {
      const response = await askZestify(newContent, imageFile);

      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        let finalContent = '';
        let isGenerated = false;

        if (response.error) {
          finalContent = `⚠️ Oops! Something went wrong: ${response.error}. Let's try again.`;
        } else {
          finalContent = response.text;
          isGenerated = !!response.isImageGen;
        }

        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          content: finalContent,
          isUser: false,
          timestamp: new Date(),
          isGeneratedImage: isGenerated,
        };
        return [...withoutTyping, aiMsg];
      });

    } catch (err: any) {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          content: `⚠️ Oops! Something went wrong: ${err.message || 'Unknown error'}. Let's try again.`,
          isUser: false,
          timestamp: new Date(),
        };
        return [...withoutTyping, aiMsg];
      });
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

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
          <WelcomeScreen onExampleClick={(txt) => handleSendMessage(txt)} />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onEdit={handleEditMessage} />
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