import { createBrowserRouter } from "react-router-dom";
import { Home } from "./views/Home/Home";
import { Movies } from "./views/Movies";
import { MovieDetail } from "./views/MovieDetail";
import { RootLayout } from "./views/RootLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "/movies",
        element: <Movies />,
      },
      {
        path: "movies/:id",
        element: <MovieDetail />,
      },
    ],
  },
]);
