'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { AuthButton } from '@/components/auth-button';

interface ChatInterfaceProps {
  user: User;
  selectedSessionId: string | null;
  onNewChat: () => void;
}

interface Message {
  from: 'user' | 'bot';
  text: string;
}

export function ChatInterface({ user, selectedSessionId, onNewChat }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'bot', text: 'Hello! How can I help you today?' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(selectedSessionId);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    setSessionId(selectedSessionId);
    if (selectedSessionId) {
      fetchMessages(selectedSessionId);
    } else {
      setMessages([{ from: 'bot', text: 'Hello! How can I help you today?' }]);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (sessionId: string) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const response = await fetch(`http://localhost:8000/sessions/${sessionId}/messages`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const formattedMessages = data.map((msg: any) => ({ from: msg.role, text: msg.content }));
      setMessages(formattedMessages);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage: Message = { from: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error('No active session found');
      return;
    }

    const response = await fetch('http://localhost:8000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ message: inputValue, session_id: sessionId }),
    });

    if (!response.body) return;

    const newSessionId = response.headers.get('X-Session-Id');
    if (newSessionId && !sessionId) {
      setSessionId(newSessionId);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let botMessage = '';

    setMessages((prev) => [...prev, { from: 'bot', text: '' }]);

    reader.read().then(function processText({ done, value }): any {
      if (done) {
        return;
      }
      botMessage += decoder.decode(value, { stream: true });
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, text: botMessage } : msg
        )
      );
      return reader.read().then(processText);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Ellen</h1>
        <AuthButton user={user} />
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-4xl p-3 rounded-lg ${
                msg.from === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              {msg.from === 'bot' ? (
                <div className="prose dark:prose-invert max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.text}
                  </ReactMarkdown>
                </div>
              ) : (
                msg.text
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-md bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
