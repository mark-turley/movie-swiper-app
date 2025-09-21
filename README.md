# Movie Swiper App - Backend

This repository contains the backend infrastructure for the Movie Swiper application, built with Supabase. It includes the database schema and the Edge Functions required to power the frontend.

## Architecture

This project follows a polyrepo architecture, separating the backend from the frontend for clarity and independent development.

*   **Backend:** This repository (`mark-turley/movie-swiper-app`). It manages the Supabase database and server-side logic (Edge Functions).
*   **Frontend:** The frontend is a React application built and hosted with Lovable. The code for the frontend is located in a separate repository: [mark-turley/cine-swipe-quest](https://github.com/mark-turley/cine-swipe-quest).

## Edge Functions

*   `/supabase/functions/fetch-popular-movies`: Fetches the latest popular movies from the TMDb API, caches them in the `movies` table, and returns them to the client.
*   `/supabase/functions/add-swipe`: Records a user's swipe action (`like` or `dislike`) in the `swipes` table.