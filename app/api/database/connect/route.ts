import {
  getDBConfig,
  connectToDatabase,
  getDatabaseSchema,
  closeConnection,
} from "@/lib/database";
import { ApiResponse, ConnectionState, DatabaseSchema } from "@/lib/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Handle POST requests to /api/database/connect
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Set environment variables from request data for MSSQL
    process.env.SQL_SERVER = requestData.server;
    process.env.SQL_DATABASE = requestData.database;
    process.env.SQL_USER = requestData.user;
    process.env.SQL_PASSWORD = requestData.password;
    process.env.SQL_ENCRYPT = requestData.encrypt ? "true" : "false";

    // Try to connect to the database
    const connection = await connectToDatabase();

    // If connection successful, get schema information
    const schema = await getDatabaseSchema(connection);

    // Close the connection
    await closeConnection(connection);

    // Store connection info in cookies
    const cookieStore = cookies();

    // Store connection parameters in cookies (except password)
    cookieStore.set("db_server", requestData.server, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24, // 1 day
    });

    cookieStore.set("db_database", requestData.database, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    cookieStore.set("db_user", requestData.user, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    cookieStore.set("db_encrypt", requestData.encrypt ? "true" : "false", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    // Store connection status
    cookieStore.set("db_connected", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    const response: ApiResponse<DatabaseSchema> = {
      success: true,
      data: schema,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Database connection error:", error);

    const response: ApiResponse<null> = {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to connect to database",
    };

    return NextResponse.json(response, { status: 500 });
  }
}

// Handle GET requests to /api/database/connect
export async function GET() {
  try {
    const cookieStore = cookies();
    const isConnected = cookieStore.get("db_connected")?.value === "true";

    if (!isConnected) {
      const response: ApiResponse<ConnectionState> = {
        success: true,
        data: {
          isConnected: false,
        },
      };

      return NextResponse.json(response);
    }

    // Get connection parameters from cookies
    const server = cookieStore.get("db_server")?.value;
    const database = cookieStore.get("db_database")?.value;
    const user = cookieStore.get("db_user")?.value;
    const encrypt = cookieStore.get("db_encrypt")?.value || "false";

    if (!server || !database || !user) {
      const response: ApiResponse<ConnectionState> = {
        success: true,
        data: {
          isConnected: false,
          error: "Connection information not found",
        },
      };

      return NextResponse.json(response);
    }

    // Set environment variables from cookies
    process.env.SQL_SERVER = server;
    process.env.SQL_DATABASE = database;
    process.env.SQL_USER = user;
    process.env.SQL_ENCRYPT = encrypt;

    // Password is NOT stored in cookies for security
    // This is just to verify that we can still connect (password needed)
    try {
      // Attempt connection - user must re-enter password if needed
      const connection = await connectToDatabase();
      const schema = await getDatabaseSchema(connection);
      await closeConnection(connection);

      const response: ApiResponse<ConnectionState> = {
        success: true,
        data: {
          isConnected: true,
          connection: {
            server,
            user,
            password: "******", // Masked
            database,
            encrypt: encrypt === "true",
          },
          schema,
        },
      };

      return NextResponse.json(response);
    } catch (dbError) {
      const response: ApiResponse<ConnectionState> = {
        success: true,
        data: {
          isConnected: false,
          error: "Database connection failed, please reconnect",
        },
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error checking connection status:", error);

    const response: ApiResponse<ConnectionState> = {
      success: false,
      error: "Failed to check connection status",
    };

    return NextResponse.json(response, { status: 500 });
  }
}
