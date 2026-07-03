// Track IFA App Story Progress
import * as fs from 'fs';
import * as path from 'path';

// Define all stories that should be tracked
const allStories = [
  'EXP-001', 'EXP-002', 'EXP-003', 'EXP-004', 'EXP-005', 'EXP-006', 'EXP-007', 'EXP-008', 
  'EXP-009', 'EXP-010', 'EXP-011', 'EXP-012', 'EXP-013', 'EXP-016', 'EXP-019', 'EXP-021', 
  'EXP-023', 'EXP-024', 'EXP-025', 'EXP-026', 'EXP-030', 'EXP-031', 'EXP-032'
];

// Stories that are completed (parsed from the EXPERIENCE_BACKLOG.md file)
const completedStories = [
  'EXP-001', 'EXP-002', 'EXP-003', 'EXP-004', 'EXP-005', 'EXP-006', 'EXP-007', 'EXP-008', 
  'EXP-009', 'EXP-010', 'EXP-011', 'EXP-012', 'EXP-013', 'EXP-016', 'EXP-019', 'EXP-021', 
  'EXP-023', 'EXP-024', 'EXP-025', 'EXP-026', 'EXP-030', 'EXP-031', 'EXP-032'
];

console.log('IFA App Story Progress Report');
console.log('=============================');
console.log();

const totalStories = allStories.length;
const completedCount = completedStories.length;
const remainingCount = totalStories - completedCount;

console.log(`Total Stories: ${totalStories}`);
console.log(`Completed: ${completedCount}`);
console.log(`Remaining: ${remainingCount}`);
console.log();

const progressPercentage = Math.round((completedCount / totalStories) * 100);
console.log(`Overall Progress: ${progressPercentage}%`);
console.log();

// Create a progress bar
const progressBarLength = 50;
const filledLength = Math.round((completedCount / totalStories) * progressBarLength);
const progressBar = '█'.repeat(filledLength) + '░'.repeat(progressBarLength - filledLength);
console.log(`[${progressBar}] ${progressPercentage}%`);
console.log();

// Categorize completed stories by sprint group
const onboardingStories = ['EXP-001', 'EXP-002', 'EXP-003', 'EXP-004', 'EXP-005', 'EXP-006', 'EXP-007', 'EXP-008', 'EXP-009', 'EXP-010', 'EXP-011', 'EXP-012', 'EXP-030', 'EXP-031', 'EXP-032'];
const babalawoStories = ['EXP-013', 'EXP-016', 'EXP-019', 'EXP-021', 'EXP-023', 'EXP-024', 'EXP-025', 'EXP-026'];
const clientStories = [];

console.log('Completed Stories:');
onboardingStories
  .filter(story => completedStories.includes(story))
  .forEach(story => console.log(`  ✓ ${story}`));
babalawoStories
  .filter(story => completedStories.includes(story))
  .forEach(story => console.log(`  ✓ ${story}`));
clientStories
  .filter(story => completedStories.includes(story))
  .forEach(story => console.log(`  ✓ ${story}`));
console.log();

// Identify remaining stories by sprint group
console.log('Remaining Stories by Sprint Group:');
console.log();
console.log('Onboarding (Sprints 1–3):');
allStories
  .filter(story => onboardingStories.includes(story) && !completedStories.includes(story))
  .forEach(story => console.log(`  - ${story}`));

console.log();
console.log('Babalawo Tools (Sprints 4–5):');
allStories
  .filter(story => babalawoStories.includes(story) && !completedStories.includes(story))
  .forEach(story => console.log(`  - ${story}`));

console.log();
console.log('Client Experience (Sprint 6–8):');
allStories
  .filter(story => clientStories.includes(story) && !completedStories.includes(story))
  .forEach(story => console.log(`  - ${story}`));