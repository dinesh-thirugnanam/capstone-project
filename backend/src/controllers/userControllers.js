import { query } from '../db/db.js';
import { decodeToken } from '../utils/authUtils.js';
import bcrypt from 'bcryptjs';

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

// Admin: Create employee
export async function createEmployee(req, res) {
  const admin = decodeToken(req);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { email, password, firstName, lastName, employeeId, department, phoneNumber } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userResult = await query(
      `INSERT INTO users (email, password, role, company_id, is_active)
       VALUES ($1, $2, 'employee', $3, true)
       RETURNING id, email, role`,
      [email, hashedPassword, admin.company_id]
    );

    const userId = userResult.rows[0].id;

    // Create profile
    await query(
      `INSERT INTO user_profiles (user_id, first_name, last_name, employee_id, department, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, firstName || null, lastName || null, employeeId || null, department || null, phoneNumber || null]
    );

    res.status(201).json({
      message: 'Employee created successfully',
      user: {
        id: userId,
        email,
        role: 'employee',
        firstName,
        lastName,
        employeeId,
        department,
        phoneNumber
      }
    });

  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ message: 'Error creating employee' });
  }
}

// Admin: Delete employee
export async function deleteEmployee(req, res) {
  const admin = decodeToken(req);
  if (!admin || admin.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  const { id } = req.params;

  try {
    // Verify employee belongs to admin's company and is not an admin
    const employeeCheck = await query(
      'SELECT role, company_id FROM users WHERE id = $1',
      [id]
    );

    if (employeeCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = employeeCheck.rows[0];

    if (employee.company_id !== admin.company_id) {
      return res.status(403).json({ message: 'Cannot delete employee from another company' });
    }

    if (employee.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }

    // Delete user profile first (due to foreign key)
    await query('DELETE FROM user_profiles WHERE user_id = $1', [id]);

    // Delete user
    await query('DELETE FROM users WHERE id = $1', [id]);

    res.status(200).json({ message: 'Employee deleted successfully' });

  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ message: 'Error deleting employee' });
  }
}
