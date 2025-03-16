import "jsr:@std/dotenv/load";
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";

// Connect to IPL Database
const client = new Client({
  user: Deno.env.get("DENO_USER"),
  database: Deno.env.get("DATABASE"),
  hostname: Deno.env.get("HOST"),
  port: Deno.env.get("PORT"),
  password: Deno.env.get("PASSWORD"),
});

await client.connect();

const result = await client.queryArray("SELECT * FROM team");
console.log("🏟️ teams:", result.rows);
await client.end();
console.log("❌ Disconnected from Database.");

console.log("Server running on http://localhost:8000");
