/**
 * User Routes
 * Handles user management and RBAC client assignments
 */

import express from 'express';
import { db, logAuditAction } from '../database/db.js';
import { getManilaTimestampForSQL } from '../utils/timezone.js';

const router = express.Router();

// GET /api/users - List all users
router.get('/', (req, res) => {
  try {
    const { status, accessLevel } = req.query;
    let query = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (accessLevel) {
      query += ' AND access_level = ?';
      params.push(accessLevel);
    }

    query += ' ORDER BY name ASC';
    const users = db.prepare(query).all(...params);

    // Fetch clients for each user
    const usersWithClients = users.map(user => {
      const clients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(user.id);
      return {
        ...user,
        clients: clients.map(c => c.client_name)
      };
    });

    res.json(usersWithClients);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/:id - Get single user
router.get('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const clients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(user.id);
    user.clients = clients.map(c => c.client_name);

    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user
router.post('/', (req, res) => {
  try {
    const { email, name, accessLevel, branch, clients } = req.body;

    if (!email || !name) {
      return res.status(400).json({ error: 'Email and name are required' });
    }

    // Check if email already exists
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const stmt = db.prepare(`
      INSERT INTO users (email, name, access_level, branch, status)
      VALUES (?, ?, ?, ?, 'Active')
    `);
    
    const result = stmt.run(email, name, accessLevel || 'User', branch || null);
    const userId = result.lastInsertRowid;

    // Assign clients if provided
    if (clients && Array.isArray(clients)) {
      const insertClient = db.prepare('INSERT INTO user_clients (user_id, client_name) VALUES (?, ?)');
      for (const client of clients) {
        insertClient.run(userId, client);
      }
    }

    logAuditAction(null, 'Admin', 'USER_CREATED', 'users', userId, { email, name });

    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const userClients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(userId);
    newUser.clients = userClients.map(c => c.client_name);

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', (req, res) => {
  try {
    const { name, accessLevel, branch, status, clients } = req.body;
    const userId = req.params.id;

    // FIXED: Use Manila timezone timestamp instead of CURRENT_TIMESTAMP
    const manilaTimestamp = getManilaTimestampForSQL();

    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          access_level = COALESCE(?, access_level),
          branch = COALESCE(?, branch),
          status = COALESCE(?, status),
          updated_at = ?
      WHERE id = ?
    `).run(name, accessLevel, branch, status, manilaTimestamp, userId);

    // Update clients if provided
    if (clients && Array.isArray(clients)) {
      db.prepare('DELETE FROM user_clients WHERE user_id = ?').run(userId);
      const insertClient = db.prepare('INSERT INTO user_clients (user_id, client_name) VALUES (?, ?)');
      for (const client of clients) {
        insertClient.run(userId, client);
      }
    }

    logAuditAction(null, 'Admin', 'USER_UPDATED', 'users', userId, { name, accessLevel, status });

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const userClients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(userId);
    user.clients = userClients.map(c => c.client_name);

    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user
router.delete('/:id', (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    
    logAuditAction(null, 'Admin', 'USER_DELETED', 'users', req.params.id, { email: user.email });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/:id/clients - Assign clients to user
router.post('/:id/clients', (req, res) => {
  try {
    const { clients } = req.body;
    const userId = req.params.id;

    if (!clients || !Array.isArray(clients)) {
      return res.status(400).json({ error: 'Clients array is required' });
    }

    db.prepare('DELETE FROM user_clients WHERE user_id = ?').run(userId);
    
    const insertClient = db.prepare('INSERT INTO user_clients (user_id, client_name) VALUES (?, ?)');
    for (const client of clients) {
      insertClient.run(userId, client);
    }

    logAuditAction(null, 'Admin', 'CLIENTS_ASSIGNED', 'users', userId, { clients });

    const userClients = db.prepare('SELECT client_name FROM user_clients WHERE user_id = ?').all(userId);
    res.json({ clients: userClients.map(c => c.client_name) });
  } catch (error) {
    console.error('Error assigning clients:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/users/clients/available - Get all available clients
router.get('/clients/available', (req, res) => {
  try {
    const clients = ['BPI', 'EON BANK', 'USB PLC', 'BPI BANKO', 'CITIBANK', 'HSBC'];
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: error.message });
  }
});

export { router as userRoutes };
