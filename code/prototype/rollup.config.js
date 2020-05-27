import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';

export default {
    input: "public/client.ts",
    output: {
      file: "public/bundle.js",
      format: "iife",
    },
    plugins: [
      resolve({ browser: true }),
      typescript()
    ]
}