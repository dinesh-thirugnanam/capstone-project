import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';

export async function getCompanyUsers(req, res) {
  const user = decodeToken(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  try {
    const result = await query(
      `SELECT 
         u.id, 
         u.email, 
         u.role, 
         u.is_active,
         u.created_at,
         up.first_name,
         up.last_name,
         up.employee_id,
         up.department,
         up.phone_number
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.company_id = $1
       ORDER BY u.created_at DESC`,
      [user.company_id]
    );

    res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching users' });
  }
}

export async function getMyProfile(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const result = await query(
      `SELECT 
         u.id, 
         u.email, 
         u.role,
         up.first_name,
         up.last_name,
         up.employee_id,
         up.department,
         up.phone_number
       FROM users u
       LEFT JOIN user_profiles up ON u.id = up.user_id
       WHERE u.id = $1`,
      [user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching profile' });
  }
}

// Update current user profile
export async function updateMyProfile(req, res) {
  const user = decodeToken(req);
  if (!user) return res.status(401).json({ message: 'Unauthorized' });

  const { firstName, lastName, phoneNumber } = req.body;

  try {
    await query(
      `UPDATE user_profiles 
       SET first_name = $1, last_name = $2, phone_number = $3
       WHERE user_id = $4`,
      [firstName, lastName, phoneNumber, user.id]
    );

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile' });
  }
}
