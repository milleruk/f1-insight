// src/server/router/index.ts
import { createRouter } from "./context";
import superjson from "superjson";

import { constructorsRouter, driversRouter } from "./routers";

export const appRouter = createRouter()
  .transformer(superjson)
  .merge("drivers.", driversRouter)
  .merge("constructors.", constructorsRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
