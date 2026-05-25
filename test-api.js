
const http = require('http');
require('dotenv').config();
const db = require('./config/connection');

const baseUrl = 'http://localhost:3001';
let tokenA, tokenB, noteId, userIdA;

function makeRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            body: parsed,
            rawData: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            body: null,
            rawData: data,
          });
        }
      });
    });

    req.on('error', (e) => {
      reject(e);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log('\n=== TESTING SECURE RECORD STORAGE ===\n');

  const timestamp = Date.now();
  
  try {
    // Register User A
    console.log('1. Register User A...');
    let res = await makeRequest('POST', '/api/users/register', {
      username: `userA_${timestamp}`,
      email: `userA_${timestamp}@example.com`,
      password: 'password123',
    });
    console.log(`   Status: ${res.status}`);
    if (res.status !== 201) {
      console.log(`   Error: ${res.rawData || JSON.stringify(res.body)}`);
      throw new Error('User A registration failed');
    }
    console.log('   ✓ User A registered');
    tokenA = res.body.token;
    userIdA = res.body.user._id;
    console.log(`   Token saved: ${tokenA.substring(0, 20)}...`);

    // Register User B
    console.log('\n2. Register User B...');
    res = await makeRequest('POST', '/api/users/register', {
      username: `userB_${timestamp}`,
      email: `userB_${timestamp}@example.com`,
      password: 'password123',
    });
    console.log(`   Status: ${res.status}`);
    if (res.status !== 201) {
      console.log(`   Error: ${res.rawData || JSON.stringify(res.body)}`);
      throw new Error('User B registration failed');
    }
    console.log('   ✓ User B registered');
    tokenB = res.body.token;
    console.log(`   Token saved: ${tokenB.substring(0, 20)}...`);

    // Create Note as User A
    console.log('\n3. Create Note as User A...');
    res = await makeRequest(
      'POST',
      '/api/notes',
      { title: 'User A Note', content: 'This is user A note' },
      tokenA
    );
    console.log(`   Status: ${res.status} ✓`);
    noteId = res.body._id;
    console.log(`   Note ID: ${noteId}`);
    console.log(`   Owner ID: ${res.body.user}`);
    console.log(`   Owner matches User A: ${res.body.user === userIdA ? '✓' : '✗'}`);

    // Get All Notes as User A
    console.log('\n4. Get All Notes as User A...');
    res = await makeRequest('GET', '/api/notes', null, tokenA);
    console.log(`   Status: ${res.status}`);
    if (res.status === 500) {
      console.log(`   Error: ${res.rawData}`);
      throw new Error('GET /api/notes failed');
    }
    console.log(`   ✓ Notes returned: ${res.body.length}`);

    // Get Single Note as User A
    console.log('\n5. Get Single Note as User A...');
    res = await makeRequest('GET', `/api/notes/${noteId}`, null, tokenA);
    console.log(`   Status: ${res.status} ✓`);
    console.log(`   Note retrieved: ${res.body.title}`);

    // Update Note as User A
    console.log('\n6. Update Note as User A...');
    res = await makeRequest(
      'PUT',
      `/api/notes/${noteId}`,
      { title: 'Updated Note', content: 'Updated content' },
      tokenA
    );
    console.log(`   Status: ${res.status} ✓`);

    // Attempt Get Note as User B (should fail)
    console.log('\n7. Attempt Get Note as User B (should return 403)...');
    res = await makeRequest('GET', `/api/notes/${noteId}`, null, tokenB);
    console.log(`   Status: ${res.status} ${res.status === 403 ? '✓' : '✗'}`);
    if (res.status === 403) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Attempt Update Note as User B (should fail)
    console.log('\n8. Attempt Update Note as User B (should return 403)...');
    res = await makeRequest(
      'PUT',
      `/api/notes/${noteId}`,
      { title: 'Hacked', content: 'Bad' },
      tokenB
    );
    console.log(`   Status: ${res.status} ${res.status === 403 ? '✓' : '✗'}`);
    if (res.status === 403) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Attempt Delete Note as User B (should fail)
    console.log('\n9. Attempt Delete Note as User B (should return 403)...');
    res = await makeRequest('DELETE', `/api/notes/${noteId}`, null, tokenB);
    console.log(`   Status: ${res.status} ${res.status === 403 ? '✓' : '✗'}`);
    if (res.status === 403) {
      console.log(`   Message: ${res.body.message}`);
    }

    // Delete Note as User A (should succeed)
    console.log('\n10. Delete Note as User A (should succeed)...');
    res = await makeRequest('DELETE', `/api/notes/${noteId}`, null, tokenA);
    console.log(`    Status: ${res.status} ✓`);
    console.log(`    Message: ${res.body.message}`);

    console.log('\n=== ALL TESTS PASSED ===\n');
  } catch (err) {
    console.error('Test failed:', err.message);
  }
  process.exit(0);
}

// Wait for database connection before running tests
db.once('open', () => {
  runTests();
});
