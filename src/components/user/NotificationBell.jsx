import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NotificationBell({ userEmail }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail, is_read: false }),
    enabled: !!userEmail,
    refetchInterval: 30000 // Atualiza a cada 30 segundos
  });

  const unreadCount = notifications.length;

  return (
    <Link to={createPageUrl('Notifications')}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="relative h-9 w-9 hover:bg-[#FFE5EE] dark:hover:bg-gray-700 text-[#3065DF] dark:text-gray-300"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF0864] text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </Link>
  );
}