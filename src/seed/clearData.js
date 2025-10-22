import { query } from '../db/db.js';

async function clearData() {
  console.log('🗑️  Clearing all data...\n');
  
  try {
    // Order matters due to foreign keys
    await query('DELETE FROM attendance');
    console.log('  ✓ Cleared attendance');
    
    await query('DELETE FROM locations');
    console.log('  ✓ Cleared locations');
    
    await query('DELETE FROM geofences');
    console.log('  ✓ Cleared geofences');
    
    await query('DELETE FROM user_profiles');
    console.log('  ✓ Cleared user profiles');
    
    await query('DELETE FROM users');
    console.log('  ✓ Cleared users');
    
    await query('DELETE FROM companies');
    console.log('  ✓ Cleared companies');
    
    console.log('\n✅ All data cleared\n');
  } catch (err) {
    console.error('❌ Error clearing data:', err.message);
    throw err;
  }
}

export default clearData;
