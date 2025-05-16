import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'sql-formatter';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format SQL query for display
export function formatSql(sql: string): string {
  try {
    return format(sql, {
      language: 'mysql',
      tabWidth: 2,
      keywordCase: 'upper',
      indentStyle: 'standard',
    });
  } catch (error) {
    console.error('SQL formatting error:', error);
    return sql;
  }
}

// Convert database result to displayable format
export function formatDatabaseResult(result: any[]): {
  columns: string[];
  rows: any[][];
} {
  if (!result || result.length === 0) {
    return { columns: [], rows: [] };
  }

  // Extract column names from the first row
  const columns = Object.keys(result[0]);

  // Extract values from each row
  const rows = result.map((row) => columns.map((col) => formatValue(row[col])));

  return { columns, rows };
}

// Format individual values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return 'NULL';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

// Extract query parameters from a SQL query
export function extractQueryParams(sql: string): string[] {
  const placeholderRegex = /\?/g;
  const matches = sql.match(placeholderRegex) || [];
  return matches.map((_, index) => `param${index + 1}`);
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

// Get string representation of data type
export function getDataTypeDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'null';
  }
  return typeof value;
}

// Detect if the value is likely SQL injection
export function detectSQLInjection(value: string): boolean {
  const sqlInjectionPatterns = [
    /(\b|;)SELECT(\b|;)/i,
    /(\b|;)INSERT(\b|;)/i,
    /(\b|;)UPDATE(\b|;)/i,
    /(\b|;)DELETE(\b|;)/i,
    /(\b|;)DROP(\b|;)/i,
    /(\b|;)UNION(\b|;)/i,
    /--/,
    /\/\*/,
    /;\s*$/,
  ];

  return sqlInjectionPatterns.some(pattern => pattern.test(value));
}