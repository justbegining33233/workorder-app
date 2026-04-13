import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface SecurityEvent {
  id?: string;
  userId?: string;
  eventType: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

// POST /api/security/events - Log security event
export async function POST(request: NextRequest) {
  try {
    const body: SecurityEvent = await request.json();
    const { userId, eventType, details, severity } = body;

    if (!eventType || !severity) {
      return NextResponse.json(
        { error: 'Event type and severity are required' },
        { status: 400 }
      );
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid severity level' },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown';

    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Insert security event
    const eventResult = await query(
      `INSERT INTO security_events (
        user_id, event_type, details, severity, ip_address, user_agent, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, created_at`,
      [
        userId || null,
        eventType,
        details ? JSON.stringify(details) : null,
        severity,
        ipAddress,
        userAgent,
      ]
    );

    const eventId = eventResult.rows[0].id;
    const createdAt = eventResult.rows[0].created_at;

    // Check for suspicious activity patterns
    if (severity === 'high' || severity === 'critical') {
      await checkForSecurityThreats(userId, eventType, details);
    }

    return NextResponse.json({
      success: true,
      eventId,
      createdAt,
      message: 'Security event logged successfully',
    });

  } catch (error) {
    console.error('Security event logging error:', error);
    return NextResponse.json(
      { error: 'Failed to log security event' },
      { status: 500 }
    );
  }
}

// GET /api/security/events - Get security events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query conditions
    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    if (userId) {
      whereConditions.push(`user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    if (eventType) {
      whereConditions.push(`event_type = $${paramIndex}`);
      queryParams.push(eventType);
      paramIndex++;
    }

    if (severity) {
      whereConditions.push(`severity = $${paramIndex}`);
      queryParams.push(severity);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get events
    const eventsResult = await query(
      `SELECT id, user_id, event_type, details, severity, ip_address, user_agent, created_at
       FROM security_events
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...queryParams, limit, offset]
    );

    // Get total count
    const countResult = await query(
      `SELECT COUNT(*) as total FROM security_events ${whereClause}`,
      queryParams
    );

    const events = eventsResult.rows.map((event: Record<string, unknown>) => ({
      id: event.id,
      userId: event.user_id,
      eventType: event.event_type,
      details: event.details ? JSON.parse(event.details as string) : null,
      severity: event.severity,
      ipAddress: event.ip_address,
      userAgent: event.user_agent,
      createdAt: event.created_at,
    }));

    return NextResponse.json({
      events,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset,
    });

  } catch (error) {
    console.error('Security events fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security events' },
      { status: 500 }
    );
  }
}

// Check for security threats and patterns
async function checkForSecurityThreats(userId: string | undefined, eventType: string, details: any) {
  try {
    // Check for multiple failed login attempts
    if (eventType === 'login_failed' && userId) {
      const recentFailures = await query(
        `SELECT COUNT(*) as count FROM security_events
         WHERE user_id = $1 AND event_type = 'login_failed'
         AND created_at > NOW() - INTERVAL '15 minutes'`,
        [userId]
      );

      if (recentFailures.rows[0].count >= 5) {
        // Log potential brute force attack
        await query(
          'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [userId, 'potential_brute_force', { failureCount: recentFailures.rows[0].count }, 'critical']
        );

        // Could trigger additional security measures like account lockout
      }
    }

    // Check for suspicious login locations
    if (eventType === 'login_success' && userId && details?.ipAddress) {
      // Get recent login locations
      const recentLogins = await query(
        `SELECT DISTINCT ip_address FROM security_events
         WHERE user_id = $1 AND event_type = 'login_success'
         AND created_at > NOW() - INTERVAL '30 days'
         ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );

      const knownIPs = recentLogins.rows.map((row: Record<string, unknown>) => row.ip_address);
      if (!knownIPs.includes(details.ipAddress)) {
        // Log suspicious login location
        await query(
          'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [userId, 'suspicious_login_location', { newIP: details.ipAddress, knownIPs }, 'high']
        );
      }
    }

    // Check for rapid password changes
    if (eventType === 'password_changed' && userId) {
      const recentChanges = await query(
        `SELECT COUNT(*) as count FROM security_events
         WHERE user_id = $1 AND event_type = 'password_changed'
         AND created_at > NOW() - INTERVAL '1 hour'`,
        [userId]
      );

      if (recentChanges.rows[0].count >= 3) {
        await query(
          'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [userId, 'rapid_password_changes', { changeCount: recentChanges.rows[0].count }, 'high']
        );
      }
    }

  } catch (error) {
    console.error('Security threat check failed:', error);
  }
}

// DELETE /api/security/events - Delete old security events (cleanup)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysOld = parseInt(searchParams.get('daysOld') || '90');

    if (daysOld < 30) {
      return NextResponse.json(
        { error: 'Cannot delete events less than 30 days old' },
        { status: 400 }
      );
    }

    // Delete old events (keep critical events longer)
    const deleteResult = await query(
      `DELETE FROM security_events
       WHERE created_at < NOW() - INTERVAL '${daysOld} days'
       AND severity IN ('low', 'medium')
       AND event_type NOT IN ('device_wiped', 'account_locked', 'admin_action')`,
      []
    );

    return NextResponse.json({
      success: true,
      deletedCount: deleteResult.rowCount,
      message: `Deleted ${deleteResult.rowCount} old security events`,
    });

  } catch (error) {
    console.error('Security events cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup security events' },
      { status: 500 }
    );
  }
}