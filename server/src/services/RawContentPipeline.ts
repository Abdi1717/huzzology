/**
 * Raw Content Processing Pipeline (Stub)
 *
 * Converts entries from the `raw_contents` table into structured
 * `content_examples` records and attaches them to existing archetypes.  This
 * first-pass implementation focuses on the wiring (DB + queue) while the heavy
 * NLP / embedding work will be added in later subtasks.
 */

// @ts-ignore – bull type declarations not installed in monorepo; acceptable for stub
import Bull from 'bull';
import { db } from '../database/connection';
import {
  rawContents as rawContentsTbl,
  contentExamples as contentExamplesTbl,
  NewContentExample,
} from '../database/schema';
import { errorLogger } from '../utils/errorLogger';

// ---------------------------------------------------------------------------
// Queue setup
// ---------------------------------------------------------------------------

const rawProcessingQueue = new Bull('raw-content-processing', {
  redis: process.env.REDIS_URL || 'redis://localhost:6379',
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Enqueue a raw_content row for processing */
export async function enqueueRawContent(rawContentId: string): Promise<void> {
  await rawProcessingQueue.add({ rawContentId });
}

/** Kick-off a batch job for all unprocessed rows (helper for cron/tasks) */
export async function enqueueUnprocessedBatch(limit = 100): Promise<number> {
  const rows = await db
    .select()
    .from(rawContentsTbl)
    .where(rawContentsTbl.processed_at.isNull())
    .limit(limit);

  for (const row of rows) {
    await enqueueRawContent(row.id);
  }
  return rows.length;
}

// ---------------------------------------------------------------------------
// Worker logic
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
rawProcessingQueue.process(async (job: any) => {
  const { rawContentId } = job.data as { rawContentId: string };
  try {
    const [raw] = await db
      .select()
      .from(rawContentsTbl)
      .where(rawContentsTbl.id.eq(rawContentId));

    if (!raw) throw new Error(`raw_content ${rawContentId} not found`);
    if (raw.processed_at) return; // already processed

    // Placeholder normalisation: store raw HTML into content_data, no parsing
    const contentExample: NewContentExample = {
      id: undefined, // auto UUID in DB default
      archetype_id: null, // unknown until classification step
      platform: raw.platform,
      platform_id: null,
      url: raw.url,
      content_data: { html: raw.raw_payload },
      caption: null,
      media_type: null,
      engagement_metrics: {},
      creator_data: {},
      classification_results: {},
      confidence_score: null,
      moderation_status: 'pending',
      is_featured: false,
      content_created_at: null,
      scraped_at: raw.scraped_at,
    } as unknown as NewContentExample;

    await db.insert(contentExamplesTbl).values(contentExample);

    await db
      .update(rawContentsTbl)
      .set({ processed_at: new Date() })
      .where(rawContentsTbl.id.eq(rawContentId));
  } catch (err) {
    errorLogger.logError(err as Error, 'error', undefined, {
      scope: 'RawContentPipeline',
      rawContentId,
    });
    throw err;
  }
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
// @ts-ignore – Node globals may be absent in TS lib list
process.on('SIGINT', async () => {
  await rawProcessingQueue.close();
});
// @ts-ignore
process.on('SIGTERM', async () => {
  await rawProcessingQueue.close();
});