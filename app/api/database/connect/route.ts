import {
  getDBConfig,
  connectToDatabase,
  getDatabaseSchema,
  closeConnection,
} from "@/lib/databases_sqlserver";
import { ApiResponse, ConnectionState, DatabaseSchema } from "@/lib/types";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// POST: /api/database/connect
export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Set environment variables for MSSQL from request
    process.env.SQL_SERVER = requestData.host;
    process.env.SQL_PORT = requestData.port.toString();
    process.env.SQL_USER = requestData.user;
    process.env.SQL_PASSWORD = requestData.password;
    process.env.SQL_DATABASE = requestData.database;
    process.env.SQL_ENCRYPT = requestData.encrypt?.toString() ?? "false";

    const connection = await connectToDatabase();
    const schema = await getDatabaseSchema(connection);
    await closeConnection(connection);

    const cookieStore = cookies();
    cookieStore.set("db_host", requestData.host, {
      httpOnly: true,
      path: "/",
      maxAge: 86400,
    });
    cookieStore.set("db_port", requestData.port.toString(), {
      httpOnly: true,
      path: "/",
      maxAge: 86400,
    });
    cookieStore.set("db_user", requestData.user, {
      httpOnly: true,
      path: "/",
      maxAge: 86400,
    });
    cookieStore.set("db_database", requestData.database, {
      httpOnly: true,
      path: "/",
      maxAge: 86400,
    });
    // cookieStore.set("db_encrypt", process.env.SQL_ENCRYPT, {
    //   httpOnly: true,
    //   path: "/",
    //   maxAge: 86400,
    // });
    cookieStore.set("db_connected", "true", {
      httpOnly: true,
      path: "/",
      maxAge: 86400,
    });

    const response: ApiResponse<DatabaseSchema> = {
      success: true,
      data: schema,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Database connection error:", error);

    return NextResponse.json<ApiResponse<null>>(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to database",
      },
      { status: 500 }
    );
  }
}

// GET: /api/database/connect
export async function GET() {
  try {
    const cookieStore = cookies();
    const isConnected = cookieStore.get("db_connected")?.value === "true";

    if (!isConnected) {
      return NextResponse.json<ApiResponse<ConnectionState>>({
        success: true,
        data: { isConnected: false },
      });
    }

    const host = cookieStore.get("db_host")?.value;
    const port = cookieStore.get("db_port")?.value;
    const user = cookieStore.get("db_user")?.value;
    const database = cookieStore.get("db_database")?.value;
    const encrypt = cookieStore.get("db_encrypt")?.value ?? "false";

    if (!host || !port || !user || !database) {
      return NextResponse.json<ApiResponse<ConnectionState>>({
        success: true,
        data: {
          isConnected: false,
          error: "Connection information not found",
        },
      });
    }

    process.env.SQL_SERVER = host;
    process.env.SQL_PORT = port;
    process.env.SQL_USER = user;
    process.env.SQL_DATABASE = database;
    process.env.SQL_ENCRYPT = encrypt;

    try {
      const connection = await connectToDatabase();
      const schema = await getDatabaseSchema(connection);
      await closeConnection(connection);

      return NextResponse.json<ApiResponse<ConnectionState>>({
        success: true,
        data: {
          isConnected: true,
          connection: {
            host,
            port: parseInt(port, 10),
            user,
            password: "******",
            database,
          },
          schema,
        },
      });
    } catch {
      return NextResponse.json<ApiResponse<ConnectionState>>({
        success: true,
        data: {
          isConnected: false,
          error: "Database connection failed, please reconnect",
        },
      });
    }
  } catch (error) {
    console.error("Error checking connection status:", error);

    return NextResponse.json<ApiResponse<ConnectionState>>(
      {
        success: false,
        error: "Failed to check connection status",
      },
      { status: 500 }
    );
  }
}
