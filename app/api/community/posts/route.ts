import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCommunityPost, getCommunityPosts, CommunityPostFilters } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);

    // Build filters from query parameters
    const filters: CommunityPostFilters = {
      search: searchParams.get('search') || undefined,
      post_type: searchParams.get('post_type') || undefined,
      city_id: searchParams.get('city_id') ? parseInt(searchParams.get('city_id')!) : undefined,
      activity_id: searchParams.get('activity_id') ? parseInt(searchParams.get('activity_id')!) : undefined,
      user_id: searchParams.get('user_id') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      rating: searchParams.get('rating') ? parseInt(searchParams.get('rating')!) : undefined,
      is_featured: searchParams.get('is_featured') === 'true' ? true : undefined,
      sort_by: (searchParams.get('sort_by') as any) || 'newest',
      limit: parseInt(searchParams.get('limit') || '20'),
      offset: parseInt(searchParams.get('offset') || '0'),
    };

    // Pass user ID only if authenticated (for like status)
    const posts = await getCommunityPosts(filters, session?.user?.id);

    return NextResponse.json({
      success: true,
      data: posts,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        hasMore: posts.length === filters.limit
      }
    });
  } catch (error) {
    console.error("Error fetching community posts:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch community posts" 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      content,
      post_type,
      trip_id,
      city_id,
      activity_id,
      images,
      tags,
      rating
    } = body;

    // Validation
    if (!title || !content || !post_type) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Title, content, and post type are required" 
        },
        { status: 400 }
      );
    }

    const validPostTypes = ['experience', 'review', 'tip', 'recommendation'];
    if (!validPostTypes.includes(post_type)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid post type" 
        },
        { status: 400 }
      );
    }

    // Rating validation
    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Rating must be between 1 and 5" 
        },
        { status: 400 }
      );
    }

    const post = await createCommunityPost({
      user_id: session.user.id,
      title,
      content,
      post_type,
      trip_id,
      city_id,
      activity_id,
      images,
      tags,
      rating
    });

    return NextResponse.json({
      success: true,
      data: post,
      message: "Community post created successfully"
    });
  } catch (error) {
    console.error("Error creating community post:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create community post" 
      },
      { status: 500 }
    );
  }
}
