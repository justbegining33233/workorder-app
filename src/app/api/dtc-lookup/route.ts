import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateRequest } from '@/lib/auth';

// Common DTC codes database (subset)
const DTC_DB: Record<string, { system: string; description: string; causes: string[]; fixes: string[]; severity: string }> = {
  P0100: { system: 'Engine', description: 'Mass Air Flow (MAF) Sensor Circuit Malfunction', causes: ['Dirty/faulty MAF sensor', 'Air leaks in intake', 'Wiring issues'], fixes: ['Clean or replace MAF sensor', 'Check intake for leaks', 'Inspect wiring harness'], severity: 'moderate' },
  P0171: { system: 'Engine', description: 'System Too Lean (Bank 1)', causes: ['Vacuum leak', 'Weak fuel pump', 'Dirty MAF or O2 sensor'], fixes: ['Check for vacuum leaks', 'Test fuel pressure', 'Clean MAF sensor'], severity: 'moderate' },
  P0300: { system: 'Engine', description: 'Random/Multiple Cylinder Misfire Detected', causes: ['Worn spark plugs', 'Bad ignition coils', 'Fuel injector failure', 'Low compression'], fixes: ['Replace spark plugs', 'Test/replace ignition coils', 'Check fuel injectors'], severity: 'severe' },
  P0420: { system: 'Emissions', description: 'Catalyst System Efficiency Below Threshold (Bank 1)', causes: ['Failing catalytic converter', 'O2 sensor issues', 'Exhaust leaks'], fixes: ['Replace catalytic converter', 'Test O2 sensors', 'Check exhaust system'], severity: 'moderate' },
  P0442: { system: 'Evap', description: 'Evaporative Emission Control System Leak Detected (Small Leak)', causes: ['Loose/damaged gas cap', 'Faulty purge valve', 'Cracked EVAP line'], fixes: ['Tighten or replace gas cap', 'Test purge valve', 'Inspect EVAP hoses'], severity: 'minor' },
  P0128: { system: 'Cooling', description: 'Coolant Temperature Below Thermostat Regulating Temperature', causes: ['Faulty thermostat stuck open', 'Coolant temp sensor malfunction'], fixes: ['Replace thermostat', 'Check coolant temperature sensor'], severity: 'moderate' },
  C0035: { system: 'ABS', description: 'Left Front Wheel Speed Sensor Circuit', causes: ['Faulty wheel speed sensor', 'Damaged wiring', 'Dirty sensor'], fixes: ['Replace wheel speed sensor', 'Inspect wiring', 'Clean sensor area'], severity: 'severe' },
  B0001: { system: 'Airbag', description: 'Driver Frontal Stage 1 Deployment Control', causes: ['Faulty airbag clock spring', 'Bad airbag module', 'Wiring issue'], fixes: ['Inspect clock spring', 'Test SRS module', 'Check related wiring'], severity: 'severe' },
  U0100: { system: 'Network', description: 'Lost Communication with ECM/PCM', causes: ['Faulty ECM', 'CAN bus wiring issue', 'Power/ground problem at ECM'], fixes: ['Check ECM power and grounds', 'Inspect CAN bus wiring', 'Test/replace ECM'], severity: 'severe' },
  P0016: { system: 'Engine', description: 'Crankshaft/Camshaft Position Correlation Bank 1 Sensor A', causes: ['Worn timing chain/belt', 'Faulty cam phaser', 'Low oil pressure'], fixes: ['Inspect timing chain', 'Check cam phaser operation', 'Check oil level and pressure'], severity: 'severe' },
};

export async function POST(req: NextRequest) {
  const auth = authenticateRequest(req);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const code = (body.code || '').toUpperCase().trim();
  if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });

  const shopId = auth.role === 'shop' ? auth.id : (auth as any).shopId;
  const techId = auth.role === 'tech' ? auth.id : null;

  // Check DB cache first
  const cached = await prisma.dTCLookup.findFirst({ where: { code }, orderBy: { lookedUpAt: 'desc' } });

  let result;
  if (cached) {
    result = {
      code: cached.code,
      system: cached.system,
      description: cached.description,
      possibleCauses: (() => { try { return cached.possibleCauses ? JSON.parse(cached.possibleCauses) : []; } catch { return []; } })(),
      commonFixes: (() => { try { return cached.commonFixes ? JSON.parse(cached.commonFixes) : []; } catch { return []; } })(),
      severity: cached.severity,
    };
  } else {
    const known = DTC_DB[code];
    if (known) {
      result = { code, ...known };
      await prisma.dTCLookup.create({
        data: {
          code, system: known.system, description: known.description,
          possibleCauses: JSON.stringify(known.causes), commonFixes: JSON.stringify(known.fixes),
          severity: known.severity, shopId: shopId || null, techId,
          workOrderId: body.workOrderId || null,
        },
      });
    } else {
      result = {
        code,
        system: code.startsWith('P') ? 'Powertrain' : code.startsWith('C') ? 'Chassis' : code.startsWith('B') ? 'Body' : code.startsWith('U') ? 'Network' : 'Unknown',
        description: `DTC ${code} — consult your OEM service data for this vehicle-specific code.`,
        possibleCauses: ['See manufacturer service manual', 'Use factory scan tool for enhanced data'],
        commonFixes: ['Dealer diagnosis recommended', 'Check TSBs for this code'],
        severity: 'unknown',
      };
    }
  }

  return NextResponse.json(result);
}
