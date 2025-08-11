import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { toggleCommunityCommentLike, deleteCommunityComment } from "@/lib/database";

interface RouteParams {
  params: {
    id: string;
    commentId: string;
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

    const commentId = parseInt(params.commentId);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'like') {
      const result = await toggleCommunityCommentLike(commentId, session.user.id);
      return NextResponse.json({
        success: true,
        data: result,
        message: result.liked ? "Comment liked" : "Comment unliked"
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing comment action:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to process comment action" 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const commentId = parseInt(params.commentId);

    if (isNaN(commentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid comment ID" },
        { status: 400 }
      );
    }

    const deleted = await deleteCommunityComment(commentId, session.user.id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Comment not found or unauthorized" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to delete comment" 
      },
      { status: 500 }
    );
  }
}
