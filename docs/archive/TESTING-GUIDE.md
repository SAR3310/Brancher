# Brancher Testing Guide

> **ARSIP — belum terverifikasi.** Laporan tes lama. Klaim seperti "85.7%" dan "Production Ready" tidak mencakup tiga tes Socket.IO yang gagal. Dokumen aktif: `docs/TESTING.md`.

Quick reference for running E2E, load, and performance tests.

## Quick Start

### Run All Tests
```bash
cd brancher
node runner.js
```

This will:
1. Start the Brancher server
2. Wait for server to be ready
3. Execute all test suites
4. Generate test reports in markdown and JSON formats

### Run Tests Separately

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Run tests
node e2e-load-test.js
```

## Test Suites Included

### 1. E2E Workflow Test
Tests complete user journeys:
- **Authentication:** Register, login, session management
- **Branch Management:** Create, list, get details
- **Messaging:** Send/receive messages (REST API)
- **Socket.IO:** Real-time connections
- **Friends & DM:** Friendship requests, direct messaging
- **Error Handling:** Logout, session cleanup

**Duration:** ~10-15 seconds
**Tests:** 14-18 tests

### 2. Load Test
Simulates concurrent users:
- **Users:** 5 test users registered and logged in
- **Operations:** Each user creates a branch and posts messages
- **Duration:** ~15-20 seconds
- **Measures:** Success rate, error handling, scalability

**Expected Results:**
```
Users created: 5/5
Users logged in: 5/5
Branches created: 5/5
Messages posted: 15/15 (if Socket.IO is working)
```

### 3. Error Handling Test
Validates error responses:
- Invalid email formats
- Missing required fields
- Unauthorized access
- Duplicate registrations
- Invalid passwords
- 404 not found

**Tests:** 7 tests
**Expected:** 100% pass rate

### 4. Performance Metrics
Measures server performance:
- **Response Times:** Average, min, max
- **Throughput:** Requests per second
- **Memory Usage:** Heap, RSS
- **Success Rate:** Percentage of successful requests

## Test Reports

After each test run, three files are generated:

### 1. Markdown Report
**File:** `test-report-{timestamp}.md`
**Contains:**
- Summary statistics
- Test results by category
- Performance metrics
- Recommendations

### 2. JSON Results
**File:** `test-results-{timestamp}.json`
**Contains:** Raw test data in JSON format for programmatic access

### 3. This Testing Report
**File:** `TESTING-REPORT.md`
**Contains:** Comprehensive analysis and recommendations

## Important Notes

### Database Cleanup
The test database persists between runs. To start fresh:

```bash
# Option 1: Delete database files
rm data/brancher.db data/sessions.db

# Option 2: Use unique test identifiers
# Tests automatically use incremental usernames: loadtest1, loadtest2, etc.
```

### Socket.IO Testing Note
Socket.IO message events may timeout if the server has connectivity issues. Ensure:
- Server is running and responding
- No firewall blocking localhost:3000
- Network latency is low

### Performance Baseline
Expected performance metrics:
- Average response time: **< 200ms** (current: 80ms)
- Max response time: **< 500ms** (current: 311ms)
- Memory usage: **< 200MB** (current: 53MB)

## Troubleshooting

### Tests Won't Connect to Server
```bash
# Check if server is running
netstat -ano | findstr :3000

# If not running, start it manually
npm start

