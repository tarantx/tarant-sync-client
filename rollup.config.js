import { uglify } from "rollup-plugin-uglify"
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import typescript from 'rollup-plugin-typescript'
import replace from 'rollup-plugin-replace'

export default {
    output: {
        format: "umd",
        file: "cdn/tarant-remote-sync-" + require("./package.json").version + ".min.js",
        name: "tarantRemoteSync"
    },
    input: "lib/index.ts",
    plugins: [
        typescript({
            tsconfig: false,
            target: "es5",
            declaration: true,
            strict: true,
            lib: ["es6"],

        }),
        nodeResolve(), 
        commonjs(), 
        uglify(),
        replace({'process.env.NODE_ENV': JSON.stringify('development')})
    ]
}