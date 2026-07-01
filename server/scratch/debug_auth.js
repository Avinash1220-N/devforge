require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const { encrypt } = require('../utils/encrypt');

async function debug() {
  console.log('Connecting to DB with MONGO_URI:', process.env.MONGO_URI);
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');
    
    console.log('Querying mock user...');
    const user = await User.findOne({ githubId: 'mock_nani' });
    console.log('Found user:', user);
    
    if (!user) {
      console.log('Creating mock user...');
      const newUser = new User({
        githubId: 'mock_nani',
        name: 'nani',
        email: 'nani@mockforge.com',
        role: 'user',
        githubAccessToken: encrypt('mock_access_token_value')
      });
      await newUser.save();
      console.log('User created successfully:', newUser);
    }
  } catch (err) {
    console.error('Debug failed with error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

debug();
