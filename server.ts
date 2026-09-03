import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";

// Hardcoded API key as requested by user
const TMDB_API_KEY = "9752227dbc864a158b73bfbf29d830a5";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // TMDB API Route - Fetch Indonesian Movies
  app.get("/api/catalog/explore", async (req, res) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_original_language=id&sort_by=popularity.desc`
      );
      if (!response.ok) {
        throw new Error(`TMDB error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // TMDB API Route - Search Indonesian Movies
  app.get("/api/catalog/search", async (req, res) => {
    try {
      const { query } = req.query;
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
          query as string
        )}&language=id-ID`
      );
      if (!response.ok) {
        throw new Error(`TMDB error: ${response.status}`);
      }
      const data = await response.json();
      
      // Filter for Indonesian movies if needed, though search might return others
      // Let's return the results, and let the frontend filter if desired, or we filter here
      const indoMovies = data.results.filter((m: any) => m.original_language === 'id');
      res.json({ results: indoMovies.length > 0 ? indoMovies : data.results });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Fetch TMDB Movie Videos (for playing trailer)
  app.get("/api/catalog/:id/videos", async (req, res) => {
    try {
      const { id } = req.params;
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${TMDB_API_KEY}`
      );
      if (!response.ok) {
        throw new Error(`TMDB error: ${response.status}`);
      }
      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
