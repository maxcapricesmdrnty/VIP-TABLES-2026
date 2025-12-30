import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

// Create Supabase client inside function to avoid build-time errors
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error('Supabase configuration missing')
  }
  return createClient(url, key)
}

export async function POST(request) {
  try {
    const supabase = getSupabase()
    const { tableId, eventId, clientName, clientEmail } = await request.json()

    if (!tableId || !eventId) {
      return NextResponse.json({ error: 'Table ID and Event ID required' }, { status: 400 })
    }

    // Generate unique access token
    const accessToken = uuidv4()

    // Create or update order for this table
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('table_id', tableId)
      .eq('event_id', eventId)
      .single()

    let order
    if (existingOrder) {
      // Update existing order with new token
      const { data, error } = await supabase
        .from('orders')
        .update({
          access_token: accessToken,
          client_name: clientName,
          client_email: clientEmail,
          status: 'pending'
        })
        .eq('id', existingOrder.id)
        .select()
        .single()
      
      if (error) throw error
      order = data
    } else {
      // Create new order
      const { data, error } = await supabase
        .from('orders')
        .insert({
          table_id: tableId,
          event_id: eventId,
          access_token: accessToken,
          client_name: clientName,
          client_email: clientEmail,
          status: 'pending'
        })
        .select()
        .single()
      
      if (error) throw error
      order = data
    }

    // Generate the VIP link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const vipLink = `${baseUrl}/vip/${accessToken}`

    return NextResponse.json({
      success: true,
      vipLink,
      accessToken,
      orderId: order.id
    })

  } catch (error) {
    console.error('Generate link error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
