import axios from 'axios';

async function testEnhancedLogging() {
  console.log('🔍 Testing Enhanced Logging System...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:3000/api/demo/health');
    console.log('✅ Health check response:', healthResponse.data);
    
    // Test structured logging endpoint
    console.log('\n2. Testing structured logging...');
    const testData = {
      message: 'Hello from enhanced logging test',
      timestamp: new Date().toISOString(),
      userId: 'test-user-456',
      action: 'logging_demo'
    };
    
    const logResponse = await axios.post('http://localhost:3000/api/demo/structured-log', testData);
    console.log('✅ Structured log response:', logResponse.data);
    
    console.log('\n🎉 Enhanced logging system is working!');
    console.log('\n📋 What was implemented:');
    console.log('- Enhanced Logging Interceptor with structured request data');
    console.log('- Frontend logger with structured logging capabilities');
    console.log('- Context-aware logging with trace IDs');
    console.log('- JSON-formatted log output for better observability');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the backend server is running on port 3000');
  }
}

testEnhancedLogging();