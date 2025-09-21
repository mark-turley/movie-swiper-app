import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Set up CORS headers for local development
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
};

serve(async (req) => {
  // Handle preflight OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the user's authorization
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    // Retrieve the TMDb API key from secrets
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      throw new Error("TMDb API key not found.");
    }

    // Fetch popular movies from TMDb
    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`
    );
    if (!tmdbResponse.ok) {
      throw new Error(`TMDb API request failed: ${tmdbResponse.statusText}`);
    }
    const tmdbData = await tmdbResponse.json();

    // Transform the movie data to match our database schema
    const moviesToInsert = tmdbData.results.map((movie: any) => ({
      tmdb_id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      popularity: movie.popularity,
      // TMDb genre_ids is an array of integers
      genres: movie.genre_ids, 
    }));

    // Use upsert to add movies, ignoring duplicates based on tmdb_id
    const { data, error } = await supabaseClient
      .from("movies")
      .upsert(moviesToInsert, { onConflict: "tmdb_id", ignoreDuplicates: true })
      .select();

    if (error) {
      throw error;
    }

    // Return the newly added movies
    return new Response(JSON.stringify({ movies: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
