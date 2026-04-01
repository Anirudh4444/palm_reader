import { Router, type IRouter } from 'express';
import fs from 'fs';
import path from 'path';

const router: IRouter = Router();

type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  dob?: string;
  gender?: string;
  createdAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUsers(): StoredUser[] {
  ensureDataDir();
  try {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function sanitizeUser(u: StoredUser) {
  return { id: u.id, name: u.name, email: u.email, dob: u.dob, gender: u.gender };
}

router.post('/register', (req, res) => {
  try {
    const { name, email, password, dob, gender } = req.body;

    if (!name?.trim() || !email?.trim() || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const users = readUsers();
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (exists) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    const newUser: StoredUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: simpleHash(password),
      dob: dob || undefined,
      gender: gender || undefined,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ user: sanitizeUser(newUser) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const users = readUsers();
    const user = users.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
        && u.passwordHash === simpleHash(password)
    );

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.patch('/profile', (req, res) => {
  try {
    const { userId, name, dob, gender } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const users = readUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx < 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (name) users[idx].name = name.trim();
    if (dob !== undefined) users[idx].dob = dob;
    if (gender !== undefined) users[idx].gender = gender;
    writeUsers(users);

    res.json({ user: sanitizeUser(users[idx]) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

export default router;
