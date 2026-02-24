import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Bell, 
  MessageSquare, 
  BookOpen, 
  Clock,
  CheckCheck,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';

const TYPE_CONFIG = {
  comment_reply: {
    icon: MessageSquare,
    color: 'bg-blue-100 text-blue-600',
    label: 'Resposta'
  },
  new_book: {
    icon: BookOpen,
    color: 'bg-green-100 text-green-600',
    label: 'Novo Livro'
  },
  new_chapter: {
    icon: BookOpen,
    color: 'bg-emerald-100 text-emerald-600',
    label: 'Novo Capítulo'
  },
  book_coming_soon: {
    icon: Clock,
    color: 'bg-amber-100 text-amber-600',
    label: 'Em Breve'
  },
  support_response: {
    icon: MessageSquare,
    color: 'bg-purple-100 text-purple-600',
    label: 'Suporte'
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
    }).catch(() => {
      navigate('/Login');
    });
  }, [navigate]);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notification')
        .select('*')
        .eq('user_email', user.email)
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id) => {
      const { data: result, error } = await supabase
        .from('notification')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      const { error } = await supabase
        .from('notification')
        .update({ is_read: true })
        .in('id', unread.map(n => n.id));
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('notification')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      markAsReadMutation.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-[#3065DF] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8FA] to-[#E8EEFB] dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('Home'))}
          className="mb-6 hover:bg-white/50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Bell className="w-8 h-8 text-[#FF0864]" />
              Notificações
            </h1>
            {unreadCount > 0 && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-white/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <Card className="p-12 text-center bg-white dark:bg-gray-800">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Você não tem notificações
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => {
                const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.comment_reply;
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                  >
                    <Card 
                      className={`p-4 cursor-pointer transition-all hover:shadow-lg ${
                        notification.is_read 
                          ? 'bg-white dark:bg-gray-800' 
                          : 'bg-white dark:bg-gray-800 border-l-4 border-l-[#FF0864]'
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${config.color}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-semibold ${notification.is_read ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'}`}>
                                {notification.title}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotificationMutation.mutate(notification.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
                              {config.label}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(notification.created_date).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}