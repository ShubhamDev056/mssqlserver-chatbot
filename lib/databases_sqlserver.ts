// lib/mssql.ts
import sql, { ConnectionPool, config as SQLConfig } from "mssql";
import { z } from "zod";

// Environment variable schema for MSSQL
const envSchema = z.object({
  SQL_SERVER: z.string().min(1),
  SQL_DATABASE: z.string().min(1),
  SQL_USER: z.string().min(1),
  SQL_PASSWORD: z.string(),
  SQL_ENCRYPT: z.string().optional(), // 'true' or 'false'
});

// DBConfig Type
type DBConfig = SQLConfig;

// Parse and get DB config
export function getDBConfig(): DBConfig {
  try {
    const env = envSchema.parse({
      SQL_SERVER: process.env.SQL_SERVER || "",
      SQL_DATABASE: process.env.SQL_DATABASE || "",
      SQL_USER: process.env.SQL_USER || "",
      SQL_PASSWORD: process.env.SQL_PASSWORD || "",
      SQL_ENCRYPT: process.env.SQL_ENCRYPT || "false",
    });

    return {
      user: env.SQL_USER,
      password: env.SQL_PASSWORD,
      server: env.SQL_SERVER,
      database: env.SQL_DATABASE,
      options: {
        encrypt: env.SQL_ENCRYPT === "true",
        trustServerCertificate: true,
      },
    };
  } catch (error) {
    console.error("Database configuration error:", error);
    throw new Error("Invalid database configuration");
  }
}

// Maintain a single pool
let pool: ConnectionPool | null = null;

// Connect to SQL Server
export async function connectToDatabase(): Promise<ConnectionPool> {
  if (pool) return pool;

  try {
    console.log("#############");
    const config = getDBConfig();
    console.log("config!!!", config);
    pool = await sql.connect(config);
    return pool;
  } catch (error) {
    console.error("Database connection error:!!!!", error);
    throw new Error("Failed to connect to SQL Server");
  }
}

// Execute a query (optionally with parameters)
export async function executeQuery<T>(
  query: string,
  params: { name: string; type: any; value: any }[] = []
): Promise<T[]> {
  const pool = await connectToDatabase();

  try {
    const request = pool.request();
    for (const param of params) {
      request.input(param.name, param.type, param.value);
    }

    const result = await request.query(query);
    return result.recordset as T[];
  } catch (error) {
    console.error("Query execution error:", error);
    throw error;
  }
}

// Get database schema info
export async function getDatabaseSchema(): Promise<{
  tables: { table_name: string; table_schema: string }[];
  columns: { table_name: string; column_name: string; data_type: string }[];
}> {
  try {
    const dbConfig = getDBConfig();
    const database = dbConfig.database;

    // Get all tables
    const tables = await executeQuery<{
      table_name: string;
      table_schema: string;
    }>(
      `SELECT TABLE_NAME as table_name, TABLE_SCHEMA as table_schema 
         FROM INFORMATION_SCHEMA.TABLES 
         WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = @dbName`,
      [{ name: "dbName", type: sql.VarChar, value: database }]
    );

    // Get all columns
    const columns = await executeQuery<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_CATALOG = @dbName`,
      [{ name: "dbName", type: sql.VarChar, value: database }]
    );

    return { tables, columns };
  } catch (error) {
    console.error("Error fetching SQL Server schema:", error);
    throw error;
  }
}

// Close DB connection (optional for mssql pooling)
export async function closeConnection(): Promise<void> {
  try {
    if (pool) {
      await pool.close();
      pool = null;
    }
  } catch (error) {
    console.error("Error closing DB connection:", error);
  }
}
