// Message types
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sql?: string;
  data?: any[];
  error?: string;
}

// Database connection types
export interface DatabaseConnection {
  // host: string;
  server: string;
  // port: number;
  user: string;
  password: string;
  database: string;
  encrypt: boolean;
}

// Database schema
export interface DatabaseSchema {
  tables: {
    table_name: string;
    table_schema: string;
  }[];
  columns: {
    table_name: string;
    column_name: string;
    data_type: string;
  }[];
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Query execution result
export interface QueryResult {
  sql: string;
  data?: any[];
  error?: string;
  executionTime?: number;
}

// Database connection state
export interface ConnectionState {
  isConnected: boolean;
  connection?: DatabaseConnection;
  schema?: DatabaseSchema;
  error?: string;
}
