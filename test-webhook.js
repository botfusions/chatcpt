/**
 * Webhook Server Test Script
 *
 * Bu script webhook sunucusunu test eder ve örnek istekler gönderir.
 */

const http = require('http');

const CONFIG = {
    host: 'localhost',
    port: 3000,
    timeout: 10000
};

// ============================================================================
// Test Utilities
// ============================================================================

/**
 * HTTP request helper
 */
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: CONFIG.host,
            port: CONFIG.port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: CONFIG.timeout
        };

        const req = http.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const response = {
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: body ? JSON.parse(body) : null
                    };
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Parse error: ${error.message}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * Test result logger
 */
function logTest(name, passed, details = '') {
    const symbol = passed ? '✓' : '✗';
    const color = passed ? '\x1b[32m' : '\x1b[31m';
    console.log(`${color}${symbol}\x1b[0m ${name}`);
    if (details) {
        console.log(`  ${details}`);
    }
}

// ============================================================================
// Test Cases
// ============================================================================

/**
 * Test 1: Health Check
 */
async function testHealthCheck() {
    console.log('\n📊 Test 1: Health Check');
    console.log('='.repeat(60));

    try {
        const response = await makeRequest('GET', '/health');

        logTest('Status code 200', response.statusCode === 200);
        logTest('Response has status field', response.body && response.body.status === 'healthy');
        logTest('Response has uptime', response.body && typeof response.body.uptime === 'number');

        console.log('Response:', JSON.stringify(response.body, null, 2));
        return true;

    } catch (error) {
        logTest('Health check', false, error.message);
        return false;
    }
}

/**
 * Test 2: Simple Webhook Request
 */
async function testSimpleWebhook() {
    console.log('\n📨 Test 2: Simple Webhook Request');
    console.log('='.repeat(60));

    try {
        const requestData = {
            message: 'Merhaba, test mesajı!'
        };

        const response = await makeRequest('POST', '/webhook', requestData);

        logTest('Status code 200', response.statusCode === 200);
        logTest('Response has success field', response.body && response.body.success === true);
        logTest('Response has response field', response.body && typeof response.body.response === 'string');
        logTest('Response has conversation_id', response.body && typeof response.body.conversation_id === 'string');
        logTest('Response has message_id', response.body && typeof response.body.message_id === 'string');

        console.log('Request:', JSON.stringify(requestData, null, 2));
        console.log('Response:', JSON.stringify(response.body, null, 2));

        return response.body.conversation_id;

    } catch (error) {
        logTest('Simple webhook request', false, error.message);
        return null;
    }
}

/**
 * Test 3: Conversation Continuation
 */
async function testConversationContinuation(conversationId) {
    console.log('\n💬 Test 3: Conversation Continuation');
    console.log('='.repeat(60));

    if (!conversationId) {
        console.log('⚠️  Skipped: No conversation ID from previous test');
        return false;
    }

    try {
        const requestData = {
            message: 'Bu ikinci mesajım',
            conversation_id: conversationId
        };

        const response = await makeRequest('POST', '/webhook', requestData);

        logTest('Status code 200', response.statusCode === 200);
        logTest('Same conversation_id returned', response.body.conversation_id === conversationId);
        logTest('Response has content', response.body && response.body.response.length > 0);

        console.log('Request:', JSON.stringify(requestData, null, 2));
        console.log('Response:', JSON.stringify(response.body, null, 2));

        return true;

    } catch (error) {
        logTest('Conversation continuation', false, error.message);
        return false;
    }
}

/**
 * Test 4: Validation Errors
 */
async function testValidation() {
    console.log('\n🔍 Test 4: Validation');
    console.log('='.repeat(60));

    const tests = [
        {
            name: 'Empty message',
            data: { message: '' },
            expectedStatus: 400
        },
        {
            name: 'Missing message field',
            data: {},
            expectedStatus: 400
        },
        {
            name: 'Invalid message type',
            data: { message: 12345 },
            expectedStatus: 400
        }
    ];

    for (const test of tests) {
        try {
            const response = await makeRequest('POST', '/webhook', test.data);
            logTest(test.name, response.statusCode === test.expectedStatus,
                `Expected ${test.expectedStatus}, got ${response.statusCode}`);
        } catch (error) {
            logTest(test.name, false, error.message);
        }
    }

    return true;
}

/**
 * Test 5: Get Conversation
 */
