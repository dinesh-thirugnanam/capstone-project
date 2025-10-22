// src/controllers/userController.js
import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function getCompanyUsers(req, res) {
  const user = decodeToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const result = await query(
      `SELECT u.id, u.email, u.role, u.is_active,
              p.first_name, p.last_name, p.employee_id, p.department, p.phone_number
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
       WHERE u.company_id = $1`,
      [user.company_id]
    );

    res.status(200).json({ users: result.rows });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching company users' });
  }
}
