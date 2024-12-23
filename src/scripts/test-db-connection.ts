import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    const connection = await mongoose.connect(process.env.MONGODB_URI);
    console.log('Successfully connected to MongoDB!');
    console.log('Connection Details:');
    console.log(`Database Name: ${connection.connection.name}`);
    console.log(`Host: ${connection.connection.host}`);
    console.log(`Port: ${connection.connection.port}`);
    console.log('Connection State:', connection.connection.readyState === 1 ? 'Connected' : 'Not Connected');
    
    await connection.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
  } finally {
    process.exit();
  }
}

testConnection();
