import { AppLoadContext } from '@remix-run/node';
import { Elysia } from 'elysia';
import { Context } from 'elysia/context';
import { InlineConfig } from 'vite';

type GetLoadContext = (context: Context) => AppLoadContext | Promise<AppLoadContext>;
interface RemixOptions {
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
     * A function that returns the value to use as `context` in route `loader` and
     * `action` functions.
     *
     * You can use declaration merging for type it correctly https://www.typescriptlang.org/docs/handbook/declaration-merging.html
     */
    getLoadContext?: GetLoadContext;
}
declare function remix(options?: RemixOptions): Promise<Elysia<"", false, {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, {
    type: {};
    error: {};
}, {
    schema: {};
    macro: {};
    macroFn: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>>;

export { type GetLoadContext, type RemixOptions, remix };
