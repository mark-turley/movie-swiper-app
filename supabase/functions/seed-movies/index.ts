import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Admin client for privileged operations
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
    const { pagesToFetch = 10 } = await req.json(); // Default to 10 pages if not specified
    const supabaseAdmin = createAdminClient();
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");

    if (!tmdbApiKey) {
      throw new Error("TMDB_API_KEY is not set in environment variables.");
    }

    let totalMoviesProcessed = 0;

    // Loop through the specified number of pages from TMDb
    for (let page = 1; page <= pagesToFetch; page++) {
      console.log(`Fetching page ${page} of ${pagesToFetch}...`);
      const tmdbResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=${page}`
      );

      if (!tmdbResponse.ok) {
        console.error(`TMDb API request failed for page ${page}: ${tmdbResponse.statusText}`);
        continue; // Skip this page on failure
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

      if (moviesToInsert.length > 0) {
        const { error, count } = await supabaseAdmin
          .from("movies")
          .upsert(moviesToInsert, { onConflict: "tmdb_id", count: 'exact' });

        if (error) {
          console.error(`Supabase upsert error on page ${page}:`, error.message);
        } else {
          totalMoviesProcessed += count ?? 0;
        }
      }
    }

    const message = `Seeding complete. Processed ${totalMoviesProcessed} movies across ${pagesToFetch} pages.`;
    console.log(message);
    return new Response(JSON.stringify({ message }), {
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
