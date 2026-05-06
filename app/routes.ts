import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("docs/:module/:contentType", "routes/content-list.tsx"),
  route("docs/:module", "routes/module.tsx"),
  route("docs/*", "routes/doc.tsx"),
] satisfies RouteConfig;
