// ============================================================
// E2E & Load Testing for Brancher
// Tests: Auth, Branches, Messaging, Friends, Socket.IO, Error Handling
// ============================================================

const http = require("http");
const ioClient = require("socket.io-client");

const BASE_URL = "http://localhost:3000";
const TIMEOUT = 10000;

// Test state
let testResults = {
  e2eTests: [],
  loadTests: [],
  socketTests: [],
  errorTests: [],
  performanceMetrics: {
    startTime: null,
    endTime: null,
    totalDuration: 0,
    avgResponseTime: 0,
    responseTimes: [],
    memoryUsage: [],
  },
  summary: {
    passed: 0,
    failed: 0,
    totalTests: 0,
  },
};

let sessionCookies = {};

// ============================================================
// HTTP Helper Functions
// ============================================================

function makeRequest(method, endpoint, body = null, userId = null) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const url = new URL(BASE_URL + endpoint);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 5000,
    };

    // Add session cookie if available
    if (userId && sessionCookies[userId]) {
      options.headers["Cookie"] = sessionCookies[userId];
    }

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        const duration = Date.now() - startTime;
        testResults.performanceMetrics.responseTimes.push(duration);

        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            duration,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: { raw: data },
            duration,
          });
        }
      });
    });

    req.on("error", (error) => {
      console.error(`[Request Error] ${method} ${endpoint}:`, error.code, error.message);
      reject(error);
    });

    req.on("timeout", () => {
      console.error(`[Timeout] ${method} ${endpoint}`);
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

function recordTest(testName, passed, details = {}) {
  testResults.summary.totalTests++;
  if (passed) {
    testResults.summary.passed++;
  } else {
    testResults.summary.failed++;
  }
  testResults.e2eTests.push({ testName, passed, ...details });
  console.log(`[${passed ? "✓" : "✗"}] ${testName}`);
}

// ============================================================
// Socket.IO Helper Functions
// ============================================================

function createSocketClient(cookie = null) {
  return new Promise((resolve, reject) => {
    const options = {
      reconnection: false,
      extraHeaders: cookie ? { cookie } : {},
    };

    const socket = ioClient("http://localhost:3000", options);

    socket.on("connect", () => {
      resolve(socket);
    });

    socket.on("connect_error", (error) => {
      reject(error);
    });

    setTimeout(() => {
      reject(new Error("Socket.IO connection timeout"));
    }, 5000);
  });
}

// ============================================================
// TEST 1: E2E WORKFLOW TEST
// ============================================================

async function testE2EWorkflow() {
  console.log("\n========== E2E WORKFLOW TESTS ==========\n");

  // A. Authentication Flow
  console.log("--- A. Authentication Flow ---");

  // Register User 1 (Alice)
  let res = await makeRequest("POST", "/api/register", {
    username: "alice",
    email: "alice@test.com",
    password: "alice123",
  });
  const alicePass = res.status === 200;
  recordTest("Register Alice", alicePass, { status: res.status });
  const aliceId = alicePass ? res.body.id : null;

  // Login Alice
  res = await makeRequest("POST", "/api/login", {
    email: "alice@test.com",
    password: "alice123",
  });
  const aliceLoginPass = res.status === 200;
  recordTest("Login Alice", aliceLoginPass, { status: res.status });

  // Store Alice's session cookie
  if (aliceLoginPass && res.headers["set-cookie"]) {
    sessionCookies.alice = res.headers["set-cookie"][0];
  }

  // Verify session - GET /api/me
  res = await makeRequest("GET", "/api/me", null, "alice");
  const aliceSessionPass = res.status === 200 && res.body.id;
  recordTest("Verify Alice Session (GET /api/me)", aliceSessionPass, {
    status: res.status,
  });

  // B. Branch Management
  console.log("\n--- B. Branch Management ---");

  // Create branch
  res = await makeRequest(
    "POST",
    "/api/branches",
    {
      name: "Test Community",
      template: "default",
      description: "E2E Test Branch",
    },
    "alice"
  );
  const createBranchPass = res.status === 200 && res.body.id;
  recordTest("Create Branch (Test Community)", createBranchPass, {
    status: res.status,
  });
  const branchId = createBranchPass ? res.body.id : null;

  // List branches
  res = await makeRequest("GET", "/api/branches", null, "alice");
  const listBranchPass = res.status === 200 && Array.isArray(res.body);
  recordTest("List Branches", listBranchPass, { status: res.status });

  // Get branch details
  if (branchId) {
    res = await makeRequest("GET", `/api/branches/${branchId}`, null, "alice");
    const branchDetailsPass =
      res.status === 200 && res.body.id && res.body.channels;
    recordTest("Get Branch Details", branchDetailsPass, { status: res.status });
  }

  // C. Messaging via Socket.IO
  console.log("\n--- C. Messaging via Socket.IO ---");

  let channelId = null;
  let messageId = null;
  let aliceSocket = null;

  try {
    // Connect Socket.IO as Alice
    aliceSocket = await createSocketClient(sessionCookies.alice);
    recordTest("Socket.IO Connect as Alice", true);

    // Get default channel from branch
    if (branchId) {
      res = await makeRequest("GET", `/api/branches/${branchId}`, null, "alice");
      const defaultChannel = res.body.channels?.[0];
      if (defaultChannel) {
        channelId = defaultChannel.id;

        // Subscribe to channel first
        aliceSocket.emit("channel:join", channelId);
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Send message via Socket.IO
        const messagePromise = new Promise((resolve) => {
          aliceSocket.once("message:channel", (msg) => {
            resolve(msg);
          });
          aliceSocket.emit("message:channel", {
            channelId,
            content: "Hello from E2E test via Socket.IO!",
          });
          setTimeout(() => resolve(null), 3000);
        });

        const msg = await messagePromise;
        const sendMessagePass = msg !== null;
        recordTest("Send Message via Socket.IO", sendMessagePass, {
          received: msg ? "yes" : "no",
          timeout: msg === null ? "yes" : "no",
        });
        messageId = msg?.id;

        // Test reaction via Socket.IO
        if (messageId) {
          const reactionPromise = new Promise((resolve) => {
            aliceSocket.once("message:updated", (msg) => {
              resolve(msg);
            });
            aliceSocket.emit("message:react", {
              messageId,
              emoji: "👍",
            });
            setTimeout(() => resolve(null), 2000);
          });

          const updatedMsg = await reactionPromise;
          const reactionPass = updatedMsg !== null;
          recordTest("Add Emoji Reaction via Socket.IO", reactionPass);
        }
      }
    }

    // Fetch message history via REST
    if (channelId) {
      res = await makeRequest(
        "GET",
        `/api/messages/channel/${channelId}`,
        null,
        "alice"
      );
      const fetchMessagesPass =
        res.status === 200 && Array.isArray(res.body);
      recordTest("Fetch Message History", fetchMessagesPass, {
        status: res.status,
      });
    }
  } catch (error) {
    recordTest("Socket.IO Message Flow", false, { error: error.message });
  } finally {
    if (aliceSocket) aliceSocket.disconnect();
  }

  // D. Friends & DM
  console.log("\n--- D. Friends & DM ---");

  // Register User 2 (Bob)
  res = await makeRequest("POST", "/api/register", {
    username: "bob",
    email: "bob@test.com",
    password: "bob123",
  });
  const bobPass = res.status === 200;
  recordTest("Register Bob", bobPass, { status: res.status });
  const bobId = bobPass ? res.body.id : null;

  // Login Bob
  res = await makeRequest("POST", "/api/login", {
    email: "bob@test.com",
    password: "bob123",
  });
  const bobLoginPass = res.status === 200;
  recordTest("Login Bob", bobLoginPass, { status: res.status });

  if (bobLoginPass && res.headers["set-cookie"]) {
    sessionCookies.bob = res.headers["set-cookie"][0];
  }

  // Alice requests friendship with Bob
  if (aliceId && bobId) {
    res = await makeRequest(
      "POST",
      "/api/friends/request",
      {
        username: "bob",
      },
      "alice"
    );
    const friendRequestPass = res.status === 200;
    recordTest("Friend Request (Alice → Bob)", friendRequestPass, {
      status: res.status,
    });

    // Get friendships to find ID
    res = await makeRequest("GET", "/api/friends", null, "bob");
    const friendshipId = res.body?.[0]?.friendshipId;

    // Bob accepts friendship
    if (friendshipId) {
      res = await makeRequest(
        "POST",
        `/api/friends/${friendshipId}/accept`,
        {},
        "bob"
      );
      const acceptPass = res.status === 200;
      recordTest("Accept Friend Request", acceptPass, { status: res.status });
    }
  }

  // Send DM Alice → Bob via Socket.IO
  try {
    const aliceSocketDM = await createSocketClient(sessionCookies.alice);
    if (bobId) {
      const dmPromise = new Promise((resolve) => {
        aliceSocketDM.once("message:dm", (msg) => {
          resolve(msg);
        });
        aliceSocketDM.emit("message:dm", {
          toUserId: bobId,
          content: "Hi Bob, this is a DM from Alice!",
        });
        setTimeout(() => resolve(null), 3000);
      });

      const dm = await dmPromise;
      const sendDMPass = dm !== null;
      recordTest("Send DM via Socket.IO (Alice → Bob)", sendDMPass, {
        received: dm ? "yes" : "no",
      });
    }
    aliceSocketDM.disconnect();
  } catch (error) {
    recordTest("Send DM via Socket.IO", false, { error: error.message });
  }

  // E. Cleanup
  console.log("\n--- E. Cleanup ---");

  // Logout Alice
  res = await makeRequest("POST", "/api/logout", {}, "alice");
  const logoutPass = res.status === 200;
  recordTest("Logout Alice", logoutPass, { status: res.status });

  // Verify session cleared
  res = await makeRequest("GET", "/api/me", null, "alice");
  const sessionClearedPass = res.status === 401;
  recordTest("Verify Session Cleared", sessionClearedPass, {
    status: res.status,
  });
}

// ============================================================
// TEST 2: LOAD TEST
// ============================================================

async function testLoadTest() {
  console.log("\n========== LOAD TEST ==========\n");

  const NUM_USERS = 5;
  const MESSAGES_PER_USER = 3;
  let loadResults = {
    usersCreated: 0,
    usersLoggedIn: 0,
    branchesCreated: 0,
    messagesPosted: 0,
    errors: [],
  };

  for (let i = 1; i <= NUM_USERS; i++) {
    const username = `loadtest${i}`;
    const email = `loadtest${i}@test.com`;
    const password = `password${i}`;

    try {
      let res = await makeRequest("POST", "/api/register", {
        username,
        email,
        password,
      });
      if (res.status === 200) {
        loadResults.usersCreated++;
      } else {
        loadResults.errors.push(`Register user ${i}: ${res.status}`);
        continue;
      }

      // Login
      res = await makeRequest("POST", "/api/login", {
        email,
        password,
      });
      if (res.status === 200) {
        loadResults.usersLoggedIn++;
        sessionCookies[username] = res.headers["set-cookie"]?.[0];

        // Create branch
        res = await makeRequest(
          "POST",
          "/api/branches",
          {
            name: `Branch-${i}`,
            template: "default",
          },
          username
        );
        if (res.status === 200 && res.body.id) {
          loadResults.branchesCreated++;
          const branchId = res.body.id;

          // Get default channel
          res = await makeRequest("GET", `/api/branches/${branchId}`, null, username);
          const defaultChannelId = res.body?.channels?.[0]?.id;

          if (defaultChannelId) {
            // Connect socket and post messages
            try {
              const socket = await createSocketClient(sessionCookies[username]);

              // Subscribe to channel first
              socket.emit("channel:join", defaultChannelId);
              await new Promise((resolve) => setTimeout(resolve, 300));

              for (let j = 1; j <= MESSAGES_PER_USER; j++) {
                const msgPromise = new Promise((resolve) => {
                  socket.once("message:channel", () => resolve(true));
                  socket.emit("message:channel", {
                    channelId: defaultChannelId,
                    content: `Load test message ${j} from user ${i}`,
                  });
                  setTimeout(() => resolve(false), 3000);
                });

                const success = await msgPromise;
                if (success) loadResults.messagesPosted++;
              }

              socket.disconnect();
            } catch (error) {
              loadResults.errors.push(
                `Socket.IO for user ${i}: ${error.message}`
              );
            }
          }
        } else {
          loadResults.errors.push(`Create branch for user ${i}: ${res.status}`);
        }

        // Logout
        res = await makeRequest("POST", "/api/logout", {}, username);
      } else {
        loadResults.errors.push(`Login user ${i}: ${res.status}`);
      }
    } catch (error) {
      loadResults.errors.push(`User ${i}: ${error.message}`);
    }
  }

  testResults.loadTests = loadResults;
  console.log(`✓ Users created: ${loadResults.usersCreated}/${NUM_USERS}`);
  console.log(`✓ Users logged in: ${loadResults.usersLoggedIn}/${NUM_USERS}`);
  console.log(
    `✓ Branches created: ${loadResults.branchesCreated}/${NUM_USERS}`
  );
  console.log(
    `✓ Messages posted: ${loadResults.messagesPosted}/${NUM_USERS * MESSAGES_PER_USER}`
  );
  if (loadResults.errors.length > 0) {
    console.log(`✗ Errors: ${loadResults.errors.length}`);
    loadResults.errors.slice(0, 5).forEach((e) => console.log(`  - ${e}`));
    if (loadResults.errors.length > 5)
      console.log(`  ... and ${loadResults.errors.length - 5} more`);
  }
}

// ============================================================
// TEST 3: ERROR HANDLING
// ============================================================

async function testErrorHandling() {
  console.log("\n========== ERROR HANDLING TESTS ==========\n");

  // Invalid email format
  let res = await makeRequest("POST", "/api/register", {
    username: "testuser",
    email: "invalid-email",
    password: "password123",
  });
  recordTest("Reject Invalid Email", res.status === 400, {
    status: res.status,
  });

  // Missing required fields
  res = await makeRequest("POST", "/api/register", {
    username: "testuser",
  });
  recordTest("Reject Missing Fields", res.status === 400, {
    status: res.status,
  });

  // Unauthorized access (no session)
  res = await makeRequest("GET", "/api/me", null, null);
  recordTest(
    "Reject Unauthorized (GET /api/me without login)",
    res.status === 401,
    { status: res.status }
  );

  // Not found endpoint
  res = await makeRequest("GET", "/api/nonexistent", null);
  recordTest("Handle 404 Not Found", res.status === 404, {
    status: res.status,
  });

  // Duplicate email registration
  res = await makeRequest("POST", "/api/register", {
    username: "newuser",
    email: "alice@test.com",
    password: "password123",
  });
  recordTest(
    "Reject Duplicate Email",
    res.status === 400 && res.body.error,
    { status: res.status }
  );

  // Duplicate username
  res = await makeRequest("POST", "/api/register", {
    username: "alice",
    email: "newemail@test.com",
    password: "password123",
  });
  recordTest(
    "Reject Duplicate Username",
    res.status === 400 && res.body.error,
    { status: res.status }
  );

  // Invalid login
  res = await makeRequest("POST", "/api/login", {
    email: "alice@test.com",
    password: "wrongpassword",
  });
  recordTest("Reject Invalid Password", res.status === 401, {
    status: res.status,
  });
}

// ============================================================
// TEST 4: PERFORMANCE METRICS
// ============================================================

function calculatePerformanceMetrics() {
  console.log("\n========== PERFORMANCE METRICS ==========\n");

  const responseTimes = testResults.performanceMetrics.responseTimes;
  if (responseTimes.length === 0) {
    console.log("No response times recorded");
    return;
  }

  const avgResponseTime =
    responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);

  testResults.performanceMetrics.avgResponseTime = avgResponseTime;
  testResults.performanceMetrics.maxResponseTime = maxResponseTime;
  testResults.performanceMetrics.minResponseTime = minResponseTime;

  console.log(`✓ Total requests: ${responseTimes.length}`);
  console.log(`✓ Average response time: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`✓ Min response time: ${minResponseTime}ms`);
  console.log(`✓ Max response time: ${maxResponseTime}ms`);
  console.log(
    `✓ Requests under 500ms: ${responseTimes.filter((t) => t < 500).length}/${responseTimes.length}`
  );

  // Check memory usage
  const memUsage = process.memoryUsage();
  console.log(`✓ Memory usage:`);
  console.log(`  - RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  - Heap used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  console.log(
    `  - Heap total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`
  );

  testResults.performanceMetrics.memoryUsage = {
    rss: memUsage.rss,
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
  };
}

// ============================================================
// MAIN TEST RUNNER
// ============================================================

async function runAllTests() {
  testResults.performanceMetrics.startTime = Date.now();

  // Wait for server to be ready
  console.log("Waiting for server to be ready...");
  let serverReady = false;
  for (let i = 0; i < 15; i++) {
    try {
      const res = await makeRequest("GET", "/api/branches", null, null);
      if (res.status === 401) {
        // Expected - not logged in, but server is responding
        console.log("Server is ready!\n");
        serverReady = true;
        break;
      }
    } catch (e) {
      if (i === 14) {
        console.log(
          "Server failed to start. Check if it's running on port 3000."
        );
        console.log("Error:", e.message);
        process.exit(1);
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  try {
    await testE2EWorkflow();
    await testLoadTest();
    await testErrorHandling();
    calculatePerformanceMetrics();
  } catch (error) {
    console.error("Test error:", error);
  }

  testResults.performanceMetrics.endTime = Date.now();
  testResults.performanceMetrics.totalDuration =
    testResults.performanceMetrics.endTime -
    testResults.performanceMetrics.startTime;

  // Generate report
  generateTestReport();
}

// ============================================================
// GENERATE TEST REPORT
// ============================================================

function generateTestReport() {
  const fs = require("fs");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  let report = `
# Brancher E2E & Load Test Report

**Generated:** ${new Date().toISOString()}
**Branch:** chore/versioning-lint-ci
**Test Duration:** ${(testResults.performanceMetrics.totalDuration / 1000).toFixed(2)}s

## Summary

- **Total Tests:** ${testResults.summary.totalTests}
- **Passed:** ${testResults.summary.passed}
- **Failed:** ${testResults.summary.failed}
- **Success Rate:** ${((testResults.summary.passed / testResults.summary.totalTests) * 100).toFixed(1)}%

## E2E Workflow Tests

### A. Authentication
${testResults.e2eTests
  .filter(
    (t) =>
      t.testName.includes("Register") ||
      t.testName.includes("Login") ||
      t.testName.includes("Session")
  )
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName} (${t.status || ""})`)
  .join("\n")}

### B. Branch Management
${testResults.e2eTests
  .filter((t) => t.testName.includes("Branch"))
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName} (${t.status || ""})`)
  .join("\n")}

### C. Messaging (Socket.IO)
${testResults.e2eTests
  .filter(
    (t) =>
      t.testName.includes("Message") ||
      t.testName.includes("Reaction") ||
      t.testName.includes("Connect")
  )
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName}`)
  .join("\n")}

### D. Friends & DM
${testResults.e2eTests
  .filter((t) => t.testName.includes("Friend") || t.testName.includes("DM"))
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName} (${t.status || ""})`)
  .join("\n")}

### E. Cleanup
${testResults.e2eTests
  .filter((t) => t.testName.includes("Logout") || t.testName.includes("Cleared"))
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName} (${t.status || ""})`)
  .join("\n")}

