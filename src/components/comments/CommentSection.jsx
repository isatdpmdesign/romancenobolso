import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MessageSquare, Send, Reply, User } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from "sonner";

export default function CommentSection({ chapterId, bookId, user }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', chapterId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('chapter_id', chapterId)
        .eq('status', 'approved')
        .order('created_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!chapterId
  });

  const createCommentMutation = useMutation({
    mutationFn: async (data) => {
      const { data: result, error } = await supabase
        .from('comment')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['comments', chapterId]);
      setNewComment('');
      setReplyingTo(null);
      setReplyContent('');
      toast.success('Comentário enviado para moderação!');
    }
  });

  const handleSubmitComment = () => {
    if (!user) {
      navigate('/Login');
      return;
    }
    if (!newComment.trim()) return;

    createCommentMutation.mutate({
      chapter_id: chapterId,
      book_id: bookId,
      user_email: user.email,
      user_name: user.nickname || user.full_name || 'Usuário',
      user_avatar: user.avatar,
      content: newComment.trim()
    });
  };

  const handleSubmitReply = (parentId, parentUserEmail) => {
    if (!user) {
      navigate('/Login');
      return;
    }
    if (!replyContent.trim()) return;

    createCommentMutation.mutate({
      chapter_id: chapterId,
      book_id: bookId,
      user_email: user.email,
      user_name: user.nickname || user.full_name || 'Usuário',
      user_avatar: user.avatar,
      content: replyContent.trim(),
      parent_id: parentId
    });

    // Criar notificação para o autor do comentário original
    if (parentUserEmail !== user.email) {
      supabase.from('notification').insert({
        user_email: parentUserEmail,
        type: 'comment_reply',
        title: 'Nova resposta ao seu comentário',
        message: `${user.user_metadata?.full_name || user.email?.split('@')[0] || 'Alguém'} respondeu ao seu comentário`,
        link: window.location.href
      }).then(({ error }) => {
        if (error) console.error('Erro ao criar notificação:', error);
      });
    }
  };

  // Organizar comentários: principais e respostas
  const mainComments = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  const getRepliesForComment = (commentId) => replies.filter(r => r.parent_id === commentId);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-[#3065DF]" />
        Comunidade
      </h2>

      {/* Novo comentário */}
      <Card className="p-4 bg-white dark:bg-gray-800">
        <Textarea
          placeholder={user ? "Compartilhe sua opinião sobre este capítulo..." : "Faça login para comentar"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user}
          rows={3}
          className="mb-3"
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || createCommentMutation.isPending}
            className="bg-[#FF0864] hover:bg-[#D10050]"
          >
            <Send className="w-4 h-4 mr-2" />
            Publicar
          </Button>
        </div>
      </Card>

      {/* Lista de comentários */}
      <div className="space-y-4">
        <AnimatePresence>
          {mainComments.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                Seja o primeiro a comentar!
              </p>
            </Card>
          ) : (
            mainComments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="p-4 bg-white dark:bg-gray-800">
                  <div className="flex gap-3">
                    {comment.user_avatar ? (
                      <img 
                        src={comment.user_avatar} 
                        alt={comment.user_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center text-white font-bold">
                        {comment.user_name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {comment.user_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(comment.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 dark:text-gray-300 mb-3">
                        {comment.content}
                      </p>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-[#3065DF] hover:bg-[#E8EEFB]"
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Responder
                      </Button>

                      {/* Form de resposta */}
                      {replyingTo === comment.id && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="mt-3 pl-4 border-l-2 border-[#3065DF]"
                        >
                          <Textarea
                            placeholder="Escreva sua resposta..."
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            rows={2}
                            className="mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSubmitReply(comment.id, comment.user_email)}
                              disabled={!replyContent.trim() || createCommentMutation.isPending}
                              className="bg-[#3065DF] hover:bg-[#1E4BB8]"
                            >
                              Responder
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyContent('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* Respostas */}
                      {getRepliesForComment(comment.id).length > 0 && (
                        <div className="mt-4 space-y-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          {getRepliesForComment(comment.id).map((reply) => (
                            <div key={reply.id} className="flex gap-3">
                              {reply.user_avatar ? (
                                <img 
                                  src={reply.user_avatar} 
                                  alt={reply.user_name}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#3065DF] to-[#FF0864] flex items-center justify-center text-white text-sm font-bold">
                                  {reply.user_name?.[0]?.toUpperCase() || 'U'}
                                </div>
                              )}
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                                    {reply.user_name}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(reply.created_date).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                  {reply.content}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}