import { terser } from "rollup-plugin-terser"
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import json from "rollup-plugin-json"
import builtins from "rollup-plugin-node-builtins"

export default {
    output: {
        format: "umd",
        file: "cdn/tarant-sync-client-" + require("./package.json").version + ".min.js",
        name: "tarantRemoteSync"
    },
    input: "lib/index.ts",
    plugins: [
        typescript({
            tsconfig: false,
            target: "es5",
            declaration: true,
            strict: true
        }),
        nodeResolve({ jsnext: true, preferBuiltins: true, browser: true }), 
        commonjs(), 
        builtins(),
        terser(),
        json()
    ]
}