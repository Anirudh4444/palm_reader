import { db, usersTable } from '@workspace/db';
import { eq } from 'drizzle-orm';
import { Router, type IRouter } from 'express';

const router: IRouter = Router();

function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function sanitizeUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, dob: u.dob, gender: u.gender };
}

router.post('/register', async (req, res) => {
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

    const existing = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      return;
    }

    const newUser = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash: simpleHash(password),
      dob: dob || null,
      gender: gender || null,
    };

    const [inserted] = await db.insert(usersTable).values(newUser).returning();
    res.status(201).json({ user: sanitizeUser(inserted) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase().trim()))
      .limit(1);

    if (!user || user.passwordHash !== simpleHash(password)) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

router.patch('/profile', async (req, res) => {
  try {
    const { userId, name, dob, gender } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const updates: Partial<typeof usersTable.$inferInsert> = {};
    if (name) updates.name = name.trim();
    if (dob !== undefined) updates.dob = dob;
    if (gender !== undefined) updates.gender = gender;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user: sanitizeUser(updated) });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

export default router;
