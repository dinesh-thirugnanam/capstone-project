// src/controllers/companyControllers.js
import { query } from '../db/db.js';

export async function createCompany(req, res) {
  const { name } = req.body;

  if (!name || name.trim().length === 0) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    // Check if company name already exists
    const existing = await query('SELECT id FROM companies WHERE name = $1', [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Company name already exists' });
    }

    // Create company
    const result = await query(
      `INSERT INTO companies (name) VALUES ($1) RETURNING id, name`,
      [name.trim()]
    );

    res.status(201).json({
      message: 'Company created successfully',
      company: result.rows[0]
    });

  } catch (err) {
    console.error('Error creating company:', err);
    res.status(500).json({ message: 'Error creating company' });
  }
}

export async function getAllCompanies(req, res) {
  try {
    const result = await query('SELECT id, name FROM companies ORDER BY name');
    res.status(200).json({ companies: result.rows });
  } catch (err) {
    console.error('Error fetching companies:', err);
    res.status(500).json({ message: 'Error fetching companies' });
  }
}