"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  MessageCircle, 
  Eye, 
  ArrowLeft, 
  Star, 
  MapPin, 
  Calendar,
  Share2,
  Flag
} from "lucide-react";
import { CommunityPost } from "@/lib/database";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import Comments from "@/components/community/comments";

export default function PostDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    if (params.id) {
      fetchPost();
    }
  }, [params.id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/posts/${params.id}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.data);
        setCommentsCount(data.data.comments_count || 0);
      } else {
        setError(data.error || "Post not found");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      setError("Failed to load post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!session || !post) return;

    try {
      const response = await fetch(`/api/community/posts/${post.id}/like`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPost(prev => prev ? {
          ...prev,
          is_liked: data.data.liked,
          likes_count: data.data.newLikeCount
        } : prev);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post?.title,
          text: post?.content?.substring(0, 100) + "...",
          url: window.location.href
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "experience": return "🌟";
      case "review": return "⭐";
      case "tip": return "💡";
      case "recommendation": return "👍";
      default: return "📝";
    }
  };

  const getPostTypeBadgeColor = (type: string) => {
    switch (type) {
      case "experience": return "bg-purple-100 text-purple-800";
      case "review": return "bg-amber-100 text-amber-800";
      case "tip": return "bg-blue-100 text-blue-800";
      case "recommendation": return "bg-emerald-100 text-emerald-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link href="/community" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">😞</div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              {error || "Post not found"}
            </h3>
            <Link href="/community">
              <Button className="bg-emerald-600 hover:bg-emerald-700">Back to Community</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/community" className="inline-flex items-center text-emerald-600 hover:text-emerald-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
        </div>

        <Card className="mb-6 bg-white border-gray-200 shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={post.user_profile_image || ""} />
                  <AvatarFallback>
                    {post.user_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-slate-900">{post.user_name}</h3>
                  <p className="text-sm text-slate-600">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getPostTypeBadgeColor(post.post_type)}>
                  {getPostTypeIcon(post.post_type)} {post.post_type}
                </Badge>
                {post.is_featured && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">Featured</Badge>
                )}
                {post.is_verified && (
                  <Badge className="bg-emerald-100 text-emerald-800">Verified</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-6">
              {/* Title */}
              <h1 className="text-3xl font-bold text-slate-900">{post.title}</h1>

              {/* Location and Trip Info */}
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {post.city_name && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {post.city_name}, {post.city_country}
                  </div>
                )}
                {post.trip_name && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {post.trip_name}
                  </div>
                )}
                {post.activity_name && (
                  <div className="flex items-center gap-1">
                    🎯 {post.activity_name}
                  </div>
                )}
              </div>

              {/* Rating */}
              {post.rating && (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < post.rating! 
                            ? "fill-yellow-400 text-yellow-400" 
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-lg font-medium text-slate-700">
                    {post.rating}/5
                  </span>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-gray max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {post.content}
                </div>
              </div>

              {/* Images */}
              {post.images && post.images.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Photos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {post.images.map((image, index) => (
                      <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={image}
                          alt={`Post image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="border-gray-300 text-slate-700">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <div className="flex items-center gap-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLike}
                    className={`flex items-center gap-2 hover:bg-gray-50 ${
                      post.is_liked ? "text-red-500" : "text-slate-600"
                    }`}
                    disabled={!session}
                  >
                    <Heart className={`h-5 w-5 ${post.is_liked ? "fill-current" : ""}`} />
                    {post.likes_count} {post.likes_count === 1 ? "Like" : "Likes"}
                  </Button>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <MessageCircle className="h-5 w-5" />
                    {commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}
                  </div>
                  
                  <div className="flex items-center gap-2 text-slate-600">
                    <Eye className="h-5 w-5" />
                    {post.views_count} {post.views_count === 1 ? "View" : "Views"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleShare} className="border-gray-300 text-slate-700 hover:bg-gray-50">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Button variant="outline" size="sm" className="border-gray-300 text-slate-700 hover:bg-gray-50">
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comments Section */}
        <Comments 
          postId={post.id} 
          initialCommentsCount={commentsCount}
          onCommentsCountChange={(count) => {
            setCommentsCount(count);
            // Also update the post object
            setPost(prev => prev ? { ...prev, comments_count: count } : prev);
          }}
        />
      </div>
    </div>
  );
}
