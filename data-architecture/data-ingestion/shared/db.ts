// One Postgres connection pool shared by both consumers. Reads standard PG*
// env vars, falling back to the docker-compose defaults so it works with zero
// configuration on a local machine.
import pg from "pg";

export const pool = new pg.Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "shop",
  password: process.env.PGPASSWORD ?? "shop",
  database: process.env.PGDATABASE ?? "shop",
});
