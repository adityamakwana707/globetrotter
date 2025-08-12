import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    name: "Globetrotter Travel Planner",
    description: "A comprehensive trip planning application",
    version: "1.0.0"
  })
}
