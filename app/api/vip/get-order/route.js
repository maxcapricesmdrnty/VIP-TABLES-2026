import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client inside function to avoid build-time errors
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function GET(request) {
  try {
    const supabase = getSupabase()
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('token')

    if (!accessToken) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 })
    }

    // Get order by access token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        tables (*),
        events (*)
      `)
      .eq('access_token', accessToken)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get menu items for the event
    const { data: menuItems } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', order.event_id)
      .eq('available', true)
      .order('category')
      .order('name')

    // Get existing order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        *,
        menu_items (*)
      `)
      .eq('order_id', order.id)

    // Calculate budget
    const beverageBudget = order.tables?.sold_price || order.tables?.standard_price || 0

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        client_name: order.client_name,
        client_email: order.client_email,
        client_notes: order.client_notes,
        total_amount: order.total_amount,
        budget_amount: beverageBudget,
        extra_amount: order.extra_amount,
        budget_exceeded: order.budget_exceeded,
        confirmed_at: order.confirmed_at
      },
      table: order.tables,
      event: order.events,
      menuItems: menuItems || [],
      orderItems: orderItems || [],
      beverageBudget
    })

  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
