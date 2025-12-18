'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Wine, Beer, Coffee, Sparkles, Plus, Minus, ShoppingCart, Check, AlertTriangle } from 'lucide-react'
import { Toaster, toast } from 'sonner'

// Category icons and labels
const categoryConfig = {
  champagne: { icon: Sparkles, label: '🍾 Champagne', color: 'bg-amber-500/20 text-amber-400' },
  vin: { icon: Wine, label: '🍷 Vins', color: 'bg-red-500/20 text-red-400' },
  spiritueux: { icon: Wine, label: '🥃 Spiritueux', color: 'bg-orange-500/20 text-orange-400' },
  aperitif: { icon: Wine, label: '🍹 Apéritifs', color: 'bg-pink-500/20 text-pink-400' },
  biere: { icon: Beer, label: '🍺 Bières', color: 'bg-yellow-500/20 text-yellow-400' },
  energy: { icon: Sparkles, label: '⚡ Energy Drinks', color: 'bg-green-500/20 text-green-400' },
  soft: { icon: Coffee, label: '🥤 Softs', color: 'bg-blue-500/20 text-blue-400' }
}

export default function VipOrderPage() {
  const params = useParams()
  const token = params.token

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  
  const [order, setOrder] = useState(null)
  const [table, setTable] = useState(null)
  const [event, setEvent] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState({}) // { menuItemId: quantity }
  const [clientNotes, setClientNotes] = useState('')

  // Load order data
  useEffect(() => {
    if (token) {
      loadOrderData()
    }
  }, [token])

  const loadOrderData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/vip/get-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: token })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de chargement')
      }

      setOrder(data.order)
      setTable(data.table)
      setEvent(data.event)
      setMenuItems(data.menuItems)
      setClientNotes(data.order.client_notes || '')

      // Restore cart from existing order items
      if (data.order.items && data.order.items.length > 0) {
        const restoredCart = {}
        data.order.items.forEach(item => {
          restoredCart[item.menu_item_id] = item.quantity
        })
        setCart(restoredCart)
      }

      if (data.order.status === 'confirmed') {
        setConfirmed(true)
      }

    } catch (err) {
      console.error('Load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Cart operations
  const addToCart = (itemId) => {
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }))
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newCart = { ...prev }
      if (newCart[itemId] > 1) {
        newCart[itemId] -= 1
      } else {
        delete newCart[itemId]
      }
      return newCart
    })
  }

  // Calculate totals
  const calculateTotals = () => {
    let total = 0
    Object.entries(cart).forEach(([itemId, quantity]) => {
      const item = menuItems.find(m => m.id === itemId)
      if (item) {
        total += item.price * quantity
      }
    })

    const budget = table?.beverage_budget || 0
    const withinBudget = Math.min(total, budget)
    const exceeding = Math.max(0, total - budget)
    const remaining = Math.max(0, budget - total)

    return { total, budget, withinBudget, exceeding, remaining }
  }

  const totals = table ? calculateTotals() : { total: 0, budget: 0, withinBudget: 0, exceeding: 0, remaining: 0 }

  // Group menu items by category
  const groupedMenu = menuItems.reduce((acc, item) => {
    const cat = item.category || 'soft'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  // Save order
  const saveOrder = async () => {
    try {
      setSaving(true)

      const items = Object.entries(cart).map(([itemId, quantity]) => {
        const item = menuItems.find(m => m.id === itemId)
        return {
          menu_item_id: itemId,
          quantity,
          price: item?.price || 0
        }
      }).filter(item => item.quantity > 0)

      const response = await fetch('/api/vip/save-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessToken: token,
          items,
          clientNotes
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur de sauvegarde')
      }

      setConfirmed(true)
      toast.success('Commande confirmée !', {
        description: 'Votre sélection a été enregistrée.'
      })

    } catch (err) {
      console.error('Save error:', err)
      toast.error('Erreur', { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-amber-500 mx-auto mb-4" />
          <p className="text-white">Chargement de votre sélection...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
        <Card className="max-w-md bg-zinc-800/50 border-red-500/50">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Lien invalide</h2>
            <p className="text-zinc-400">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Confirmed state
  if (confirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black flex items-center justify-center p-4">
        <Toaster richColors position="top-center" />
        <Card className="max-w-md bg-zinc-800/50 border-green-500/50">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Commande confirmée !</h2>
            <p className="text-zinc-400 mb-4">
              Merci {table?.client_name || ''}, votre sélection de boissons a été enregistrée pour la table {table?.table_number}.
            </p>
            <div className="bg-zinc-900/50 rounded-lg p-4 text-left">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-400">Total commande</span>
                <span className="text-white font-semibold">{totals.total.toLocaleString()} {event?.currency}</span>
              </div>
              {totals.exceeding > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-orange-400">Supplément hors budget</span>
                  <span className="text-orange-400 font-semibold">+{totals.exceeding.toLocaleString()} {event?.currency}</span>
                </div>
              )}
            </div>
            <Button 
              className="mt-4 w-full"
              variant="outline"
              onClick={() => {
                setConfirmed(false)
                loadOrderData()
              }}
            >
              Modifier ma sélection
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main order page
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black">
      <Toaster richColors position="top-center" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-4">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">{event?.name || 'VIP'}</h1>
              <p className="text-sm text-zinc-400">
                Table {table?.table_number} • {table?.client_name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Budget boisson</p>
              <p className="text-lg font-bold text-amber-400">
                {table?.beverage_budget?.toLocaleString() || 0} {event?.currency}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Budget Progress */}
      <div className="sticky top-[73px] z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-zinc-400">Sélection actuelle</span>
            <span className={`font-semibold ${totals.exceeding > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {totals.total.toLocaleString()} {event?.currency}
            </span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                totals.exceeding > 0 ? 'bg-orange-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, (totals.total / totals.budget) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            {totals.exceeding > 0 ? (
              <span className="text-orange-400">+{totals.exceeding.toLocaleString()} {event?.currency} hors budget</span>
            ) : (
              <span className="text-green-400">{totals.remaining.toLocaleString()} {event?.currency} restant</span>
            )}
            <span className="text-zinc-500">{Object.keys(cart).length} article(s)</span>
          </div>
        </div>
      </div>

      {/* Menu */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-40">
        {Object.entries(categoryConfig).map(([catKey, catConfig]) => {
          const items = groupedMenu[catKey]
          if (!items || items.length === 0) return null

          return (
            <div key={catKey} className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                {catConfig.label}
              </h2>
              <div className="space-y-2">
                {items.map(item => {
                  const quantity = cart[item.id] || 0
                  return (
                    <div 
                      key={item.id}
                      className={`bg-zinc-800/50 rounded-lg p-3 border transition-all ${
                        quantity > 0 ? 'border-amber-500/50' : 'border-zinc-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white truncate">{item.name}</h3>
                          <p className="text-sm text-zinc-500">
                            {item.format} {item.volume && `• ${item.volume}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 ml-3">
                          <span className="text-amber-400 font-semibold whitespace-nowrap">
                            {item.price.toLocaleString()} {event?.currency}
                          </span>
                          <div className="flex items-center gap-1">
                            {quantity > 0 && (
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-full"
                                onClick={() => removeFromCart(item.id)}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            )}
                            {quantity > 0 && (
                              <span className="w-8 text-center font-semibold text-white">{quantity}</span>
                            )}
                            <Button
                              size="icon"
                              className="h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 text-black"
                              onClick={() => addToCart(item.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Notes */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-white mb-3">📝 Notes & demandes spéciales</h2>
          <Textarea
            placeholder="Ex: Champagne bien frais, allergies, préférences..."
            value={clientNotes}
            onChange={(e) => setClientNotes(e.target.value)}
            className="bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500 min-h-[100px]"
          />
        </div>
      </main>

      {/* Fixed Cart Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 p-4 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto">
          {/* Summary */}
          <div className="bg-zinc-800/50 rounded-lg p-3 mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-zinc-400">Dans le budget</span>
              <span className="text-green-400 font-semibold">
                {totals.withinBudget.toLocaleString()} {event?.currency}
              </span>
            </div>
            {totals.exceeding > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-orange-400 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" />
                  Hors budget (à régler sur place)
                </span>
                <span className="text-orange-400 font-semibold">
                  +{totals.exceeding.toLocaleString()} {event?.currency}
                </span>
              </div>
            )}
          </div>

          {/* Confirm Button */}
          <Button
            className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black font-semibold text-lg"
            onClick={saveOrder}
            disabled={saving || Object.keys(cart).length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Confirmation...
              </>
            ) : (
              <>
                <ShoppingCart className="w-5 h-5 mr-2" />
                Confirmer ma sélection
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}
