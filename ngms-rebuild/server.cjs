const next = require("next");
const http = require("node:http");

const port = Number(process.env.PORT || 3000);
const host = process.env.BIND_ADDRESS || "0.0.0.0";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid TCP port supplied by the HostAfrica Node.js application.");
}

const app = next({ dev: false, hostname: host, port });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = http.createServer((request, response) => handle(request, response));
    server.listen(port, host, () => {
      console.log(`NGMS HostAfrica application listening on ${host}:${port}`);
    });
    server.on("error", (error) => {
      console.error("NGMS application server error:", error);
      process.exitCode = 1;
    });
  })
  .catch((error) => {
    console.error("NGMS application failed to prepare:", error);
    process.exit(1);
  });
