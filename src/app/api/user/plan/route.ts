import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Check if user is authenticated
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    // Fetch user plan details from database
    const { data: user, error } = await supabase
      .from('users')
      .select('id, plan, story_count, upgraded_at')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching user plan:', error);
      return NextResponse.json({ error: 'Failed to fetch plan details' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Return plan details in the same format as getUserPlanDetails
    const planDetails = {
      plan: user.plan || 'free',
      story_count: user.story_count || 0,
      upgraded_at: user.upgraded_at,
      canCreateStory: user.plan === 'pro' || (user.story_count || 0) < 5,
      storiesRemaining: user.plan === 'pro' ? Infinity : Math.max(0, 5 - (user.story_count || 0)),
      isProPlan: user.plan === 'pro'
    };

    return NextResponse.json(planDetails);

  } catch (error) {
    console.error('Plan fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 