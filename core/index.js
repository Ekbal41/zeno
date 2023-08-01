const http = require("http");
const Router = require("trouter");
const { parse } = require("querystring");
const parser = require("../packages/parser.js");
const { wslash, bvalue, mutate, onError } = require("./utils.js");

class Zeno extends Router {
  constructor(opts = {}) {
    super(opts);
    this.apps = {};
    this.midware = [];
    this.bmidware = {};
    this.parse = parser;
    this.server = opts.server;
    this.handler = this.handler.bind(this);
    this.onError = opts.onError || onError;
    this.onNoMatch = opts.onNoMatch || this.onError.bind(null, { code: 404 });
  }
  add(method, pattern, ...fns) {
    let base = wslash(bvalue(pattern));
    if (this.apps[base] !== void 0) {
      const error = new Error(
        `Cannot mount ".${method.toLowerCase()}('${wslash(
          pattern
        )}')" because a Zeno application at ".use('${base}')" already exists! You should move this handler into your Zeno application instead.`
      );
      error.code = 409; // Conflict
      error.status = 409;
      error.name = "ZenoMountError";
      throw error;
    }
    return super.add(method, pattern, ...fns);
  }

  use(base, ...fns) {
    if (typeof base === "function") {
      this.midware.push(base, ...fns);
    } else if (base === "/") {
      this.midware.push(...fns);
    } else {
      base = wslash(base);
      fns.forEach((fn) => {
        if (fn instanceof Zeno) {
          this.apps[base] = fn;
        } else {
          let arr = this.bwares[base] || [];
          arr.length > 0 || arr.push((r, _, nxt) => (mutate(base, r), nxt()));
          this.bwares[base] = arr.concat(fn);
        }
      });
    }
    return this;
  }

  listen() {
    (this.server = this.server || http.createServer()).on(
      "request",
      this.handler
    );
    this.server.listen.apply(this.server, arguments);
    return this;
  }
  handler(req, res, info) {
    info = info || this.parse(req);
    let fns = [],
      arr = this.midware,
      obj = this.find(req.method, info.pathname);
    req.originalUrl = req.originalUrl || req.url;
    let base = bvalue((req.path = info.pathname));
    if (this.bmidware[base] !== void 0) {
      arr.push(...this.bmidware[base]);
    }
    if (obj) {
      fns.push(...obj.handlers);
      req.params = obj.params;
    } else if (this.apps[base] !== void 0) {
      mutate(base, req);
      info.pathname = req.path; //=> updates

      fns.push(this.apps[base].handler.bind(null, req, res, info));
    }
    fns.push(this.onNoMatch);
    // Grab addl values from `info`
    req.search = info.search;
    req.query = parse(info.query);
    // Exit if only a single function
    let i = 0,
      len = arr.length,
      num = fns.length;
    if (len === i && num === 1) return fns[0](req, res);
    // Otherwise loop thru all middlware
    let next = (err) => (err ? this.onError(err, req, res, next) : loop());
    let loop = (_) => res.finished || (i < len && arr[i++](req, res, next));
    arr = arr.concat(fns);
    len += num;
    loop(); // init
  }
}

module.exports = (opts) => new Zeno(opts);
