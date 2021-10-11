import babel from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import typescript from "@rollup/plugin-typescript";
import livereload from "rollup-plugin-livereload";
import serve from "rollup-plugin-serve";

export default {
    input: "src/index.tsx",
    output: {
        file: "public/bundle.js",
        format: "iife",
        sourcemap: true,
    },
    plugins: [
        typescript(),
        nodeResolve({
            browser: true,
        }),
        replace({
            "process.env.NODE_ENV": JSON.stringify("development"),
        }),
        babel({
            presets: ["@babel/preset-react"],
            babelHelpers: "bundled",
        }),
        commonjs(),
        serve({
            open: true,
            verbose: true,
            contentBase: ["", "public"],
            host: "localhost",
            port: 3000,
        }),
        livereload({ watch: "public" }),
    ],
};
