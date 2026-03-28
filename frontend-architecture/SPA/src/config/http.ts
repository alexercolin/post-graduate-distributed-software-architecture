import axios from "axios";

export const moviesApi = axios.create({
  baseURL: "https://api.themoviedb.org/3",
  headers: {
    Authorization: `Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1ZDk0NzM5Y2JjZDRjMTQ1MzJiYTY5NmJiMDM4Y2Q2MiIsIm5iZiI6MTc3NDcwMzI4NS4yOTMsInN1YiI6IjY5YzdkMmI1ODgwNDA3MzI5ZjlkNGIzOCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.JOISYG8oLSuk7VO6Z3WCJjGh2D9QN22LbObnNptQ7V0`,
  },
});
