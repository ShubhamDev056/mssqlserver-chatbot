import mysql from "mysql2/promise";
import { z } from "zod";

// Environment variable schema
const envSchema = z.object({
  MYSQL_HOST: z.string().min(1),
  MYSQL_PORT: z.string().transform((val) => parseInt(val, 10)),
  MYSQL_USER: z.string().min(1),
  MYSQL_PASSWORD: z.string(),
  MYSQL_DATABASE: z.string().min(1),
});

// Database connection type
export type DBConnection = mysql.Connection;

// Database connection configuration
type DBConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
};

// Get database configuration from environment variables
export function getDBConfig(): DBConfig {
  try {
    const env = envSchema.parse({
      MYSQL_HOST: process.env.MYSQL_HOST || "",
      MYSQL_PORT: process.env.MYSQL_PORT || "3306",
      MYSQL_USER: process.env.MYSQL_USER || "",
      MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
      MYSQL_DATABASE: process.env.MYSQL_DATABASE || "",
    });

    return {
      host: env.MYSQL_HOST,
      port: env.MYSQL_PORT,
      user: env.MYSQL_USER,
      password: env.MYSQL_PASSWORD,
      database: env.MYSQL_DATABASE,
    };
  } catch (error) {
    console.error("Database configuration error:", error);
    throw new Error("Invalid database configuration");
  }
}

// Create a database connection
export async function connectToDatabase(): Promise<DBConnection> {
  try {
    const config = getDBConfig();
    return await mysql.createConnection(config);
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Failed to connect to database");
  }
}

// Execute a database query
export async function executeQuery<T>(
  connection: DBConnection,
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await connection.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error("Query execution error:", error);
    throw error;
  }
}

// Get database schema information
export async function getDatabaseSchema(connection: DBConnection): Promise<{
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
      connection,
      `SELECT TABLE_NAME as table_name, TABLE_SCHEMA as table_schema 
       FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ?`,
      [database]
    );

    // Get all columns
    const columns = await executeQuery<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      connection,
      `SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type 
       FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = ?`,
      [database]
    );

    return { tables, columns };
  } catch (error) {
    console.error("Error fetching database schema:", error);
    throw error;
  }
}

// Close the database connection
export async function closeConnection(connection: DBConnection): Promise<void> {
  try {
    await connection.end();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}
