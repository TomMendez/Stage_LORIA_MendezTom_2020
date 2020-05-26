import resolve from '@rollup/plugin-node-resolve';

export default {
    input: "public/client.js",
    output: {
      file: "public/bundle.js",
      format: "es",
    },
    plugins: [
      resolve({ browser: true })
    ]
}