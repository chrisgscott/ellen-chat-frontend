'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { ChatHistorySidebar } from "@/components/chat/chat-history-sidebar";
import { ChatInterface } from "@/components/chat/chat-interface";
import type { User } from '@supabase/supabase-js';

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        router.push("/auth/login");
      } else {
        setUser(data.user);
      }
    };
    checkUser();
  }, [router]);

  const handleNewChat = () => {
    setSelectedSessionId(null);
  };

  if (!user) {
    return <div className="flex h-full w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex h-full w-full">
      <ChatHistorySidebar onSelectSession={setSelectedSessionId} onNewChat={handleNewChat} />
      <main className="flex-1 h-full">
        <ChatInterface user={user} selectedSessionId={selectedSessionId} onNewChat={handleNewChat} />
      </main>
    </div>
  );
}

