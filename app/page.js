'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calendar, MapPin, Plus, LogOut, Settings, Users, Table2, Loader2, Wine, FileText, Download, Trash2, Edit, ChevronLeft, ChevronRight, X, PanelLeftClose, PanelLeft, LayoutDashboard, Receipt, Cog, ChevronDown, Upload, FileSpreadsheet, Check, Link, Copy, ExternalLink, ShoppingCart } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'
import { jsPDF } from 'jspdf'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState('events')
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  const [eventForm, setEventForm] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    currency: 'CHF',
    status: 'draft'
  })

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) {
        fetchEvents()
      }
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword
        })
        if (error) throw error
        toast.success('Connexion réussie!')
      } else {
        const { error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword
        })
        if (error) throw error
        toast.success('Compte créé! Vérifiez votre email.')
      }
      setShowAuthDialog(false)
      checkUser()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setEvents([])
    setSelectedEvent(null)
    setView('events')
    toast.success('Déconnecté')
  }

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false })
      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Erreur lors du chargement des événements')
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const createEvent = async () => {
    try {
      const slug = generateSlug(eventForm.name)
      const { data, error } = await supabase
        .from('events')
        .insert([{ ...eventForm, slug }])
        .select()
        .single()
      
      if (error) throw error
      
      // Note: Les jours ne sont plus créés automatiquement
      // L'utilisateur les ajoute manuellement via l'onglet "Jours"

      toast.success('Événement créé!')
      setShowEventDialog(false)
      setEventForm({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        location: '',
        currency: 'CHF',
        status: 'draft'
      })
      fetchEvents()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-500',
      active: 'bg-green-500',
      archived: 'bg-red-500'
    }
    const labels = {
      draft: 'Brouillon',
      active: 'Actif',
      archived: 'Archivé'
    }
    return <Badge className={colors[status]}>{labels[status]}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 text-amber-400">
            VIP Table Management
          </h1>
          <p className="text-muted-foreground">Gestion de tables VIP pour événements exclusifs</p>
        </div>
        
        <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700">
              Connexion / Inscription
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{authMode === 'login' ? 'Connexion' : 'Inscription'}</DialogTitle>
              <DialogDescription>
                {authMode === 'login' 
                  ? 'Connectez-vous à votre compte' 
                  : 'Créez un nouveau compte'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAuth}>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2">
                <Button type="submit" disabled={authLoading} className="w-full">
                  {authLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {authMode === 'login' ? 'Se connecter' : "S'inscrire"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                >
                  {authMode === 'login' 
                    ? "Pas de compte? S'inscrire" 
                    : 'Déjà un compte? Se connecter'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  if (selectedEvent) {
    return (
      <EventDashboard 
        event={selectedEvent} 
        view={view}
        setView={setView}
        onBack={() => {
          setSelectedEvent(null)
          setView('events')
        }}
        user={user}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-400">
            VIP Table Management
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Mes Événements</h2>
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 hover:to-amber-700">
                <Plus className="w-4 h-4 mr-2" /> Nouvel événement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer un événement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nom de l'événement</Label>
                  <Input
                    value={eventForm.name}
                    onChange={(e) => setEventForm({...eventForm, name: e.target.value})}
                    placeholder="Caprices Gstaad 2025"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    placeholder="Description de l'événement..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={eventForm.start_date}
                      onChange={(e) => setEventForm({...eventForm, start_date: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={eventForm.end_date}
                      onChange={(e) => setEventForm({...eventForm, end_date: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <Label>Lieu</Label>
                  <Input
                    value={eventForm.location}
                    onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
                    placeholder="Gstaad, Suisse"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Devise</Label>
                    <Select value={eventForm.currency} onValueChange={(v) => setEventForm({...eventForm, currency: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CHF">CHF</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select value={eventForm.status} onValueChange={(v) => setEventForm({...eventForm, status: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon</SelectItem>
                        <SelectItem value="active">Actif</SelectItem>
                        <SelectItem value="archived">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEventDialog(false)}>Annuler</Button>
                <Button onClick={createEvent} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun événement. Créez votre premier événement!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:border-amber-500 transition-colors"
                onClick={() => {
                  setSelectedEvent(event)
                  setView('dashboard')
                }}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{event.name}</CardTitle>
                    {getStatusBadge(event.status)}
                  </div>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {event.location}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {event.start_date && format(parseISO(event.start_date), 'dd MMM', { locale: fr })}
                    {' - '}
                    {event.end_date && format(parseISO(event.end_date), 'dd MMM yyyy', { locale: fr })}
                  </div>
                  <div className="mt-2 text-sm">
                    Devise: <span className="font-semibold">{event.currency}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// Event Dashboard Component
function EventDashboard({ event, view, setView, onBack, user, onLogout }) {
  const [venues, setVenues] = useState([])
  const [eventDays, setEventDays] = useState([])
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedDay, setSelectedDay] = useState(null)
  const [tables, setTables] = useState([])
  const [layouts, setLayouts] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [showTableModal, setShowTableModal] = useState(false)
  const [showVenueDialog, setShowVenueDialog] = useState(false)
  const [menuItems, setMenuItems] = useState([])
  const [showMenuDialog, setShowMenuDialog] = useState(false)
  const [editingMenuItem, setEditingMenuItem] = useState(null)
  const [venueForm, setVenueForm] = useState({ name: '', capacity: 500 })
  
  // Menu import states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importedItems, setImportedItems] = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  
  // Layout with multiple back categories
  const [layoutForm, setLayoutForm] = useState({
    left: { prefix: 'L', count: 4, rows: 2, capacity: 10, price: 5000 },
    right: { prefix: 'R', count: 4, rows: 2, capacity: 10, price: 5000 },
    backCategories: [
      { id: '1', name: 'Tables Arrière', prefix: 'B', rows: 1, tablesPerRow: 4, capacity: 10, price: 3000 }
    ]
  })
  
  const [menuForm, setMenuForm] = useState({
    name: '',
    category: 'champagne',
    price: 0,
    format: 'Bouteille',
    volume: '75cl',
    description: '',
    available: true
  })

  const categories = [
    { value: 'champagne', label: '🍾 Champagne' },
    { value: 'aperitif', label: '🥃 Apéritifs' },
    { value: 'biere', label: '🍺 Bières' },
    { value: 'energy', label: '⚡ Energy Drinks' },
    { value: 'spiritueux', label: '🥃 Spiritueux' },
    { value: 'vin', label: '🍷 Vins' },
    { value: 'soft', label: '🥤 Soft Drinks' }
  ]

  useEffect(() => {
    fetchVenues()
    fetchEventDays()
    fetchMenuItems()
  }, [event.id])

  useEffect(() => {
    if (selectedVenue && selectedDay) {
      fetchTables()
      fetchLayouts()
    }
  }, [selectedVenue, selectedDay])

  const fetchVenues = async () => {
    const { data } = await supabase
      .from('venues')
      .select('*')
      .eq('event_id', event.id)
      .order('sort_order')
    setVenues(data || [])
    if (data?.length > 0 && !selectedVenue) {
      setSelectedVenue(data[0])
    }
  }

  const fetchEventDays = async () => {
    const { data } = await supabase
      .from('event_days')
      .select('*')
      .eq('event_id', event.id)
      .order('date')
    setEventDays(data || [])
    // Set first active day as selected
    const activeDays = (data || []).filter(d => d.is_active)
    if (activeDays.length > 0 && !selectedDay) {
      setSelectedDay(activeDays[0].date)
    }
  }
  
  // Get only active days for table selection
  const activeDays = eventDays.filter(d => d.is_active)

  const fetchTables = async () => {
    if (!selectedVenue || !selectedDay) return
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', selectedVenue.id)
      .eq('day', selectedDay)
      .order('zone')
      .order('table_number')
    setTables(data || [])
  }

  const fetchLayouts = async () => {
    if (!selectedVenue) return
    
    // Try to get layouts for the specific day first
    let query = supabase
      .from('table_layouts')
      .select('*')
      .eq('venue_id', selectedVenue.id)
    
    if (selectedDay) {
      query = query.eq('date', selectedDay)
    } else {
      query = query.is('date', null)
    }
    
    let { data } = await query.order('sort_order')
    
    // If no layouts for specific day, try to get default layouts
    if ((!data || data.length === 0) && selectedDay) {
      const defaultQuery = await supabase
        .from('table_layouts')
        .select('*')
        .eq('venue_id', selectedVenue.id)
        .is('date', null)
        .order('sort_order')
      data = defaultQuery.data
    }
    
    setLayouts(data || [])
    
    if (data?.length > 0) {
      const newForm = { 
        left: { prefix: 'L', count: 4, rows: 2, capacity: 10, price: 5000 },
        right: { prefix: 'R', count: 4, rows: 2, capacity: 10, price: 5000 },
        backCategories: []
      }
      
      data.forEach(l => {
        if (l.zone === 'left') {
          newForm.left = {
            prefix: l.table_prefix,
            count: l.table_count,
            rows: l.rows,
            capacity: l.capacity_per_table,
            price: l.standard_price
          }
        } else if (l.zone === 'right') {
          newForm.right = {
            prefix: l.table_prefix,
            count: l.table_count,
            rows: l.rows,
            capacity: l.capacity_per_table,
            price: l.standard_price
          }
        } else if (l.zone.startsWith('back')) {
          // Calculate tablesPerRow from total count and rows
          const totalTables = l.table_count
          const numRows = l.rows || 1
          const tablesPerRow = Math.ceil(totalTables / numRows)
          
          newForm.backCategories.push({
            id: l.id,
            name: l.zone.replace('back_', '').replace(/_/g, ' ') || 'Catégorie',
            prefix: l.table_prefix,
            rows: numRows,
            tablesPerRow: tablesPerRow,
            capacity: l.capacity_per_table,
            price: l.standard_price
          })
        }
      })
      
      if (newForm.backCategories.length === 0) {
        newForm.backCategories = [{ id: '1', name: 'Tables Arrière', prefix: 'B', rows: 1, tablesPerRow: 4, capacity: 10, price: 3000 }]
      }
      
      setLayoutForm(newForm)
    }
  }

  const fetchMenuItems = async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('event_id', event.id)
      .order('category')
      .order('sort_order')
    setMenuItems(data || [])
  }

  const createVenue = async () => {
    try {
      const { error } = await supabase
        .from('venues')
        .insert([{
          event_id: event.id,
          name: venueForm.name,
          capacity: venueForm.capacity,
          sort_order: venues.length
        }])
      
      if (error) throw error
      toast.success('Salle créée!')
      setShowVenueDialog(false)
      setVenueForm({ name: '', capacity: 500 })
      fetchVenues()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const addBackCategory = () => {
    const newId = Date.now().toString()
    setLayoutForm({
      ...layoutForm,
      backCategories: [
        ...layoutForm.backCategories,
        { id: newId, name: `Catégorie ${layoutForm.backCategories.length + 1}`, prefix: `C${layoutForm.backCategories.length + 1}`, rows: 1, tablesPerRow: 4, capacity: 10, price: 3000 }
      ]
    })
  }

  const removeBackCategory = (id) => {
    if (layoutForm.backCategories.length <= 1) {
      toast.error('Vous devez garder au moins une catégorie')
      return
    }
    setLayoutForm({
      ...layoutForm,
      backCategories: layoutForm.backCategories.filter(c => c.id !== id)
    })
  }

  const updateBackCategory = (id, field, value) => {
    setLayoutForm({
      ...layoutForm,
      backCategories: layoutForm.backCategories.map(c => 
        c.id === id ? { ...c, [field]: value } : c
      )
    })
  }

  const saveLayout = async () => {
    if (!selectedVenue) {
      toast.error('Sélectionnez une salle d\'abord')
      return
    }

    try {
      // Delete existing layouts for this venue/day combination
      let deleteQuery = supabase
        .from('table_layouts')
        .delete()
        .eq('venue_id', selectedVenue.id)
      
      if (selectedDay) {
        deleteQuery = deleteQuery.eq('date', selectedDay)
      } else {
        deleteQuery = deleteQuery.is('date', null)
      }
      
      await deleteQuery

      const layoutsToInsert = [
        {
          venue_id: selectedVenue.id,
          zone: 'left',
          table_prefix: layoutForm.left.prefix,
          table_count: layoutForm.left.count,
          rows: layoutForm.left.rows,
          capacity_per_table: layoutForm.left.capacity,
          standard_price: layoutForm.left.price,
          sort_order: 0,
          date: selectedDay || null
        },
        {
          venue_id: selectedVenue.id,
          zone: 'right',
          table_prefix: layoutForm.right.prefix,
          table_count: layoutForm.right.count,
          rows: layoutForm.right.rows,
          capacity_per_table: layoutForm.right.capacity,
          standard_price: layoutForm.right.price,
          sort_order: 1,
          date: selectedDay || null
        },
        ...layoutForm.backCategories.map((cat, idx) => ({
          venue_id: selectedVenue.id,
          zone: `back_${cat.name.replace(/\s+/g, '_').toLowerCase()}`,
          table_prefix: cat.prefix,
          table_count: cat.rows * cat.tablesPerRow,
          rows: cat.rows,
          capacity_per_table: cat.capacity,
          standard_price: cat.price,
          sort_order: idx + 2,
          date: selectedDay || null
        }))
      ]

      await supabase.from('table_layouts').insert(layoutsToInsert)
      toast.success(selectedDay ? `Configuration sauvegardée pour le ${format(parseISO(selectedDay), 'dd MMM', { locale: fr })}!` : 'Configuration par défaut sauvegardée!')
      fetchLayouts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const generateTablesForDay = async () => {
    if (!selectedVenue || !selectedDay) {
      toast.error('Sélectionnez une salle et un jour')
      return
    }

    try {
      await supabase
        .from('tables')
        .delete()
        .eq('venue_id', selectedVenue.id)
        .eq('day', selectedDay)

      const tablesToInsert = []
      
      // Left zone
      for (let i = 1; i <= layoutForm.left.count; i++) {
        tablesToInsert.push({
          event_id: event.id,
          venue_id: selectedVenue.id,
          table_number: `${layoutForm.left.prefix}${i}`,
          day: selectedDay,
          zone: 'left',
          status: 'libre',
          standard_price: layoutForm.left.price,
          sold_price: 0
        })
      }
      
      // Right zone
      for (let i = 1; i <= layoutForm.right.count; i++) {
        tablesToInsert.push({
          event_id: event.id,
          venue_id: selectedVenue.id,
          table_number: `${layoutForm.right.prefix}${i}`,
          day: selectedDay,
          zone: 'right',
          status: 'libre',
          standard_price: layoutForm.right.price,
          sold_price: 0
        })
      }
      
      // Back categories
      layoutForm.backCategories.forEach(cat => {
        const zoneName = `back_${cat.name.replace(/\s+/g, '_').toLowerCase()}`
        const totalTables = cat.rows * cat.tablesPerRow // Calculate total from rows × tablesPerRow
        for (let i = 1; i <= totalTables; i++) {
          tablesToInsert.push({
            event_id: event.id,
            venue_id: selectedVenue.id,
            table_number: `${cat.prefix}${i}`,
            day: selectedDay,
            zone: zoneName,
            status: 'libre',
            standard_price: cat.price,
            sold_price: 0
          })
        }
      })

      await supabase.from('tables').insert(tablesToInsert)
      toast.success(`${tablesToInsert.length} tables générées!`)
      fetchTables()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const saveMenuItem = async () => {
    try {
      if (editingMenuItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(menuForm)
          .eq('id', editingMenuItem.id)
        if (error) throw error
        toast.success('Article modifié!')
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([{ ...menuForm, event_id: event.id }])
        if (error) throw error
        toast.success('Article ajouté!')
      }
      setShowMenuDialog(false)
      setEditingMenuItem(null)
      setMenuForm({
        name: '',
        category: 'champagne',
        price: 0,
        format: 'Bouteille',
        volume: '75cl',
        description: '',
        available: true
      })
      fetchMenuItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteMenuItem = async (id) => {
    if (!confirm('Supprimer cet article?')) return
    try {
      await supabase.from('menu_items').delete().eq('id', id)
      toast.success('Article supprimé')
      fetchMenuItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const importDefaultMenu = async () => {
    const defaultItems = [
      { name: 'Dom Pérignon', category: 'champagne', price: 800, format: 'Bouteille', volume: '75cl' },
      { name: 'Dom Pérignon Luminous', category: 'champagne', price: 1700, format: 'Magnum', volume: '150cl' },
      { name: 'Perrier-Jouet Belle Epoque', category: 'champagne', price: 650, format: 'Bouteille', volume: '75cl' },
      { name: 'Perrier-Jouet Blanc de Blancs', category: 'champagne', price: 450, format: 'Bouteille', volume: '75cl' },
      { name: 'Perrier-Jouet Blason Rosé', category: 'champagne', price: 400, format: 'Bouteille', volume: '75cl' },
      { name: 'Perrier-Jouet Blason Rosé', category: 'champagne', price: 850, format: 'Magnum', volume: '150cl' },
      { name: 'Perrier-Jouet Brut', category: 'champagne', price: 350, format: 'Bouteille', volume: '75cl' },
      { name: 'Perrier-Jouet Brut', category: 'champagne', price: 750, format: 'Magnum', volume: '150cl' },
      { name: 'Hierbas Mari Mayans', category: 'aperitif', price: 450, format: 'Bouteille', volume: '70cl' },
      { name: 'Ricard', category: 'aperitif', price: 450, format: 'Bouteille', volume: '70cl' },
      { name: 'Suze', category: 'aperitif', price: 350, format: 'Bouteille', volume: '70cl' },
      { name: 'Desperados', category: 'biere', price: 8, format: 'Canette', volume: '33cl' },
      { name: 'Heineken', category: 'biere', price: 8, format: 'Canette', volume: '33cl' },
      { name: 'Red Bull', category: 'energy', price: 8, format: 'Canette', volume: '25cl' },
      { name: 'Red Bull Apricot Edition', category: 'energy', price: 8, format: 'Canette', volume: '25cl' },
      { name: 'Red Bull Peach Edition', category: 'energy', price: 8, format: 'Canette', volume: '25cl' },
      { name: 'Red Bull Sugarfree', category: 'energy', price: 8, format: 'Canette', volume: '25cl' },
    ]

    try {
      const itemsWithEventId = defaultItems.map(item => ({
        ...item,
        event_id: event.id,
        available: true
      }))
      
      const { error } = await supabase.from('menu_items').insert(itemsWithEventId)
      if (error) throw error
      toast.success('Menu importé avec succès!')
      fetchMenuItems()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Handle file upload for menu import
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportError('')
    setImportedItems([])

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/parse-menu', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors du parsing')
      }

      if (data.items && data.items.length > 0) {
        setImportedItems(data.items)
        setShowImportDialog(true)
        toast.success(`${data.items.length} articles détectés!`)
      } else {
        toast.error('Aucun article trouvé dans le fichier')
      }
    } catch (error) {
      console.error('Upload error:', error)
      setImportError(error.message)
      toast.error(error.message)
    } finally {
      setImportLoading(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // Update imported item
  const updateImportedItem = (id, field, value) => {
    setImportedItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    )
  }

  // Remove imported item
  const removeImportedItem = (id) => {
    setImportedItems(items => items.filter(item => item.id !== id))
  }

  // Confirm and save imported items
  const confirmImport = async () => {
    if (importedItems.length === 0) {
      toast.error('Aucun article à importer')
      return
    }

    setImportLoading(true)
    try {
      const itemsToInsert = importedItems.map(item => ({
        event_id: event.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        category: item.category,
        format: item.format || 'Bouteille',
        volume: item.volume || '',
        description: item.description || '',
        available: true
      }))

      const { error } = await supabase.from('menu_items').insert(itemsToInsert)
      if (error) throw error

      toast.success(`${itemsToInsert.length} articles importés avec succès!`)
      setShowImportDialog(false)
      setImportedItems([])
      fetchMenuItems()
    } catch (error) {
      console.error('Import error:', error)
      toast.error(error.message)
    } finally {
      setImportLoading(false)
    }
  }

  const getTablesByZone = (zone) => tables.filter(t => t.zone === zone)
  
  const getBackZones = () => {
    // Support both "back" and "back_xxx" formats
    const zones = [...new Set(tables.filter(t => t.zone === 'back' || t.zone.startsWith('back_')).map(t => t.zone))]
    return zones.length > 0 ? zones : []
  }

  const stats = {
    total: tables.length,
    libre: tables.filter(t => t.status === 'libre').length,
    reserve: tables.filter(t => t.status === 'reserve').length,
    confirme: tables.filter(t => t.status === 'confirme').length,
    paye: tables.filter(t => t.status === 'paye').length,
    ca: tables.filter(t => ['confirme', 'paye'].includes(t.status)).reduce((sum, t) => sum + (t.total_price || 0), 0),
    commissions: tables.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
  }

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [configOpen, setConfigOpen] = useState(true)

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tables', label: 'Tables', icon: Table2 },
    { id: 'invoices', label: 'Factures', icon: Receipt },
  ]

  const configNavItems = [
    { id: 'days', label: 'Jours', icon: Calendar },
    { id: 'venues', label: 'Salles', icon: Users },
    { id: 'layout', label: 'Plan', icon: Settings },
    { id: 'menu', label: 'Menu', icon: Wine },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-card border-r border-border flex flex-col transition-all duration-300 fixed h-full z-40`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-bold text-amber-400 truncate">{event.name}</span>
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="shrink-0">
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {mainNavItems.map(item => (
            <Button
              key={item.id}
              variant={view === item.id ? 'secondary' : 'ghost'}
              onClick={() => setView(item.id)}
              className={`w-full justify-start ${view === item.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="ml-2">{item.label}</span>}
            </Button>
          ))}

          {/* Configuration Section */}
          <div className="pt-4">
            <Button
              variant="ghost"
              onClick={() => setConfigOpen(!configOpen)}
              className="w-full justify-start text-muted-foreground"
            >
              <Cog className="w-4 h-4 shrink-0" />
              {sidebarOpen && (
                <>
                  <span className="ml-2 flex-1 text-left">Configuration</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${configOpen ? '' : '-rotate-90'}`} />
                </>
              )}
            </Button>
            
            {(configOpen || !sidebarOpen) && (
              <div className={`${sidebarOpen ? 'ml-4 border-l border-border pl-2' : ''} mt-1 space-y-1`}>
                {configNavItems.map(item => (
                  <Button
                    key={item.id}
                    variant={view === item.id ? 'secondary' : 'ghost'}
                    onClick={() => setView(item.id)}
                    className={`w-full justify-start ${view === item.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : ''}`}
                    size="sm"
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {sidebarOpen && <span className="ml-2">{item.label}</span>}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-2 border-t border-border">
          {sidebarOpen && (
            <div className="px-2 py-1 mb-2">
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <Badge variant="outline" className="mt-1">{event.currency}</Badge>
            </div>
          )}
          <Button variant="ghost" onClick={onLogout} className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 shrink-0" />
            {sidebarOpen && <span className="ml-2">Déconnexion</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-16'} transition-all duration-300 p-6`}>
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Tables</CardDescription>
                  <CardTitle className="text-2xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-green-500/50">
                <CardHeader className="pb-2">
                  <CardDescription>Libres</CardDescription>
                  <CardTitle className="text-2xl text-green-500">{stats.libre}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-yellow-500/50">
                <CardHeader className="pb-2">
                  <CardDescription>Réservées</CardDescription>
                  <CardTitle className="text-2xl text-yellow-500">{stats.reserve}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-blue-500/50">
                <CardHeader className="pb-2">
                  <CardDescription>Confirmées</CardDescription>
                  <CardTitle className="text-2xl text-blue-500">{stats.confirme}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-purple-500/50">
                <CardHeader className="pb-2">
                  <CardDescription>Payées</CardDescription>
                  <CardTitle className="text-2xl text-purple-500">{stats.paye}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border-amber-500/50">
                <CardHeader className="pb-2">
                  <CardDescription>CA Total</CardDescription>
                  <CardTitle className="text-2xl text-amber-400">{stats.ca.toLocaleString()} {event.currency}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Résumé Financier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">CA Brut</p>
                    <p className="text-2xl font-bold">{stats.ca.toLocaleString()} {event.currency}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Commissions</p>
                    <p className="text-2xl font-bold text-red-500">-{stats.commissions.toLocaleString()} {event.currency}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">CA Net</p>
                    <p className="text-2xl font-bold text-green-500">{(stats.ca - stats.commissions).toLocaleString()} {event.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tables View */}
        {view === 'tables' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <Label>Salle</Label>
                <Select value={selectedVenue?.id} onValueChange={(v) => setSelectedVenue(venues.find(ve => ve.id === v))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner une salle" />
                  </SelectTrigger>
                  <SelectContent>
                    {venues.map(v => (
                      <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Jour</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Sélectionner un jour" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeDays.map(d => (
                      <SelectItem key={d.id} value={d.date}>
                        {d.label && <span className="text-amber-400 mr-1">[{d.label}]</span>}
                        {format(parseISO(d.date), 'EEE dd MMM', { locale: fr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tables.length === 0 && selectedVenue && selectedDay && (
                <Button onClick={generateTablesForDay}>
                  Générer les tables
                </Button>
              )}
            </div>

            {tables.length > 0 && (
              <div className="bg-card rounded-lg border p-6 overflow-x-auto">
                {/* Zone Gauche + DJ Booth + Zone Droite */}
                <div className="flex items-center justify-center gap-6 min-w-fit">
                  {/* Zone Gauche */}
                  <div className="shrink-0">
                    <h3 className="text-center mb-4 font-semibold text-muted-foreground">Zone Gauche</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getTablesByZone('left').map(table => (
                        <TableCell 
                          key={table.id} 
                          table={table} 
                          currency={event.currency}
                          onClick={() => {
                            setSelectedTable(table)
                            setShowTableModal(true)
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* DJ Booth - Centré */}
                  <div className="shrink-0 flex flex-col items-center justify-center self-center">
                    <div className="w-16 h-16 bg-gradient-to-b from-amber-500/30 to-amber-600/10 rounded-lg flex items-center justify-center border-2 border-amber-500/50">
                      <div className="text-center">
                        <div className="text-lg">🎧</div>
                        <div className="text-[9px] font-bold text-amber-400">DJ</div>
                      </div>
                    </div>
                  </div>

                  {/* Zone Droite */}
                  <div className="shrink-0">
                    <h3 className="text-center mb-4 font-semibold text-muted-foreground">Zone Droite</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {getTablesByZone('right').map(table => (
                        <TableCell 
                          key={table.id} 
                          table={table}
                          currency={event.currency}
                          onClick={() => {
                            setSelectedTable(table)
                            setShowTableModal(true)
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multiple Back Categories */}
                <div className="mt-8 space-y-6">
                  {getBackZones().map(zone => {
                    const zoneTables = getTablesByZone(zone)
                    // Handle both "back" and "back_xxx" formats
                    const zoneName = zone === 'back' ? 'Arrière' : zone.replace('back_', '').replace(/_/g, ' ')
                    const category = layoutForm.backCategories.find(c => 
                      `back_${c.name.replace(/\s+/g, '_').toLowerCase()}` === zone || 
                      (zone === 'back' && c.name.toLowerCase().includes('arrière'))
                    )
                    const tablesPerRow = category?.tablesPerRow || Math.min(zoneTables.length, 6)
                    
                    return (
                      <div key={zone}>
                        <h3 className="text-center mb-4 font-semibold text-muted-foreground capitalize">{zoneName}</h3>
                        <div className="flex flex-wrap justify-center gap-3">
                          {zoneTables.map(table => (
                            <TableCell 
                              key={table.id} 
                              table={table}
                              currency={event.currency}
                              onClick={() => {
                                setSelectedTable(table)
                                setShowTableModal(true)
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="flex justify-center gap-6 mt-8 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500"></div>
                    <span className="text-sm">Libre</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-yellow-500/30 border border-yellow-500"></div>
                    <span className="text-sm">Réservé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500/30 border border-blue-500"></div>
                    <span className="text-sm">Confirmé</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500"></div>
                    <span className="text-sm">Payé</span>
                  </div>
                </div>
              </div>
            )}

            {selectedTable && (
              <TableModal
                table={selectedTable}
                open={showTableModal}
                onClose={() => {
                  setShowTableModal(false)
                  setSelectedTable(null)
                }}
                currency={event.currency}
                event={event}
                onSave={() => {
                  fetchTables()
                  setShowTableModal(false)
                  setSelectedTable(null)
                }}
              />
            )}
          </div>
        )}

        {/* Days/Weeks View */}
        {view === 'days' && (
          <DaysWeeksManager event={event} eventDays={eventDays} onUpdate={fetchEventDays} />
        )}

        {/* Menu View */}
        {view === 'menu' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-xl font-semibold">Menu Boissons</h2>
              <div className="flex gap-2 flex-wrap">
                {/* File Upload Button */}
                <div className="relative">
                  <input
                    type="file"
                    id="menu-file-upload"
                    accept=".docx,.xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => document.getElementById('menu-file-upload').click()}
                    disabled={importLoading}
                  >
                    {importLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Importer fichier
                  </Button>
                </div>
                
                {menuItems.length === 0 && (
                  <Button variant="outline" onClick={importDefaultMenu}>
                    Menu par défaut
                  </Button>
                )}
                <Dialog open={showMenuDialog} onOpenChange={setShowMenuDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter un article
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingMenuItem ? 'Modifier' : 'Ajouter'} un article</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Nom</Label>
                        <Input
                          value={menuForm.name}
                          onChange={(e) => setMenuForm({...menuForm, name: e.target.value})}
                          placeholder="Dom Pérignon"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Catégorie</Label>
                          <Select value={menuForm.category} onValueChange={(v) => setMenuForm({...menuForm, category: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(cat => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Prix ({event.currency})</Label>
                          <Input
                            type="number"
                            value={menuForm.price === 0 ? '' : menuForm.price}
                            onChange={(e) => setMenuForm({...menuForm, price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Format</Label>
                          <Select value={menuForm.format} onValueChange={(v) => setMenuForm({...menuForm, format: v})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bouteille">Bouteille</SelectItem>
                              <SelectItem value="Magnum">Magnum</SelectItem>
                              <SelectItem value="Jeroboam">Jeroboam</SelectItem>
                              <SelectItem value="Canette">Canette</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Volume</Label>
                          <Input
                            value={menuForm.volume}
                            onChange={(e) => setMenuForm({...menuForm, volume: e.target.value})}
                            placeholder="75cl"
                          />
                        </div>
                      </div>
                      <div>
                        <Label>Description</Label>
                        <Textarea
                          value={menuForm.description}
                          onChange={(e) => setMenuForm({...menuForm, description: e.target.value})}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={menuForm.available}
                          onCheckedChange={(v) => setMenuForm({...menuForm, available: v})}
                        />
                        <Label>Disponible</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setShowMenuDialog(false)
                        setEditingMenuItem(null)
                        setMenuForm({
                          name: '',
                          category: 'champagne',
                          price: 0,
                          format: 'Bouteille',
                          volume: '75cl',
                          description: '',
                          available: true
                        })
                      }}>Annuler</Button>
                      <Button onClick={saveMenuItem} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                        {editingMenuItem ? 'Modifier' : 'Ajouter'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Tabs defaultValue="champagne" className="w-full">
              <TabsList className="flex flex-wrap h-auto gap-1">
                {categories.map(cat => (
                  <TabsTrigger key={cat.value} value={cat.value} className="text-sm">
                    {cat.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {categories.map(cat => (
                <TabsContent key={cat.value} value={cat.value}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {menuItems.filter(item => item.category === cat.value).map(item => (
                      <Card key={item.id} className={!item.available ? 'opacity-50' : ''}>
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base">{item.name}</CardTitle>
                              <CardDescription>{item.format} • {item.volume}</CardDescription>
                            </div>
                            <Badge className="bg-amber-500 text-black">
                              {item.price.toLocaleString()} {event.currency}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <Badge variant={item.available ? 'default' : 'secondary'}>
                              {item.available ? 'Disponible' : 'Indisponible'}
                            </Badge>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingMenuItem(item)
                                  setMenuForm({
                                    name: item.name,
                                    category: item.category,
                                    price: item.price,
                                    format: item.format,
                                    volume: item.volume,
                                    description: item.description || '',
                                    available: item.available
                                  })
                                  setShowMenuDialog(true)
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteMenuItem(item.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  {menuItems.filter(item => item.category === cat.value).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun article dans cette catégorie
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>

            {/* Import Preview Dialog */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Prévisualisation de l'import ({importedItems.length} articles)
                  </DialogTitle>
                  <DialogDescription>
                    Vérifiez et corrigez les données avant l'import
                  </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-auto py-4">
                  {importedItems.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Aucun article à importer
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {importedItems.map((item, index) => (
                        <div key={item.id} className="border rounded-lg p-3 bg-muted/30">
                          <div className="flex items-start gap-3">
                            <span className="text-sm font-medium text-muted-foreground w-6">{index + 1}</span>
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-3">
                              <div className="md:col-span-2">
                                <Label className="text-xs text-muted-foreground">Nom</Label>
                                <Input
                                  value={item.name}
                                  onChange={(e) => updateImportedItem(item.id, 'name', e.target.value)}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Catégorie</Label>
                                <Select 
                                  value={item.category} 
                                  onValueChange={(v) => updateImportedItem(item.id, 'category', v)}
                                >
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {categories.map(cat => (
                                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Prix ({event.currency})</Label>
                                <Input
                                  type="number"
                                  value={item.price === 0 ? '' : item.price}
                                  onChange={(e) => updateImportedItem(item.id, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                  className="h-8 text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Format</Label>
                                  <Input
                                    value={item.format}
                                    onChange={(e) => updateImportedItem(item.id, 'format', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="Bouteille"
                                  />
                                </div>
                                <div className="flex-1">
                                  <Label className="text-xs text-muted-foreground">Volume</Label>
                                  <Input
                                    value={item.volume}
                                    onChange={(e) => updateImportedItem(item.id, 'volume', e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="75cl"
                                  />
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                              onClick={() => removeImportedItem(item.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter className="border-t pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowImportDialog(false)
                      setImportedItems([])
                    }}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={confirmImport}
                    disabled={importLoading || importedItems.length === 0}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 text-black"
                  >
                    {importLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 mr-2" />
                    )}
                    Importer {importedItems.length} articles
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Invoices View */}
        {view === 'invoices' && (
          <InvoicesView event={event} tables={tables} />
        )}

        {/* Venues View */}
        {view === 'venues' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Salles</h2>
              <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                    <Plus className="w-4 h-4 mr-2" /> Nouvelle salle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une salle</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Nom</Label>
                      <Input
                        value={venueForm.name}
                        onChange={(e) => setVenueForm({...venueForm, name: e.target.value})}
                        placeholder="Main Room"
                      />
                    </div>
                    <div>
                      <Label>Capacité</Label>
                      <Input
                        type="number"
                        value={venueForm.capacity === 0 ? '' : venueForm.capacity}
                        onChange={(e) => setVenueForm({...venueForm, capacity: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVenueDialog(false)}>Annuler</Button>
                    <Button onClick={createVenue} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">Créer</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {venues.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Aucune salle. Créez votre première salle!</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venues.map(venue => (
                  <Card key={venue.id}>
                    <CardHeader>
                      <CardTitle>{venue.name}</CardTitle>
                      <CardDescription>Capacité: {venue.capacity} personnes</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Layout View - With Multiple Back Categories */}
        {view === 'layout' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h2 className="text-xl font-semibold">Configuration du Plan de Tables</h2>
              <div className="flex gap-4 items-end">
                <div>
                  <Label>Salle</Label>
                  <Select value={selectedVenue?.id} onValueChange={(v) => setSelectedVenue(venues.find(ve => ve.id === v))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Sélectionner une salle" />
                    </SelectTrigger>
                    <SelectContent>
                      {venues.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Jour (optionnel)</Label>
                  <Select value={selectedDay || 'default'} onValueChange={(v) => setSelectedDay(v === 'default' ? null : v)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Config par défaut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Config par défaut</SelectItem>
                      {activeDays.map(d => (
                        <SelectItem key={d.id} value={d.date}>
                          {d.label && `[${d.label}] `}{format(parseISO(d.date), 'EEE dd MMM', { locale: fr })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {selectedDay && (
              <Card className="bg-amber-500/10 border-amber-500/30">
                <CardContent className="py-3 flex items-center justify-between">
                  <p className="text-sm">
                    <strong>Configuration spécifique</strong> pour le {format(parseISO(selectedDay), 'EEEE dd MMMM', { locale: fr })}. 
                    Cette configuration sera utilisée uniquement pour ce jour.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={async () => {
                      // Copy default layout to this day
                      const { data: defaultLayouts } = await supabase
                        .from('table_layouts')
                        .select('*')
                        .eq('venue_id', selectedVenue.id)
                        .is('date', null)
                      
                      if (defaultLayouts && defaultLayouts.length > 0) {
                        // Delete existing for this day
                        await supabase
                          .from('table_layouts')
                          .delete()
                          .eq('venue_id', selectedVenue.id)
                          .eq('date', selectedDay)
                        
                        // Copy default layouts
                        const newLayouts = defaultLayouts.map(l => ({
                          ...l,
                          id: undefined,
                          date: selectedDay
                        }))
                        await supabase.from('table_layouts').insert(newLayouts)
                        toast.success('Configuration par défaut copiée!')
                        fetchLayouts()
                      } else {
                        toast.error('Aucune configuration par défaut trouvée')
                      }
                    }}
                  >
                    Copier config par défaut
                  </Button>
                </CardContent>
              </Card>
            )}

            {!selectedVenue ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Sélectionnez ou créez une salle d'abord.</p>
              </Card>
            ) : (
              <>
                {/* Side Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {['left', 'right'].map(zone => (
                    <Card key={zone}>
                      <CardHeader>
                        <CardTitle>Zone {zone === 'left' ? 'Gauche' : 'Droite'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Préfixe</Label>
                            <Input
                              value={layoutForm[zone].prefix}
                              onChange={(e) => setLayoutForm({
                                ...layoutForm,
                                [zone]: { ...layoutForm[zone], prefix: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Nombre de tables</Label>
                            <Input
                              type="number"
                              value={layoutForm[zone].count === 0 ? '' : layoutForm[zone].count}
                              onChange={(e) => setLayoutForm({
                                ...layoutForm,
                                [zone]: { ...layoutForm[zone], count: e.target.value === '' ? 0 : parseInt(e.target.value) }
                              })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Capacité/table</Label>
                            <Input
                              type="number"
                              value={layoutForm[zone].capacity === 0 ? '' : layoutForm[zone].capacity}
                              onChange={(e) => setLayoutForm({
                                ...layoutForm,
                                [zone]: { ...layoutForm[zone], capacity: e.target.value === '' ? 0 : parseInt(e.target.value) }
                              })}
                            />
                          </div>
                          <div>
                            <Label>Prix ({event.currency})</Label>
                            <Input
                              type="number"
                              value={layoutForm[zone].price === 0 ? '' : layoutForm[zone].price}
                              onChange={(e) => setLayoutForm({
                                ...layoutForm,
                                [zone]: { ...layoutForm[zone], price: e.target.value === '' ? 0 : parseInt(e.target.value) }
                              })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Back Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Catégories Arrière (derrière le DJ)</h3>
                    <Button onClick={addBackCategory} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter une catégorie
                    </Button>
                  </div>
                  
                  {layoutForm.backCategories.map((cat, index) => (
                    <Card key={cat.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Input
                            value={cat.name}
                            onChange={(e) => updateBackCategory(cat.id, 'name', e.target.value)}
                            className="max-w-xs font-semibold"
                            placeholder="Nom de la catégorie"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBackCategory(cat.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                          <div>
                            <Label>Préfixe</Label>
                            <Input
                              value={cat.prefix}
                              onChange={(e) => updateBackCategory(cat.id, 'prefix', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Nb lignes</Label>
                            <Input
                              type="number"
                              min="1"
                              value={cat.rows === 0 ? '' : cat.rows}
                              onChange={(e) => updateBackCategory(cat.id, 'rows', e.target.value === '' ? 1 : parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Tables/ligne</Label>
                            <Input
                              type="number"
                              min="1"
                              value={cat.tablesPerRow === 0 ? '' : cat.tablesPerRow}
                              onChange={(e) => updateBackCategory(cat.id, 'tablesPerRow', e.target.value === '' ? 1 : parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Total</Label>
                            <Input
                              value={cat.rows * cat.tablesPerRow}
                              disabled
                              className="bg-muted"
                            />
                          </div>
                          <div>
                            <Label>Capacité/table</Label>
                            <Input
                              type="number"
                              value={cat.capacity === 0 ? '' : cat.capacity}
                              onChange={(e) => updateBackCategory(cat.id, 'capacity', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Prix ({event.currency})</Label>
                            <Input
                              type="number"
                              value={cat.price === 0 ? '' : cat.price}
                              onChange={(e) => updateBackCategory(cat.id, 'price', e.target.value === '' ? 0 : parseInt(e.target.value))}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Button onClick={saveLayout} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                  Sauvegarder la configuration
                </Button>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisualisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start p-4 bg-muted rounded-lg">
                      <div className="flex-1">
                        <p className="text-center text-sm mb-2 font-semibold">Gauche</p>
                        <div className="grid grid-cols-2 gap-1 max-w-24 mx-auto">
                          {Array.from({ length: layoutForm.left.count }).map((_, i) => (
                            <div key={i} className="w-10 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                              {layoutForm.left.prefix}{i + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mx-4">
                        <div className="w-20 h-20 bg-amber-500/30 border-2 border-amber-500 rounded flex items-center justify-center">
                          <span className="text-xs font-bold">🎧 DJ</span>
                        </div>
                      </div>

                      <div className="flex-1">
                        <p className="text-center text-sm mb-2 font-semibold">Droite</p>
                        <div className="grid grid-cols-2 gap-1 max-w-24 mx-auto">
                          {Array.from({ length: layoutForm.right.count }).map((_, i) => (
                            <div key={i} className="w-10 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                              {layoutForm.right.prefix}{i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Preview Back Categories */}
                    <div className="mt-6 space-y-4">
                      {layoutForm.backCategories.map(cat => {
                        const totalTables = cat.rows * cat.tablesPerRow
                        return (
                          <div key={cat.id}>
                            <p className="text-center text-sm mb-2 font-semibold">{cat.name} ({cat.rows} lignes × {cat.tablesPerRow} = {totalTables} tables)</p>
                            <div 
                              className="grid gap-1 mx-auto"
                              style={{ 
                                gridTemplateColumns: `repeat(${cat.tablesPerRow}, minmax(0, 1fr))`,
                                maxWidth: `${cat.tablesPerRow * 50}px`
                              }}
                            >
                              {Array.from({ length: totalTables }).map((_, i) => (
                                <div key={i} className="w-10 h-8 bg-blue-500/30 border border-blue-500 rounded flex items-center justify-center text-xs">
                                  {cat.prefix}{i + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

// Table Cell Component
function TableCell({ table, currency, onClick }) {
  const getStatusClass = (status) => {
    const classes = {
      libre: 'bg-green-500/20 border-green-500 hover:bg-green-500/30',
      reserve: 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/30',
      confirme: 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30',
      paye: 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/30'
    }
    return classes[status] || ''
  }

  // Calculate total persons (base capacity + additional persons)
  const baseCapacity = table.capacity || 0
  const additionalPersons = table.additional_persons || 0
  const totalPersons = baseCapacity + additionalPersons
  
  // Check if table has reservation info
  const hasReservation = table.status !== 'libre' && table.client_name

  return (
    <div
      onClick={onClick}
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all w-[130px] h-[100px] flex flex-col justify-center ${getStatusClass(table.status)}`}
    >
      <div className="font-bold text-center text-base">{table.table_number}</div>
      
      {hasReservation ? (
        <>
          {/* Client name */}
          <div className="text-xs text-center truncate mt-1 font-medium px-1">{table.client_name}</div>
          
          {/* Number of persons */}
          <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            <span>{totalPersons > 0 ? totalPersons : baseCapacity || '-'}</span>
          </div>
          
          {/* Price */}
          {table.sold_price > 0 && (
            <div className="text-xs text-center font-semibold text-amber-400 mt-0.5">
              {table.sold_price.toLocaleString()} {currency}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Show capacity for free tables */}
          {baseCapacity > 0 && (
            <div className="text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Users className="w-3 h-3" />
              <span>{baseCapacity} pers.</span>
            </div>
          )}
          {/* Show standard price for free tables */}
          {table.standard_price > 0 && (
            <div className="text-xs text-center text-muted-foreground mt-0.5">
              {table.standard_price.toLocaleString()} {currency}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Table Modal Component
function TableModal({ table, open, onClose, currency, event, onSave }) {
  const [form, setForm] = useState({
    status: table.status || 'libre',
    client_name: table.client_name || '',
    client_email: table.client_email || '',
    client_phone: table.client_phone || '',
    client_address: table.client_address || '',
    sold_price: table.sold_price || table.standard_price || 0,
    concierge_nom: table.concierge_nom || '',
    concierge_commission: table.concierge_commission || 0,
    additional_persons: table.additional_persons || 0,
    additional_person_price: table.additional_person_price || 0,
    on_site_additional_persons: table.on_site_additional_persons || 0,
    on_site_additional_revenue: table.on_site_additional_revenue || 0,
    staff_notes: table.staff_notes || '',
    drink_preorder: table.drink_preorder || ''
  })
  const [saving, setSaving] = useState(false)
  const [vipLink, setVipLink] = useState('')
  const [generatingVipLink, setGeneratingVipLink] = useState(false)

  const beverageBudget = form.sold_price
  const commissionAmount = form.sold_price * (form.concierge_commission / 100)
  const totalPrice = form.sold_price + (form.additional_persons * form.additional_person_price) + form.on_site_additional_revenue
  const netAmount = totalPrice - commissionAmount

  const handleSave = async () => {
    setSaving(true)
    try {
      let newStatus = form.status
      if (form.client_name && newStatus === 'libre') {
        newStatus = 'reserve'
      }

      const { error } = await supabase
        .from('tables')
        .update({
          ...form,
          status: newStatus
        })
        .eq('id', table.id)

      if (error) throw error
      toast.success('Table mise à jour!')
      onSave()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const markAsPaid = async () => {
    setSaving(true)
    try {
      await supabase
        .from('tables')
        .update({ status: 'paye' })
        .eq('id', table.id)
      toast.success('Table marquée comme payée!')
      onSave()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const confirmTable = async () => {
    setSaving(true)
    try {
      await supabase
        .from('tables')
        .update({ status: 'confirme' })
        .eq('id', table.id)
      toast.success('Réservation confirmée!')
      onSave()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const resetTable = async () => {
    if (!confirm('Êtes-vous sûr de vouloir libérer cette table?')) return
    setSaving(true)
    try {
      await supabase
        .from('tables')
        .update({
          status: 'libre',
          client_name: null,
          client_email: null,
          client_phone: null,
          client_address: null,
          sold_price: 0,
          concierge_nom: null,
          concierge_commission: 0,
          additional_persons: 0,
          additional_person_price: 0,
          on_site_additional_persons: 0,
          on_site_additional_revenue: 0,
          staff_notes: null,
          drink_preorder: null
        })
        .eq('id', table.id)
      toast.success('Table libérée!')
      onSave()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  const generateInvoice = () => {
    const doc = new jsPDF()
    
    doc.setFontSize(24)
    doc.setTextColor(218, 165, 32)
    doc.text('FACTURE', 105, 30, { align: 'center' })
    
    doc.setFontSize(16)
    doc.setTextColor(0, 0, 0)
    doc.text(event.name, 105, 40, { align: 'center' })
    
    doc.setFontSize(10)
    doc.text(`Facture N°: INV-${table.id.slice(0, 8).toUpperCase()}`, 20, 60)
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 67)
    doc.text(`Table: ${table.table_number}`, 20, 74)
    doc.text(`Date réservation: ${format(parseISO(table.day), 'dd MMMM yyyy', { locale: fr })}`, 20, 81)
    
    doc.setFontSize(12)
    doc.text('Client:', 20, 100)
    doc.setFontSize(10)
    doc.text(form.client_name || 'N/A', 20, 108)
    doc.text(form.client_email || '', 20, 115)
    doc.text(form.client_phone || '', 20, 122)
    doc.text(form.client_address || '', 20, 129)
    
    let yPos = 150
    doc.setFillColor(218, 165, 32)
    doc.rect(20, yPos, 170, 8, 'F')
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    doc.text('Description', 25, yPos + 6)
    doc.text('Montant', 165, yPos + 6, { align: 'right' })
    
    yPos += 15
    doc.text(`Table ${table.table_number} - Réservation VIP`, 25, yPos)
    doc.text(`${form.sold_price.toLocaleString()} ${currency}`, 165, yPos, { align: 'right' })
    
    if (form.additional_persons > 0) {
      yPos += 8
      doc.text(`Personnes supplémentaires (${form.additional_persons} x ${form.additional_person_price} ${currency})`, 25, yPos)
      doc.text(`${(form.additional_persons * form.additional_person_price).toLocaleString()} ${currency}`, 165, yPos, { align: 'right' })
    }
    
    if (form.on_site_additional_revenue > 0) {
      yPos += 8
      doc.text('Revenus supplémentaires sur place', 25, yPos)
      doc.text(`${form.on_site_additional_revenue.toLocaleString()} ${currency}`, 165, yPos, { align: 'right' })
    }
    
    yPos += 15
    doc.setDrawColor(218, 165, 32)
    doc.line(20, yPos, 190, yPos)
    yPos += 10
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('TOTAL', 25, yPos)
    doc.text(`${totalPrice.toLocaleString()} ${currency}`, 165, yPos, { align: 'right' })
    
    yPos += 15
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(`Budget boissons inclus: ${beverageBudget.toLocaleString()} ${currency}`, 25, yPos)
    
    doc.setFontSize(8)
    doc.text('Merci de votre confiance!', 105, 270, { align: 'center' })
    doc.text(event.location || '', 105, 277, { align: 'center' })
    
    doc.save(`Facture_${table.table_number}_${format(new Date(), 'yyyyMMdd')}.pdf`)
    toast.success('Facture générée!')
  }

  const generateVipLink = async () => {
    setGeneratingVipLink(true)
    try {
      const response = await fetch('/api/vip/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tableId: table.id })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur de génération')
      }
      
      setVipLink(data.link)
      
      // Try to copy to clipboard (may fail due to browser permissions)
      try {
        await navigator.clipboard.writeText(data.link)
        toast.success('Lien VIP généré et copié!', {
          description: data.isExisting ? 'Lien existant récupéré' : 'Nouveau lien généré'
        })
      } catch (clipboardError) {
        // Clipboard failed, but link is still generated
        toast.success('Lien VIP généré!', {
          description: 'Cliquez sur l\'icône copier pour copier le lien'
        })
      }
      
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setGeneratingVipLink(false)
    }
  }

  const copyVipLink = async () => {
    if (vipLink) {
      try {
        await navigator.clipboard.writeText(vipLink)
        toast.success('Lien copié!')
      } catch (err) {
        // Fallback: create a temporary input element
        const textArea = document.createElement('textarea')
        textArea.value = vipLink
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          toast.success('Lien copié!')
        } catch (e) {
          toast.error('Impossible de copier. Sélectionnez le lien manuellement.')
        }
        document.body.removeChild(textArea)
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Table {table.table_number}
            <Badge className={{
              libre: 'bg-green-500',
              reserve: 'bg-yellow-500',
              confirme: 'bg-blue-500',
              paye: 'bg-purple-500'
            }[form.status]}>
              {form.status === 'libre' ? 'Libre' : form.status === 'reserve' ? 'Réservé' : form.status === 'confirme' ? 'Confirmé' : 'Payé'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Informations Client</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nom complet</Label>
                <Input
                  value={form.client_name}
                  onChange={(e) => setForm({...form, client_name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.client_email}
                  onChange={(e) => setForm({...form, client_email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input
                  value={form.client_phone}
                  onChange={(e) => setForm({...form, client_phone: e.target.value})}
                  placeholder="+41 79 123 45 67"
                />
              </div>
              <div>
                <Label>Adresse</Label>
                <Input
                  value={form.client_address}
                  onChange={(e) => setForm({...form, client_address: e.target.value})}
                  placeholder="Rue Example 1, Genève"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Tarification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prix standard</Label>
                <Input value={table.standard_price} disabled className="bg-muted" />
              </div>
              <div>
                <Label>Prix négocié ({currency})</Label>
                <Input
                  type="number"
                  value={form.sold_price === 0 ? '' : form.sold_price}
                  onChange={(e) => setForm({...form, sold_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Budget boissons (10%)</Label>
                <Input value={beverageBudget.toFixed(2)} disabled className="bg-muted" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Concierge</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nom du concierge</Label>
                <Input
                  value={form.concierge_nom}
                  onChange={(e) => setForm({...form, concierge_nom: e.target.value})}
                />
              </div>
              <div>
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.concierge_commission === 0 ? '' : form.concierge_commission}
                  onChange={(e) => setForm({...form, concierge_commission: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Montant commission</Label>
                <Input value={commissionAmount.toFixed(2)} disabled className="bg-muted" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Personnes supplémentaires</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre de personnes supp.</Label>
                <Input
                  type="number"
                  value={form.additional_persons === 0 ? '' : form.additional_persons}
                  onChange={(e) => setForm({...form, additional_persons: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Prix par personne ({currency})</Label>
                <Input
                  type="number"
                  value={form.additional_person_price === 0 ? '' : form.additional_person_price}
                  onChange={(e) => setForm({...form, additional_person_price: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Personnes ajoutées sur place</Label>
                <Input
                  type="number"
                  value={form.on_site_additional_persons === 0 ? '' : form.on_site_additional_persons}
                  onChange={(e) => setForm({...form, on_site_additional_persons: e.target.value === '' ? 0 : parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Revenus supp. sur place ({currency})</Label>
                <Input
                  type="number"
                  value={form.on_site_additional_revenue === 0 ? '' : form.on_site_additional_revenue}
                  onChange={(e) => setForm({...form, on_site_additional_revenue: e.target.value === '' ? 0 : parseFloat(e.target.value)})}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Notes</h3>
            <div className="space-y-4">
              <div>
                <Label>Notes staff (internes)</Label>
                <Textarea
                  value={form.staff_notes}
                  onChange={(e) => setForm({...form, staff_notes: e.target.value})}
                />
              </div>
              <div>
                <Label>Précommande boissons</Label>
                <Textarea
                  value={form.drink_preorder}
                  onChange={(e) => setForm({...form, drink_preorder: e.target.value})}
                />
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/30">
            <CardHeader>
              <CardTitle className="text-lg text-amber-400">Résumé Financier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Prix de base:</span>
                  <span>{form.sold_price.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Personnes supp. ({form.additional_persons} × {form.additional_person_price}):</span>
                  <span>+ {(form.additional_persons * form.additional_person_price).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Revenus sur place:</span>
                  <span>+ {form.on_site_additional_revenue.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>{totalPrice.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Commission concierge:</span>
                  <span>- {commissionAmount.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between font-bold text-green-500 border-t pt-2">
                  <span>Net:</span>
                  <span>{netAmount.toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-amber-400 border-t pt-2 mt-2">
                  <span>Budget boissons:</span>
                  <span>{beverageBudget.toLocaleString()} {currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* VIP Pre-order Link */}
          {form.client_name && form.sold_price > 0 && (
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-purple-400 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Pré-commande VIP
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Générez un lien unique pour que le client puisse pré-commander ses boissons.
                </p>
                
                {vipLink ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input 
                        value={vipLink} 
                        readOnly 
                        className="text-xs bg-zinc-800/50"
                      />
                      <Button size="icon" variant="outline" onClick={copyVipLink}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="outline" onClick={() => window.open(vipLink, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-green-400">✓ Lien prêt à envoyer au client</p>
                  </div>
                ) : (
                  <Button 
                    onClick={generateVipLink} 
                    disabled={generatingVipLink}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    {generatingVipLink ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Link className="w-4 h-4 mr-2" />
                        Générer lien VIP
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {form.status !== 'libre' && (
            <Button variant="destructive" onClick={resetTable} disabled={saving}>
              Libérer
            </Button>
          )}
          {form.client_name && (
            <Button variant="outline" onClick={generateInvoice}>
              <Download className="w-4 h-4 mr-2" /> PDF
            </Button>
          )}
          {form.status === 'reserve' && (
            <Button variant="secondary" onClick={confirmTable} disabled={saving}>
              Confirmer
            </Button>
          )}
          {form.status === 'confirme' && (
            <Button className="bg-purple-500 hover:bg-purple-600" onClick={markAsPaid} disabled={saving}>
              Payé
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


// Invoices View Component
function InvoicesView({ event }) {
  const [reservedTables, setReservedTables] = useState([])
  const [payments, setPayments] = useState({})
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'virement', reference: '', notes: '' })

  useEffect(() => {
    fetchReservedTables()
    fetchPayments()
  }, [event.id])

  const fetchReservedTables = async () => {
    try {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', event.id)
        .neq('status', 'libre')
        .order('day')
      setReservedTables(data || [])
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayments = async () => {
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false })
      
      // Group payments by table_id
      const grouped = (data || []).reduce((acc, p) => {
        if (!acc[p.table_id]) acc[p.table_id] = []
        acc[p.table_id].push(p)
        return acc
      }, {})
      setPayments(grouped)
    } catch (error) {
      console.error('Error fetching payments:', error)
    }
  }

  // Format amount Swiss style: 1'500.00
  const formatSwiss = (amount) => {
    return amount.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Calculate total for a table
  const calculateTableTotal = (table) => {
    const basePrice = table.sold_price || table.standard_price || 0
    const additionalPersons = (table.additional_persons || 0) * (table.additional_person_price || 0)
    const onSiteRevenue = table.on_site_additional_revenue || 0
    return basePrice + additionalPersons + onSiteRevenue
  }

  // Calculate paid amount for a table
  const getPaidAmount = (tableId) => {
    const tablePayments = payments[tableId] || []
    return tablePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  // Generate PDF Invoice
  const generateInvoice = (table, consolidated = false, clientTables = null) => {
    const doc = new jsPDF()
    const currency = event.currency
    const tables = consolidated ? clientTables : [table]
    
    // Header
    doc.setFontSize(24)
    doc.setTextColor(218, 165, 32)
    doc.text(consolidated ? 'FACTURE CONSOLIDÉE' : 'FACTURE', 105, 25, { align: 'center' })
    
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(event.name, 105, 35, { align: 'center' })
    
    // Invoice info
    doc.setFontSize(10)
    const invoiceNum = consolidated 
      ? `CONS-${table.client_email?.slice(0, 6) || 'X'}-${format(new Date(), 'yyyyMMdd')}`.toUpperCase()
      : `INV-${table.id.slice(0, 8).toUpperCase()}`
    
    doc.text(`Facture N°: ${invoiceNum}`, 20, 55)
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 62)
    
    // Client info
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('Client:', 20, 80)
    doc.setFont(undefined, 'normal')
    doc.setFontSize(10)
    doc.text(table.client_name || 'N/A', 20, 88)
    if (table.client_email) doc.text(table.client_email, 20, 95)
    if (table.client_phone) doc.text(table.client_phone, 20, 102)
    if (table.client_address) doc.text(table.client_address, 20, 109)
    
    // Table header
    let yPos = 130
    doc.setFillColor(218, 165, 32)
    doc.rect(20, yPos, 170, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('Description', 25, yPos + 6)
    doc.text('Date', 100, yPos + 6)
    doc.text('Montant', 175, yPos + 6, { align: 'right' })
    
    // Table rows
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, 'normal')
    yPos += 12
    
    let grandTotal = 0
    tables.forEach((t, idx) => {
      const total = calculateTableTotal(t)
      grandTotal += total
      
      // Table line
      doc.text(`Table ${t.table_number} - Réservation VIP`, 25, yPos)
      doc.text(format(parseISO(t.day), 'dd/MM/yyyy'), 100, yPos)
      doc.text(`${formatSwiss(t.sold_price || 0)} ${currency}`, 175, yPos, { align: 'right' })
      yPos += 7
      
      // Additional persons
      if (t.additional_persons > 0) {
        const addAmount = t.additional_persons * (t.additional_person_price || 0)
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`  + ${t.additional_persons} pers. supp. × ${formatSwiss(t.additional_person_price || 0)}`, 25, yPos)
        doc.text(`${formatSwiss(addAmount)} ${currency}`, 175, yPos, { align: 'right' })
        yPos += 6
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
      }
      
      // On-site revenue
      if (t.on_site_additional_revenue > 0) {
        doc.setFontSize(9)
        doc.setTextColor(100, 100, 100)
        doc.text(`  + Revenus supplémentaires sur place`, 25, yPos)
        doc.text(`${formatSwiss(t.on_site_additional_revenue)} ${currency}`, 175, yPos, { align: 'right' })
        yPos += 6
        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
      }
      
      if (idx < tables.length - 1) yPos += 3
    })
    
    // Total
    yPos += 5
    doc.setDrawColor(218, 165, 32)
    doc.line(20, yPos, 190, yPos)
    yPos += 8
    doc.setFontSize(12)
    doc.setFont(undefined, 'bold')
    doc.text('TOTAL', 25, yPos)
    doc.text(`${formatSwiss(grandTotal)} ${currency}`, 175, yPos, { align: 'right' })
    
    // Payments section
    const allPayments = tables.flatMap(t => payments[t.id] || [])
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0)
    const remaining = grandTotal - totalPaid
    
    if (allPayments.length > 0) {
      yPos += 15
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('Paiements reçus:', 25, yPos)
      doc.setFont(undefined, 'normal')
      yPos += 7
      
      allPayments.forEach(p => {
        doc.text(`${format(parseISO(p.payment_date), 'dd/MM/yyyy')} - ${p.payment_method}`, 30, yPos)
        doc.text(`-${formatSwiss(p.amount)} ${currency}`, 175, yPos, { align: 'right' })
        yPos += 6
      })
      
      yPos += 5
      doc.setFont(undefined, 'bold')
      if (remaining > 0) {
        doc.setTextColor(200, 0, 0)
        doc.text('RESTE À PAYER:', 25, yPos)
        doc.text(`${formatSwiss(remaining)} ${currency}`, 175, yPos, { align: 'right' })
      } else {
        doc.setTextColor(0, 150, 0)
        doc.text('SOLDÉ', 25, yPos)
      }
    }
    
    // Budget info
    yPos += 20
    doc.setFontSize(9)
    doc.setTextColor(100, 100, 100)
    doc.setFont(undefined, 'normal')
    const totalBudget = tables.reduce((sum, t) => sum + (t.sold_price || t.standard_price || 0), 0)
    doc.text(`Budget boissons inclus: ${formatSwiss(totalBudget)} ${currency}`, 25, yPos)
    
    // Footer
    doc.setFontSize(9)
    doc.setTextColor(0, 0, 0)
    doc.text('Merci de votre confiance!', 105, 265, { align: 'center' })
    doc.setFontSize(8)
    doc.text('Caprices Festival - Gstaad', 105, 272, { align: 'center' })
    doc.text('vip@caprices.ch', 105, 278, { align: 'center' })
    
    const fileName = consolidated 
      ? `Facture_Consolidee_${table.client_name?.replace(/\s+/g, '_') || 'Client'}_${format(new Date(), 'yyyyMMdd')}.pdf`
      : `Facture_${table.table_number}_${format(new Date(), 'yyyyMMdd')}.pdf`
    
    doc.save(fileName)
    toast.success('Facture générée!')
    
    return doc
  }

  // Send invoice by email
  const sendInvoiceEmail = async (table, consolidated = false, clientTables = null) => {
    if (!table.client_email) {
      toast.error('Email client manquant')
      return
    }

    setSendingEmail(consolidated ? `cons_${table.client_email}` : table.id)
    
    try {
      const doc = new jsPDF()
      const tables = consolidated ? clientTables : [table]
      const currency = event.currency
      
      // Generate PDF content (same as generateInvoice but don't save)
      // ... (recreate PDF in memory)
      doc.setFontSize(24)
      doc.setTextColor(218, 165, 32)
      doc.text(consolidated ? 'FACTURE CONSOLIDÉE' : 'FACTURE', 105, 25, { align: 'center' })
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.text(event.name, 105, 35, { align: 'center' })
      
      const invoiceNum = consolidated 
        ? `CONS-${table.client_email?.slice(0, 6) || 'X'}-${format(new Date(), 'yyyyMMdd')}`.toUpperCase()
        : `INV-${table.id.slice(0, 8).toUpperCase()}`
      
      doc.setFontSize(10)
      doc.text(`Facture N°: ${invoiceNum}`, 20, 55)
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 20, 62)
      
      doc.setFontSize(11)
      doc.setFont(undefined, 'bold')
      doc.text('Client:', 20, 80)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(10)
      doc.text(table.client_name || 'N/A', 20, 88)
      if (table.client_email) doc.text(table.client_email, 20, 95)
      if (table.client_phone) doc.text(table.client_phone, 20, 102)
      
      let yPos = 130
      doc.setFillColor(218, 165, 32)
      doc.rect(20, yPos, 170, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.setFont(undefined, 'bold')
      doc.text('Description', 25, yPos + 6)
      doc.text('Date', 100, yPos + 6)
      doc.text('Montant', 175, yPos + 6, { align: 'right' })
      
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      yPos += 12
      
      let grandTotal = 0
      tables.forEach(t => {
        grandTotal += calculateTableTotal(t)
        doc.text(`Table ${t.table_number} - Réservation VIP`, 25, yPos)
        doc.text(format(parseISO(t.day), 'dd/MM/yyyy'), 100, yPos)
        doc.text(`${formatSwiss(t.sold_price || 0)} ${currency}`, 175, yPos, { align: 'right' })
        yPos += 8
      })
      
      yPos += 5
      doc.setDrawColor(218, 165, 32)
      doc.line(20, yPos, 190, yPos)
      yPos += 8
      doc.setFontSize(12)
      doc.setFont(undefined, 'bold')
      doc.text('TOTAL', 25, yPos)
      doc.text(`${formatSwiss(grandTotal)} ${currency}`, 175, yPos, { align: 'right' })
      
      doc.setFontSize(9)
      doc.setFont(undefined, 'normal')
      doc.text('Merci de votre confiance!', 105, 265, { align: 'center' })
      doc.text('Caprices Festival - Gstaad | vip@caprices.ch', 105, 272, { align: 'center' })
      
      // Get base64
      const pdfBase64 = doc.output('datauristring').split(',')[1]
      
      const fileName = consolidated 
        ? `Facture_Consolidee_${table.client_name?.replace(/\s+/g, '_') || 'Client'}.pdf`
        : `Facture_${table.table_number}.pdf`
      
      const response = await fetch('/api/invoice/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: table.client_email,
          subject: `Facture Caprices VIP - ${table.client_name || 'Client'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #DAA520;">Caprices Festival - VIP</h2>
              <p>Bonjour ${table.client_name || ''},</p>
              <p>Veuillez trouver ci-joint votre facture pour votre réservation VIP.</p>
              <p><strong>Montant total: ${formatSwiss(grandTotal)} ${currency}</strong></p>
              <p>Pour toute question, n'hésitez pas à nous contacter.</p>
              <p>Cordialement,<br>L'équipe Caprices VIP</p>
              <hr style="border-color: #DAA520;">
              <p style="font-size: 12px; color: #666;">vip@caprices.ch</p>
            </div>
          `,
          pdfBase64,
          fileName
        })
      })

      const data = await response.json()
      
      if (!response.ok) throw new Error(data.error)
      
      toast.success(`Facture envoyée à ${table.client_email}`)
    } catch (error) {
      toast.error(`Erreur: ${error.message}`)
    } finally {
      setSendingEmail(null)
    }
  }

  // Add payment
  const addPayment = async () => {
    if (!selectedTableForPayment || !paymentForm.amount) {
      toast.error('Montant requis')
      return
    }

    try {
      const { error } = await supabase.from('payments').insert({
        table_id: selectedTableForPayment.id,
        amount: parseFloat(paymentForm.amount),
        payment_method: paymentForm.method,
        reference: paymentForm.reference,
        notes: paymentForm.notes,
        payment_date: new Date().toISOString().split('T')[0]
      })

      if (error) throw error

      toast.success('Paiement enregistré!')
      setShowPaymentDialog(false)
      setPaymentForm({ amount: '', method: 'virement', reference: '', notes: '' })
      fetchPayments()
      fetchReservedTables()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Group by client (email or phone)
  const groupedByClient = reservedTables.reduce((acc, table) => {
    const key = table.client_email?.toLowerCase() || table.client_phone || table.id
    if (!acc[key]) {
      acc[key] = {
        client_name: table.client_name,
        client_email: table.client_email,
        client_phone: table.client_phone,
        client_address: table.client_address,
        tables: []
      }
    }
    acc[key].tables.push(table)
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Facturation Clients</h2>
        <Badge variant="outline">{reservedTables.length} réservations</Badge>
      </div>
      
      {Object.keys(groupedByClient).length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Aucune réservation à facturer</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.values(groupedByClient).map((client, idx) => {
            const clientTotal = client.tables.reduce((sum, t) => sum + calculateTableTotal(t), 0)
            const clientPaid = client.tables.reduce((sum, t) => sum + getPaidAmount(t.id), 0)
            const clientRemaining = clientTotal - clientPaid
            
            return (
              <Card key={idx} className={clientRemaining <= 0 ? 'border-green-500/50' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {client.client_name || 'Client sans nom'}
                        {clientRemaining <= 0 && <Badge className="bg-green-500">Soldé</Badge>}
                      </CardTitle>
                      <CardDescription>
                        {client.client_email} {client.client_phone && `• ${client.client_phone}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{client.tables.length} table{client.tables.length > 1 ? 's' : ''}</Badge>
                      {client.tables.length > 1 && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => generateInvoice(client.tables[0], true, client.tables)}>
                            <Download className="w-4 h-4 mr-1" /> Consolidée
                          </Button>
                          {client.client_email && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => sendInvoiceEmail(client.tables[0], true, client.tables)}
                              disabled={sendingEmail === `cons_${client.client_email}`}
                            >
                              {sendingEmail === `cons_${client.client_email}` ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <FileText className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {client.tables.map(table => {
                      const tableTotal = calculateTableTotal(table)
                      const tablePaid = getPaidAmount(table.id)
                      const tableRemaining = tableTotal - tablePaid
                      
                      return (
                        <div key={table.id} className="p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{table.table_number}</span>
                              <span className="text-muted-foreground text-sm">
                                {format(parseISO(table.day), 'dd MMM yyyy', { locale: fr })}
                              </span>
                              <Badge variant={table.status === 'paye' ? 'default' : 'secondary'} className="text-xs">
                                {table.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right mr-4">
                                <div className="font-bold">{formatSwiss(tableTotal)} {event.currency}</div>
                                {tablePaid > 0 && (
                                  <div className="text-xs text-green-500">Payé: {formatSwiss(tablePaid)}</div>
                                )}
                                {tableRemaining > 0 && (
                                  <div className="text-xs text-orange-500">Reste: {formatSwiss(tableRemaining)}</div>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTableForPayment(table)
                                  setShowPaymentDialog(true)
                                }}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => generateInvoice(table)}>
                                <Download className="w-4 h-4" />
                              </Button>
                              {table.client_email && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => sendInvoiceEmail(table)}
                                  disabled={sendingEmail === table.id}
                                >
                                  {sendingEmail === table.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <FileText className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {/* Show payments */}
                          {payments[table.id]?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="text-xs text-muted-foreground mb-1">Paiements:</div>
                              {payments[table.id].map(p => (
                                <div key={p.id} className="flex justify-between text-xs">
                                  <span>{format(parseISO(p.payment_date), 'dd/MM/yy')} - {p.payment_method}</span>
                                  <span className="text-green-500">{formatSwiss(p.amount)} {event.currency}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Client total */}
                  <div className="mt-4 pt-4 border-t flex justify-between items-center">
                    <div>
                      <span className="font-semibold">Total client:</span>
                      {clientPaid > 0 && (
                        <span className="ml-4 text-sm text-green-500">Payé: {formatSwiss(clientPaid)} {event.currency}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-amber-400">
                        {formatSwiss(clientTotal)} {event.currency}
                      </div>
                      {clientRemaining > 0 && (
                        <div className="text-sm text-orange-500">
                          Reste à payer: {formatSwiss(clientRemaining)} {event.currency}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              Table {selectedTableForPayment?.table_number} - {selectedTableForPayment?.client_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Montant ({event.currency})</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Méthode de paiement</Label>
              <Select value={paymentForm.method} onValueChange={(v) => setPaymentForm({...paymentForm, method: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="virement">Virement bancaire</SelectItem>
                  <SelectItem value="carte">Carte de crédit</SelectItem>
                  <SelectItem value="twint">TWINT</SelectItem>
                  <SelectItem value="especes">Espèces</SelectItem>
                  <SelectItem value="autre">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Référence (optionnel)</Label>
              <Input
                value={paymentForm.reference}
                onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                placeholder="N° de transaction..."
              />
            </div>
            <div>
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                placeholder="Notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>Annuler</Button>
            <Button onClick={addPayment} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Days/Weeks Manager Component
function DaysWeeksManager({ event, eventDays, onUpdate }) {
  const [weeks, setWeeks] = useState([])
  const [showAddWeek, setShowAddWeek] = useState(false)
  const [showEditWeek, setShowEditWeek] = useState(false)
  const [editingWeek, setEditingWeek] = useState(null)
  const [newWeek, setNewWeek] = useState({ name: '', dates: [] })
  const [selectedDates, setSelectedDates] = useState([])
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const grouped = {}
    eventDays.forEach(day => {
      const weekLabel = day.label || 'Autres dates'
      if (!grouped[weekLabel]) {
        grouped[weekLabel] = []
      }
      grouped[weekLabel].push(day)
    })
    
    const weeksList = Object.entries(grouped).map(([name, days]) => ({
      name,
      days: days.sort((a, b) => new Date(a.date) - new Date(b.date))
    }))
    
    setWeeks(weeksList)
  }, [eventDays])

  const addWeek = async () => {
    if (!newWeek.name || selectedDates.length === 0) {
      toast.error('Ajoutez un nom et au moins une date')
      return
    }

    setLoading(true)
    try {
      const daysToInsert = selectedDates.map(date => ({
        event_id: event.id,
        date: date,
        label: newWeek.name,
        is_active: true
      }))

      const { error } = await supabase
        .from('event_days')
        .insert(daysToInsert)

      if (error) throw error

      toast.success(`${newWeek.name} ajoute avec ${selectedDates.length} jours!`)
      setShowAddWeek(false)
      setNewWeek({ name: '', dates: [] })
      setSelectedDates([])
      onUpdate()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const removeDay = async (dayId) => {
    if (!confirm('Supprimer ce jour?')) return
    try {
      await supabase.from('event_days').delete().eq('id', dayId)
      toast.success('Jour supprime')
      onUpdate()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const toggleDayActive = async (day) => {
    try {
      await supabase
        .from('event_days')
        .update({ is_active: !day.is_active })
        .eq('id', day.id)
      onUpdate()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const deleteWeek = async (weekName) => {
    if (!confirm(`Supprimer toute la semaine "${weekName}" et ses jours?`)) return
    try {
      let result;
      if (weekName === 'Autres dates') {
        // Delete days with null or empty label
        result = await supabase
          .from('event_days')
          .delete()
          .eq('event_id', event.id)
          .is('label', null)
          .select()
      } else {
        result = await supabase
          .from('event_days')
          .delete()
          .eq('event_id', event.id)
          .eq('label', weekName)
          .select()
      }
      
      if (result.error) {
        throw result.error
      }
      
      toast.success(`${result.data?.length || 0} jours supprimes`)
      onUpdate()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error(error.message || 'Erreur lors de la suppression')
    }
  }

  const addDateToSelection = (date) => {
    if (!selectedDates.includes(date)) {
      setSelectedDates([...selectedDates, date])
    }
  }

  const removeDateFromSelection = (date) => {
    setSelectedDates(selectedDates.filter(d => d !== date))
  }

  const openEditWeek = (week) => {
    setEditingWeek(week)
    setEditName(week.name)
    setSelectedDates([])
    setShowEditWeek(true)
  }

  const saveWeekEdit = async () => {
    if (!editName.trim()) {
      toast.error('Le nom ne peut pas etre vide')
      return
    }
    
    setLoading(true)
    try {
      // Update the label for all days in this week
      const oldLabel = editingWeek.name === 'Autres dates' ? null : editingWeek.name
      
      if (oldLabel === null) {
        await supabase
          .from('event_days')
          .update({ label: editName })
          .eq('event_id', event.id)
          .is('label', null)
      } else {
        await supabase
          .from('event_days')
          .update({ label: editName })
          .eq('event_id', event.id)
          .eq('label', oldLabel)
      }

      // Add new dates if any selected
      if (selectedDates.length > 0) {
        const daysToInsert = selectedDates.map(date => ({
          event_id: event.id,
          date: date,
          label: editName,
          is_active: true
        }))
        await supabase.from('event_days').insert(daysToInsert)
      }

      toast.success('Semaine modifiee!')
      setShowEditWeek(false)
      setEditingWeek(null)
      setSelectedDates([])
      onUpdate()
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gestion des Semaines</h2>
        <Dialog open={showAddWeek} onOpenChange={setShowAddWeek}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
              <Plus className="w-4 h-4 mr-2" /> Ajouter une semaine
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajouter une semaine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom de la semaine</Label>
                <Input
                  value={newWeek.name}
                  onChange={(e) => setNewWeek({...newWeek, name: e.target.value})}
                  placeholder="Week One, Semaine 1..."
                />
              </div>
              <div>
                <Label>Ajouter des dates</Label>
                <div className="flex gap-2 mt-2">
                  <Input type="date" id="newDateInput" />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('newDateInput')
                      if (input.value) {
                        addDateToSelection(input.value)
                        input.value = ''
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {selectedDates.length > 0 && (
                <div>
                  <Label>Dates selectionnees</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDates.sort().map(date => (
                      <Badge key={date} variant="secondary" className="flex items-center gap-1">
                        {format(parseISO(date), 'dd MMM yyyy', { locale: fr })}
                        <button onClick={() => removeDateFromSelection(date)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddWeek(false)}>Annuler</Button>
              <Button onClick={addWeek} disabled={loading} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Week Dialog */}
        <Dialog open={showEditWeek} onOpenChange={setShowEditWeek}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Modifier la semaine</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom de la semaine</Label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Week One, Semaine 1..."
                />
              </div>
              <div>
                <Label>Ajouter des dates supplementaires</Label>
                <div className="flex gap-2 mt-2">
                  <Input type="date" id="editDateInput" />
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('editDateInput')
                      if (input.value) {
                        addDateToSelection(input.value)
                        input.value = ''
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {selectedDates.length > 0 && (
                <div>
                  <Label>Nouvelles dates a ajouter</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDates.sort().map(date => (
                      <Badge key={date} variant="secondary" className="flex items-center gap-1">
                        {format(parseISO(date), 'dd MMM yyyy', { locale: fr })}
                        <button onClick={() => removeDateFromSelection(date)} className="ml-1 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {editingWeek && (
                <div>
                  <Label>Jours actuels</Label>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {editingWeek.days.map(day => (
                      <Badge key={day.id} variant="outline" className="text-xs">
                        {format(parseISO(day.date), 'dd MMM', { locale: fr })}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Pour supprimer un jour, utilisez le X sur la carte de la semaine</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditWeek(false)}>Annuler</Button>
              <Button onClick={saveWeekEdit} disabled={loading} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Sauvegarder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {weeks.length === 0 ? (
        <Card className="p-8 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Aucune semaine configuree</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {weeks.map((week, idx) => (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-amber-400" />
                    {week.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{week.days.length} jour{week.days.length > 1 ? 's' : ''}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => openEditWeek(week)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => deleteWeek(week.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {week.days.map(day => (
                    <div 
                      key={day.id} 
                      className={`flex items-center gap-2 p-2 rounded-lg border ${
                        day.is_active ? 'bg-green-500/10 border-green-500/50' : 'bg-muted opacity-50'
                      }`}
                    >
                      <span className="font-medium text-sm">
                        {format(parseISO(day.date), 'EEE dd MMM', { locale: fr })}
                      </span>
                      <Switch checked={day.is_active} onCheckedChange={() => toggleDayActive(day)} />
                      <Button variant="ghost" size="icon" className="w-6 h-6 text-red-500" onClick={() => removeDay(day.id)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">Recapitulatif</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-6">
            <div>
              <span className="text-muted-foreground">Semaines:</span>
              <span className="ml-2 font-bold">{weeks.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Total jours:</span>
              <span className="ml-2 font-bold">{eventDays.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Jours actifs:</span>
              <span className="ml-2 font-bold text-green-500">{eventDays.filter(d => d.is_active).length}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

