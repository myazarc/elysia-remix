import { join } from 'node:path';
import { createRequestHandler } from '@remix-run/node';
import { Elysia } from 'elysia';

async function remix(options) {
  const cwd = process.env.REMIX_ROOT ?? process.cwd();
  const mode = options?.mode ?? process.env.NODE_ENV ?? "development";
  const buildDirectory = join(cwd, options?.buildDirectory ?? "build");
  const serverBuildPath = join(
    buildDirectory,
    "server",
    options?.serverBuildFile ?? "index.js"
  );
  const elysia = new Elysia({
    name: "elysia-remix",
    seed: options
  });
  let vite;
  if (mode !== "production") {
    vite = await import('vite').then((vite2) => {
      return vite2.createServer({
        ...options?.vite,
        server: {
          ...options?.vite?.server,
          middlewareMode: true
        }
      });
    });
  }
  if (vite) {
    elysia.use(
      (await import('elysia-connect-middleware')).connect(vite.middlewares)
    );
  } else {
    const clientDirectory = join(buildDirectory, "client");
    const glob = new Bun.Glob(`${clientDirectory}/**`);
    for (const path of glob.scanSync()) {
      elysia.get(
        path.substring(clientDirectory.length),
        () => new Response(Bun.file(path))
      );
    }
  }
  elysia.all("*", async function processRemixSSR(context) {
    const handler = createRequestHandler(
      vite ? await vite.ssrLoadModule("virtual:remix/server-build") : await import(serverBuildPath),
      mode
    );
    const loadContext = await options?.getLoadContext?.(context);
    return handler(context.request, loadContext);
  });
  return elysia;
}

export { remix };
