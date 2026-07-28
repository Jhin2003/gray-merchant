// This file wires the Prisma CLI config. For Prisma 7 we pass the
// connection URL via the `datasource` option so the schema doesn't need to
// declare a `url` field. Driver-adapter wiring is applied in the generated
// `PrismaClient` (via `PrismaService`) for runtime queries.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url = process.env["DATABASE_URL"];
if (!url) {
  throw new Error("DATABASE_URL is required for Prisma CLI");
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url,
  },
});
