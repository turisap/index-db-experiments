import sourcemaps from "rollup-plugin-sourcemaps";
import { terser } from "rollup-plugin-terser";
import typescript from "rollup-plugin-typescript2";

// @TODO how does all of this work?

export function createRollupConfig(options, callback) {
    const name = options.name;
    const outputName = "dist/" + [name, options.format, "js"].join(".");

    const config = {
        input: options.input,
        output: {
            file: outputName,
            format: options.format,
            name: "indexDbController",
            sourcemap: true,
            globals: { react: "React" },
            exports: "named",
        },
        plugins: [
            typescript({
                tsconfig: options.tsconfig,
                clean: true,
            }),
            sourcemaps(),
            options.format !== "esm" &&
                terser({
                    output: { comments: false },
                    compress: {
                        drop_console: true,
                    },
                }),
        ].filter(Boolean),
    };

    return callback ? callback(config) : config;
}
