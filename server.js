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

serve(
  async (req) => {
    const url = new URL(req.url);
    console.log(`Received request: ${req.method} ${url.pathname}`);

    // Handle CORS Preflight Request
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "http://localhost:5500",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Fetch all teams
    if (req.method === "GET" && url.pathname === "/teams") {
      try {
        const result = await client.queryObject("SELECT * FROM team");
        return new Response(JSON.stringify(result.rows), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:5500",
          },
        });
      } catch (error) {
        console.error("Error fetching teams:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch teams" }),
          {
            status: 500,
          }
        );
      }
    }

    // Fetch player runs by playerId
    if (req.method === "POST" && url.pathname === "/player-runs") {
      try {
        const body = await req.json();
        console.log("Received request body:", body);

        if (!body.playerId) {
          return new Response(JSON.stringify({ error: "Missing playerId" }), {
            status: 400,
          });
        }

        // Fetch total runs from the database
        const result = await client.queryObject(
          "SELECT SUM(batter_runs)::int AS total_runs FROM delivery where batter_id = $1",
          [body.playerId]
        );

        console.log("result", result);
        return new Response(JSON.stringify(result.rows[0]), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:5500",
          },
        });
      } catch (error) {
        console.error("Error fetching player runs:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch player runs" }),
          {
            status: 500,
          }
        );
      }
    }

    // Fetch all players
    if (req.method === "GET" && url.pathname === "/players") {
      try {
        const result = await client.queryObject("SELECT * FROM player");
        return new Response(JSON.stringify(result.rows), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "http://localhost:5500",
          },
        });
      } catch (error) {
        console.error("Error fetching players:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch players" }),
          {
            status: 500,
          }
        );
      }
    }

    // Default response for invalid routes
    return new Response("Invalid request", { status: 404 });
  },
  { port: 8000 }
);

// Gracefully close database connection when the server shuts down
Deno.addSignalListener("SIGINT", async () => {
  console.log("\n❌ Server shutting down...");
  await client.end();
  Deno.exit();
});

console.log("🚀 Server running on http://localhost:8000");
