import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role for bypassing RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { tableId } = await request.json()

    if (!tableId) {
      return NextResponse.json({ error: 'tableId requis' }, { status: 400 })
    }

    // Get table info
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('*, venues(name, event_id), events:venues(events(name, currency))')
      .eq('id', tableId)
      .single()

    if (tableError || !table) {
      console.error('Table error:', tableError)
      return NextResponse.json({ error: 'Table non trouvée' }, { status: 404 })
    }

    // Get event_id from the table's venue
    const { data: venue } = await supabase
      .from('venues')
      .select('event_id')
      .eq('id', table.venue_id)
      .single()

    if (!venue) {
      return NextResponse.json({ error: 'Venue non trouvé' }, { status: 404 })
    }

    // Check if an order already exists for this table
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('table_id', tableId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingOrder) {
      // Return existing token
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      return NextResponse.json({
        success: true,
        accessToken: existingOrder.access_token,
        orderId: existingOrder.id,
        link: `${baseUrl}/vip/${existingOrder.access_token}`,
        isExisting: true,
        table: {
          id: table.id,
          table_number: table.table_number,
          client_name: table.client_name,
          beverage_budget: table.beverage_budget || table.sold_price || 0
        }
      })
    }

    // Create new order with unique token
    const accessToken = crypto.randomUUID()
    const beverageBudget = table.sold_price || table.standard_price || 0

    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert({
        table_id: tableId,
        event_id: venue.event_id,
        order_type: 'initial',
        status: 'pending',
        access_token: accessToken,
        budget_amount: beverageBudget,
        total_amount: 0,
        extra_amount: 0,
        budget_exceeded: false
      })
      .select()
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Erreur création commande' }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    
    return NextResponse.json({
      success: true,
      accessToken: newOrder.access_token,
      orderId: newOrder.id,
      link: `${baseUrl}/vip/${newOrder.access_token}`,
      isExisting: false,
      table: {
        id: table.id,
        table_number: table.table_number,
        client_name: table.client_name,
        beverage_budget: beverageBudget
      }
    })

  } catch (error) {
    console.error('Generate link error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
