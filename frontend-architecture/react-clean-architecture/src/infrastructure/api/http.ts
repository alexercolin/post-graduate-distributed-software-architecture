const BASE_URL = "https://api.themoviedb.org/3";
const TOKEN =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI4NzBjY2Q3YmQwOThhNjQ2ZDU5NjhiYTUyOGE1NWZlMiIsIm5iZiI6MTc3NDcwMzI4NS4yOTMsInN1YiI6IjY5YzdkMmI1ODgwNDA3MzI5ZjlkNGIzOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.tlW-68LyygGanhCt9aKH_JglpKXpvJqHcwE_HYgzQD8";

export async function moviesApi(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  return response.json();
}
