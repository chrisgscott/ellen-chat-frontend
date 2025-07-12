'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ChatSession {
  id: string;
  initial_message_content: string;
}

interface ChatHistorySidebarProps {
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export function ChatHistorySidebar({ onSelectSession, onNewChat }: ChatHistorySidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const supabase = createClient();
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session error:', sessionError);
          return;
        }

        if (!session) {
          console.log('No active session found');
          return;
        }

        console.log('Making request to fetch sessions with user:', session.user?.id);
        const response = await fetch('http://localhost:8000/sessions', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Sessions fetched:', data);
          setSessions(data);
        } else {
          console.error('Failed to fetch sessions:', response.status, response.statusText);
          const errorText = await response.text();
          console.error('Error response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
      }
    };

    fetchSessions();
  }, []);

  return (
    <aside className="w-64 bg-muted/40 p-4 border-r flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Chat History</h2>
        <button onClick={onNewChat} className="text-sm font-semibold hover:underline">New</button>
      </div>
      <div className="space-y-2 flex-1 overflow-y-auto">
        {sessions.map((session) => (
          <div
            key={session.id}
            onClick={() => onSelectSession(session.id)}
            className="p-2 rounded-md hover:bg-muted cursor-pointer truncate"
            title={session.initial_message_content}
          >
            {session.initial_message_content || 'New Chat'}
          </div>
        ))}
      </div>
    </aside>
  );
}
