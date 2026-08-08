"use client";

import { useState, useEffect } from "react";
import {
  getMessages,
  sendMessage,
} from "@/lib/actions/employer/messages";
import { Send } from "lucide-react";
import {
  WvCard,
  WvButton,
  WvInput,
  WvBadge,
  WvLoadingState,
  WvEmptyState,
} from "@/components/wv";

export function EmployerMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (recipientId: string) => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(recipientId, newMessage);
      setNewMessage("");
      await loadMessages();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  if (loading) {
    return (
      <WvCard padding="lg">
        <WvLoadingState label="Loading conversations…" />
      </WvCard>
    );
  }

  const threads = new Map<string, any[]>();
  messages.forEach((msg) => {
    const otherUserId =
      msg.sender_id === selectedThread ? msg.recipient_id : msg.sender_id;
    if (!threads.has(otherUserId)) {
      threads.set(otherUserId, []);
    }
    threads.get(otherUserId)!.push(msg);
  });

  if (threads.size === 0) {
    return (
      <WvEmptyState
        title="No messages yet"
        description="When you contact candidates from their profile, conversations will appear here."
        action={
          <WvButton href="/employer/search-users" size="sm">
            Search candidates
          </WvButton>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {error && (
        <p className="lg:col-span-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      <div className="lg:col-span-1">
        <h2 className="mb-4 text-lg font-semibold text-wv-foreground">Conversations</h2>
        <div className="space-y-2">
          {Array.from(threads.entries()).map(([userId, threadMessages]) => {
            const otherUser =
              threadMessages[0].sender_id === userId
                ? threadMessages[0].sender
                : threadMessages[0].recipient;
            const unreadCount = threadMessages.filter(
              (m) => !m.is_read && m.recipient_id === userId,
            ).length;

            return (
              <WvCard
                key={userId}
                hover
                padding="sm"
                onClick={() => setSelectedThread(userId)}
                className={
                  selectedThread === userId ? "ring-2 ring-wv-brand-blue/50" : ""
                }
                ariaLabel={`Conversation with ${otherUser?.full_name || otherUser?.email}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-wv-foreground">
                      {otherUser?.full_name || otherUser?.email}
                    </p>
                    <p className="line-clamp-1 text-sm text-wv-muted">
                      {threadMessages[0].body}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <WvBadge variant="brand">{unreadCount}</WvBadge>
                  )}
                </div>
              </WvCard>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedThread ? (
          <WvCard padding="lg">
            <div className="space-y-4">
              {threads.get(selectedThread)?.map((msg) => (
                <div
                  key={msg.id}
                  className={`rounded-xl p-4 ${
                    msg.sender_id === selectedThread
                      ? "ml-auto max-w-[85%] bg-blue-500/15"
                      : "mr-auto max-w-[85%] bg-wv-surface"
                  }`}
                >
                  <p className="mb-1 text-sm font-semibold text-wv-foreground">
                    {msg.sender?.full_name || msg.sender?.email}
                  </p>
                  <p className="text-wv-muted">{msg.body}</p>
                  <p className="mt-1 text-xs text-wv-subtle">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 border-t border-wv-border pt-4">
                <WvInput
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSendMessage(selectedThread);
                    }
                  }}
                  placeholder="Type a message…"
                  className="flex-1"
                  aria-label="Message body"
                />
                <WvButton
                  onClick={() => handleSendMessage(selectedThread)}
                  ariaLabel="Send message"
                >
                  <Send className="h-5 w-5" />
                </WvButton>
              </div>
            </div>
          </WvCard>
        ) : (
          <WvEmptyState
            compact
            title="Select a conversation"
            description="Choose a thread on the left to read and reply to candidate messages."
          />
        )}
      </div>
    </div>
  );
}
