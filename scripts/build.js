import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT_DIR, "src");
const PAGES_DIR = path.join(SRC_DIR, "pages");
const COMPONENTS_DIR = path.join(SRC_DIR, "components");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const DIST_DIR = path.join(ROOT_DIR, "dist");

const MAX_INCLUDE_DEPTH = 32;

const INCLUDE_TAG_PATTERN = /^include$/i;

const outputFiles = new Set();

/**
 * 指定したパスが基準ディレクトリの内部にあるか確認する。
 */
function isInside(parent, target) {
    const relative = path.relative(parent, target);

    return (
        relative === "" ||
        (
            relative !== ".." &&
            !relative.startsWith(`..${path.sep}`) &&
            !path.isAbsolute(relative)
        )
    );
}

/**
 * ファイル・ディレクトリの存在を確認する。
 */
async function exists(target) {
    try {
        await fs.access(target);
        return true;
    } catch {
        return false;
    }
}

/**
 * ディレクトリを安全に取得する。
 */
async function getRealDirectory(target) {
    if (!(await exists(target))) {
        return null;
    }

    const stat = await fs.stat(target);

    if (!stat.isDirectory()) {
        throw new Error(`Not a directory: ${target}`);
    }

    return fs.realpath(target);
}

/**
 * dist/ を初期化する。
 */
async function cleanDist() {
    const root = await fs.realpath(ROOT_DIR);
    const dist = path.resolve(DIST_DIR);

    if (!isInside(root, dist) || dist === root) {
        throw new Error("Unsafe dist directory.");
    }

    if (await exists(dist)) {
        const stat = await fs.lstat(dist);

        if (stat.isSymbolicLink()) {
            throw new Error("dist/ must not be a symbolic link.");
        }
    }

    await fs.rm(dist, {
        recursive: true,
        force: true
    });

    await fs.mkdir(dist, {
        recursive: true
    });
}

/**
 * 出力先の重複を検出する。
 */
function registerOutput(target) {
    const relative = path.relative(DIST_DIR, target);

    if (outputFiles.has(relative)) {
        throw new Error(`Duplicate output file: ${relative}`);
    }

    outputFiles.add(relative);
}

/**
 * HTML属性を解析する。
 *
 * 現在は src 属性のみを許可する。
 */
