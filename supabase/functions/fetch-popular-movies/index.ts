import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey",
};

// This function creates a Supabase client with service_role privileges
// for administrative tasks, bypassing RLS.
const createAdminClient = () => {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Use the admin client for database operations
    const supabaseAdmin = createAdminClient();

    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");
    if (!tmdbApiKey) {
      throw new Error("TMDb API key not found.");
    }

    const tmdbResponse = await fetch(
      `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=1`
    );
    if (!tmdbResponse.ok) {
      throw new Error(`TMDb API request failed: ${tmdbResponse.statusText}`);
    }
    const tmdbData = await tmdbResponse.json();

    const moviesToInsert = tmdbData.results.map((movie: any) => ({
      tmdb_id: movie.id,
      title: movie.title,
      overview: movie.overview,
      release_date: movie.release_date,
      poster_path: movie.poster_path,
      popularity: movie.popularity,
      genres: movie.genre_ids,
    }));

    const { data, error } = await supabaseAdmin
      .from("movies")
      .upsert(moviesToInsert, { onConflict: "tmdb_id" }) // Note: ignoreDuplicates is default on upsert
      .select();

    if (error) {
      throw error;
    }

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
