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

export async function POST(request) {
  try {
    const supabase = getSupabase()
    const { accessToken, items, clientNotes } = await request.json()

    if (!accessToken) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    // Get order by access token
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('access_token', accessToken)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }

    // Get table to get budget
    const { data: table } = await supabase
      .from('tables')
      .select('sold_price, standard_price')
      .eq('id', order.table_id)
      .single()

    const beverageBudget = table?.sold_price || table?.standard_price || 0

    // Calculate totals
    let totalAmount = 0
    const orderItems = []

    if (items && items.length > 0) {
      for (const item of items) {
        const itemTotal = item.price * item.quantity
        totalAmount += itemTotal
        orderItems.push({
          order_id: order.id,
          menu_item_id: item.menu_item_id,
          quantity: item.quantity,
          unit_price: item.price,
          total_price: itemTotal
        })
      }
    }

    const extraAmount = Math.max(0, totalAmount - beverageBudget)
    const budgetExceeded = totalAmount > beverageBudget

    // Delete existing order items
    await supabase
      .from('order_items')
      .delete()
      .eq('order_id', order.id)

    // Insert new order items
    if (orderItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) {
        console.error('Items insert error:', itemsError)
        return NextResponse.json({ error: 'Erreur sauvegarde articles' }, { status: 500 })
      }
    }

    // Update order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        total_amount: totalAmount,
        budget_amount: beverageBudget,
        extra_amount: extraAmount,
        budget_exceeded: budgetExceeded,
        client_notes: clientNotes || '',
        confirmed_at: new Date().toISOString()
      })
      .eq('id', order.id)
      .select()
      .single()

    if (updateError) {
      console.error('Order update error:', updateError)
      return NextResponse.json({ error: 'Erreur mise à jour commande' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: updatedOrder.id,
        status: updatedOrder.status,
        total_amount: updatedOrder.total_amount,
        budget_amount: updatedOrder.budget_amount,
        extra_amount: updatedOrder.extra_amount,
        budget_exceeded: updatedOrder.budget_exceeded,
        confirmed_at: updatedOrder.confirmed_at
      },
      message: 'Commande confirmée avec succès'
    })

  } catch (error) {
    console.error('Save order error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
