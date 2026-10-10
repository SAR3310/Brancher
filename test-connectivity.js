const http = require("http");

function makeRequest(method, endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: endpoint,
      method: method,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({ status: res.statusCode, body: data.substring(0, 100) });
      });
    });

    req.on("error", (error) => {
      console.log("Request error details:", {
        code: error.code,
        message: error.message,
        errno: error.errno,
      });
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
    req.end();
  });
}

async function test() {
  try {
    console.log("Testing connectivity to http://127.0.0.1:3000...");
    const res = await makeRequest("GET", "/api/branches");
    console.log("✓ Connection successful!");
    console.log("Status:", res.status);
    console.log("Body:", res.body);
  } catch (error) {
    console.error("✗ Connection failed:", error.message);
    console.error("Full error:", error);
    process.exit(1);
  }
}

test();
