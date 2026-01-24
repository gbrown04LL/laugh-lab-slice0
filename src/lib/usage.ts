import getDb from './db';
import { usageTracking } from './db/schema';
import { eq } from 'drizzle-orm';

const FREE_TIER_LIMIT = 2;

function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export async function checkUsageLimit(identifier: string): Promise<{
  allowed: boolean;
  remaining: number;
  limit: number;
  reason?: string;
}> {
  const db = getDb();
  const monthKey = getCurrentMonthKey();
  
  const existing = await db.query.usageTracking.findFirst({
    where: eq(usageTracking.identifier, identifier),
  });

  if (!existing) {
    // First time user
    return { allowed: true, remaining: FREE_TIER_LIMIT, limit: FREE_TIER_LIMIT };
  }

  // Check if it's a new month
  if (existing.monthKey !== monthKey) {
    // Reset for new month
    await db.update(usageTracking)
      .set({ monthlyCount: 0, monthKey, updatedAt: new Date() })
      .where(eq(usageTracking.identifier, identifier));
    return { allowed: true, remaining: FREE_TIER_LIMIT, limit: FREE_TIER_LIMIT };
  }

  const count = existing.monthlyCount ?? 0;
  const remaining = Math.max(0, FREE_TIER_LIMIT - count);

  if (count >= FREE_TIER_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      limit: FREE_TIER_LIMIT,
      reason: `You've used all ${FREE_TIER_LIMIT} free analyses this month. Upgrade to continue.`,
    };
  }

  return { allowed: true, remaining, limit: FREE_TIER_LIMIT };
}

export async function incrementUsage(identifier: string): Promise<void> {
  const db = getDb();
  const monthKey = getCurrentMonthKey();
  
  const existing = await db.query.usageTracking.findFirst({
    where: eq(usageTracking.identifier, identifier),
  });

  if (!existing) {
    await db.insert(usageTracking).values({
      identifier,
      monthlyCount: 1,
      monthKey,
    });
  } else {
    await db.update(usageTracking)
      .set({ 
        monthlyCount: (existing.monthlyCount ?? 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(usageTracking.identifier, identifier));
  }
}
