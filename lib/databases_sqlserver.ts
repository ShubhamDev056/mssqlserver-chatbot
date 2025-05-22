import sql, { ConnectionPool, config as SQLConfig, VarChar, Int } from "mssql";
import { z } from "zod";

// Environment variable schema for SQL Server
const envSchema = z.object({
  SQL_SERVER: z.string().min(1),
  SQL_PORT: z.string().transform((val) => parseInt(val, 10)),
  SQL_DATABASE: z.string().min(1),
  SQL_USER: z.string().min(1),
  SQL_PASSWORD: z.string(),
  SQL_ENCRYPT: z.string().transform((val) => val === "true"),
});

// Connection type
export type DBConnection = ConnectionPool;

// Get database configuration from environment variables
export function getDBConfig(): SQLConfig {
  try {
    const env = envSchema.parse({
      SQL_SERVER: process.env.SQL_SERVER || "",
      SQL_PORT: process.env.SQL_PORT || "1433",
      SQL_DATABASE: process.env.SQL_DATABASE || "",
      SQL_USER: process.env.SQL_USER || "",
      SQL_PASSWORD: process.env.SQL_PASSWORD || "",
      SQL_ENCRYPT: process.env.SQL_ENCRYPT || "false",
    });

    return {
      server: env.SQL_SERVER,
      // port: env.SQL_PORT,
      user: env.SQL_USER,
      password: env.SQL_PASSWORD,
      database: env.SQL_DATABASE,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
      options: {
        // encrypt: env.SQL_ENCRYPT,
        trustServerCertificate: !env.SQL_ENCRYPT,
      },
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
    console.log("db config details: ", config);
    const pool = await sql.connect(config);
    const result = await pool
      .request()
      .query("SELECT GETDATE() AS currentTime");
    console.log(result.recordset);
    return pool;
  } catch (error) {
    console.error("Database connection error:", error);
    throw new Error("Failed to connect to database");
  }
}

// Execute a SQL query with positional `?` parameters
export async function executeQuery<T>(
  connection: sql.ConnectionPool,
  query: string,
  parameters: Record<string, any> = {}
): Promise<T[]> {
  const request = connection.request();

  for (const [key, value] of Object.entries(parameters)) {
    request.input(key, value);
  }

  const result = await request.query<T>(query);
  return result.recordset;
}

// Get database schema
export async function getDatabaseSchema(
  connection: sql.ConnectionPool
): Promise<{
  tables: { table_name: string; table_schema: string }[];
  columns: { table_name: string; column_name: string; data_type: string }[];
}> {
  try {
    const dbConfig = getDBConfig();
    const database = dbConfig.database!;

    const tables = await executeQuery<{
      table_name: string;
      table_schema: string;
    }>(
      connection,
      `SELECT TABLE_NAME as table_name, TABLE_SCHEMA as table_schema 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_CATALOG = @database AND TABLE_TYPE = 'BASE TABLE'`,
      { database }
    );

    const columns = await executeQuery<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      connection,
      `SELECT TABLE_SCHEMA + '.' + TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_CATALOG = @database`,
      { database }
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
    await connection.close();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}
