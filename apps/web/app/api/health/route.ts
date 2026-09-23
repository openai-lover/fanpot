export function GET() { return Response.json({ status: 'degraded', timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } }); }
