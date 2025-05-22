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

// Handle POST requests to /api/chat
export async function POST(request: NextRequest) {
  let connection;
  try {
    // Get the request data
    const requestData = await request.json();
    const { message } = requestData;

    // Check if we're connected to a database
    const cookieStore = cookies();
    const isConnected = cookieStore.get("db_connected")?.value === "true";

    if (!isConnected) {
      const response: ApiResponse<null> = {
        success: false,
        error: "Not connected to any database. Please connect first.",
      };

      return NextResponse.json(response, { status: 400 });
    }

    // Set environment variables from cookies
    const host = cookieStore.get("db_host")?.value || "";
    const port = cookieStore.get("db_port")?.value || "3306";
    const user = cookieStore.get("db_user")?.value || "";
    const database = cookieStore.get("db_database")?.value || "";

    // Requires password to be set in the environment
    process.env.SQL_SERVER = host;
    process.env.SQL_PORT = port;
    process.env.SQL_USER = user;
    process.env.SQL_DATABASE = database;

    // Connect to the database
    connection = await connectToDatabase();

    // Get database schema
    const schema = await getDatabaseSchema(connection);
    console.log("Schema!!!!!!!!:", schema);
    // Generate SQL query from natural language
    const startTime = Date.now();
    const sql = await generateSqlFromNaturalLanguage(message, schema);
    console.log("SQL query generated:", sql);
    let parseSql = JSON.parse(sql);
    console.log("sql!!!!!!", parseSql);

    // Execute the query
    try {
      const data = await executeQuery(connection, parseSql.sql_query);
      const executionTime = Date.now() - startTime;

      const response: ApiResponse<QueryResult> = {
        success: true,
        data: {
          sql,
          data,
          executionTime,
        },
      };

      return NextResponse.json(response);
    } catch (queryError) {
      const executionTime = Date.now() - startTime;
      console.error("Query execution error:", queryError);

      const response: ApiResponse<QueryResult> = {
        success: true,
        data: {
          sql,
          error:
            queryError instanceof Error
              ? queryError.message
              : "Query execution failed",
          executionTime,
        },
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error("Error processing chat request:", error);

    const response: ApiResponse<null> = {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process request",
    };

    return NextResponse.json(response, { status: 500 });
  } finally {
    if (connection) {
      await closeConnection(connection);
    }
  }
}
