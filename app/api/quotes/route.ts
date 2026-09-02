import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    // Validate required fields
    if (!payload.lead_info?.email || !payload.lead_info?.phone) {
      return NextResponse.json(
        { error: 'Missing required fields: email and phone' },
        { status: 400 }
      )
    }

    // Insert quote request into Supabase
    const { data, error } = await supabase
      .from('quote_requests')
      .insert([
        {
          full_name: payload.lead_info.full_name,
          email: payload.lead_info.email,
          phone: payload.lead_info.phone,
          notes: payload.lead_info.notes,
          panel_count: payload.calculator_metrics.panel_count,
          system_kw: payload.calculator_metrics.system_kw,
          soiling_loss_pct: payload.calculator_metrics.soiling_loss_pct,
          annual_financial_loss: payload.calculator_metrics.annual_financial_loss,
          estimated_cleaning_cost: payload.calculator_metrics.estimated_cleaning_cost,
          net_annual_savings: payload.calculator_metrics.net_annual_savings,
          payback_months: payload.calculator_metrics.payback_months,
          submitted_at: payload.submitted_at,
        },
      ])

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json(
        { error: 'Failed to save quote request' },
        { status: 500 }
      )
    }

    // TODO: Send email notification to admin & customer
    // Example: await sendEmailNotification(payload.lead_info.email, payload)

    return NextResponse.json(
      { success: true, message: 'Quote request saved' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Quote endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
