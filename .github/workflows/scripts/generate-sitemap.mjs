import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "../../../");

const SITE_URL = "https://t-b-t.nchos.net";

const OUTPUT_FILE = path.join(root, "/public/sitemap.xml");

const EXCLUDED_DIRECTORIES = new Set([
    ".git",
    ".github",
    "assets",
    "data",
    "errors",
    "functions",
    "old",
    "scripts",
]);

const EXCLUDED_FILES = new Set([
    "404.html",
]);

const EXCLUDED_EXTENSIONS = new Set([
    ".draft.html",
]);

function collectHtmlFiles(directory) {
    const files = [];

    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            if (EXCLUDED_DIRECTORIES.has(entry.name)) {
                continue;
            }

            files.push(...collectHtmlFiles(fullPath));
            continue;
        }

        if (!entry.isFile()) {
            continue;
        }

        if (!entry.name.endsWith(".html")) {
            continue;
        }

        if (EXCLUDED_FILES.has(entry.name)) {
            continue;
        }

        if ([...EXCLUDED_EXTENSIONS].some(extension => entry.name.endsWith(extension))) {
            continue;
        }

        files.push(fullPath);
    }

    return files;
}

function encodePath(relativePath) {
    return relativePath
        .split("/")
        .map(segment => encodeURIComponent(segment))
        .join("/");
}

function htmlPathToUrl(filePath) {
    let relativePath = path.relative(root, filePath).replaceAll(path.sep, "/");

    if (relativePath === "index.html") {
        return `${SITE_URL}/`;
    }

    if (relativePath.endsWith("/index.html")) {
        relativePath = relativePath.slice(0, -"index.html".length);
    } else {
        relativePath = relativePath.replace(/\.html$/, "");
    }

    return `${SITE_URL}/${encodePath(relativePath)}`;
}

function escapeXml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&apos;");
}

const htmlFiles = collectHtmlFiles(root);

const urls = htmlFiles
    .map(htmlPathToUrl)
    .sort((a, b) => a.localeCompare(b));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
    .map(url => `    <url>\n        <loc>${escapeXml(url)}</loc>\n    </url>`)
    .join("\n")}
</urlset>
`;

fs.writeFileSync(OUTPUT_FILE, sitemap, "utf8");

console.log(`Generated ${OUTPUT_FILE}`);
console.log(`Found ${urls.length} HTML page(s).`);

for (const url of urls) {
    console.log(`  ${url}`);
}
