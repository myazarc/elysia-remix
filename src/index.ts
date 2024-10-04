import { join } from "node:path";
import staticPlugin from "@elysiajs/static";
import { type AppLoadContext, createRequestHandler } from "@remix-run/node";
import { Elysia } from "elysia";
import type { Context } from "elysia/context";
import type { InlineConfig, ViteDevServer } from "vite";

export type GetLoadContext = (
	context: Context,
) => AppLoadContext | Promise<AppLoadContext>;

export interface RemixOptions {
	/**
	 * in `development` mode it starts `vite` and in `production` it just served like static.
	 *
	 * @default process.env.NODE_ENV || "development"
	 */
	mode?: "development" | "production";
	/**
	 * The base path for the Remix app.
	 * This should match the `basename` in your `vite` config.
	 *
	 * @default "/"
	 */
	basename?: string;
	/**
	 * The directory where the Remix app is built.
	 * This should match the `buildDirectory` directory in your `vite` config.
	 *
	 * @default "build"
	 */
	buildDirectory?: string;
	/**
	 * The Remix server output filename.
	 * This should match the `serverBuildFile` filename in your `vite` config.
	 *
	 * @default "index.js"
	 */
	serverBuildFile?: string;
	/**
	 * Configure `vite` server in `development` mode
	 */
	vite?: InlineConfig;

	/**
	 * Configure [static plugin](https://elysiajs.com/plugins/static) options in `production` mode
	 *
	 * @default
	 * {
	 *		assets: clientDirectory,
	 *		prefix: "/",
	 *		directive: "immutable",
	 *		maxAge: 31556952000
	 * }
	 */
	static?: Parameters<typeof staticPlugin>[0];

	/**
	 * A function that returns the value to use as `context` in route `loader` and
	 * `action` functions.
	 *
	 * You can use declaration merging for type it correctly https://www.typescriptlang.org/docs/handbook/declaration-merging.html
	 */
	getLoadContext?: GetLoadContext;
}

export async function remix(options?: RemixOptions) {
	const cwd = process.env.REMIX_ROOT ?? process.cwd();
	const mode = options?.mode ?? process.env.NODE_ENV ?? "development";
	const buildDirectory = join(cwd, options?.buildDirectory ?? "build");
	const serverBuildPath = join(
		buildDirectory,
		"server",
		options?.serverBuildFile ?? "index.js",
	);

	const elysia = new Elysia({
		name: "elysia-remix",
		seed: options,
	});

	let vite: ViteDevServer | undefined;

	if (mode !== "production") {
		vite = await import("vite").then((vite) => {
			return vite.createServer({
				...options?.vite,
				server: {
					...options?.vite?.server,
					middlewareMode: true,
				},
			});
		});
	}

	if (vite) {
		elysia.use(
			(await import("elysia-connect-middleware")).connect(vite.middlewares),
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
			vite
				? await vite.ssrLoadModule("virtual:remix/server-build")
				: await import(serverBuildPath),
			mode,
		);

		const loadContext = await options?.getLoadContext?.(context);

		return handler(context.request, loadContext);
	});

	return elysia;
}
