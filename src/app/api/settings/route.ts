import { sql } from '@/server-lib/neon';
import { NextResponse } from 'next/server';
import type { KitchenSettings } from '@/shared/models/breakfast';

// Mock settings for development without database
// Note: For demo purposes, kitchen is always "open" to allow testing
const MOCK_SETTINGS: KitchenSettings = {
  service_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  service_start_hour: 0,   // Midnight (allows demo testing anytime)
  service_end_hour: 24,    // Midnight next day (allows demo testing anytime)
};

// Display hours shown to users (actual breakfast service hours)
const DISPLAY_HOURS = {
  service_start_hour: 8,   // 8am
  service_end_hour: 13,    // 1pm
};

export async function GET() {
  try {
    const rows = await sql`
      SELECT key, value FROM kitchen_settings 
      WHERE key IN ('service_days', 'service_start_hour', 'service_end_hour')
    ` as unknown as Array<{ key: string; value: string }>;

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
      service_end_hour: parseInt(settingsMap.get('service_end_hour') ?? '13', 10),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch settings, using mock data:', error);
    // Return mock data when database is not available
    return NextResponse.json(MOCK_SETTINGS);
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
      // Use upsert: insert or update based on conflict
      await sql`
        INSERT INTO kitchen_settings (key, value) 
        VALUES ('service_days', ${JSON.stringify(service_days)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }

    if (service_start_hour !== undefined) {
      const hour = Number(service_start_hour);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'Invalid start hour' }, { status: 400 });
      }
      await sql`
        INSERT INTO kitchen_settings (key, value) 
        VALUES ('service_start_hour', ${String(hour)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }

    if (service_end_hour !== undefined) {
      const hour = Number(service_end_hour);
      if (isNaN(hour) || hour < 0 || hour > 23) {
        return NextResponse.json({ error: 'Invalid end hour' }, { status: 400 });
      }
      await sql`
        INSERT INTO kitchen_settings (key, value) 
        VALUES ('service_end_hour', ${String(hour)})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
      `;
    }

    // Return updated settings
    const rows = await sql`
      SELECT key, value FROM kitchen_settings 
      WHERE key IN ('service_days', 'service_start_hour', 'service_end_hour')
    ` as unknown as Array<{ key: string; value: string }>;

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
      service_end_hour: parseInt(settingsMap.get('service_end_hour') ?? '13', 10),
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
