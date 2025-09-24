import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { pagesToFetch = 10 } = await req.json(); // Default to 10 pages
    const supabaseAdmin = createAdminClient();
    const tmdbApiKey = Deno.env.get("TMDB_API_KEY");

    if (!tmdbApiKey) {
      throw new Error("TMDB_API_KEY is not set.");
    }

    let totalMoviesProcessed = 0;

    for (let page = 1; page <= pagesToFetch; page++) {
      console.log(`Fetching page ${page} of ${pagesToFetch} from popular movies...`);
      const listResponse = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${tmdbApiKey}&language=en-US&page=${page}`
      );
      if (!listResponse.ok) continue;
      const listData = await listResponse.json();

      // For each movie in the list, fetch its full details
      const detailPromises = listData.results.map((movie: any) =>
        fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${tmdbApiKey}&language=en-US`)
      );
      const detailResponses = await Promise.all(detailPromises);

      const moviesToInsert = [];
      for (const res of detailResponses) {
        if (res.ok) {
          const movieDetail = await res.json();
          moviesToInsert.push({
            tmdb_id: movieDetail.id,
            title: movieDetail.title,
            overview: movieDetail.overview,
            release_date: movieDetail.release_date,
            poster_path: movieDetail.poster_path,
            popularity: movieDetail.popularity,
            genres: movieDetail.genres.map((g: any) => g.id), // Extract genre IDs
            tagline: movieDetail.tagline,
            vote_average: movieDetail.vote_average,
            vote_count: movieDetail.vote_count,
            runtime: movieDetail.runtime,
            production_companies: movieDetail.production_companies.map((c: any) => c.name), // Extract company names
          });
        }
      }

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
