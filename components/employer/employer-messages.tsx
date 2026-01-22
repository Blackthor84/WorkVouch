"use client";

import { useState, useEffect } from "react";
import {
  getMessages,
  sendMessage,
  markMessageAsRead,
} from "@/lib/actions/employer/messages";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

export function EmployerMessages() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThread, setSelectedThread] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error: any) {
      alert(error.message || "Failed to load messages");
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
    } catch (error: any) {
      alert(error.message || "Failed to send message");
    }
  };

  if (loading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-grey-medium dark:text-gray-400">
          Loading messages...
        </p>
      </Card>
    );
  }

  // Group messages by thread
  const threads = new Map<string, any[]>();
  messages.forEach((msg) => {
    const otherUserId =
      msg.sender_id === selectedThread ? msg.recipient_id : msg.sender_id;
    if (!threads.has(otherUserId)) {
      threads.set(otherUserId, []);
    }
    threads.get(otherUserId)!.push(msg);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <h2 className="text-xl font-semibold text-grey-dark dark:text-gray-200 mb-4">
          Messages
        </h2>
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
              <div
                key={userId}
                className={`cursor-pointer ${selectedThread === userId ? "ring-2 ring-blue-600 dark:ring-blue-400" : ""}`}
                onClick={() => setSelectedThread(userId)}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-grey-dark dark:text-gray-200">
                        {otherUser?.full_name || otherUser?.email}
                      </p>
                      <p className="text-sm text-grey-medium dark:text-gray-400 line-clamp-1">
                        {threadMessages[0].body}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <span className="px-2 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-xs font-semibold">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        {selectedThread ? (
          <Card className="p-6">
            <div className="space-y-4">
              {threads.get(selectedThread)?.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-xl ${
                    msg.sender_id === selectedThread
                      ? "bg-blue-50 dark:bg-blue-900/20 ml-auto"
                      : "bg-grey-background dark:bg-[#1A1F2B]"
                  }`}
                >
                  <p className="text-sm font-semibold text-grey-dark dark:text-gray-200 mb-1">
                    {msg.sender?.full_name || msg.sender?.email}
                  </p>
                  <p className="text-grey-dark dark:text-gray-200">
                    {msg.body}
                  </p>
                  <p className="text-xs text-grey-medium dark:text-gray-400 mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t border-grey-background dark:border-[#374151]">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSendMessage(selectedThread);
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 rounded-xl border bg-white dark:bg-[#111827] text-grey-dark dark:text-gray-200 border-gray-300 dark:border-[#374151] px-4 py-2"
                />
                <Button onClick={() => handleSendMessage(selectedThread)}>
                  <PaperAirplaneIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-grey-medium dark:text-gray-400">
              Select a conversation to view messages
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
