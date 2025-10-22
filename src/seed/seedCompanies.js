import { query } from '../db/db.js';

async function seedCompanies() {
  console.log('🏢 Seeding companies...');
  
  try {
    const companies = [
      { name: 'Tech Corp' },
      { name: 'Design Studios Inc' },
      { name: 'Retail Solutions Ltd' }
    ];

    const results = [];
    for (const company of companies) {
      const result = await query(
        `INSERT INTO companies (name) 
         VALUES ($1) 
         ON CONFLICT DO NOTHING 
         RETURNING id, name`,
        [company.name]
      );
      
      if (result.rows.length > 0) {
        results.push(result.rows[0]);
        console.log(`  ✓ Created: ${result.rows[0].name}`);
      }
    }

    console.log(`✅ Seeded ${results.length} companies\n`);
    return results;
  } catch (err) {
    console.error('❌ Error seeding companies:', err.message);
    throw err;
  }
}

export default seedCompanies;
