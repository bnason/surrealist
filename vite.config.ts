import { fileURLToPath } from "node:url";
import legacy from "@vitejs/plugin-legacy";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { compression } from "vite-plugin-compression2";
import { ViteImageOptimizer as images } from "vite-plugin-image-optimizer";
import { Mode, plugin as markdown } from "vite-plugin-markdown";
import { surreal, version } from "./package.json";

const isPreview = process.env.VITE_SURREALIST_PREVIEW === "true";
const isInstance = process.env.VITE_SURREALIST_INSTANCE === "true";

export default defineConfig(({ mode }) => {
	// Required because we cannot pass a custom mode to tauri build
	mode = isPreview ? "preview" : mode;

	return {
		plugins: [
			images(),
			react(),
			markdown({
				mode: [Mode.HTML],
			}),
			legacy({
				modernTargets: "since 2021-01-01, not dead",
				modernPolyfills: true,
				renderLegacyChunks: false,
			}),
			isInstance
				? compression({
						threshold: 100,
						deleteOriginalAssets: true,
						include: /assets\/.+\.(html|xml|css|json|js|mjs|svg|wasm)$/,
					})
				: compression({
						deleteOriginalAssets: true,
						include: /\.(wasm)$/,
						filename: (id) => id,
					}),
		],
		clearScreen: false,
		envPrefix: ["VITE_", "TAURI_"],
		server: {
			port: 1420,
			strictPort: true,
		},
		build: {
			target: "es2020",
			minify: process.env.TAURI_DEBUG ? false : "esbuild",
			sourcemap: !!process.env.TAURI_DEBUG,
			rollupOptions: {
				input:
					process.env.TAURI_ENV_PLATFORM || mode === "development"
						? {
								surrealist: "/index.html",
							}
						: {
								surrealist: "/index.html",
								"mini-run": "/mini/run/index.html",
								"mini-new": "/mini/new/index.html",
								"cloud-manage": "/cloud/manage/index.html",
								"cloud-callback": "/cloud/callback/index.html",
							},
				output: {
					experimentalMinChunkSize: 5000,
					manualChunks: {
						react: ["react", "react-dom"],
						posthog: ["posthog-js"],
						codemirror: [
							"codemirror",
							"@surrealdb/codemirror",
							"@surrealdb/lezer",
							"@replit/codemirror-indentation-markers",
						],
						mantime: ["@mantine/core", "@mantine/hooks", "@mantine/notifications"],
						surreal: ["surrealdb", "@surrealdb/wasm", "@surrealdb/ql-wasm"],
					},
				},
			},
		},
		esbuild: {
			supported: {
				"top-level-await": true, //browsers can handle top-level-await features
			},
		},
		resolve: {
			alias: {
				"~": fileURLToPath(new URL("src", import.meta.url)),
			},
		},
		css: {
			modules: {
				localsConvention: "dashesOnly",
			},
			preprocessorOptions: {
				scss: {
					additionalData: '@use "~/assets/styles/mixins" as *;',
					api: "modern-compiler",
				},
			},
		},
		define: {
			"import.meta.env.DATE": JSON.stringify(new Date()),
			"import.meta.env.VERSION": JSON.stringify(version),
			"import.meta.env.SDB_VERSION": JSON.stringify(surreal),
			"import.meta.env.MODE": JSON.stringify(mode),
			"import.meta.env.POSTHOG_URL": JSON.stringify("https://eu.i.posthog.com"),
			"import.meta.env.POSTHOG_KEY": JSON.stringify(
				"phc_BWVuHaJuhnFi3HthLhb9l8opktRrNeFHVnisZdQ5404",
			),
		},
		optimizeDeps: {
			exclude: ["@surrealdb/wasm", "@surrealdb/ql-wasm"],
			esbuildOptions: {
				target: "esnext",
			},
		},
		assetsInclude: ["**/@surrealdb/wasm/dist/*.wasm", "**/@surrealdb/ql-wasm/dist/*.wasm"],
	};
});
