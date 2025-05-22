// File: /app/api/database/schema/route.ts

import { NextResponse } from "next/server";
import {
  connectToDatabase,
  getDatabaseSchema,
  closeConnection,
} from "@/lib/databases_sqlserver"; // Update path if needed

export async function GET() {
  try {
    const connection = await connectToDatabase();
    const { tables, columns } = await getDatabaseSchema(connection);

    // Group columns under each table
    const grouped: Record<string, string[]> = {};

    for (const table of tables) {
      const fullName = `${table.table_schema}.${table.table_name}`;
      grouped[fullName] = columns
        .filter((col) => col.table_name === fullName)
        .map((col) => col.column_name);
    }

    await closeConnection(connection);

    return NextResponse.json({ success: true, data: grouped });
  } catch (error) {
    console.error("Schema fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch schema" },
      { status: 500 }
    );
  }
}
