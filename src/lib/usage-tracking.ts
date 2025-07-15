import { supabaseClient } from './supabase';

export interface UsageStatus {
  canGenerate: boolean;
  remaining: number | 'unlimited';
  plan: 'free' | 'pro';
  storyCount: number;
}

export interface PlanDetails {
  plan: 'free' | 'pro';
  storyCount: number;
  upgradedAt: string | null;
  polarCustomerId: string | null;
}

export async function checkStoryLimit(userId: string, supabaseAccessToken: string): Promise<UsageStatus> {
  const supabase = supabaseClient(supabaseAccessToken);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, story_count, upgraded_at, polar_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user plan:', error);
    // Default to free plan with no remaining stories on error
    return { canGenerate: false, remaining: 0, plan: 'free', storyCount: 0 };
  }

  const plan = user.plan || 'free';
  const storyCount = user.story_count || 0;

  if (plan === 'pro') {
    return {
      canGenerate: true,
      remaining: 'unlimited',
      plan: 'pro',
      storyCount
    };
  }

  // Free plan logic
  const remaining = Math.max(0, 5 - storyCount);
  return {
    canGenerate: remaining > 0,
    remaining,
    plan: 'free',
    storyCount
  };
}

export async function incrementStoryCount(userId: string, supabaseAccessToken: string): Promise<void> {
  const supabase = supabaseClient(supabaseAccessToken);
  
  // First get current count
  const { data: currentUser, error: fetchError } = await supabase
    .from('users')
    .select('story_count')
    .eq('id', userId)
    .single();

  if (fetchError) {
    console.error('Error fetching current story count:', fetchError);
    throw new Error('Failed to fetch current story count');
  }

  const currentCount = currentUser.story_count || 0;
  
  const { error } = await supabase
    .from('users')
    .update({ story_count: currentCount + 1 })
    .eq('id', userId);

  if (error) {
    console.error('Error incrementing story count:', error);
    throw new Error('Failed to update story count');
  }
}

export async function getUserPlanDetails(userId: string, supabaseAccessToken: string): Promise<PlanDetails> {
  const supabase = supabaseClient(supabaseAccessToken);
  
  const { data: user, error } = await supabase
    .from('users')
    .select('plan, story_count, upgraded_at, polar_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user plan details:', error);
    return {
      plan: 'free',
      storyCount: 0,
      upgradedAt: null,
      polarCustomerId: null
    };
  }

  return {
    plan: user.plan || 'free',
    storyCount: user.story_count || 0,
    upgradedAt: user.upgraded_at,
    polarCustomerId: user.polar_customer_id
  };
}

export async function upgradeUserToPro(userId: string, polarCustomerId: string, supabaseAccessToken: string): Promise<void> {
  const supabase = supabaseClient(supabaseAccessToken);
  
  const { error } = await supabase
    .from('users')
    .update({
      plan: 'pro',
      upgraded_at: new Date().toISOString(),
      polar_customer_id: polarCustomerId
    })
    .eq('id', userId);

  if (error) {
    console.error('Error upgrading user to pro:', error);
    throw new Error('Failed to upgrade user to pro plan');
  }
}

export function formatUsageText(usage: UsageStatus): string {
  if (usage.plan === 'pro') {
    return `Pro Plan - Unlimited stories (${usage.storyCount} generated)`;
  }
  
  return `Free Plan - ${usage.remaining} stories remaining (${usage.storyCount}/5 used)`;
}

export function shouldShowUpgradePrompt(usage: UsageStatus): boolean {
  return usage.plan === 'free' && !usage.canGenerate;
}

export function shouldShowUsageWarning(usage: UsageStatus): boolean {
  return usage.plan === 'free' && typeof usage.remaining === 'number' && usage.remaining <= 1;
} 