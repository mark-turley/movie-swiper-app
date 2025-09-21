import { serve } from "https://deno.land/std@0.201.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// These headers are required for the browser to be able to call the function
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // This is needed for the browser's preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the user that called the function.
    // This way your row-level-security policies are applied.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Get the user from the auth header
    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const movieId = typeof body.movieId === "number" ? body.movieId : Number(body.movieId);
    const userLiked = Boolean(body.userLiked);

    if (!movieId || Number.isNaN(movieId)) {
      return new Response(JSON.stringify({ error: "Invalid or missing movieId" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use the user's ID from the authenticated session
    const { data, error } = await supabaseClient
      .from("swipes")
      .insert([{ user_id: user.id, movie_id: movieId, liked: userLiked }]);

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ data }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Function error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
