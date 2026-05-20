import { db, readingsTable } from '@workspace/db';
import { and, desc, eq } from 'drizzle-orm';
import { Router, type IRouter } from 'express';

const router: IRouter = Router();

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    const rows = await db
      .select()
      .from(readingsTable)
      .where(eq(readingsTable.userId, userId))
      .orderBy(desc(readingsTable.createdAt));

    const readings = rows.map(r => ({
      id: r.id,
      userId: r.userId,
      imageUri: r.imageUri,
      hand: r.hand,
      dob: r.dob ?? undefined,
      language: r.language ?? undefined,
      createdAt: r.createdAt.toISOString(),
      analysis: r.analysis,
    }));

    res.json({ readings });
  } catch (error) {
    console.error('Get readings error:', error);
    res.status(500).json({ error: 'Failed to fetch readings' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { id, userId, imageUri, hand, dob, language, analysis, createdAt } = req.body;
    if (!id || !userId || !analysis) {
      res.status(400).json({ error: 'id, userId and analysis are required' });
      return;
    }

    const [inserted] = await db
      .insert(readingsTable)
      .values({
        id,
        userId,
        imageUri: imageUri ?? '',
        hand: hand ?? 'right',
        dob: dob ?? null,
        language: language ?? null,
        analysis,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      })
      .onConflictDoNothing()
      .returning();

    const row = inserted;
    res.status(201).json({
      reading: row ? {
        id: row.id, userId: row.userId, imageUri: row.imageUri,
        hand: row.hand, dob: row.dob ?? undefined, language: row.language ?? undefined,
        createdAt: row.createdAt.toISOString(), analysis: row.analysis,
      } : null,
    });
  } catch (error) {
    console.error('Create reading error:', error);
    res.status(500).json({ error: 'Failed to save reading' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, analysis, language } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const updates: Partial<typeof readingsTable.$inferInsert> = {};
    if (analysis !== undefined) updates.analysis = analysis;
    if (language !== undefined) updates.language = language;

    const [updated] = await db
      .update(readingsTable)
      .set(updates)
      .where(and(eq(readingsTable.id, id), eq(readingsTable.userId, userId)))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Reading not found' });
      return;
    }

    res.json({
      reading: {
        id: updated.id, userId: updated.userId, imageUri: updated.imageUri,
        hand: updated.hand, dob: updated.dob ?? undefined, language: updated.language ?? undefined,
        createdAt: updated.createdAt.toISOString(), analysis: updated.analysis,
      },
    });
  } catch (error) {
    console.error('Update reading error:', error);
    res.status(500).json({ error: 'Failed to update reading' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query as { userId?: string };
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    await db
      .delete(readingsTable)
      .where(and(eq(readingsTable.id, id), eq(readingsTable.userId, userId)));

    res.json({ success: true });
  } catch (error) {
    console.error('Delete reading error:', error);
    res.status(500).json({ error: 'Failed to delete reading' });
  }
});

export default router;
