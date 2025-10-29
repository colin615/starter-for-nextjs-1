import { NextResponse } from 'next/server';
import { createServerClient, getLoggedInUser } from '@/lib/server/supabase';
import { revokeToken } from '@/lib/kick-oauth';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    // Check if user is authenticated
    const user = await getLoggedInUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createServerClient();

    // Get the Kick connection
    const { data: connection, error: fetchError } = await supabase
      .from('oauth_connections')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'kick')
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: 'Kick connection not found' },
        { status: 404 }
      );
    }

    // Try to revoke the token (optional, don't fail if it doesn't work)
    try {
      if (connection.access_token) {
        await revokeToken(connection.access_token, 'access_token');
      }
      if (connection.refresh_token) {
        await revokeToken(connection.refresh_token, 'refresh_token');
      }
    } catch (revokeError) {
      console.error('Failed to revoke tokens (continuing with deletion):', revokeError);
      // Continue with deletion even if token revocation fails
    }

    // Delete the connection from database
    const { error: deleteError } = await supabase
      .from('oauth_connections')
      .delete()
      .eq('id', connection.id);

    if (deleteError) {
      console.error('Error deleting Kick connection:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Kick connection deleted successfully'
    });
  } catch (error) {
    console.error('Kick unlink error:', error);
    return NextResponse.json(
      { error: 'An error occurred while unlinking Kick' },
      { status: 500 }
    );
  }
}

