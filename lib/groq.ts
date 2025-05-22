import Groq from "groq-sdk";
import { z } from "zod";
import "server-only";

// Environment variable schema
const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1),
});

// Create Groq client
export function createGroqClient() {
  try {
    const env = envSchema.parse({
      GROQ_API_KEY: process.env.GROQ_API_KEY || "",
    });

    return new Groq({
      apiKey: env.GROQ_API_KEY,
    });
  } catch (error) {
    console.error("Groq client creation error:", error);
    throw new Error("Invalid Groq API configuration");
  }
}

// Natural language to SQL conversion system prompt
const SQL_SYSTEM_PROMPT = `
You are an expert database engineer specialized in translating natural language into SQL queries.

Given the database schema information and a natural language query, you will:
1. Analyze the schema to understand the database structure.
2. Interpret the user's natural language question.
3. Generate a valid SQL query that accurately answers the question.
4. Return ONLY the SQL query without any explanations. The query should be optimized and include appropriate joins, WHERE clauses, and aggregations as needed.

Important rules:
- Only use tables and columns that exist in the provided schema.
- Never use SELECT * in production queries to avoid performance issues.
- Never execute commands that could modify the database (INSERT, UPDATE, DELETE, DROP, etc.) unless explicitly asked to do so.
- Always use appropriate table aliases for clarity in complex queries.
- Include appropriate comments to explain complex parts of the query.
- Ensure the query is optimized for performance.

The query you generate will be executed against a MySQL database.
`;

// Extract SQL query from LLM response with ZOD schema to ensure SQL validity
const SqlResponseSchema = z.object({
  sql: z.string(),
});

// Function to generate SQL from natural language
export async function generateSqlFromNaturalLanguage(
  naturalLanguageQuery: string,
  schema: {
    tables: { table_name: string; table_schema: string }[];
    columns: { table_name: string; column_name: string; data_type: string }[];
  }
): Promise<string> {
  try {
    const groq = createGroqClient();
    const schemaText = formatSchemaForPrompt(schema);
    console.log("first schemaText:", schemaText);

    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SQL_SYSTEM_PROMPT },
        {
          role: "user",
          content: `DATABASE SCHEMA:\n${schemaText}\n\nNATURAL LANGUAGE QUERY: ${naturalLanguageQuery}\n\nRespond with a JSON object that contains the corresponding SQL query in a field called "sql_query". Return the SQL query in a single line without any line breaks. Example: { "sql_query": "SELECT * FROM users;" }`,
        },
      ],
      model: "llama3-8b-8192",
      temperature: 0.2,
      max_tokens: 1024,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "";
    console.log("content!!!:", content);
    try {
      const parsedContent = JSON.parse(content);
      const validatedResponse = SqlResponseSchema.parse(parsedContent);
      return validatedResponse.sql.trim();
    } catch (parseError) {
      const sqlMatch = content.match(/```sql\s*([\s\S]*?)\s*```/);
      if (sqlMatch && sqlMatch[1]) {
        return sqlMatch[1].trim();
      }

      return content.trim();
    }
  } catch (error) {
    console.error("Error generating SQL from natural language:", error);
    throw new Error("Failed to generate SQL query");
  }
}

// Format database schema for prompt
function formatSchemaForPrompt(schema: {
  tables: { table_name: string; table_schema: string }[];
  columns: { table_name: string; column_name: string; data_type: string }[];
}): string {
  // Group columns by full table name including schema
  const tableColumns: Record<
    string,
    { column_name: string; data_type: string }[]
  > = {};

  for (const column of schema.columns) {
    const tableName = column.table_name; // already includes schema prefix like "sbm.project_details"
    if (!tableColumns[tableName]) {
      tableColumns[tableName] = [];
    }
    tableColumns[tableName].push({
      column_name: column.column_name,
      data_type: column.data_type,
    });
  }

  // Format the schema as a string
  let schemaText = "";

  for (const table of schema.tables) {
    const fullTableName = `${table.table_schema}.${table.table_name}`;
    schemaText += `Table: ${fullTableName}\n`;

    const columns = tableColumns[fullTableName] || [];
    for (const column of columns) {
      schemaText += `  - ${column.column_name} (${column.data_type})\n`;
    }

    schemaText += "\n";
  }

  return schemaText;
}
