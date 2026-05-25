require('dotenv').config();
const db = require('./config/connection');
const { User } = require('./models/User');

async function test() {
  try {
    // Wait for database connection
    await new Promise((resolve) => {
      db.once('open', resolve);
    });
    
    console.log('User model:', User);
    console.log('Creating user...');
    const user = await User.create({
      username: 'test' + Date.now(),
      email: 'test' + Date.now() + '@example.com',
      password: 'password123',
    });
    console.log('User created:', user);
  } catch (err) {
    console.error('ERROR:', err.message);
    console.error('Full error:', err);
  }
  process.exit(0);
}

test();
