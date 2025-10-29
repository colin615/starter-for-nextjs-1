import { NextResponse } from 'next/server';
import { createServerClient, getLoggedInUser } from '@/lib/server/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Check if user is authenticated
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Check if user has Kick connection
    const { data: connection, error } = await supabase
      .from('oauth_connections')
      .select('id')
      .eq('user_id', user.id)
      .eq('provider', 'kick')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      console.error('Error checking Kick connection:', error);
      return NextResponse.json({ connected: false }, { status: 500 });
    }

    return NextResponse.json({ 
      connected: !!connection 
    });
  } catch (error) {
    console.error('Kick status check error:', error);
    return NextResponse.json({ connected: false }, { status: 500 });
  }
}