async function testGetConversation(conversationId) {
    console.log('\n📖 Test 5: Get Conversation');
    console.log('='.repeat(60));

    if (!conversationId) {
        console.log('⚠️  Skipped: No conversation ID');
        return false;
    }

    try {
        const response = await makeRequest('GET', `/webhook/conversation/${conversationId}`);

        logTest('Status code 200', response.statusCode === 200);
        logTest('Response has conversation', response.body && response.body.conversation);
        logTest('Conversation has messages', response.body.conversation && Array.isArray(response.body.conversation.messages));

        console.log('Response:', JSON.stringify(response.body, null, 2));

        return true;

    } catch (error) {
        logTest('Get conversation', false, error.message);
        return false;
    }
}

/**
 * Test 6: List Conversations
 */
async function testListConversations() {
    console.log('\n📋 Test 6: List Conversations');
    console.log('='.repeat(60));

    try {
        const response = await makeRequest('GET', '/webhook/conversations');

        logTest('Status code 200', response.statusCode === 200);
        logTest('Response has conversations array', response.body && Array.isArray(response.body.conversations));
        logTest('Response has count', response.body && typeof response.body.count === 'number');

        console.log('Response:', JSON.stringify(response.body, null, 2));

        return true;

    } catch (error) {
        logTest('List conversations', false, error.message);
        return false;
    }
}

/**
 * Test 7: Math Operations
 */
async function testMathOperations() {
    console.log('\n🔢 Test 7: Math Operations');
    console.log('='.repeat(60));

    const mathTests = [
        { message: '5 + 3', expected: '8' },
        { message: '10 - 4', expected: '6' },
        { message: '6 * 7', expected: '42' },
        { message: '15 / 3', expected: '5' }
    ];

    for (const test of mathTests) {
        try {
            const response = await makeRequest('POST', '/webhook', { message: test.message });

            const hasExpected = response.body.response.includes(test.expected);
            logTest(`${test.message} = ${test.expected}`, hasExpected,
                `Response: ${response.body.response}`);

        } catch (error) {
            logTest(`Math: ${test.message}`, false, error.message);
        }
    }

    return true;
}

/**
 * Test 8: Rate Limiting
 */
async function testRateLimiting() {
    console.log('\n⏱️  Test 8: Rate Limiting');
    console.log('='.repeat(60));

    try {
        // Send multiple requests rapidly
        const requests = [];
        for (let i = 0; i < 5; i++) {
            requests.push(makeRequest('POST', '/webhook', { message: `Test ${i}` }));
        }

        const responses = await Promise.all(requests);

        logTest('All requests completed', responses.length === 5);
        logTest('All requests successful', responses.every(r => r.statusCode === 200));

        const rateLimits = responses.map(r => r.body.rateLimit?.remaining);
        logTest('Rate limit decreasing', rateLimits[0] > rateLimits[4],
            `First: ${rateLimits[0]}, Last: ${rateLimits[4]}`);

        return true;

    } catch (error) {
        logTest('Rate limiting', false, error.message);
        return false;
    }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 WEBHOOK SERVER TEST SUITE');
    console.log('='.repeat(60));
    console.log(`Target: http://${CONFIG.host}:${CONFIG.port}`);

    let conversationId = null;
    const results = {
        passed: 0,
        failed: 0
    };

    try {
        // Test 1: Health Check
        const healthOk = await testHealthCheck();
        if (!healthOk) {
            console.log('\n❌ Server is not responding. Make sure it\'s running!');
            console.log('Start server with: npm start');
            process.exit(1);
        }
        results.passed++;

        // Test 2: Simple Webhook
        conversationId = await testSimpleWebhook();
        if (conversationId) results.passed++; else results.failed++;

        // Test 3: Conversation Continuation
        const cont = await testConversationContinuation(conversationId);
        if (cont) results.passed++; else results.failed++;

        // Test 4: Validation
        await testValidation();
        results.passed++;

        // Test 5: Get Conversation
        const getConv = await testGetConversation(conversationId);
        if (getConv) results.passed++; else results.failed++;

        // Test 6: List Conversations
        const list = await testListConversations();
        if (list) results.passed++; else results.failed++;

        // Test 7: Math Operations
        await testMathOperations();
        results.passed++;

        // Test 8: Rate Limiting
        await testRateLimiting();
        results.passed++;

    } catch (error) {
        console.error('\n❌ Test suite error:', error.message);
        results.failed++;
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ Passed: ${results.passed}`);
    console.log(`✗ Failed: ${results.failed}`);
    console.log(`Total: ${results.passed + results.failed}`);
    console.log('='.repeat(60));

    process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
if (require.main === module) {
    runAllTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}

module.exports = { runAllTests };
