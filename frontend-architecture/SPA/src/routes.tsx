import { createBrowserRouter } from "react-router-dom";
import { Home } from "./views/Home";
import { Movie } from "./views/Movie";
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
        path: "movies",
        element: <Movie />,
      },
    ],
  },
]);
