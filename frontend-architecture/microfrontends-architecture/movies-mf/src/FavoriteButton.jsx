import { useState } from "react";

export default function FavoriteButton({ movieTitle = "this movie" }) {
  const [added, setAdded] = useState(false);

  return (
    <button
      onClick={() => setAdded((prev) => !prev)}
      style={{
        padding: "8px 16px",
        background: added ? "#e53e3e" : "#3182ce",
        color: "#fff",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "14px",
      }}
    >
      {added ? `Remove "${movieTitle}" from My List` : `Add "${movieTitle}" to My List`}
    </button>
  );
}
