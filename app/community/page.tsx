"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Heart, MessageCircle, Eye, Plus, Filter, Star, MapPin, Calendar } from "lucide-react";
import { CommunityPost } from "@/lib/database";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

interface CommunityPageProps {}

export default function CommunityPage({}: CommunityPageProps) {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchPosts(true);
  }, [selectedType, sortBy, searchTerm]);

  const fetchPosts = async (reset = false) => {
    try {
      setLoading(true);
      const currentPage = reset ? 0 : page;
      const params = new URLSearchParams({
        limit: "20",
        offset: (currentPage * 20).toString(),
        sort_by: sortBy,
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedType !== "all") params.append("post_type", selectedType);

      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();

      if (data.success) {
        if (reset) {
          setPosts(data.data);
          setPage(0);
        } else {
          setPosts(prev => [...prev, ...data.data]);
        }
        setHasMore(data.pagination.hasMore);
        if (!reset) setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: number) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: "POST",
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked: data.data.liked,
                likes_count: data.data.newLikeCount 
              }
            : post
        ));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
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
      case "review": return "bg-yellow-100 text-yellow-800";
      case "tip": return "bg-blue-100 text-blue-800";
      case "recommendation": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">Community</h1>
              <p className="text-slate-600 text-sm sm:text-base">Share your travel experiences and discover amazing stories from fellow travelers</p>
            </div>
            {session && (
              <div className="flex justify-start lg:justify-end">
                <Link href="/community/create">
                  <Button className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" />
                    Share Experience
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search posts, cities, or activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white border-gray-300 text-slate-900"
              />
            </div>
            <div className="flex gap-3">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[160px] bg-white border-gray-300 text-slate-900">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="experience">🌟 Experiences</SelectItem>
                  <SelectItem value="review">⭐ Reviews</SelectItem>
                  <SelectItem value="tip">💡 Tips</SelectItem>
                  <SelectItem value="recommendation">👍 Recommendations</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px] bg-white border-gray-300 text-slate-900">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-200">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="most_liked">Most Liked</SelectItem>
                  <SelectItem value="most_commented">Most Commented</SelectItem>
                  <SelectItem value="highest_rated">Highest Rated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={post.user_profile_image || ""} />
                      <AvatarFallback>
                        {post.user_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm text-slate-900">{post.user_name}</p>
                      <p className="text-xs text-slate-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getPostTypeBadgeColor(post.post_type)}>
                      {getPostTypeIcon(post.post_type)} {post.post_type}
                    </Badge>
                    {post.is_featured && (
                      <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">Featured</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-2 text-slate-900">{post.title}</h3>
                    <p className="text-slate-600 line-clamp-3">{post.content}</p>
                  </div>

                  {/* Location and Trip Info */}
                  <div className="flex flex-wrap gap-2 text-sm text-slate-500">
                    {post.city_name && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {post.city_name}, {post.city_country}
                      </div>
                    )}
                    {post.trip_name && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
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
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < post.rating! 
                              ? "fill-amber-500 text-amber-500" 
                              : "text-slate-300"
                          }`}
                        />
                      ))}
                      <span className="text-sm text-slate-600 ml-1">
                        {post.rating}/5
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs border-gray-300 text-slate-700">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Images */}
                  {post.images && post.images.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {post.images.slice(0, 3).map((image, index) => (
                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Post image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {index === 2 && post.images!.length > 3 && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <span className="text-white font-medium">
                                +{post.images!.length - 3} more
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 ${
                          post.is_liked ? "text-red-500" : "hover:text-emerald-600"
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.is_liked ? "fill-current" : ""}`} />
                        {post.likes_count}
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {post.comments_count}
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views_count}
                      </div>
                    </div>

                    <Link href={`/community/posts/${post.id}`}>
                      <Button variant="outline" size="sm" className="border-gray-300 text-slate-700 hover:bg-gray-50">
                        Read More
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Load More */}
        {hasMore && !loading && (
          <div className="text-center mt-8">
            <Button onClick={() => fetchPosts(false)} variant="outline" className="border-gray-300 text-slate-700 hover:bg-gray-50">
              Load More Posts
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto"></div>
          </div>
        )}

        {/* Empty State */}
        {posts.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-slate-400 text-6xl mb-4">🌍</div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">
              No posts found
            </h3>
            <p className="text-slate-500 mb-4">
              {searchTerm 
                ? "Try adjusting your search terms or filters"
                : "Be the first to share your travel experience!"
              }
            </p>
            {session && (
              <Link href="/community/create">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Share Your Experience
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