function parseIncludeAttributes(attributes) {
    const match = attributes.match(
        /^\s*src\s*=\s*(["'])(.*?)\1\s*$/is
    );

    if (!match) {
        throw new Error(
            'Invalid include tag. Expected: <include src="..."></include>'
        );
    }

    const src = match[2].trim();

    if (!src) {
        throw new Error("Include src must not be empty.");
    }

    if (
        src.includes("\\") ||
        src.includes("\0") ||
        path.posix.isAbsolute(src) ||
        /^[a-z][a-z\d+.-]*:/i.test(src)
    ) {
        throw new Error(`Invalid include path: ${src}`);
    }

    return src;
}

/**
 * Include先のファイルを解決する。
 *
 * Include先は src/components/ 以下に限定する。
 */
async function resolveComponent(src, currentFile) {
    const target = path.resolve(
        path.dirname(currentFile),
        src
    );

    const componentsReal = await fs.realpath(COMPONENTS_DIR);

    let realTarget;

    try {
        realTarget = await fs.realpath(target);
    } catch {
        throw new Error(`Include file not found: ${src}`);
    }

    if (!isInside(componentsReal, realTarget)) {
        throw new Error(`Include path escapes components: ${src}`);
    }

    const stat = await fs.stat(realTarget);

    if (!stat.isFile()) {
        throw new Error(`Include target is not a file: ${src}`);
    }

    if (path.extname(realTarget).toLowerCase() !== ".html") {
        throw new Error(`Include target must be an HTML file: ${src}`);
    }

    return realTarget;
}

/**
 * HTML内のIncludeタグを再帰的に展開する。
 *
 * HTMLコメントおよびscript/style要素の内部は解析対象外。
 */
async function expandIncludes(
    html,
    currentFile,
    includeStack = [],
    depth = 0
) {
    if (depth > MAX_INCLUDE_DEPTH) {
        throw new Error(
            `Maximum include depth exceeded: ${currentFile}`
        );
    }

    const currentRealPath = await fs.realpath(currentFile);

    if (includeStack.includes(currentRealPath)) {
        const chain = [
            ...includeStack,
            currentRealPath
        ].map(file => path.relative(ROOT_DIR, file));

        throw new Error(
            `Circular include detected:\n${chain.join("\n -> ")}`
        );
    }

    const nextStack = [
        ...includeStack,
        currentRealPath
    ];

    let result = "";
    let position = 0;

    while (position < html.length) {
        const tagStart = html.indexOf("<", position);

        if (tagStart === -1) {
            result += html.slice(position);
            break;
        }

        result += html.slice(position, tagStart);

        // HTMLコメントをスキップ
        if (html.startsWith("<!--", tagStart)) {
            const commentEnd = html.indexOf("-->", tagStart + 4);

            if (commentEnd === -1) {
                result += html.slice(tagStart);
                break;
            }

            result += html.slice(tagStart, commentEnd + 3);
            position = commentEnd + 3;
            continue;
        }

        // script/style要素の内部をスキップ
        const rawTextMatch = html
            .slice(tagStart)
            .match(/^<(script|style)\b[^>]*>/i);

        if (rawTextMatch) {
            const openingTag = rawTextMatch[0];
            const tagName = rawTextMatch[1];

            const contentStart = tagStart + openingTag.length;

            const closingPattern = new RegExp(
                `</${tagName}\\s*>`,
                "ig"
            );

            closingPattern.lastIndex = contentStart;

            const closingMatch = closingPattern.exec(html);

            if (!closingMatch) {
                result += html.slice(tagStart);
                break;
            }

            const end = closingPattern.lastIndex;

            result += html.slice(tagStart, end);
            position = end;
            continue;
        }

        // Includeタグを検出
        const openingMatch = html
            .slice(tagStart)
            .match(/^<include\b([^>]*)>/i);

        if (!openingMatch) {
            result += "<";
            position = tagStart + 1;
            continue;
        }

        const openingTag = openingMatch[0];
        const attributes = openingMatch[1];

        const openingEnd = tagStart + openingTag.length;

        const closingMatch = html
            .slice(openingEnd)
            .match(/^\s*<\/include\s*>/i);

        if (!closingMatch) {
            throw new Error(
                `Missing </include> in ${path.relative(ROOT_DIR, currentFile)}`
            );
        }

        const src = parseIncludeAttributes(attributes);

        if (closingMatch[0].trim() !== "</include>") {
            // 大文字・小文字の違いは許容するため、ここでは判定しない
        }

        const includeContentEnd =
            openingEnd + closingMatch.index;

        if (html.slice(openingEnd, includeContentEnd).trim()) {
            throw new Error(
                `Include elements must be empty: ${src}`
            );
        }

        const closingEnd =
            openingEnd + closingMatch[0].length;

        const componentFile = await resolveComponent(
            src,
            currentFile
        );

        let componentHtml;

        try {
            componentHtml = await fs.readFile(
                componentFile,
                "utf8"
            );
        } catch {
            throw new Error(
                `Unable to read component: ${src}`
            );
        }

        const expanded = await expandIncludes(
            componentHtml,
            componentFile,
            nextStack,
            depth + 1
        );

        result += expanded;
        position = closingEnd;
    }

    return result;
}

/**
 * ディレクトリ内のファイルを再帰的に処理する。
 */
async function processDirectory(sourceDir, outputDir, options = {}) {
    const {
        expandHtml = false
    } = options;

    const entries = await fs.readdir(sourceDir, {
        withFileTypes: true
    });

    for (const entry of entries) {
        const source = path.join(sourceDir, entry.name);
        const destination = path.join(outputDir, entry.name);

        if (entry.isSymbolicLink()) {
            throw new Error(
                `Symbolic links are not supported: ${source}`
            );
        }

        if (entry.isDirectory()) {
            await fs.mkdir(destination, {
                recursive: true
            });

            await processDirectory(
                source,
                destination,
                options
            );

            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        await fs.mkdir(path.dirname(destination), {
            recursive: true
        });

        registerOutput(destination);

        if (
            expandHtml &&
            path.extname(entry.name).toLowerCase() === ".html"
        ) {
            const html = await fs.readFile(source, "utf8");

            const expanded = await expandIncludes(
                html,
                source
            );

            if (/<include\b/i.test(expanded)) {
                throw new Error(
                    `Unresolved include tag: ${source}`
                );
            }

            await fs.writeFile(destination, expanded, "utf8");

            console.log(
                `HTML  ${path.relative(ROOT_DIR, destination)}`
            );

            continue;
        }

        await fs.copyFile(source, destination);

        console.log(
            `COPY  ${path.relative(ROOT_DIR, destination)}`
        );
    }
}

/**
 * ビルドを実行する。
 */
async function build() {
    console.log("\nBuilding website...\n");

    await cleanDist();

    outputFiles.clear();

    if (!(await exists(PAGES_DIR))) {
        throw new Error("src/pages/ does not exist.");
    }

    // HTMLページとその他のページファイルを出力
    await processDirectory(
        PAGES_DIR,
        DIST_DIR,
        {
            expandHtml: true
        }
    );

    // public/ の静的ファイルを出力
    if (await exists(PUBLIC_DIR)) {
        await processDirectory(
            PUBLIC_DIR,
            DIST_DIR
        );
    }

    console.log("\nBuild completed successfully.");
    console.log(`Output: ${path.relative(ROOT_DIR, DIST_DIR)}/`);
}

/**
 * CLIエントリーポイント
 */
async function main() {
    const args = process.argv.slice(2);

    try {
        if (args.includes("--clean")) {
            await cleanDist();
            console.log("dist/ cleaned.");
            return;
        }

        await build();
    } catch (error) {
        console.error("\nBuild failed.");
        console.error(error.message);

        process.exitCode = 1;
    }
}

await main();

