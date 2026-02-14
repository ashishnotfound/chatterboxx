import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Send, X, MoreHorizontal } from 'lucide-react';
import { Avatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { Story, StoryComment } from '@/hooks/useStories';
import { useAuth } from '@/contexts/AuthContext';

interface StoryInteractionsProps {
  story: Story;
  onLike: (storyId: string) => void;
  onComment: (storyId: string, content: string) => void;
  onDeleteComment: (commentId: string) => void;
  onReply: (commentId: string, content: string) => void;
}

export function StoryInteractions({ 
  story, 
  onLike, 
  onComment, 
  onDeleteComment, 
  onReply 
}: StoryInteractionsProps) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const handleLike = () => {
    onLike(story.id);
  };

  const handleComment = () => {
    if (!commentText.trim()) return;
    onComment(story.id, commentText);
    setCommentText('');
  };

  const handleReply = (commentId: string) => {
    if (!replyText.trim()) return;
    onReply(commentId, replyText);
    setReplyText('');
    setReplyingTo(null);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    return `${Math.floor(diffMins / 1440)}d`;
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
      {/* Like and Comment Buttons */}
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-2 text-white transition-transform active:scale-95"
        >
          <motion.div
            animate={{ scale: story.isLiked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Heart 
              className={`w-6 h-6 ${story.isLiked ? 'fill-red-500 text-red-500' : ''}`} 
            />
          </motion.div>
          <span className="text-sm">{story.likeCount || 0}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-white transition-transform active:scale-95"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-sm">{story.commentCount || 0}</span>
        </button>
      </div>

      {/* Story Caption */}
      {story.caption && (
        <p className="text-white text-sm mb-2 line-clamp-2">
          <span className="font-medium">{story.profile?.username}</span> {story.caption}
        </p>
      )}

      {/* Time */}
      <p className="text-white/70 text-xs">
        {formatTimeAgo(story.createdAt)}
      </p>

      {/* Comments Modal */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-medium">Comments</h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {story.comments?.length === 0 ? (
                  <p className="text-white/50 text-center py-8">No comments yet</p>
                ) : (
                  story.comments?.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar 
                          user={{
                            id: comment.user?.id || '',
                            username: comment.user?.username || '',
                            email: '',
                            avatar: comment.user?.avatar_url || '',
                            isPro: false,
                            isOnline: true,
                            presenceStatus: 'online' as any,
                            streak: 0,
                            uptime: 0,
                            createdAt: new Date(),
                          }} 
                          size="sm" 
                        />
                        <div className="flex-1">
                          <div className="bg-white/10 rounded-2xl p-3">
                            <p className="text-white font-medium text-sm">
                              {comment.user?.username}
                            </p>
                            <p className="text-white text-sm">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-3 mt-1 px-1">
                            <span className="text-white/50 text-xs">
                              {formatTimeAgo(comment.createdAt)}
                            </span>
                            <button
                              onClick={() => setReplyingTo(comment.id)}
                              className="text-white/50 text-xs hover:text-white transition-colors"
                            >
                              Reply
                            </button>
                            {comment.userId === user?.id && (
                              <button
                                onClick={() => onDeleteComment(comment.id)}
                                className="text-white/50 text-xs hover:text-red-400 transition-colors"
                              >
                                Delete
                              </button>
                            )}
                          </div>

                          {/* Reply Input */}
                          {replyingTo === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="mt-2 flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="Reply to comment..."
                                className="flex-1 bg-white/10 text-white placeholder-white/50 px-3 py-2 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                                autoFocus
                              />
                              <button
                                onClick={() => handleReply(comment.id)}
                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                              >
                                <Send className="w-4 h-4 text-white" />
                              </button>
                              <button
                                onClick={() => setReplyingTo(null)}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                            </motion.div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <Avatar 
                    user={user ? {
                      id: user.id,
                      username: user.user_metadata?.username || user.email?.split('@')[0] || '',
                      email: user.email || '',
                      avatar: user.user_metadata?.avatar_url || '',
                      isPro: false,
                      isOnline: true,
                      presenceStatus: 'online' as any,
                      streak: 0,
                      uptime: 0,
                      createdAt: new Date(),
                    } : {
                      id: '',
                      username: '',
                      email: '',
                      avatar: '',
                      isPro: false,
                      isOnline: false,
                      presenceStatus: 'offline' as any,
                      streak: 0,
                      uptime: 0,
                      createdAt: new Date(),
                    }}
                    size="sm" 
                  />
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-white/10 text-white placeholder-white/50 px-4 py-2 rounded-full focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentText.trim()}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
