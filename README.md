# Movie Swiper App

A web application that helps couples decide on a movie to watch. Users are presented with a "Tinder-like" swiping interface to rate movies, and the app uses a machine learning model to generate personalized recommendations. When two users form a "couple" in the app, it finds and displays the movies they're both likely to enjoy.

## Tech Stack

*   **Frontend:** React (to be added)
*   **Backend:** [Supabase](https://supabase.io/)
    *   **Database:** Supabase Postgres
    *   **Authentication:** Supabase Auth
    *   **Serverless Functions:** Supabase Edge Functions
*   **Machine Learning:** Python (scikit-learn, pandas) - (to be added)
*   **Movie Data:** [The Movie Database (TMDb) API](https://www.themoviedb.org/documentation/api)

## Project Structure

```
.
├── frontend/         # React app (to be added)
├── ml/               # Python code for the ML recommendation model (to be added)
└── supabase/
    ├── migrations/   # Supabase database migrations
    └── functions/    # Supabase edge functions (to be added)
```

## Getting Started

1.  **Set up Supabase:** Create a new project on [Supabase](https://supabase.com/).
2.  **Link Project:** Link your Supabase project to the `movie-swiper-app` GitHub repository.
3.  **Apply Migrations:** Apply the database migrations located in the `supabase/migrations` directory.
4.  **Get API Keys:**
    *   Add your Supabase Project URL and `anon` key as secrets to your frontend environment.
    *   Sign up for an API key from [The Movie Database (TMDb)](https://www.themoviedb.org/documentation/api) and store it securely in Supabase.
5.  **Develop Frontend:** Add your React application code to the `frontend/` directory.
6.  **Develop ML Model:** Add the Python scripts for the recommendation model to the `ml/` directory.
