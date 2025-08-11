"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Star, Upload, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ImageUpload from "@/components/community/image-upload";

interface Trip {
  id: number;
  name: string;
}

interface City {
  id: number;
  name: string;
  country: string;
}

interface Activity {
  id: number;
  name: string;
}

export default function CreatePostPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    post_type: "",
    trip_id: "",
    city_id: "",
    activity_id: "",
    rating: 0,
    tags: [] as string[],
  });
  
  const [currentTag, setCurrentTag] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/community/create");
    }
  }, [status, router]);

  // Fetch user's trips, cities, and activities
  useEffect(() => {
    if (session?.user?.id) {
      fetchUserData();
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      // Fetch trips
      const tripsResponse = await fetch("/api/trips");
      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json();
        // The trips API returns an array directly, not nested in a trips property
        setTrips(Array.isArray(tripsData) ? tripsData : []);
      }

      // Fetch cities
      const citiesResponse = await fetch("/api/cities");
      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json();
        // The cities API returns an array directly, not nested in a cities property
        setCities(Array.isArray(citiesData) ? citiesData : []);
      }

      // Fetch activities - let's create this endpoint
      const activitiesResponse = await fetch("/api/activities");
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(Array.isArray(activitiesData) ? activitiesData : []);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addTag = () => {
    if (currentTag.trim() && !formData.tags.includes(currentTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const postData = {
        title: formData.title,
        content: formData.content,
        post_type: formData.post_type,
        trip_id: formData.trip_id ? parseInt(formData.trip_id) : undefined,
        city_id: formData.city_id ? parseInt(formData.city_id) : undefined,
        activity_id: formData.activity_id ? parseInt(formData.activity_id) : undefined,
        rating: formData.rating > 0 ? formData.rating : undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        images: images.length > 0 ? images : undefined,
      };

      const response = await fetch("/api/community/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/community");
      } else {
        alert(data.error || "Failed to create post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/community" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Community
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Share Your Experience</h1>
          <p className="text-gray-600">Tell the community about your amazing travel experience!</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Post Type */}
              <div>
                <Label htmlFor="post_type">Post Type *</Label>
                <Select
                  value={formData.post_type}
                  onValueChange={(value) => handleInputChange("post_type", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What type of post is this?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="experience">🌟 Experience - Share your travel story</SelectItem>
                    <SelectItem value="review">⭐ Review - Rate and review a place</SelectItem>
                    <SelectItem value="tip">💡 Tip - Share helpful travel advice</SelectItem>
                    <SelectItem value="recommendation">👍 Recommendation - Suggest a place or activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Give your post an engaging title..."
                  required
                />
              </div>

              {/* Content */}
              <div>
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  placeholder="Share your experience in detail..."
                  rows={8}
                  required
                />
              </div>

              {/* Location Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="trip_id">Related Trip</Label>
                  <Select
                    value={formData.trip_id}
                    onValueChange={(value) => handleInputChange("trip_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id.toString()}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="city_id">City</Label>
                  <Select
                    value={formData.city_id}
                    onValueChange={(value) => handleInputChange("city_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a city" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.id} value={city.id.toString()}>
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="activity_id">Activity</Label>
                  <Select
                    value={formData.activity_id}
                    onValueChange={(value) => handleInputChange("activity_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {activities.map((activity) => (
                        <SelectItem key={activity.id} value={activity.id.toString()}>
                          {activity.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Rating */}
              {(formData.post_type === "review" || formData.post_type === "recommendation") && (
                <div>
                  <Label>Rating</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleInputChange("rating", star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= formData.rating
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {formData.rating > 0 ? `${formData.rating}/5` : "No rating"}
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    />
                    <Button type="button" onClick={addTag} variant="outline">
                      Add Tag
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>Images</Label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={5}
                  disabled={loading}
                />
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Link href="/community">
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Share Experience"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
