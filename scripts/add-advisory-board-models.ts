import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

console.log('Preparing to add advisory board models to the database...');

try {
  // Change to backend directory
  const backendDir = path.resolve(__dirname, '..', 'backend');
  
  // Run prisma generate to update client
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });
  
  // Run prisma db push to update the database schema
  console.log('Pushing schema changes to database...');
  execSync('npx prisma db push', { cwd: backendDir, stdio: 'inherit' });
  
  console.log('Successfully added advisory board models to the database!');
  console.log('Models added:');
  console.log('- AdvisoryVote');
  console.log('- AdvisoryVoteOption');
  console.log('- AdvisoryVoteCast');
} catch (error) {
  console.error('Error adding advisory board models:', error.message);
  console.error('Make sure your database server is running at localhost:5432');
  console.error('Alternatively, you can run these commands manually in the backend directory:');
  console.log('npx prisma generate');
  console.log('npx prisma db push');
}