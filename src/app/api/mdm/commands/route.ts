import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface MDMCommandRequest {
  deviceId: string;
  command: 'lock' | 'wipe' | 'update_policy' | 'check_compliance';
  parameters?: any;
  userId?: string;
}

// POST /api/mdm/commands - Send MDM command to device
export async function POST(request: NextRequest) {
  try {
    const body: MDMCommandRequest = await request.json();
    const { deviceId, command, parameters, userId } = body;

    if (!deviceId || !command) {
      return NextResponse.json(
        { error: 'Device ID and command are required' },
        { status: 400 }
      );
    }

    // Validate command type
    const validCommands = ['lock', 'wipe', 'update_policy', 'check_compliance'];
    if (!validCommands.includes(command)) {
      return NextResponse.json(
        { error: 'Invalid command type' },
        { status: 400 }
      );
    }

    // Check if device is enrolled in MDM
    const deviceResult = await query(
      'SELECT id, user_id, status FROM mdm_devices WHERE device_id = $1',
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found in MDM' },
        { status: 404 }
      );
    }

    const device = deviceResult.rows[0];

    if (device.status !== 'active') {
      return NextResponse.json(
        { error: 'Device is not active in MDM' },
        { status: 403 }
      );
    }

    // Check authorization (user can only command their own devices, or admin can command any)
    if (userId && device.user_id !== userId) {
      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0 || userResult.rows[0].role !== 'admin') {
        return NextResponse.json(
          { error: 'Unauthorized to send commands to this device' },
          { status: 403 }
        );
      }
    }

    // Insert command into database
    const commandResult = await query(
      `INSERT INTO mdm_commands (
        device_id, command, parameters, status, created_at, created_by
      ) VALUES ($1, $2, $3, 'pending', NOW(), $4)
      RETURNING id, created_at`,
      [device.id, command, parameters ? JSON.stringify(parameters) : null, userId]
    );

    const commandId = commandResult.rows[0].id;
    const createdAt = commandResult.rows[0].created_at;

    // Log command event
    await query(
      'INSERT INTO security_events (user_id, event_type, details, severity, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId || device.user_id, 'mdm_command_sent', { deviceId, command, commandId }, command === 'wipe' ? 'critical' : 'high']
    );

    // For immediate execution commands, mark as executed
    // In a real implementation, this would be handled by a push notification or polling mechanism
    if (command === 'check_compliance') {
      await query(
        'UPDATE mdm_commands SET status = $1, executed_at = NOW() WHERE id = $2',
        ['executed', commandId]
      );
    }

    return NextResponse.json({
      success: true,
      commandId,
      deviceId,
      command,
      status: 'pending',
      createdAt,
      message: `MDM command '${command}' sent to device`,
    });

  } catch (error) {
    console.error('MDM command error:', error);
    return NextResponse.json(
      { error: 'Failed to send MDM command' },
      { status: 500 }
    );
  }
}

// GET /api/mdm/commands - Get pending commands for a device
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deviceId = searchParams.get('deviceId');

    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    // Get device from database
    const deviceResult = await query(
      'SELECT id FROM mdm_devices WHERE device_id = $1 AND status = $2',
      [deviceId, 'active']
    );

    if (deviceResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Device not found or not active in MDM' },
        { status: 404 }
      );
    }

    const deviceDbId = deviceResult.rows[0].id;

    // Get pending commands
    const commandsResult = await query(
      `SELECT id, command, parameters, created_at, created_by
       FROM mdm_commands
       WHERE device_id = $1 AND status = 'pending'
       ORDER BY created_at ASC`,
      [deviceDbId]
    );

    const commands = commandsResult.rows.map((cmd: Record<string, unknown>) => ({
      id: cmd.id,
      command: cmd.command,
      parameters: cmd.parameters ? JSON.parse(cmd.parameters as string) : null,
      createdAt: cmd.created_at,
      createdBy: cmd.created_by,
    }));

    return NextResponse.json({
      deviceId,
      commands,
      count: commands.length,
    });

  } catch (error) {
    console.error('MDM commands fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MDM commands' },
      { status: 500 }
    );
  }
}

// PUT /api/mdm/commands/{id} - Update command status (mark as executed)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commandId = searchParams.get('id');

    if (!commandId) {
      return NextResponse.json(
        { error: 'Command ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, result } = body;

    if (!status || !['executed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status (executed or failed) is required' },
        { status: 400 }
      );
    }

    // Update command status
    const updateResult = await query(
      `UPDATE mdm_commands
       SET status = $1, executed_at = NOW(), result = $2
       WHERE id = $3 AND status = 'pending'
       RETURNING id, command, device_id`,
      [status, result ? JSON.stringify(result) : null, commandId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Command not found or already executed' },
        { status: 404 }
      );
    }

    const command = updateResult.rows[0];

    // Log command execution
    await query(
      'INSERT INTO security_events (event_type, details, severity, created_at) VALUES ($1, $2, $3, NOW())',
      ['mdm_command_executed', { commandId, command: command.command, status, result }, status === 'failed' ? 'high' : 'low']
    );

    return NextResponse.json({
      success: true,
      commandId,
      status,
      executedAt: new Date(),
      message: `Command ${status} successfully`,
    });

  } catch (error) {
    console.error('MDM command update error:', error);
    return NextResponse.json(
      { error: 'Failed to update command status' },
      { status: 500 }
    );
  }
}