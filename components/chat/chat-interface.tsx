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
  from: 'user' | 'assistant';
  text: string;
}

export function ChatInterface({ user, selectedSessionId, onNewChat }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    { from: 'assistant', text: 'Hello! How can I help you today?' },
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
      setMessages([{ from: 'assistant', text: 'Hello! How can I help you today?' }]);
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

    setMessages((prev) => [...prev, { from: 'assistant', text: '' }]);

    const processStream = async () => {
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let botMessageText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.substring(6));
              if (json.token) {
                botMessageText += json.token;
                setMessages((prev) =>
                  prev.map((msg, index) =>
                    index === prev.length - 1
                      ? { ...msg, text: botMessageText }
                      : msg
                  )
                );
              }
            } catch (error) {
              console.error('Failed to parse SSE data:', line, error);
            }
          }
        }
      }
    };

    processStream();
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">Ellen</h1>
        <AuthButton user={user} />
      </header>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, index) => {
          // Debug logging for message rendering
          if (index === messages.length - 1) {
            console.log('Rendering message:', { from: msg.from, text: msg.text.substring(0, 100) + '...' });
            console.log('Is assistant?', msg.from === 'assistant');
          }
          return (
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
                {msg.from === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none overflow-hidden">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.text}</div>
                )}
              </div>
            </div>
          );
        })}
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
