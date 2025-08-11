import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCommunityComment, getCommunityComments } from "@/lib/database";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);
    const postId = parseInt(params.id);

    if (isNaN(postId)) {
      return NextResponse.json(
        { success: false, error: "Invalid post ID" },
        { status: 400 }
      );
    }

    const comments = await getCommunityComments(postId, session?.user?.id);

    return NextResponse.json({
      success: true,
      data: comments
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to fetch comments" 
      },
      { status: 500 }
    );
  }
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

    const body = await request.json();
    const { content, parent_comment_id } = body;

    // Validation
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Comment content is required" 
        },
        { status: 400 }
      );
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Comment is too long (max 1000 characters)" 
        },
        { status: 400 }
      );
    }

    const comment = await createCommunityComment({
      post_id: postId,
      user_id: session.user.id,
      content: content.trim(),
      parent_comment_id: parent_comment_id ? parseInt(parent_comment_id) : undefined
    });

    return NextResponse.json({
      success: true,
      data: comment,
      message: "Comment created successfully"
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create comment" 
      },
      { status: 500 }
    );
  }
}
