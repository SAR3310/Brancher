#!/usr/bin/env node

const { spawn, spawnSync } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function checkServerReady() {
  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/api/branches",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      res.on("data", () => {});
      res.on("end", () => {
        //console.log("  Server responded with status:", res.statusCode);
        resolve(true);
      });
    });

    req.on("error", (err) => {
      // console.log("  Connection error:", err.code);
      resolve(false);
    });

    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function main() {
  const projectDir = __dirname;

  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║         Brancher E2E & Load Test Runner                ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Note: Manual cleanup may be needed on Windows
  // Kill any existing node processes
  console.log("Cleaning up any existing processes...");

  await sleep(1000);

  // Start server
  console.log("Starting Brancher server...");
  const serverProc = spawn("node", ["server/index.js"], {
    cwd: projectDir,
    stdio: "pipe",
  });

  // Capture server output
  let serverOutput = "";
  serverProc.stdout.on("data", (data) => {
    serverOutput += data.toString();
  });
  serverProc.stderr.on("data", (data) => {
    serverOutput += data.toString();
  });

  // Wait for server to be ready
  console.log("Waiting for server to start...");
  let ready = false;
  for (let i = 0; i < 30; i++) {
    const isReady = await checkServerReady();
    if (isReady) {
      ready = true;
      console.log("✓ Server is ready!\n");
      break;
    }
    process.stdout.write(".");
    await sleep(1000);
  }

  if (!ready) {
    console.log("\n✗ Server failed to start");
    console.log("Server output:", serverOutput.substring(0, 500));
    serverProc.kill();
    process.exit(1);
  }

  // Run tests
  await sleep(1000);
  console.log("Starting tests...\n");

  const testProc = spawn("node", ["e2e-load-test.js"], {
    cwd: projectDir,
    stdio: "inherit",
  });

  testProc.on("close", (code) => {
    console.log("\nTests completed");
    serverProc.kill();
    process.exit(code);
  });

  testProc.on("error", (err) => {
    console.error("Test error:", err);
    serverProc.kill();
    process.exit(1);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
