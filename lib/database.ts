import sql, { ConnectionPool, config as SQLConfig } from "mssql";
import { z } from "zod";

// Environment variable schema for MSSQL with your env var names
const envSchema = z.object({
  SQL_SERVER: z.string().min(1),
  SQL_DATABASE: z.string().min(1),
  SQL_USER: z.string().min(1),
  SQL_PASSWORD: z.string(),
  SQL_ENCRYPT: z.string(), // "true" or "false"
});

// Database connection type
export type DBConnection = ConnectionPool;

// Database connection configuration type
type DBConfig = {
  server: string;
  database: string;
  user: string;
  password: string;
  encrypt: boolean | "strict";
};

// Get database configuration from environment variables
export function getDBConfig(): DBConfig {
  try {
    const env = envSchema.parse({
      //SQL_SERVER: process.env.SQL_SERVER || "",
      SQL_SERVER: "10.22.3.245",
      SQL_DATABASE: process.env.SQL_DATABASE || "",
      SQL_USER: process.env.SQL_USER || "",
      SQL_PASSWORD: process.env.SQL_PASSWORD || "",
      SQL_ENCRYPT: process.env.SQL_ENCRYPT || "false",
    });

    let encrypt: boolean | "strict";
    if (env.SQL_ENCRYPT.toLowerCase() === "true") {
      encrypt = true;
    } else if (env.SQL_ENCRYPT.toLowerCase() === "strict") {
      encrypt = "strict";
    } else {
      encrypt = false;
    }

    return {
      server: env.SQL_SERVER,
      database: env.SQL_DATABASE,
      user: env.SQL_USER,
      password: env.SQL_PASSWORD,
      encrypt,
    };
  } catch (error) {
    console.error("Database configuration error:", error);
    throw new Error("Invalid database configuration");
  }
}

// Create and return a new connection pool
export async function connectToDatabase(): Promise<DBConnection> {
  try {
    const config = getDBConfig();
    console.log("get db config", config);
    const sqlConfig: SQLConfig = {
      server: config.server,
      database: config.database,
      user: config.user,
      password: config.password,
      options: {
        encrypt: config.encrypt,
        trustServerCertificate: !config.encrypt, // useful for local dev with self-signed certs
      },
    };

    const pool = new sql.ConnectionPool(sqlConfig);
    await pool.connect();

    return pool;
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
    const request = connection.request();

    // Add input parameters if any
    params.forEach((param, index) => {
      // Use generic sql.VarChar as example; you may want to customize by param type
      request.input(`param${index}`, param);
    });

    // Note: To use params in query, your query must have placeholders like @param0, @param1 etc.
    const result = await request.query(query);
    return result.recordset as T[];
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

    // Get all tables in the current database
    const tables = await executeQuery<{
      table_name: string;
      table_schema: string;
    }>(
      connection,
      `SELECT TABLE_NAME AS table_name, TABLE_SCHEMA AS table_schema 
       FROM INFORMATION_SCHEMA.TABLES 
       WHERE TABLE_CATALOG = @param0`,
      [database]
    );

    // Get all columns in the current database
    const columns = await executeQuery<{
      table_name: string;
      column_name: string;
      data_type: string;
    }>(
      connection,
      `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, DATA_TYPE AS data_type 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_CATALOG = @param0`,
      [database]
    );

    return { tables, columns };
  } catch (error) {
    console.error("Error fetching database schema:", error);
    throw error;
  }
}

// Close the database connection pool
export async function closeConnection(connection: DBConnection): Promise<void> {
  try {
    await connection.close();
  } catch (error) {
    console.error("Error closing database connection:", error);
  }
}
