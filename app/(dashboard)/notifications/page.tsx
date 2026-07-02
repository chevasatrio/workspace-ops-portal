"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, CheckCircle2, CircleAlert, Clock, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/read-all", { method: "PUT" });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "BORROW_APPROVED":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "BORROW_REJECTED":
        return <CircleAlert className="w-5 h-5 text-destructive" />;
      case "BORROW_DUE_SOON":
      case "BORROW_OVERDUE":
        return <Clock className="w-5 h-5 text-orange-500" />;
      case "MAINTENANCE_DUE":
        return <CalendarDays className="w-5 h-5 text-blue-500" />;
      default:
        return <Check className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };

  if (loading) {
    return <div className="p-6 max-w-4xl mx-auto space-y-4 animate-pulse">
      <div className="h-8 bg-muted w-48 rounded mb-6"></div>
      <div className="h-24 bg-muted rounded-xl"></div>
      <div className="h-24 bg-muted rounded-xl"></div>
      <div className="h-24 bg-muted rounded-xl"></div>
    </div>;
  }

  const unreadExists = notifications.some(n => !n.isRead);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
        {unreadExists && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mb-2 opacity-20" />
              <p>You're all caught up!</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif) => (
            <Link key={notif.id} href={notif.link || "#"} className="block">
              <Card className={`transition-colors hover:bg-accent/50 ${!notif.isRead ? 'border-primary/50 bg-primary/5' : ''}`}>
                <CardContent className="p-4 flex gap-4 items-start">
                  <div className="mt-1">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className={`font-medium ${!notif.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {notif.title}
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {timeAgo(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <div className="w-2 h-2 rounded-full bg-primary mt-2"></div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
