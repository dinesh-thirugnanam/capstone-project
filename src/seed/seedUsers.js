import { query } from '../db/db.js';
import pkg from 'bcryptjs';
const { hash } = pkg;

async function seedUsers() {
  console.log('👥 Seeding users...');
  
  try {
    // Get existing companies
    const companiesResult = await query('SELECT id FROM companies LIMIT 3');
    const companyIds = companiesResult.rows.map(r => r.id);

    if (companyIds.length === 0) {
      throw new Error('No companies found. Run seedCompanies first.');
    }

    const hashedPassword = await hash('password123', 12);

    const users = [
      // Admins
      { 
        email: 'admin@techcorp.com', 
        password: hashedPassword, 
        role: 'admin', 
        companyId: companyIds[0],
        profile: { firstName: 'Alice', lastName: 'Admin', phoneNumber: '+911234567890' }
      },
      { 
        email: 'admin@designstudios.com', 
        password: hashedPassword, 
        role: 'admin', 
        companyId: companyIds[1],
        profile: { firstName: 'Bob', lastName: 'Boss', phoneNumber: '+911234567891' }
      },
      
      // Employees
      { 
        email: 'emp1@techcorp.com', 
        password: hashedPassword, 
        role: 'employee', 
        companyId: companyIds[0],
        profile: { firstName: 'Charlie', lastName: 'Coder', employeeId: 'EMP001', department: 'Engineering' }
      },
      { 
        email: 'emp2@techcorp.com', 
        password: hashedPassword, 
        role: 'employee', 
        companyId: companyIds[0],
        profile: { firstName: 'Diana', lastName: 'Designer', employeeId: 'EMP002', department: 'Design' }
      },
      { 
        email: 'emp3@designstudios.com', 
        password: hashedPassword, 
        role: 'employee', 
        companyId: companyIds[1],
        profile: { firstName: 'Ethan', lastName: 'Engineer', employeeId: 'EMP003', department: 'Development' }
      }
    ];

    const results = [];
    for (const user of users) {
      // Insert user
      const userResult = await query(
        `INSERT INTO users (email, password, role, company_id, is_active) 
         VALUES ($1, $2, $3, $4, true) 
         ON CONFLICT (email) DO NOTHING 
         RETURNING id, email, role`,
        [user.email, user.password, user.role, user.companyId]
      );

      if (userResult.rows.length > 0) {
        const userId = userResult.rows[0].id;
        
        // Insert profile
        await query(
          `INSERT INTO user_profiles (user_id, first_name, last_name, employee_id, department, phone_number)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (user_id) DO NOTHING`,
          [
            userId, 
            user.profile.firstName, 
            user.profile.lastName, 
            user.profile.employeeId || null, 
            user.profile.department || null,
            user.profile.phoneNumber || null
          ]
        );

        results.push(userResult.rows[0]);
        console.log(`  ✓ Created: ${user.email} (${user.role})`);
      }
    }

    console.log(`✅ Seeded ${results.length} users\n`);
    return results;
  } catch (err) {
    console.error('❌ Error seeding users:', err.message);
    throw err;
  }
}

export default seedUsers;