## Load Test Results

- **Users Created:** ${testResults.loadTests.usersCreated}/5
- **Users Logged In:** ${testResults.loadTests.usersLoggedIn}/5
- **Branches Created:** ${testResults.loadTests.branchesCreated}/5
- **Messages Posted:** ${testResults.loadTests.messagesPosted}/15 (3 per user)

${
  testResults.loadTests.errors && testResults.loadTests.errors.length > 0
    ? `### Load Test Errors (${testResults.loadTests.errors.length})
${testResults.loadTests.errors
  .slice(0, 10)
  .map((e) => `- ${e}`)
  .join("\n")}
${testResults.loadTests.errors.length > 10 ? `- ... and ${testResults.loadTests.errors.length - 10} more` : ""}`
    : ""
}

## Error Handling Tests

${testResults.e2eTests
  .filter(
    (t) =>
      t.testName.includes("Reject") ||
      t.testName.includes("Handle") ||
      t.testName.includes("Unauthorized")
  )
  .map((t) => `- [${t.passed ? "✓" : "✗"}] ${t.testName} (${t.status || ""})`)
  .join("\n")}

## Performance Metrics

### Response Times
- **Average:** ${testResults.performanceMetrics.avgResponseTime.toFixed(2)}ms
- **Min:** ${testResults.performanceMetrics.minResponseTime}ms
- **Max:** ${testResults.performanceMetrics.maxResponseTime}ms
- **Requests < 500ms:** ${testResults.performanceMetrics.responseTimes.filter((t) => t < 500).length}/${testResults.performanceMetrics.responseTimes.length}

