import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toggleCommunityPostLike } from "@/lib/database";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const result = await toggleCommunityPostLike(postId, session.user.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: result.liked ? "Post liked" : "Post unliked"
    });
  } catch (error) {
    console.error("Error toggling post like:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to toggle like" 
      },
      { status: 500 }
    );
  }
}
