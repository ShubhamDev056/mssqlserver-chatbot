import {
  connectToDatabase,
  executeQuery,
  closeConnection,
  getDatabaseSchema,
} from "@/lib/databases_sqlserver";
import { generateSqlFromNaturalLanguage } from "@/lib/groq";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { ApiResponse, QueryResult } from "@/lib/types";
import sql from "mssql"; // Required for sql.VarChar, etc.

// Handle POST requests to /api/chat
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const requestData = await request.json();
    const { message } = requestData;

    // Check if database is connected via cookie
    const cookieStore = cookies();
    const isConnected = cookieStore.get("db_connected")?.value === "true";

    if (!isConnected) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Not connected to any database. Please connect first.",
      };
      return NextResponse.json(response, { status: 400 });
    }

    // Set required environment variables from cookies
    const server = cookieStore.get("db_host")?.value || "";
    const user = cookieStore.get("db_user")?.value || "";
    const database = cookieStore.get("db_database")?.value || "";

    // Set SQL Server env vars — password should be in env file
    process.env.SQL_SERVER = server;
    process.env.SQL_USER = user;
    process.env.SQL_DATABASE = database;

    // Connect to SQL Server
    const connection = await connectToDatabase();

    try {
      // Get database schema
      const schema = await getDatabaseSchema();

      // Generate SQL from message
      const startTime = Date.now();
      const sqlResult = await generateSqlFromNaturalLanguage(message, schema);
      const parsedSql = JSON.parse(sqlResult);
      const query = parsedSql.query;

      console.log("Generated SQL:", query);

      // Execute SQL query
      const data = await executeQuery(query);
      const executionTime = Date.now() - startTime;

      const response: ApiResponse<QueryResult> = {
        success: true,
        data: {
          sql: query,
          data,
          executionTime,
        },
      };
      return NextResponse.json(response);
    } catch (queryError) {
      const executionTime = Date.now() - Date.now();

      const response: ApiResponse<QueryResult> = {
        success: true,
        data: {
          sql: "",
          error:
            queryError instanceof Error
              ? queryError.message
              : "Query execution failed",
          executionTime,
        },
      };
      return NextResponse.json(response);
    } finally {
      // Close SQL connection pool
      await closeConnection();
    }
  } catch (error) {
    console.error("Chat request error:", error);
    const response: ApiResponse<null> = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process request",
    };
    return NextResponse.json(response, { status: 500 });
  }
}
