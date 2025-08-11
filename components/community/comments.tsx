"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Reply, 
  Trash2, 
  Send,
  MoreVertical
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CommunityComment } from "@/lib/database";
import { formatDistanceToNow } from "date-fns";

interface CommentsProps {
  postId: number;
  initialCommentsCount: number;
  onCommentsCountChange: (count: number) => void;
}

export default function Comments({ postId, initialCommentsCount, onCommentsCountChange }: CommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyToComment, setReplyToComment] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/posts/${postId}/comments`);
      const data = await response.json();

      if (data.success) {
        setComments(data.data);
        // Update parent component with actual count
        const totalCount = countTotalComments(data.data);
        onCommentsCountChange(totalCount);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const countTotalComments = (comments: CommunityComment[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !newComment.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setNewComment("");
        fetchComments(); // Refresh comments
      } else {
        alert(data.error || "Failed to post comment");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: number) => {
    if (!session || !replyContent.trim()) return;

    try {
      setSubmitting(true);
      const response = await fetch(`/api/community/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: replyContent.trim(),
          parent_comment_id: parentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setReplyContent("");
        setReplyToComment(null);
        fetchComments(); // Refresh comments
      } else {
        alert(data.error || "Failed to post reply");
      }
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLikeComment = async (commentId: number) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}?action=like`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the comment in state
        setComments(prev => updateCommentInTree(prev, commentId, {
          is_liked: data.data.liked,
          likes_count: data.data.newLikeCount
        }));
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!session || !confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/comments/${commentId}`, {
        method: "DELETE",
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchComments(); // Refresh comments
      } else {
        alert(data.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment");
    }
  };

  const updateCommentInTree = (
    comments: CommunityComment[], 
    commentId: number, 
    updates: Partial<CommunityComment>
  ): CommunityComment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates)
        };
      }
      return comment;
    });
  };

  const CommentItem = ({ comment, isReply = false }: { comment: CommunityComment; isReply?: boolean }) => (
    <div className={`${isReply ? 'ml-8 mt-3' : 'mb-4'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.user_profile_image || ""} />
          <AvatarFallback>
            {comment.user_name?.charAt(0) || "U"}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-sm">{comment.user_name}</h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </span>
                {session?.user?.id === comment.user_id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-3 w-3 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
          
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleLikeComment(comment.id)}
              className={`h-6 px-2 ${comment.is_liked ? "text-red-500" : ""}`}
              disabled={!session}
            >
              <Heart className={`h-3 w-3 mr-1 ${comment.is_liked ? "fill-current" : ""}`} />
              {comment.likes_count > 0 ? comment.likes_count : "Like"}
            </Button>
            
            {!isReply && session && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setReplyToComment(
                  replyToComment === comment.id ? null : comment.id
                )}
                className="h-6 px-2"
              >
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}
          </div>

          {/* Reply form */}
          {replyToComment === comment.id && (
            <div className="mt-3">
              <form onSubmit={(e) => {
                e.preventDefault();
                handleSubmitReply(comment.id);
              }}>
                <div className="flex gap-2">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Write a reply..."
                    rows={2}
                    className="flex-1 text-sm"
                  />
                  <div className="flex flex-col gap-2">
                    <Button 
                      type="submit" 
                      size="sm"
                      disabled={!replyContent.trim() || submitting}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setReplyToComment(null);
                        setReplyContent("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply={true} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            Comments ({comments.reduce((total, comment) => total + 1 + (comment.replies?.length || 0), 0)})
          </h3>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Add comment form */}
        {session ? (
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={(session.user as any)?.image || ""} />
                <AvatarFallback>
                  {((session.user?.name || session.user?.email || "U")[0] || "U").toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={3}
                  className="resize-none"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">
                    {newComment.length}/1000 characters
                  </span>
                  <Button 
                    type="submit" 
                    disabled={!newComment.trim() || submitting || newComment.length > 1000}
                    size="sm"
                  >
                    {submitting ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Sign in to join the conversation</p>
          </div>
        )}

        {/* Comments list */}
        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to share your thoughts!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
