const app = require("../core");
const users = require("./users.js");

const { PORT = 3000 } = process.env;

function reply(req, res) {
  res.end(`Main: Hello from ${req.method} ${req.url}`);
}

// Main app
app()
  .get("/", reply)
  .get("/about", reply)
  .use("users", users)
  .listen(PORT, () => {
    console.log(`> Running on localhost:${PORT}`);
  });
