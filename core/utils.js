const http = require("http");

function wslash(x) {
  return x.charCodeAt(0) === 47 ? x : "/" + x;
}

function bvalue(x) {
  let y = x.indexOf("/", 1);
  return y > 1 ? x.substring(0, y) : x;
}

function mutate(str, req) {
  req.url = req.url.substring(str.length) || "/";
  req.path = req.path.substring(str.length) || "/";
}
function onError(err, req, res, next) {
  let code = (res.statusCode = err.code || err.status || 500);
  if (typeof err === "string" || Buffer.isBuffer(err)) {
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end(err);
  } else res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(err.message || http.STATUS_CODES[code] || "Internal Server Error");
  if (err.stack) {
    console.error("Stack Trace:", err.stack);
  }
}

module.exports = {
  wslash,
  bvalue,
  mutate,
  onError,
};
