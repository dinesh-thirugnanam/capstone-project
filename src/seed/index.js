import 'dotenv/config';
import clearData from './clearData.js';
import seedCompanies from './seedCompanies.js';
import seedUsers from './seedUsers.js';
import seedGeofences from './seedGeofences.js';
import seedAttendance from './seedAttendance.js';
import seedLocations from './seedLocations.js';
import { end } from '../db/db.js';

async function runSeeds() {
  console.log('\n🌱 Starting database seeding...\n');
  
  try {
    // Optional: clear existing data
    const args = process.argv.slice(2);
    if (args.includes('--clear')) {
      await clearData();
    }

    // Run seeds in order
    await seedCompanies();
    await seedUsers();
    await seedGeofences();
    await seedAttendance();
    await seedLocations();

    console.log('🎉 All seeds completed successfully!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n💥 Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await end();
  }
}

runSeeds();