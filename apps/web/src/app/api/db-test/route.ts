import { NextResponse } from 'next/server';
import { checkDatabaseSetup, getDatabaseStats } from '../../../lib/check-database';

export async function GET() {
  try {
    const [tableStatus, stats] = await Promise.all([
      checkDatabaseSetup(),
      getDatabaseStats()
    ]);

    return NextResponse.json({
      success: true,
      tables: tableStatus,
      stats,
      message: 'Database connection successful'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Database connection failed'
    }, { status: 500 });
  }
}