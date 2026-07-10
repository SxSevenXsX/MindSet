import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || "127.0.0.1";

const types = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".svg", "image/svg+xml"],
]);

function safePath(urlPath) {
  let decoded = "";
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0]);
  } catch (error) {
    return null;
  }
  const candidate = normalize(join(root, decoded === "/" ? "index.html" : decoded));
  const fromRoot = relative(root, candidate);
  const escapesRoot = fromRoot === ".." || fromRoot.startsWith(`..${sep}`) || isAbsolute(fromRoot);
  return escapesRoot ? null : candidate;
}

createServer((request, response) => {
  const path = safePath(request.url || "/");
  let isFile = false;
  try {
    isFile = !!path && existsSync(path) && statSync(path).isFile();
  } catch (error) {
    isFile = false;
  }
  if (!isFile) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": types.get(extname(path)) || "application/octet-stream" });
  createReadStream(path).pipe(response);
}).listen(port, host, () => {
  console.log(`MindSet local server: http://${host}:${port}`);
});
