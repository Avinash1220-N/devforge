require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { encrypt } = require('../utils/encrypt');
const logActivity = require('../utils/activityLogger');
const jwt = require('jsonwebtoken');

async function testMockLoginLogic() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected.');

  const username = 'nani';
  const role = 'admin';

  try {
    const mockId = `mock_${username.toLowerCase()}`;
    
    console.log('1. User.findOne...');
    let user = await User.findOne({ githubId: mockId });
    console.log('Found user:', user);

    if (!user) {
      console.log('2. Creating new user...');
      user = new User({
        githubId: mockId,
        name: username,
        email: `${username.toLowerCase()}@mockforge.com`,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${username}`,
        role: role === 'admin' ? 'admin' : 'user',
        githubAccessToken: encrypt('mock_access_token_value')
      });
      await user.save();
      console.log('User saved successfully');
    } else {
      console.log('2. User exists, saving status...');
      user.role = role === 'admin' ? 'admin' : 'user';
      await user.save();
      console.log('User updated successfully');
    }

    console.log('3. jwt.sign...');
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'devforge_local_jwt_secret_token_12345',
      { expiresIn: '30d' }
    );
    console.log('Token signed:', token);

    console.log('4. logActivity...');
    const logRes = await logActivity(user._id, 'login', { method: 'mock_login' });
    console.log('Activity logged result:', logRes);

    console.log('SUCCESS: All login logic resolved without error!');
  } catch (error) {
    console.error('CRITICAL: Login logic crashed with error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testMockLoginLogic();
