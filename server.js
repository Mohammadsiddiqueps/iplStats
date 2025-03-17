import "jsr:@std/dotenv/load";
import { serve } from "https://deno.land/std@0.181.0/http/server.ts";
import { Client } from "https://deno.land/x/postgres/mod.ts";

// Database Connection
const client = new Client({
  user: Deno.env.get("DENO_USER"),
  database: Deno.env.get("DATABASE"),
  hostname: Deno.env.get("HOST"),
  port: Deno.env.get("PORT"),
  password: Deno.env.get("PASSWORD"),
});
await client.connect();

// Handle CORS
function handleCORS(req) {
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
}

// Fetch all teams
async function getTeams() {
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
    return new Response(JSON.stringify({ error: "Failed to fetch teams" }), {
      status: 500,
    });
  }
}

// Fetch player info
async function getPlayerInfo(req) {
  try {
    const body = await req.json();
    if (!body.playerId) {
      return new Response(JSON.stringify({ error: "Missing playerId" }), {
        status: 400,
      });
    }

    const totalRuns = await client.queryObject(
      "SELECT SUM(batter_runs)::int AS totalRuns FROM delivery WHERE batter_id = $1",
      [body.playerId]
    );

    const totalWickets = await client.queryObject(
      "SELECT COUNT(*)::int AS totalWickets FROM dismissal WHERE dismissed_by = $1",
      [body.playerId]
    );

    return new Response(
      JSON.stringify({ ...totalRuns.rows[0], ...totalWickets.rows[0] }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "http://localhost:5500",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching player info:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch player info" }), {
      status: 500,
    });
  }
}

// Fetch all players
async function getPlayers() {
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
    return new Response(JSON.stringify({ error: "Failed to fetch players" }), {
      status: 500,
    });
  }
}

// Request Handler
async function handleRequest(req) {
  const url = new URL(req.url);

  // Handle CORS Preflight Request
  const corsResponse = handleCORS(req);
  if (corsResponse) return corsResponse;

  if (req.method === "GET" && url.pathname === "/teams") {
    return getTeams();
  }
  if (req.method === "POST" && url.pathname === "/player-info") {
    return getPlayerInfo(req);
  }
  if (req.method === "GET" && url.pathname === "/players") {
    return getPlayers();
  }

  return new Response("Invalid request", { status: 404 });
}

// Start Server
serve(handleRequest, { port: 8000 });

// Graceful Shutdown
Deno.addSignalListener("SIGINT", async () => {
  console.log("\n❌ Server shutting down...");
  await client.end();
  Deno.exit();
});

console.log("🚀 Server running on http://localhost:8000");
