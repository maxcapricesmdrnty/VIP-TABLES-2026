import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { accessToken } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    // Get order by access token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          menu_item_id,
          quantity,
          unit_price,
          total_price,
          menu_items (
            id,
            name,
            price,
            category,
            format,
            volume
          )
        )
      `)
      .eq('access_token', accessToken)
      .single()

    if (orderError || !order) {
      console.error('Order error:', orderError)
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Get table info
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('*')
      .eq('id', order.table_id)
      .single()

    if (tableError || !table) {
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    // Get event info
    const { data: event } = await supabase
      .from('events')
      .select('name, currency')
      .eq('id', order.event_id)
      .single()

    // Get available menu items for this event
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', order.event_id)
      .eq('available', true)
      .order('category')
      .order('name')

    if (menuError) {
      console.error('Menu error:', menuError)
    }

    // Calculate budget
    const beverageBudget = table.sold_price || table.standard_price || 0

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        total_amount: order.total_amount || 0,
        extra_amount: order.extra_amount || 0,
        budget_exceeded: order.budget_exceeded || false,
        client_notes: order.client_notes || '',
        items: order.order_items || [],
        confirmed_at: order.confirmed_at
      },
      table: {
        id: table.id,
        table_number: table.table_number,
        client_name: table.client_name,
        day: table.day,
        beverage_budget: beverageBudget
      },
      event: event || { name: 'Événement', currency: 'CHF' },
      menuItems: menuItems || []
    })

  } catch (error) {
    console.error('Get order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
