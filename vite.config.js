import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  define: {
    __DEV__: true,
    __PROFILE__: true,
    __UMD__: true,
    __EXPERIMENTAL__: true,
  },
  resolve: {
    alias: {
      react: path.posix.resolve("packages/react"),
      "react-dom": path.posix.resolve("packages/react-dom"),
      "react-dom-bindings": path.posix.resolve("packages/react-dom-bindings"),
      "react-reconciler": path.posix.resolve("packages/react-reconciler"),
      scheduler: path.posix.resolve("packages/scheduler"),
      shared: path.posix.resolve("packages/shared"),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    force: true,
  },
});
