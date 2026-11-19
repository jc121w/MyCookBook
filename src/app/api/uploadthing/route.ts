import { createRouteHandler } from "uploadthing/next";
import { fileRouter } from "./core";

// Exposes /api/uploadthing. Reads UPLOADTHING_TOKEN from .env.
export const { GET, POST } = createRouteHandler({ router: fileRouter });