### Memory Usage
- **RSS:** ${(testResults.performanceMetrics.memoryUsage.rss / 1024 / 1024).toFixed(2)}MB
- **Heap Used:** ${(testResults.performanceMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
- **Heap Total:** ${(testResults.performanceMetrics.memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB

## Recommendations

${testResults.summary.failed > 0 ? `1. **Fix Failed Tests:** ${testResults.summary.failed} tests failed
   - Review the failed endpoints and fix any issues
   - Check server logs for error details\n` : ""}

${
  testResults.performanceMetrics.avgResponseTime > 500
    ? `2. **Improve Response Times:** Average is ${testResults.performanceMetrics.avgResponseTime.toFixed(2)}ms (target < 500ms)
   - Add database indexes for frequently queried fields
   - Optimize heavy queries
   - Consider caching\n`
    : ""
}

${
  testResults.loadTests.errors && testResults.loadTests.errors.length > 3
    ? `3. **Investigate Load Test Errors:** ${testResults.loadTests.errors.length} errors detected
   - May indicate concurrency or race condition issues
   - Monitor database connection pooling\n`
    : ""
}

${
  testResults.performanceMetrics.memoryUsage.heapUsed / 1024 / 1024 > 200
    ? `4. **Monitor Memory Usage:** Currently ${(testResults.performanceMetrics.memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB
   - Watch for memory leaks
   - Add proper cleanup for Socket.IO connections\n`
    : ""
}

## Test Environment

- **Node Version:** ${process.version}
- **Platform:** ${process.platform}
- **Base URL:** ${BASE_URL}
- **Total Test Duration:** ${(testResults.performanceMetrics.totalDuration / 1000).toFixed(2)}s

---
*Test Report Auto-Generated by E2E & Load Testing Suite*
`;

  const reportPath = `./test-report-${timestamp}.md`;
  fs.writeFileSync(reportPath, report);
  console.log(`\n✓ Test report saved to: ${reportPath}`);

  // Also save JSON for programmatic access
  const jsonPath = `./test-results-${timestamp}.json`;
  fs.writeFileSync(jsonPath, JSON.stringify(testResults, null, 2));
  console.log(`✓ Test results saved to: ${jsonPath}`);
}

// ============================================================
// RUN TESTS
// ============================================================

console.log(
  "╔════════════════════════════════════════════════════════╗"
);
console.log(
  "║  Brancher E2E & Load Testing Suite                     ║"
);
console.log(
  "║  Testing: Auth, Branches, Messaging, Friends, Socket   ║"
);
console.log(
  "╚════════════════════════════════════════════════════════╝\n"
);

runAllTests().catch(console.error);
