import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'corridors.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    const corridors = JSON.parse(data);
    return NextResponse.json(corridors);
  } catch (error) {
    console.error('Failed to load corridors:', error);
    return NextResponse.json(
      { error: 'Failed to load corridor data' },
      { status: 500 }
    );
  }
}
