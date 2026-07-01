const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const HtmlPartialsPlugin = require("./webpack-partials");
const CopyPlugin = require("copy-webpack-plugin");

// PUBLIC_PATH should be "/" for local dev (default) or "/metajurassic/" for GitHub Pages.
const publicPath = process.env.PUBLIC_PATH || "/";

const config = {
    entry: {
        index: "./src/index.ts",
        practice: "./src/practice.ts",
        faq: "./src/faq.ts",
        profile: "./src/profile.ts",
    },
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "[name].js",
        assetModuleFilename: "assets/[name][ext]",
        clean: true,
        publicPath: publicPath,
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: "src/index.html",
            chunks: ["index"],
            basePath: publicPath,
        }),
        new HtmlWebpackPlugin({
            template: "src/index.html",
            filename: "practice/index.html",
            chunks: ["practice"],
            basePath: publicPath,
        }),
        new HtmlWebpackPlugin({
            template: "src/faq.html",
            filename: "faq/index.html",
            chunks: ["faq"],
            basePath: publicPath,
        }),
        new HtmlWebpackPlugin({
            template: "src/profile.html",
            filename: "profile/index.html",
            chunks: ["profile"],
            basePath: publicPath,
        }),
        new CopyPlugin({
            patterns: [{ from: "src/data", to: "data" }],
        }),
        new CopyPlugin({
            patterns: [{ from: "src/favicon.svg", to: "favicon.svg" }],
        }),
        new CopyPlugin({
            patterns: [
                { from: "src/assets/profile.svg", to: "assets/profile.svg" },
            ],
        }),
        new HtmlPartialsPlugin({
            basePath: publicPath,
        }),
    ],
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".wasm"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: "ts-loader",
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: ["style-loader", "css-loader", "postcss-loader"],
            },
            {
                test: /\.(md|json)$/i,
                type: "asset/resource",
                generator: {
                    filename: "content/[name][ext]",
                },
            },
            {
                test: /\.svg$/i,
                type: "asset/resource",
                generator: {
                    filename: "assets/[name][contenthash][ext]",
                },
            },
        ],
    },
    mode: "development",
    devServer: {
        static: path.join(__dirname, "dist"),
        port: 8080,
        historyApiFallback: {
            rewrites: [
                { from: /^\/practice/, to: "/practice/index.html" },
                { from: /^\/faq/, to: "/faq/index.html" },
                { from: /^\/profile/, to: "/profile/index.html" },
            ],
        },
    },
    watchOptions: {
        ignored: ["**/node_modules/**", "**/dist/**"],
    },
    experiments: {
        asyncWebAssembly: true,
    },
};

module.exports = config;
