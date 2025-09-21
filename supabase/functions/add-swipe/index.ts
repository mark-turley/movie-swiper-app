import { serve } from "std/server";
import { createClient } from "npm:@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const body = await req.json();
    const movieId = typeof body.movieId === "number" ? body.movieId : Number(body.movieId);
    const userLiked = Boolean(body.userLiked);
    // temporary placeholder user id until auth is implemented
    const userId = body.userId ?? "00000000-0000-0000-0000-000000000000";

    if (!movieId || Number.isNaN(movieId)) {
      return new Response(JSON.stringify({ error: "Invalid or missing movieId" }), { status: 400 });
    }

    const { data, error } = await supabase
      .from("swipes")
      .insert([{ user_id: userId, movie_id: movieId, liked: userLiked }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ data }), { status: 200 });
  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500 });
  }
});
