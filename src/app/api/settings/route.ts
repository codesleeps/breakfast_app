import { queryInternalDatabase } from '@/server-lib/internal-db-query';
import { NextResponse } from 'next/server';
import type { KitchenSettings } from '@/shared/models/breakfast';

export async function GET() {
  try {
    const rows = await queryInternalDatabase(
      'SELECT key, value FROM kitchen_settings WHERE key IN ($1, $2, $3)',
      ['service_days', 'service_start_hour', 'service_end_hour']
    ) as unknown as Array<{ key: string; value: string }>;

    const settingsMap = new Map(rows.map(r => [r.key, r.value]));

    const serviceDaysRaw = settingsMap.get('service_days');
    let serviceDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (serviceDaysRaw) {
      try {
        serviceDays = JSON.parse(serviceDaysRaw);
      } catch {
        // fallback to default
      }
    }

    const settings: KitchenSettings = {
      service_days: serviceDays,
      service_start_hour: parseInt(settingsMap.get('service_start_hour') ?? '8', 10),
      service_end_hour: parseInt(settingsMap.get('service_end_hour') ?? '11', 10),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    // Verify staff PIN from header
    const pin = request.headers.get('x-staff-pin');
    if (pin !== '2024') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { service_days, service_start_hour, service_end_hour } = body;

    if (service_days !== undefined) {
      if (!Array.isArray(service_days)) {
        return NextResponse.json({ error: 'service_days must be an array' }, { status: 400 });
      }
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of service_days) {
        if (!validDays.includes(day)) {
          return NextResponse.json({ error: `Invalid day: ${day}` }, { status: 400 });
        }
      }
      await queryInternalDatabase(
        'UPDATE kitchen_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [JSON.stringify(service_days), 'service_days']
      );
    }

    if (service_start_hour !== undefined) {
      const hour = Number(service_start_hour);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'Invalid start hour' }, { status: 400 });
      }
      await queryInternalDatabase(
        'UPDATE kitchen_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [String(hour), 'service_start_hour']
      );
    }

    if (service_end_hour !== undefined) {
      const hour = Number(service_end_hour);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'Invalid end hour' }, { status: 400 });
      }
      await queryInternalDatabase(
        'UPDATE kitchen_settings SET value = $1, updated_at = NOW() WHERE key = $2',
        [String(hour), 'service_end_hour']
      );
    }

    // Return updated settings
    const rows = await queryInternalDatabase(
      'SELECT key, value FROM kitchen_settings WHERE key IN ($1, $2, $3)',
      ['service_days', 'service_start_hour', 'service_end_hour']
    ) as unknown as Array<{ key: string; value: string }>;

    const settingsMap = new Map(rows.map(r => [r.key, r.value]));

    const serviceDaysRaw = settingsMap.get('service_days');
    let finalDays: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (serviceDaysRaw) {
      try {
        finalDays = JSON.parse(serviceDaysRaw);
      } catch {
        // fallback
      }
    }

    const settings: KitchenSettings = {
      service_days: finalDays,
      service_start_hour: parseInt(settingsMap.get('service_start_hour') ?? '8', 10),
      service_end_hour: parseInt(settingsMap.get('service_end_hour') ?? '11', 10),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
