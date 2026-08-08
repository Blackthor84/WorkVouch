"use client";

import { useState, useEffect } from "react";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
} from "@/lib/actions/employer/messages";
import { Send } from "lucide-react";
import {
  WvCard,
  WvButton,
  WvInput,
  WvBadge,
  WvLoadingState,
  WvEmptyState,
  WvErrorState,
} from "@/components/wv";

type Thread = {
  messages: Array<Record<string, unknown>>;
  otherUser: { full_name?: string; email?: string } | null;
  otherUserId: string;
};

export function EmployerMessages() {
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
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
      const { messages: data, currentUserId: userId } = await getMessages();
      setMessages(data);
      setCurrentUserId(userId);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectThread = async (otherUserId: string) => {
    setSelectedThread(otherUserId);
    if (!currentUserId) return;

    const unread = messages.filter(
      (m) =>
        !m.is_read &&
        m.recipient_id === currentUserId &&
        m.sender_id === otherUserId,
    );
    await Promise.all(
      unread.map((m) => markMessageAsRead(String(m.id)).catch(() => {})),
    );
    if (unread.length > 0) {
      setMessages((prev) =>
        prev.map((m) =>
          unread.some((u) => u.id === m.id) ? { ...m, is_read: true } : m,
        ),
      );
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

  if (error) {
    return (
      <WvErrorState
        title="Could not load messages"
        message={error}
        action={
          <WvButton size="sm" onClick={loadMessages}>
            Retry
          </WvButton>
        }
      />
    );
  }

  const threads = new Map<string, Thread>();

  if (currentUserId) {
    messages.forEach((msg) => {
      const otherUserId =
        msg.sender_id === currentUserId
          ? String(msg.recipient_id)
          : String(msg.sender_id);
      const otherUser =
        msg.sender_id === currentUserId ? msg.recipient : msg.sender;

      const threadKey =
        String(msg.sender_id) < String(msg.recipient_id)
          ? `${msg.sender_id}-${msg.recipient_id}`
          : `${msg.recipient_id}-${msg.sender_id}`;

      if (!threads.has(threadKey)) {
        threads.set(threadKey, {
          messages: [],
          otherUser: otherUser as Thread["otherUser"],
          otherUserId,
        });
      }
      threads.get(threadKey)!.messages.push(msg);
    });
  }

  const currentThread = selectedThread
    ? Array.from(threads.values()).find(
        (thread) => thread.otherUserId === selectedThread,
      )?.messages
    : null;

  if (threads.size === 0) {
    return (
      <WvEmptyState
        title="No messages"
        description="Message candidates from their profile. Conversations appear here."
        action={
          <WvButton href="/employer/search-users" size="sm">
            Search
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
          {Array.from(threads.entries()).map(([threadKey, thread]) => {
            const sorted = [...thread.messages].sort(
              (a, b) =>
                new Date(String(b.created_at)).getTime() -
                new Date(String(a.created_at)).getTime(),
            );
            const latest = sorted[0];
            const unreadCount = thread.messages.filter(
              (m) => !m.is_read && m.recipient_id === currentUserId,
            ).length;

            return (
              <WvCard
                key={threadKey}
                hover
                padding="sm"
                onClick={() => handleSelectThread(thread.otherUserId)}
                className={
                  selectedThread === thread.otherUserId
                    ? "ring-2 ring-wv-brand-blue/50"
                    : ""
                }
                ariaLabel={`Conversation with ${thread.otherUser?.full_name || thread.otherUser?.email}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-wv-foreground">
                      {thread.otherUser?.full_name || thread.otherUser?.email}
                    </p>
                    <p className="line-clamp-1 text-sm text-wv-muted">
                      {String(latest?.body ?? "")}
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
        {selectedThread && currentThread ? (
          <WvCard padding="lg">
            <div className="space-y-4">
              {[...currentThread]
                .sort(
                  (a, b) =>
                    new Date(String(a.created_at)).getTime() -
                    new Date(String(b.created_at)).getTime(),
                )
                .map((msg) => {
                  const isFromCurrentUser =
                    currentUserId && msg.sender_id === currentUserId;
                  return (
                    <div
                      key={String(msg.id)}
                      className={`rounded-xl p-4 ${
                        isFromCurrentUser
                          ? "ml-auto max-w-[85%] bg-blue-500/15"
                          : "mr-auto max-w-[85%] bg-wv-surface"
                      }`}
                    >
                      <p className="mb-1 text-sm font-semibold text-wv-foreground">
                        {(msg.sender as { full_name?: string; email?: string })
                          ?.full_name ||
                          (msg.sender as { email?: string })?.email}
                      </p>
                      <p className="text-wv-muted">{String(msg.body)}</p>
                      <p className="mt-1 text-xs text-wv-subtle">
                        {new Date(String(msg.created_at)).toLocaleString()}
                      </p>
                    </div>
                  );
                })}
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
            description="Choose a thread to read and reply."
          />
        )}
      </div>
    </div>
  );
}
