import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiResponse } from "@/lib/types";

// Handle POST requests to /api/database/disconnect
export async function POST() {
  try {
    const cookieStore = cookies();
    
    // Clear all database connection cookies
    cookieStore.delete("db_connected");
    cookieStore.delete("db_host");
    cookieStore.delete("db_port");
    cookieStore.delete("db_user");
    cookieStore.delete("db_database");
    
    const response: ApiResponse<{ message: string }> = {
      success: true,
      data: {
        message: "Successfully disconnected from database",
      },
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error disconnecting from database:", error);
    
    const response: ApiResponse<null> = {
      success: false,
      error: "Failed to disconnect from database",
    };
    
    return NextResponse.json(response, { status: 500 });
  }
}