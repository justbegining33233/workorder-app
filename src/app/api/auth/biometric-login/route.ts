import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

interface BiometricLoginRequest {
  userId: string;
  deviceToken: string;
  deviceId: string;
  biometryType: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: BiometricLoginRequest = await request.json();
    const { userId, deviceToken, deviceId, biometryType } = body;

    // Validate required fields
    if (!userId || !deviceToken || !deviceId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user exists and is active
    const userResult = await query(
      'SELECT id, email, name, role, status, biometric_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Account is not active' },
        { status: 403 }
      );
    }

    // Check if biometric authentication is enabled for this user
    if (!user.biometric_enabled) {
      return NextResponse.json(
        { error: 'Biometric authentication not enabled for this account' },
        { status: 403 }
      );
    }

    // Verify device token (in a real implementation, this would be more sophisticated)
    const deviceResult = await query(
      'SELECT id, device_id, device_token, last_used, trusted FROM user_devices WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not registered for biometric authentication' },
        { status: 403 }
      );
    }

    const device = deviceResult.rows[0];

    // Check if device is trusted
    if (!device.trusted) {
      return NextResponse.json(
        { error: 'Device not trusted for biometric authentication' },
        { status: 403 }
      );
    }

    // Verify device token matches (simplified - in reality would use secure comparison)
    if (device.device_token !== deviceToken) {
      // Log suspicious activity
      await query(
        'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [userId, 'biometric_token_mismatch', { deviceId, biometryType }, 'high']
      );

      return NextResponse.json(
        { error: 'Invalid device token' },
        { status: 403 }
      );
    }

    // Update device last used timestamp
    await query(
      'UPDATE user_devices SET last_used = NOW() WHERE id = $1',
      [device.id]
    );

    // Log successful biometric authentication
    await query(
      'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, 'biometric_login_success', { deviceId, biometryType }, 'low']
    );

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        deviceId,
        biometryType,
        loginMethod: 'biometric',
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      device: {
        id: deviceId,
        biometryType,
        lastUsed: new Date(),
      },
    });

  } catch (error: unknown) {
    console.error('Biometric login error:', error);

    // Log error event
    try {
      const body = await request.json().catch(() => ({}));
      await query(
        'INSERT INTO security_events (event_type, details, severity, created_at) VALUES ($1, $2, $3, NOW())',
        ['biometric_login_error', { error: error instanceof Error ? error.message : String(error), userId: body.userId }, 'medium']
      );
    } catch {
      // Ignore logging error
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check biometric login capability
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required' },
        { status: 400 }
      );
    }

    // Check if user has biometric authentication enabled
    const userResult = await query(
      'SELECT biometric_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const biometricEnabled = userResult.rows[0].biometric_enabled;

    // Get registered devices for biometric auth
    const devicesResult = await query(
      'SELECT device_id, device_name, biometry_type, last_used, trusted FROM user_devices WHERE user_id = $1 AND trusted = true ORDER BY last_used DESC',
      [userId]
    );

    return NextResponse.json({
      biometricEnabled,
      registeredDevices: devicesResult.rows.map((device: Record<string, unknown>) => ({
        deviceId: device.device_id,
        deviceName: device.device_name,
        biometryType: device.biometry_type,
        lastUsed: device.last_used,
        trusted: device.trusted,
      })),
    });

  } catch (error) {
    console.error('Biometric capability check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}