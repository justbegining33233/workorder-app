import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface MDMEnrollmentRequest {
  deviceId: string;
  deviceInfo: {
    platform: string;
    model: string;
    operatingSystem: string;
    osVersion: string;
    manufacturer: string;
    isVirtual: boolean;
  };
  userId?: string;
}

interface MDMCommand {
  id: string;
  deviceId: string;
  command: 'lock' | 'wipe' | 'update_policy' | 'check_compliance';
  parameters?: any;
  status: 'pending' | 'executed' | 'failed';
  createdAt: Date;
  executedAt?: Date;
}

// POST /api/mdm/enroll - Enroll a device in MDM
export async function POST(request: NextRequest) {
  try {
    const body: MDMEnrollmentRequest = await request.json();
    const { deviceId, deviceInfo, userId } = body;

    if (!deviceId || !deviceInfo) {
      return NextResponse.json(
        { error: 'Device ID and device info are required' },
        { status: 400 }
      );
    }

    // Check if device is already enrolled
    const existingDevice = await query(
      'SELECT id FROM mdm_devices WHERE device_id = $1',
      [deviceId]
    );

    if (existingDevice.rows.length > 0) {
      return NextResponse.json(
        { error: 'Device is already enrolled in MDM' },
        { status: 409 }
      );
    }

    // Insert device into MDM
    const enrollmentResult = await query(
      `INSERT INTO mdm_devices (
        device_id, platform, model, operating_system, os_version,
        manufacturer, is_virtual, enrolled_at, status, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'active', $8)
      RETURNING id`,
      [
        deviceId,
        deviceInfo.platform,
        deviceInfo.model,
        deviceInfo.operatingSystem,
        deviceInfo.osVersion,
        deviceInfo.manufacturer,
        deviceInfo.isVirtual,
        userId || null,
      ]
    );

    const deviceDbId = enrollmentResult.rows[0].id;

    // Get default MDM policies
    const policiesResult = await query(
      'SELECT id, name, description, config FROM mdm_policies WHERE enabled = true'
    );

    // Apply policies to device
    for (const policy of policiesResult.rows) {
      await query(
        `INSERT INTO mdm_device_policies (device_id, policy_id, applied_at)
         VALUES ($1, $2, NOW())`,
        [deviceDbId, policy.id]
      );
    }

    // Log enrollment event
    await query(
      'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, 'device_enrolled', { deviceId, deviceInfo }, 'low']
    );

    return NextResponse.json({
      success: true,
      deviceId: deviceDbId,
      enrolledAt: new Date(),
      policies: policiesResult.rows,
      message: 'Device successfully enrolled in MDM',
    });

  } catch (error) {
    console.error('MDM enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll device' },
      { status: 500 }
    );
  }
}

// DELETE /api/mdm/unenroll - Unenroll a device from MDM
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');
    const userId = searchParams.get('userId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Check if device exists and is enrolled
    const deviceResult = await query(
      'SELECT id, user_id FROM mdm_devices WHERE device_id = $1 AND status = $2',
      [deviceId, 'active']
    );

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found or not enrolled' },
        { status: 404 }
      );
    }

    const device = deviceResult.rows[0];

    // Check authorization (user can only unenroll their own devices, or admin can unenroll any)
    if (userId && device.user_id !== userId) {
      // Check if user is admin
      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to unenroll this device' },
          { status: 403 }
        );
      }
    }

    // Remove device policies
    await query(
      'DELETE FROM mdm_device_policies WHERE device_id = $1',
      [device.id]
    );

    // Update device status to unenrolled
    await query(
      'UPDATE mdm_devices SET status = $1, unenrolled_at = NOW() WHERE id = $2',
      ['unenrolled', device.id]
    );

    // Log unenrollment event
    await query(
      'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId || device.user_id, 'device_unenrolled', { deviceId }, 'medium']
    );

    return NextResponse.json({
      success: true,
      message: 'Device successfully unenrolled from MDM',
    });

  } catch (error) {
    console.error('MDM unenrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to unenroll device' },
      { status: 500 }
    );
  }
}