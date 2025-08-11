import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getComprehensiveTripDetails } from "@/lib/database"
import { sendEmail } from "@/lib/email"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    const { to } = await request.json()
    const tripId = parseInt(params.id)
    if (!to || typeof to !== 'string') return NextResponse.json({ message: 'Recipient email required' }, { status: 400 })
    if (Number.isNaN(tripId)) return NextResponse.json({ message: 'Invalid trip id' }, { status: 400 })

    const { trip, cities, activities, itinerary } = await getComprehensiveTripDetails(tripId, session.user.id)
    if (!trip) return NextResponse.json({ message: 'Trip not found' }, { status: 404 })

    // Build a beautiful HTML (can be printed to PDF by mailbox client). For real PDF, integrate puppeteer later.
    const html = buildTripHtmlEmail({ trip, cities, activities, itinerary })

    await sendEmail({
      from: 'GlobeTrotter <noreply@globetrotter.com>',
      to,
      subject: `Your Trip: ${trip.name} (${new Date(trip.start_date).toLocaleDateString()} - ${new Date(trip.end_date).toLocaleDateString()})`,
      html
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Email PDF error:', err)
    return NextResponse.json({ message: 'Failed to email trip PDF' }, { status: 500 })
  }
}

function buildTripHtmlEmail({ trip, cities, activities, itinerary }: any) {
  const formatDate = (d: any) => new Date(d).toLocaleDateString()
  const cityList = cities.map((c: any, idx: number) => `
    <div class="city">
      <div class="badge">${idx + 1}</div>
      <div class="city-meta">
        <div class="city-name">${c.name}</div>
        <div class="city-country">${c.country}</div>
        ${(c.latitude && c.longitude) ? `<div class="coords">${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}</div>` : ''}
      </div>
    </div>
  `).join('')

  const perDay = (itinerary || []).map((day: any, i: number) => `
    <div class="day">
      <div class="day-header">
        <div class="day-number">Day ${i + 1}</div>
        <div class="day-date">${formatDate(day.date)}</div>
        ${day.city ? `<div class="day-city">${day.city.name}</div>` : ''}
      </div>
      <div class="activities">
        ${(day.activities || []).map((a: any) => `
          <div class="activity">
            <div class="time">${a.startTime ? a.startTime.slice(0,5) : ''}</div>
            <div class="details">
              <div class="name">${a.name}</div>
              ${a.category ? `<div class="meta">${a.category}${a.duration_hours ? ` • ${a.duration_hours}h` : ''}</div>` : ''}
              ${a.description ? `<div class="desc">${a.description}</div>` : ''}
            </div>
            ${a.estimatedCost ? `<div class="cost">$${a.estimatedCost}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `).join('')

  return `
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${trip.name} - Itinerary</title>
    <style>
      body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto; background:#0b1220; color:#e5e7eb; padding:24px}
      .container{max-width:820px;margin:0 auto;background:linear-gradient(180deg,#0f172a,#111827);border:1px solid #1f2937;border-radius:16px;overflow:hidden}
      .header{padding:24px 28px;background:radial-gradient(circle at 10% 10%,#1d4ed8,transparent 40%),radial-gradient(circle at 90% 20%,#10b981,transparent 35%),radial-gradient(circle at 50% 120%,#9333ea,transparent 40%)}
      .title{font-size:24px;font-weight:800;color:white}
      .subtitle{color:#9ca3af}
      .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:12px}
      .card{background:#0b1220;border:1px solid #1f2937;border-radius:12px;padding:16px}
      .section{padding:20px 28px}
      .section-title{font-weight:700;margin-bottom:12px;color:white}
      .city{display:flex;align-items:center;background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:10px;margin-bottom:8px}
      .badge{min-width:28px;height:28px;background:#2563eb;border-radius:9999px;display:flex;align-items:center;justify-content:center;color:white;font-weight:700;margin-right:10px}
      .city-name{color:white;font-weight:600}
      .city-country,.coords{color:#9ca3af;font-size:12px}
      .day{border-top:1px solid #1f2937;padding:14px 0}
      .day-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
      .day-number{color:#93c5fd;font-weight:700}
      .day-date{color:#9ca3af}
      .activities{display:flex;flex-direction:column;gap:8px}
      .activity{display:flex;align-items:flex-start;background:#0b1220;border:1px solid #1f2937;border-radius:10px;padding:10px}
      .activity .time{width:60px;color:#60a5fa;font-weight:600}
      .activity .name{color:white;font-weight:600}
      .activity .meta{color:#9ca3af;font-size:12px}
      .activity .desc{color:#cbd5e1;font-size:12px;margin-top:4px}
      .activity .cost{margin-left:auto;color:#34d399;font-weight:700}
      .footer{padding:16px 28px;border-top:1px solid #1f2937;color:#9ca3af;font-size:12px}
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="title">${trip.name}</div>
        <div class="subtitle">${formatDate(trip.start_date)} - ${formatDate(trip.end_date)} • ${cities.length} destinations • ${activities.length} activities</div>
        <div class="grid">
          <div class="card"><div style="color:#9ca3af">Status</div><div style="color:white;font-weight:700;text-transform:capitalize">${trip.status}</div></div>
          <div class="card"><div style="color:#9ca3af">Visibility</div><div style="color:white;font-weight:700">${trip.is_public ? 'Public' : 'Private'}</div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">Destinations</div>
        ${cityList || '<div style="color:#9ca3af">No destinations yet</div>'}
      </div>
      <div class="section">
        <div class="section-title">Itinerary</div>
        ${perDay || '<div style="color:#9ca3af">No itinerary yet</div>'}
      </div>
      <div class="footer">Generated by GlobeTrotter</div>
    </div>
  </body>
  </html>
  `
}