# Or kill stray processes
Get-Process node | Stop-Process -Force
```

### Socket.IO Tests Fail
**Possible Causes:**
1. Server Socket.IO middleware not configured
2. Session middleware not attached to Socket.IO
3. Event listener timeout too short
4. Event name mismatch

**Solution:**
1. Check `server/index.js` line 53: `io.engine.use(sessionMiddleware)`
2. Verify Socket.IO handlers at lines 521-677
3. Check browser DevTools Network tab for WebSocket traffic

### Database Corruption
```bash
# Delete corrupted database and restart
rm data/*.db

# Restart server - new database will be created
npm start
```

### Memory Leaks
If memory usage keeps increasing:
1. Check Socket.IO connection cleanup
2. Verify session store is clearing old sessions
3. Monitor database connections

## Running in CI/CD

### GitHub Actions Example
```yaml
- name: Run E2E Tests
  run: |
    cd brancher
    npm install
    node runner.js
    
- name: Upload Test Reports
  if: always()
  uses: actions/upload-artifact@v2
  with:
    name: test-reports
    path: brancher/test-*.{md,json}
```

## Expected Test Results

### Passing Tests (Expected)
- ✓ All REST API endpoints
- ✓ Authentication (register, login, logout)
- ✓ Branch operations (create, list, get)
- ✓ Error handling (validation, authorization)
- ✓ Load test core operations
- ✓ Performance metrics

### Known Issues
- ⚠ Socket.IO message events may timeout (configuration issue)
- ⚠ Socket.IO DM events may not be received
- ⚠ Register test may fail if database not cleaned (duplicate user)

### Pass/Fail Criteria
- **PASS:** > 80% of tests succeed
- **FAIL:** < 80% of tests succeed, OR critical API errors
- **WARNING:** Socket.IO issues, performance > 500ms

## Test Customization

### Modify Load Test Parameters
Edit `e2e-load-test.js`:
```javascript
const NUM_USERS = 5;        // Change number of users
const MESSAGES_PER_USER = 3; // Change messages per user
const TIMEOUT = 10000;       // Change timeout (ms)
```

### Modify Performance Targets
Edit the `calculatePerformanceMetrics()` function in `e2e-load-test.js`

### Add Custom Tests
Add new test functions in `e2e-load-test.js`:
```javascript
async function testCustomFeature() {
  // Your test code
  recordTest("My Custom Test", passed, { details });
}

// Call in runAllTests()
await testCustomFeature();
```

## Performance Benchmarking

### Baseline (Current Server)
- **Users:** 5 concurrent
- **Avg Response:** 80ms
- **Max Response:** 311ms
- **Memory:** 53MB RSS
- **Success:** 100% (REST API)

### Stress Test (To Be Run)
- **Users:** 50-100 concurrent
- **Duration:** 5 minutes
- **Measure:** Response time degradation, memory growth, error rate

## Monitoring & Alerts

### What to Watch
1. **Response Time Trend:** Should stay < 200ms average
2. **Memory Usage:** Should not exceed 200MB
3. **Error Rate:** Should stay near 0%
4. **Socket.IO Events:** Should reliably reach destination

### Alert Thresholds
- Response time > 500ms → Investigate
- Memory > 300MB → Check for leaks
- Error rate > 5% → Check server logs
- Socket.IO latency > 3s → Check connection

## Test Maintenance

### Regular Updates Needed
- Update test data when schema changes
- Update Socket.IO event names if they change
- Update error messages if validation changes
- Update performance targets as app scales

### Monthly Checklist
- [ ] Run full test suite
- [ ] Review performance trends
- [ ] Update baseline metrics
- [ ] Check for new error patterns
- [ ] Verify Socket.IO stability

## Support & Debugging

### Enable Verbose Logging
```bash
DEBUG=* node runner.js
```

### Check Server Logs
The server outputs logs to console:
- Auth events: `Auth: register`, `Auth: login`
- HTTP requests: `POST /api/register 200`
- Errors: Detailed error messages

### Export Test Results
```bash
# Convert JSON to CSV for analysis
node -e "
  const data = require('./test-results-*.json');
  const tests = data.e2eTests;
  console.log('Test,Passed,Status');
  tests.forEach(t => console.log(\`\${t.testName},\${t.passed},\${t.status}\`));
"
```

---

**Last Updated:** October 5, 2026  
**Maintained By:** QA Team  
**Repository:** brancher (chore/versioning-lint-ci)
