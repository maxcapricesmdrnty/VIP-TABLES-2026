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
import { Calendar, MapPin, Plus, LogOut, Settings, Users, Table2, Loader2, Wine, FileText, Download, Trash2, Edit, ChevronLeft, ChevronRight, X, PanelLeftClose, PanelLeft, LayoutDashboard, Receipt, Cog, ChevronDown, Upload, FileSpreadsheet, Check, Link, Link as LinkIcon, Copy, ExternalLink, ShoppingCart, Ticket, Search, Filter, UserCheck, Clock, CreditCard, StickyNote, Banknote, TrendingUp, TrendingDown, DollarSign, Eye, AlertTriangle } from 'lucide-react'
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

  // Refresh selected event data
  const refreshSelectedEvent = async () => {
    if (!selectedEvent) return
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('id', selectedEvent.id)
      .single()
    if (data) setSelectedEvent(data)
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
        onEventUpdate={refreshSelectedEvent}
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
function EventDashboard({ event, view, setView, onBack, user, onLogout, onEventUpdate }) {
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
  
  // Add single table modal
  const [showAddTableModal, setShowAddTableModal] = useState(false)
  const [addTableForm, setAddTableForm] = useState({
    zone: 'left',
    table_number: '',
    display_number: '',
    capacity: 10,
    standard_price: 5000
  })
  
  // Menu import states
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importedItems, setImportedItems] = useState([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  
  // Layout with multiple back categories and section toggles
  const [layoutForm, setLayoutForm] = useState({
    left: { enabled: true, name: 'Zone Gauche', prefix: 'L', count: 4, rows: 2, capacity: 10, price: 5000, startNumber: 1 },
    right: { enabled: true, name: 'Zone Droite', prefix: 'R', count: 4, rows: 2, capacity: 10, price: 5000, startNumber: 1 },
    center: { enabled: true }, // DJ booth
    backCategories: [
      { id: '1', name: 'Tables Arrière', prefix: 'B', rows: 1, tablesPerRow: 4, capacity: 10, price: 3000, enabled: true, startNumber: 1 }
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
      // Find specific layouts
      const leftLayout = data.find(l => l.zone === 'left')
      const rightLayout = data.find(l => l.zone === 'right')
      const centerLayout = data.find(l => l.zone === 'center')
      
      const newForm = { 
        left: leftLayout ? {
          enabled: leftLayout.enabled !== false,
          name: leftLayout.zone_name || 'Zone Gauche',
          prefix: leftLayout.table_prefix,
          count: leftLayout.table_count,
          rows: leftLayout.rows,
          capacity: leftLayout.capacity_per_table,
          price: leftLayout.standard_price,
          startNumber: leftLayout.start_number || 1
        } : { enabled: true, name: 'Zone Gauche', prefix: 'L', count: 4, rows: 2, capacity: 10, price: 5000, startNumber: 1 },
        right: rightLayout ? {
          enabled: rightLayout.enabled !== false,
          name: rightLayout.zone_name || 'Zone Droite',
          prefix: rightLayout.table_prefix,
          count: rightLayout.table_count,
          rows: rightLayout.rows,
          capacity: rightLayout.capacity_per_table,
          price: rightLayout.standard_price,
          startNumber: rightLayout.start_number || 1
        } : { enabled: true, name: 'Zone Droite', prefix: 'R', count: 4, rows: 2, capacity: 10, price: 5000, startNumber: 1 },
        center: { enabled: centerLayout ? centerLayout.enabled !== false : true },
        backCategories: []
      }
      
      // Load back categories
      data.filter(l => l.zone === 'back' || l.zone.startsWith('back_')).forEach((l, idx) => {
        const totalTables = l.table_count
        const numRows = l.rows || 1
        const tablesPerRow = Math.ceil(totalTables / numRows) || 4
        
        newForm.backCategories.push({
          id: l.id,
          name: l.zone_name || (idx === 0 ? 'Tables Arrière' : `Catégorie ${idx + 1}`),
          prefix: l.table_prefix,
          rows: numRows,
          tablesPerRow: tablesPerRow,
          capacity: l.capacity_per_table,
          price: l.standard_price,
          enabled: l.enabled !== false,
          startNumber: l.start_number || 1
        })
      })
      
      if (newForm.backCategories.length === 0) {
        newForm.backCategories = [{ id: '1', name: 'Tables Arrière', prefix: 'B', rows: 1, tablesPerRow: 4, capacity: 10, price: 3000, enabled: true, startNumber: 1 }]
      }
      
      console.log('Loaded layout form:', newForm)
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
        { id: newId, name: `Catégorie ${layoutForm.backCategories.length + 1}`, prefix: `C${layoutForm.backCategories.length + 1}`, rows: 1, tablesPerRow: 4, capacity: 10, price: 3000, enabled: true, startNumber: 1 }
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
      
      const { error: deleteError } = await deleteQuery
      if (deleteError) {
        console.error('Delete error:', deleteError)
        toast.error('Erreur lors de la suppression: ' + deleteError.message)
        return
      }

      const layoutsToInsert = []
      let sortOrder = 0
      
      // Always save left zone (with enabled flag)
      layoutsToInsert.push({
        venue_id: selectedVenue.id,
        zone: 'left',
        zone_name: layoutForm.left.name || 'Zone Gauche',
        table_prefix: layoutForm.left.prefix,
        table_count: layoutForm.left.count,
        rows: layoutForm.left.rows,
        capacity_per_table: layoutForm.left.capacity,
        standard_price: layoutForm.left.price,
        start_number: layoutForm.left.startNumber || 1,
        sort_order: sortOrder++,
        date: selectedDay || null,
        enabled: layoutForm.left.enabled !== false
      })
      
      // Always save right zone (with enabled flag)
      layoutsToInsert.push({
        venue_id: selectedVenue.id,
        zone: 'right',
        zone_name: layoutForm.right.name || 'Zone Droite',
        table_prefix: layoutForm.right.prefix,
        table_count: layoutForm.right.count,
        rows: layoutForm.right.rows,
        capacity_per_table: layoutForm.right.capacity,
        standard_price: layoutForm.right.price,
        start_number: layoutForm.right.startNumber || 1,
        sort_order: sortOrder++,
        date: selectedDay || null,
        enabled: layoutForm.right.enabled !== false
      })
      
      // Save ALL back categories (with their enabled flag)
      layoutForm.backCategories.forEach((cat, idx) => {
        // Use 'back' for first category, 'back_2', 'back_3', etc. for others
        const zoneName = idx === 0 ? 'back' : `back_${idx + 1}`
        layoutsToInsert.push({
          venue_id: selectedVenue.id,
          zone: zoneName,
          zone_name: cat.name,
          table_prefix: cat.prefix,
          table_count: cat.rows * cat.tablesPerRow,
          rows: cat.rows,
          capacity_per_table: cat.capacity,
          standard_price: cat.price,
          start_number: cat.startNumber || 1,
          sort_order: sortOrder++,
          date: selectedDay || null,
          enabled: cat.enabled !== false
        })
      })
      
      // Also save the center (DJ booth) enabled state
      layoutsToInsert.push({
        venue_id: selectedVenue.id,
        zone: 'center',
        table_prefix: 'DJ',
        table_count: 0,
        rows: 0,
        capacity_per_table: 0,
        standard_price: 0,
        start_number: 1,
        sort_order: sortOrder++,
        date: selectedDay || null,
        enabled: layoutForm.center.enabled
      })

      console.log('Saving layouts:', layoutsToInsert)
      
      const { error: insertError } = await supabase.from('table_layouts').insert(layoutsToInsert)
      
      if (insertError) {
        console.error('Insert error:', insertError)
        toast.error('Erreur lors de la sauvegarde: ' + insertError.message)
        return
      }
      
      toast.success(selectedDay ? `Configuration sauvegardée pour le ${format(parseISO(selectedDay), 'dd MMM', { locale: fr })}!` : 'Configuration par défaut sauvegardée!')
      fetchLayouts()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const generateTablesForDay = async (forceRegenerate = false) => {
    if (!selectedVenue || !selectedDay) {
      toast.error('Sélectionnez une salle et un jour')
      return
    }

    try {
      // Get existing tables for this day
      const { data: existingTables } = await supabase
        .from('tables')
        .select('*')
        .eq('venue_id', selectedVenue.id)
        .eq('day', selectedDay)
      
      // Check for reserved tables
      const reservedTables = (existingTables || []).filter(t => t.status !== 'libre')
      
      if (reservedTables.length > 0 && !forceRegenerate) {
        const confirmMsg = `⚠️ Il y a ${reservedTables.length} table(s) avec des réservations.\n\n` +
          `Tables réservées: ${reservedTables.map(t => t.display_number || t.table_number).join(', ')}\n\n` +
          `Les réservations seront conservées. Seules les nouvelles tables seront ajoutées.\n\n` +
          `Continuer?`
        
        if (!confirm(confirmMsg)) {
          return
        }
      }
      
      // Get ALL existing table numbers (not just reserved) to avoid duplicates
      const existingTableNumbers = new Set((existingTables || []).map(t => t.table_number))
      
      // Only delete truly empty FREE tables (no client_name, no sold_price)
      if (existingTables && existingTables.length > 0) {
        const emptyFreeTableIds = existingTables
          .filter(t => t.status === 'libre' && !t.client_name && !t.sold_price)
          .map(t => t.id)
        if (emptyFreeTableIds.length > 0) {
          await supabase
            .from('tables')
            .delete()
            .in('id', emptyFreeTableIds)
          // Remove deleted tables from existing set
          existingTables
            .filter(t => emptyFreeTableIds.includes(t.id))
            .forEach(t => existingTableNumbers.delete(t.table_number))
        }
      }

      const tablesToInsert = []
      
      // Left zone - only if enabled
      if (layoutForm.left.enabled) {
        const startNum = layoutForm.left.startNumber || 1
        for (let i = 1; i <= layoutForm.left.count; i++) {
          const tableNumber = `${layoutForm.left.prefix}${i}`
          if (!existingTableNumbers.has(tableNumber)) {
            tablesToInsert.push({
              event_id: event.id,
              venue_id: selectedVenue.id,
              table_number: tableNumber,
              display_number: String(startNum + i - 1),
              day: selectedDay,
              zone: 'left',
              status: 'libre',
              standard_price: layoutForm.left.price,
              sold_price: 0,
              capacity: layoutForm.left.capacity || 10
            })
          }
        }
      }
      
      // Right zone - only if enabled
      if (layoutForm.right.enabled) {
        const startNum = layoutForm.right.startNumber || 1
        for (let i = 1; i <= layoutForm.right.count; i++) {
          const tableNumber = `${layoutForm.right.prefix}${i}`
          if (!existingTableNumbers.has(tableNumber)) {
            tablesToInsert.push({
              event_id: event.id,
              venue_id: selectedVenue.id,
              table_number: tableNumber,
              display_number: String(startNum + i - 1),
              day: selectedDay,
              zone: 'right',
              status: 'libre',
              standard_price: layoutForm.right.price,
              sold_price: 0,
              capacity: layoutForm.right.capacity || 10
            })
          }
        }
      }
      
      // Back categories - only enabled ones
      layoutForm.backCategories.filter(cat => cat.enabled !== false).forEach((cat, idx) => {
        const zoneName = idx === 0 ? 'back' : `back_${idx + 1}`
        const totalTables = cat.rows * cat.tablesPerRow
        const startNum = cat.startNumber || 1
        for (let i = 1; i <= totalTables; i++) {
          const tableNumber = `${cat.prefix}${i}`
          if (!existingTableNumbers.has(tableNumber)) {
            tablesToInsert.push({
              event_id: event.id,
              venue_id: selectedVenue.id,
              table_number: tableNumber,
              display_number: String(startNum + i - 1),
              day: selectedDay,
              zone: zoneName,
              status: 'libre',
              standard_price: cat.price,
              sold_price: 0,
              capacity: cat.capacity || 10
            })
          }
        }
      })

      if (tablesToInsert.length > 0) {
        await supabase.from('tables').insert(tablesToInsert)
      }
      
      const keptCount = reservedTables.length
      const newCount = tablesToInsert.length
      toast.success(`${newCount} tables créées${keptCount > 0 ? `, ${keptCount} réservations conservées` : ''}!`)
      fetchTables()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Add a single table manually
  const addSingleTable = async () => {
    if (!selectedVenue || !selectedDay) {
      toast.error('Sélectionnez une salle et un jour')
      return
    }
    
    if (!addTableForm.table_number || !addTableForm.display_number) {
      toast.error('Numéro de table et numéro physique requis')
      return
    }
    
    try {
      // Check if table_number already exists
      const { data: existing } = await supabase
        .from('tables')
        .select('id')
        .eq('venue_id', selectedVenue.id)
        .eq('day', selectedDay)
        .eq('table_number', addTableForm.table_number)
        .maybeSingle()
      
      if (existing) {
        toast.error(`La table ${addTableForm.table_number} existe déjà pour ce jour`)
        return
      }
      
      const { error } = await supabase.from('tables').insert({
        event_id: event.id,
        venue_id: selectedVenue.id,
        table_number: addTableForm.table_number,
        display_number: addTableForm.display_number,
        day: selectedDay,
        zone: addTableForm.zone,
        status: 'libre',
        standard_price: addTableForm.standard_price,
        sold_price: 0,
        capacity: addTableForm.capacity
      })
      
      if (error) throw error
      
      toast.success(`Table ${addTableForm.display_number} ajoutée!`)
      setShowAddTableModal(false)
      fetchTables()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Get zone options for add table modal
  const getZoneOptions = () => {
    const zones = []
    if (layoutForm.left.enabled) {
      zones.push({ value: 'left', label: layoutForm.left.prefix, prefix: layoutForm.left.prefix, capacity: layoutForm.left.capacity, price: layoutForm.left.price })
    }
    if (layoutForm.right.enabled) {
      zones.push({ value: 'right', label: layoutForm.right.prefix, prefix: layoutForm.right.prefix, capacity: layoutForm.right.capacity, price: layoutForm.right.price })
    }
    layoutForm.backCategories.filter(cat => cat.enabled !== false).forEach((cat, idx) => {
      const zoneName = idx === 0 ? 'back' : `back_${idx + 1}`
      zones.push({ value: zoneName, label: cat.name || cat.prefix, prefix: cat.prefix, capacity: cat.capacity, price: cat.price })
    })
    return zones
  }

  // Get next table number for a zone
  const getNextTableNumber = (zone) => {
    const zoneTables = tables.filter(t => t.zone === zone && t.day === selectedDay)
    const zoneConfig = getZoneOptions().find(z => z.value === zone)
    if (!zoneConfig) return ''
    
    // Find the highest number used
    const numbers = zoneTables.map(t => {
      const match = t.table_number.match(/\d+$/)
      return match ? parseInt(match[0]) : 0
    })
    const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1
    return `${zoneConfig.prefix}${nextNum}`
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

  // Calculate table total helper
  const calculateTableTotal = (t) => {
    return (t.sold_price || 0) + ((t.additional_persons || 0) * (t.additional_person_price || 0)) + (t.on_site_additional_revenue || 0)
  }

  // Calculate total persons for a table
  const calculateTablePersons = (t) => {
    return (t.capacity || 0) + (t.additional_persons || 0) + (t.on_site_additional_persons || 0)
  }

  const stats = {
    total: tables.length,
    libre: tables.filter(t => t.status === 'libre').length,
    reserve: tables.filter(t => t.status === 'reserve').length,
    confirme: tables.filter(t => t.status === 'confirme').length,
    paye: tables.filter(t => t.status === 'paye').length,
    // Montant potentiel total (toutes les tables avec leur prix standard)
    potentiel: tables.reduce((sum, t) => sum + (t.standard_price || 0), 0),
    // CA par statut
    caReserve: tables.filter(t => t.status === 'reserve').reduce((sum, t) => sum + calculateTableTotal(t), 0),
    caConfirme: tables.filter(t => t.status === 'confirme').reduce((sum, t) => sum + calculateTableTotal(t), 0),
    caPaye: tables.filter(t => t.status === 'paye').reduce((sum, t) => sum + calculateTableTotal(t), 0),
    // CA total (confirmé + payé)
    ca: tables.filter(t => ['confirme', 'paye'].includes(t.status)).reduce((sum, t) => sum + calculateTableTotal(t), 0),
    paid: tables.reduce((sum, t) => sum + (t.total_paid || 0), 0),
    // Total personnes (toutes tables non-libres)
    totalPersons: tables.filter(t => t.status !== 'libre').reduce((sum, t) => sum + calculateTablePersons(t), 0),
    commissions: tables.reduce((sum, t) => sum + (t.commission_amount || 0), 0)
  }

  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [configOpen, setConfigOpen] = useState(true)

  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tables', label: 'Tables', icon: Table2 },
    { id: 'invoices', label: 'Factures', icon: Receipt },
    { id: 'comptabilite', label: 'Comptabilité', icon: Banknote },
    { id: 'guichet', label: 'Guichet', icon: Ticket },
  ]

  const configNavItems = [
    { id: 'days', label: 'Jours', icon: Calendar },
    { id: 'venues', label: 'Salles', icon: Users },
    { id: 'layout', label: 'Plan', icon: Settings },
    { id: 'menu', label: 'Menu', icon: Wine },
    { id: 'team', label: 'Équipe', icon: UserCheck },
  ]
  
  const serviceNavItems = [
    { id: 'preorders', label: 'Pré-commandes', icon: ShoppingCart },
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

          {/* Pré-commandes Section */}
          <div className="pt-4 space-y-1">
            {serviceNavItems.map(item => (
              <Button
                key={item.id}
                variant={view === item.id ? 'secondary' : 'ghost'}
                onClick={() => setView(item.id)}
                className={`w-full justify-start ${view === item.id ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : ''}`}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span className="ml-2">📦 {item.label}</span>}
              </Button>
            ))}
          </div>

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
            {/* Chiffre d'affaires par statut */}
            <Card>
              <CardHeader>
                <CardTitle>Chiffre d'affaires</CardTitle>
                <CardDescription>Tous jours et salles confondus</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Potentiel total</p>
                    <p className="text-xl font-bold">{stats.potentiel.toLocaleString()} {event.currency}</p>
                  </div>
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-sm text-yellow-400">Réservé</p>
                    <p className="text-xl font-bold text-yellow-400">{stats.caReserve.toLocaleString()} {event.currency}</p>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-400">Confirmé</p>
                    <p className="text-xl font-bold text-blue-400">{stats.caConfirme.toLocaleString()} {event.currency}</p>
                  </div>
                  <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <p className="text-sm text-purple-400">Payé</p>
                    <p className="text-xl font-bold text-purple-400">{stats.caPaye.toLocaleString()} {event.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Résumé financier + Personnes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé Financier</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
                      <span className="text-muted-foreground">CA Total (Confirmé + Payé)</span>
                      <span className="font-bold text-lg">{stats.ca.toLocaleString()} {event.currency}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <span className="text-green-400">Déjà encaissé</span>
                      <span className="font-bold text-lg text-green-400">{stats.paid.toLocaleString()} {event.currency}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <span className="text-amber-400">Reste à encaisser</span>
                      <span className="font-bold text-lg text-amber-400">{(stats.ca - stats.paid).toLocaleString()} {event.currency}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Personnes attendues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Users className="w-12 h-12 text-amber-500" />
                        <span className="text-5xl font-bold text-amber-400">{stats.totalPersons}</span>
                      </div>
                      <p className="text-muted-foreground mt-2">personnes au total</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <div className="bg-card rounded-lg border p-4 sm:p-6 overflow-x-auto">
                {/* Zone Gauche + DJ Booth + Zone Droite */}
                <div className="inline-flex items-start justify-start gap-4 sm:gap-6 min-w-max">
                  {/* Zone Gauche */}
                  {getTablesByZone('left').length > 0 && (
                    <div className="shrink-0">
                      <h3 className="text-center mb-3 sm:mb-4 font-semibold text-muted-foreground text-sm sm:text-base">Zone Gauche</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  )}

                  {/* DJ Booth - Centré */}
                  <div className="shrink-0 flex flex-col items-center justify-center self-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-b from-amber-500/30 to-amber-600/10 rounded-lg flex items-center justify-center border-2 border-amber-500/50">
                      <div className="text-center">
                        <div className="text-base sm:text-lg">🎧</div>
                        <div className="text-[8px] sm:text-[9px] font-bold text-amber-400">DJ</div>
                      </div>
                    </div>
                  </div>

                  {/* Zone Droite */}
                  {getTablesByZone('right').length > 0 && (
                    <div className="shrink-0">
                      <h3 className="text-center mb-3 sm:mb-4 font-semibold text-muted-foreground text-sm sm:text-base">Zone Droite</h3>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3">
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
                  )}
                </div>

                {/* Multiple Back Categories - Fixed grid with horizontal scroll */}
                <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6">
                  {getBackZones().map(zone => {
                    const zoneTables = getTablesByZone(zone)
                    if (zoneTables.length === 0) return null
                    
                    // Get the category config to determine tables per row
                    const categoryIndex = zone === 'back' ? 0 : parseInt(zone.replace('back_', '')) - 1
                    const category = layoutForm.backCategories[categoryIndex]
                    const tablesPerRow = category?.tablesPerRow || Math.min(zoneTables.length, 6)
                    const zoneName = category?.name || (zone === 'back' ? 'Tables Arrière' : `Catégorie ${categoryIndex + 1}`)
                    
                    return (
                      <div key={zone} className="overflow-x-auto">
                        <h3 className="text-center mb-3 sm:mb-4 font-semibold text-muted-foreground text-sm sm:text-base">{zoneName}</h3>
                        <div 
                          className="inline-grid gap-2 sm:gap-3 min-w-max"
                          style={{ 
                            gridTemplateColumns: `repeat(${tablesPerRow}, auto)`,
                            display: 'inline-grid',
                            justifyItems: 'end',
                            marginLeft: 'auto',
                            marginRight: 'auto'
                          }}
                        >
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

        {/* Guichet View */}
        {view === 'guichet' && (
          <GuichetView event={event} eventDays={eventDays} />
        )}

        {/* Team Management View */}
        {view === 'team' && (
          <TeamManagementView event={event} />
        )}

        {/* Pre-Orders View */}
        {view === 'preorders' && (
          <PreOrdersView event={event} eventDays={eventDays} />
        )}

        {/* Invoices View */}
        {view === 'invoices' && (
          <InvoicesView event={event} tables={tables} onEventUpdate={onEventUpdate} />
        )}

        {/* Comptabilité View */}
        {view === 'comptabilite' && (
          <ComptabiliteView event={event} tables={tables} eventDays={eventDays} />
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
                  <div className="flex gap-2">
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
                          
                          // Also copy display_numbers from a reference day (first day with tables)
                          const { data: refTables } = await supabase
                            .from('tables')
                            .select('table_number, display_number')
                            .eq('event_id', event.id)
                            .not('display_number', 'is', null)
                            .limit(100)
                          
                          if (refTables && refTables.length > 0) {
                            // Get unique display_numbers by table_number
                            const displayNumberMap = {}
                            refTables.forEach(t => {
                              if (t.display_number && !displayNumberMap[t.table_number]) {
                                displayNumberMap[t.table_number] = t.display_number
                              }
                            })
                            
                            // Update tables for this day
                            for (const [tableNum, displayNum] of Object.entries(displayNumberMap)) {
                              await supabase
                                .from('tables')
                                .update({ display_number: displayNum })
                                .eq('event_id', event.id)
                                .eq('day', selectedDay)
                                .eq('table_number', tableNum)
                            }
                          }
                          
                          toast.success('Configuration par défaut copiée (layout + numéros)!')
                          fetchLayouts()
                          fetchTables()
                        } else {
                          toast.error('Aucune configuration par défaut trouvée')
                        }
                      }}
                    >
                      ← Copier config par défaut
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                      onClick={async () => {
                        // Set this day's config as the new default
                        const { data: dayLayouts, error: fetchError } = await supabase
                          .from('table_layouts')
                          .select('*')
                          .eq('venue_id', selectedVenue.id)
                          .eq('date', selectedDay)
                        
                        if (fetchError) {
                          console.error('Error fetching layouts:', fetchError)
                          toast.error('Erreur lors de la récupération de la configuration')
                          return
                        }
                        
                        console.log('Day layouts found:', dayLayouts)
                        
                        if (dayLayouts && dayLayouts.length > 0) {
                          // Delete existing default layouts
                          const { error: deleteError } = await supabase
                            .from('table_layouts')
                            .delete()
                            .eq('venue_id', selectedVenue.id)
                            .is('date', null)
                          
                          if (deleteError) {
                            console.error('Error deleting defaults:', deleteError)
                            toast.error('Erreur lors de la suppression des anciens défauts: ' + deleteError.message)
                            return
                          }
                          
                          // Copy this day's layouts as default (without date)
                          const newDefaults = dayLayouts.map(l => ({
                            venue_id: l.venue_id,
                            zone: l.zone,
                            table_prefix: l.table_prefix,
                            table_count: l.table_count,
                            rows: l.rows,
                            capacity_per_table: l.capacity_per_table,
                            standard_price: l.standard_price,
                            sort_order: l.sort_order,
                            enabled: l.enabled !== false,
                            start_number: l.start_number || 1,
                            date: null
                          }))
                          
                          console.log('Inserting new defaults:', newDefaults)
                          
                          const { error: insertError } = await supabase.from('table_layouts').insert(newDefaults)
                          
                          if (insertError) {
                            console.error('Error inserting defaults:', insertError)
                            toast.error('Erreur lors de la sauvegarde: ' + insertError.message)
                            return
                          }
                          
                          // Refresh layouts
                          fetchLayouts()
                          toast.success('Configuration définie comme défaut!')
                        } else {
                          toast.error('Aucune configuration pour ce jour. Sauvegardez d\'abord la configuration.')
                        }
                      }}
                    >
                      ⭐ Définir comme défaut
                    </Button>
                  </div>
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
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle>Zone {zone === 'left' ? 'Gauche' : 'Droite'}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Activer</span>
                            <button
                              onClick={() => setLayoutForm({
                                ...layoutForm,
                                [zone]: { ...layoutForm[zone], enabled: !layoutForm[zone].enabled }
                              })}
                              className={`w-12 h-6 rounded-full transition-colors ${layoutForm[zone].enabled ? 'bg-green-500' : 'bg-muted'}`}
                            >
                              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${layoutForm[zone].enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                          </div>
                        </div>
                      </CardHeader>
                      {layoutForm[zone].enabled && (
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label>Préfixe / Nom</Label>
                              <Input
                                value={layoutForm[zone].prefix}
                                onChange={(e) => setLayoutForm({
                                  ...layoutForm,
                                  [zone]: { ...layoutForm[zone], prefix: e.target.value }
                                })}
                                placeholder="Ex: PRIVILEGE, VIP..."
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
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                            <div>
                              <Label>N° de départ</Label>
                              <Input
                                type="number"
                                min="1"
                                value={layoutForm[zone].startNumber || 1}
                                onChange={(e) => setLayoutForm({
                                  ...layoutForm,
                                  [zone]: { ...layoutForm[zone], startNumber: e.target.value === '' ? 1 : parseInt(e.target.value) }
                                })}
                              />
                            </div>
                            <div className="flex items-end">
                              <div className="text-sm text-muted-foreground pb-2">
                                → Tables <span className="font-semibold text-foreground">{layoutForm[zone].startNumber || 1}</span> à <span className="font-semibold text-foreground">{(layoutForm[zone].startNumber || 1) + (layoutForm[zone].count || 1) - 1}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                {/* DJ Booth Toggle */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">🎧</span> DJ Booth (Centre)
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Afficher</span>
                        <button
                          onClick={() => setLayoutForm({
                            ...layoutForm,
                            center: { ...layoutForm.center, enabled: !layoutForm.center.enabled }
                          })}
                          className={`w-12 h-6 rounded-full transition-colors ${layoutForm.center.enabled ? 'bg-green-500' : 'bg-muted'}`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${layoutForm.center.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {layoutForm.center.enabled 
                        ? "Le DJ booth sera affiché dans la prévisualisation et le plan de salle." 
                        : "Le DJ booth est masqué dans la prévisualisation et le plan de salle."}
                    </p>
                  </CardContent>
                </Card>

                {/* Back Categories */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Catégories Arrière (derrière le DJ)</h3>
                    <Button onClick={addBackCategory} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" /> Ajouter une catégorie
                    </Button>
                  </div>
                  
                  {layoutForm.backCategories.map((cat, index) => (
                    <Card key={cat.id} className={cat.enabled === false ? 'opacity-60' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => updateBackCategory(cat.id, 'enabled', cat.enabled === false ? true : false)}
                              className={`w-10 h-5 rounded-full transition-colors flex-shrink-0 ${cat.enabled !== false ? 'bg-green-500' : 'bg-muted'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${cat.enabled !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                            </button>
                            <Input
                              value={cat.name}
                              onChange={(e) => updateBackCategory(cat.id, 'name', e.target.value)}
                              className="max-w-xs font-semibold"
                              placeholder="Nom de la catégorie"
                              disabled={cat.enabled === false}
                            />
                          </div>
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
                      {cat.enabled !== false && (
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
                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                          <div>
                            <Label>N° de départ</Label>
                            <Input
                              type="number"
                              min="1"
                              value={cat.startNumber || 1}
                              onChange={(e) => updateBackCategory(cat.id, 'startNumber', e.target.value === '' ? 1 : parseInt(e.target.value))}
                            />
                          </div>
                          <div className="flex items-end">
                            <div className="text-sm text-muted-foreground pb-2">
                              → Tables <span className="font-semibold text-foreground">{cat.startNumber || 1}</span> à <span className="font-semibold text-foreground">{(cat.startNumber || 1) + (cat.rows * cat.tablesPerRow) - 1}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      )}
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4 flex-wrap">
                  <Button onClick={saveLayout} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                    Sauvegarder la configuration
                  </Button>
                  
                  <Button 
                    onClick={async () => {
                      if (!selectedDay) {
                        toast.error('Sélectionnez un jour spécifique (pas "Config par défaut")')
                        return
                      }
                      await generateTablesForDay()
                    }}
                    variant="outline"
                    className="border-amber-500 text-amber-500 hover:bg-amber-500/10"
                  >
                    🔄 Générer les tables
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      if (!selectedDay) {
                        toast.error('Sélectionnez un jour spécifique')
                        return
                      }
                      const zones = getZoneOptions()
                      if (zones.length === 0) {
                        toast.error('Aucune zone activée')
                        return
                      }
                      const firstZone = zones[0]
                      setAddTableForm({
                        zone: firstZone.value,
                        table_number: getNextTableNumber(firstZone.value),
                        display_number: '',
                        capacity: firstZone.capacity || 10,
                        standard_price: firstZone.price || 5000
                      })
                      setShowAddTableModal(true)
                    }}
                    variant="outline"
                    className="border-green-500 text-green-500 hover:bg-green-500/10"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Ajouter une table
                  </Button>
                </div>

                {/* Add Table Modal */}
                <Dialog open={showAddTableModal} onOpenChange={setShowAddTableModal}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ajouter une table</DialogTitle>
                      <DialogDescription>
                        Ajouter une table à la configuration du {selectedDay ? format(parseISO(selectedDay), 'dd MMMM', { locale: fr }) : ''}
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <Label>Zone / Catégorie</Label>
                        <select
                          value={addTableForm.zone}
                          onChange={(e) => {
                            const zone = e.target.value
                            const zoneConfig = getZoneOptions().find(z => z.value === zone)
                            setAddTableForm({
                              ...addTableForm,
                              zone,
                              table_number: getNextTableNumber(zone),
                              capacity: zoneConfig?.capacity || 10,
                              standard_price: zoneConfig?.price || 5000
                            })
                          }}
                          className="w-full p-2 border rounded bg-background"
                        >
                          {getZoneOptions().map(z => (
                            <option key={z.value} value={z.value}>{z.label}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <Label>N° de table (physique)</Label>
                        <Input
                          value={addTableForm.display_number}
                          onChange={(e) => setAddTableForm({...addTableForm, display_number: e.target.value})}
                          placeholder="Ex: 15, 201..."
                        />
                        <p className="text-xs text-muted-foreground mt-1">Numéro affiché sur la table réelle</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Capacité (personnes)</Label>
                          <Input
                            type="number"
                            value={addTableForm.capacity}
                            onChange={(e) => setAddTableForm({...addTableForm, capacity: parseInt(e.target.value) || 10})}
                          />
                        </div>
                        <div>
                          <Label>Prix standard ({event.currency})</Label>
                          <Input
                            type="number"
                            value={addTableForm.standard_price}
                            onChange={(e) => setAddTableForm({...addTableForm, standard_price: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddTableModal(false)}>Annuler</Button>
                      <Button onClick={addSingleTable} className="bg-green-500 hover:bg-green-600">
                        <Plus className="w-4 h-4 mr-2" /> Ajouter
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisualisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start p-4 bg-muted rounded-lg">
                      {/* Left Zone - only show if enabled */}
                      {layoutForm.left.enabled ? (
                        <div className="flex-1">
                          <p className="text-center text-sm mb-2 font-semibold">Gauche</p>
                          <div className="grid grid-cols-2 gap-1 max-w-24 mx-auto">
                            {Array.from({ length: layoutForm.left.count }).map((_, i) => (
                              <div key={i} className="w-10 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                                {(layoutForm.left.startNumber || 1) + i}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground italic">Zone gauche désactivée</span>
                        </div>
                      )}

                      {/* DJ Booth - only show if enabled */}
                      {layoutForm.center.enabled ? (
                        <div className="mx-4">
                          <div className="w-20 h-20 bg-amber-500/30 border-2 border-amber-500 rounded flex items-center justify-center">
                            <span className="text-xs font-bold">🎧 DJ</span>
                          </div>
                        </div>
                      ) : (
                        <div className="mx-4 w-20 h-20 border-2 border-dashed border-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">DJ off</span>
                        </div>
                      )}

                      {/* Right Zone - only show if enabled */}
                      {layoutForm.right.enabled ? (
                        <div className="flex-1">
                          <p className="text-center text-sm mb-2 font-semibold">Droite</p>
                          <div className="grid grid-cols-2 gap-1 max-w-24 mx-auto">
                            {Array.from({ length: layoutForm.right.count }).map((_, i) => (
                              <div key={i} className="w-10 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                                {(layoutForm.right.startNumber || 1) + i}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-xs text-muted-foreground italic">Zone droite désactivée</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Back Categories - only enabled ones */}
                    <div className="mt-6 space-y-4">
                      {layoutForm.backCategories.filter(cat => cat.enabled !== false).map(cat => {
                        const totalTables = cat.rows * cat.tablesPerRow
                        const startNum = cat.startNumber || 1
                        return (
                          <div key={cat.id}>
                            <p className="text-center text-sm mb-2 font-semibold">{cat.name} (Tables {startNum} → {startNum + totalTables - 1})</p>
                            <div 
                              className="grid gap-1 mx-auto"
                              style={{ 
                                gridTemplateColumns: `repeat(${cat.tablesPerRow}, minmax(0, 1fr))`,
                                maxWidth: `${cat.tablesPerRow * 50}px`
                              }}
                            >
                              {Array.from({ length: totalTables }).map((_, i) => (
                                <div key={i} className="w-10 h-8 bg-blue-500/30 border border-blue-500 rounded flex items-center justify-center text-xs">
                                  {startNum + i}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                      {layoutForm.backCategories.filter(cat => cat.enabled === false).length > 0 && (
                        <p className="text-center text-xs text-muted-foreground italic">
                          {layoutForm.backCategories.filter(cat => cat.enabled === false).length} catégorie(s) arrière désactivée(s)
                        </p>
                      )}
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
      className={`p-2 rounded-lg border-2 cursor-pointer transition-all w-[100px] sm:w-[130px] h-[85px] sm:h-[100px] flex flex-col justify-center ${getStatusClass(table.status)}`}
    >
      <div className="font-bold text-center text-sm sm:text-base">
        {table.display_number || table.table_number}
        {table.display_number && <span className="text-[9px] sm:text-[10px] font-normal text-muted-foreground ml-1">({table.table_number})</span>}
      </div>
      
      {hasReservation ? (
        <>
          {/* Client name */}
          <div className="text-[10px] sm:text-xs text-center truncate mt-1 font-medium px-1">{table.client_name}</div>
          
          {/* Number of persons */}
          <div className="text-[10px] sm:text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1 mt-0.5">
            <Users className="w-3 h-3" />
            <span>{totalPersons > 0 ? totalPersons : baseCapacity || '-'}</span>
          </div>
          
          {/* Price */}
          {table.sold_price > 0 && (
            <div className="text-[10px] sm:text-xs text-center font-semibold text-amber-400 mt-0.5">
              {table.sold_price.toLocaleString()} {currency}
            </div>
          )}
        </>
      ) : (
        <>
          {/* Show capacity for free tables */}
          {baseCapacity > 0 && (
            <div className="text-[10px] sm:text-[11px] text-center text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Users className="w-3 h-3" />
              <span>{baseCapacity} pers.</span>
            </div>
          )}
          {/* Show standard price for free tables */}
          {table.standard_price > 0 && (
            <div className="text-[10px] sm:text-xs text-center text-muted-foreground mt-0.5">
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
    display_number: table.display_number || '',
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

  // Load existing VIP link if any
  useEffect(() => {
    const loadVipLink = async () => {
      const { data } = await supabase
        .from('orders')
        .select('access_token')
        .eq('table_id', table.id)
        .maybeSingle()
      
      if (data?.access_token) {
        const baseUrl = window.location.origin
        setVipLink(`${baseUrl}/vip/${data.access_token}`)
      }
    }
    loadVipLink()
  }, [table.id])

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

  const resetTable = async () => {
    if (!confirm('Êtes-vous sûr de vouloir libérer cette table? Toutes les informations seront effacées.')) return
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
    if (!vipLink) {
      toast.error('Aucun lien à copier')
      return
    }
    
    try {
      // Method 1: Modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(vipLink)
        toast.success('Lien copié!')
        return
      }
      
      // Method 2: execCommand fallback
      const textArea = document.createElement('textarea')
      textArea.value = vipLink
      textArea.style.cssText = 'position:fixed;left:-9999px;top:-9999px'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const success = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (success) {
        toast.success('Lien copié!')
      } else {
        throw new Error('Copy failed')
      }
    } catch (e) {
      console.error('Copy error:', e)
      // Show the link in a prompt for manual copy
      prompt('Copiez ce lien:', vipLink)
    }
  }

  const shareVipLink = () => {
    if (!vipLink) {
      toast.error('Aucun lien à partager')
      return
    }
    
    const message = `Bonjour ${form.client_name || ''}, voici votre lien de pré-commande VIP: ${vipLink}`
    
    // Use Web Share API if available (mobile)
    if (navigator.share) {
      navigator.share({
        title: `Pré-commande VIP - Table ${table.display_number || table.table_number}`,
        text: message,
        url: vipLink
      }).catch((err) => {
        console.log('Share cancelled or failed:', err)
      })
    } else {
      // Fallback: open WhatsApp with link
      const phone = form.client_phone ? form.client_phone.replace(/[^0-9]/g, '') : ''
      const text = encodeURIComponent(message)
      const whatsappUrl = phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
      window.open(whatsappUrl, '_blank')
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
          {/* Numéro de table + Statut */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 p-3 rounded-lg">
              <Label className="text-amber-400">N° Table</Label>
              <div className="mt-1 p-2 bg-muted rounded border font-semibold text-lg">
                {form.display_number || table.table_number}
              </div>
            </div>
            <div className="bg-muted/30 p-3 rounded-lg">
              <Label className="text-amber-400">Statut</Label>
              <select
                value={form.status}
                onChange={(e) => setForm({...form, status: e.target.value})}
                className="mt-1 w-full p-2 rounded border bg-background text-foreground font-semibold"
              >
                <option value="libre">🟢 Libre</option>
                <option value="reserve">🟡 Réservé</option>
                <option value="confirme">🔵 Confirmé</option>
                <option value="paye">🟣 Payé</option>
              </select>
            </div>
          </div>

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
                <Label>Budget boissons (100%)</Label>
                <Input value={beverageBudget.toFixed(2)} disabled className="bg-muted" />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-amber-400">Concierge (pour rapport interne)</h3>
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
                <Label>Montant commission (info)</Label>
                <Input value={commissionAmount.toFixed(2)} disabled className="bg-muted text-muted-foreground" />
                <p className="text-xs text-muted-foreground mt-1">Non déduit du total</p>
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
                <div className="flex justify-between font-bold text-green-500 border-t pt-2">
                  <span>Total:</span>
                  <span>{totalPrice.toLocaleString()} {currency}</span>
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
                      <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => {
                          if (vipLink) {
                            navigator.clipboard.writeText(vipLink).then(() => {
                              toast.success('Lien copié!')
                            }).catch(() => {
                              prompt('Copiez ce lien:', vipLink)
                            })
                          }
                        }} 
                        title="Copier"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => {
                        if (vipLink) {
                          navigator.clipboard.writeText(vipLink).then(() => {
                            toast.success('Lien copié!')
                          }).catch(() => {
                            prompt('Copiez ce lien:', vipLink)
                          })
                        }
                      }} 
                      className="w-full mt-2"
                    >
                      <Copy className="w-3 h-3 mr-1" /> Copier le lien
                    </Button>
                    <p className="text-xs text-green-400 mt-2">✓ Lien prêt à envoyer au client</p>
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
              Libérer la table
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


// Team Management Component
function TeamManagementView({ event }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newMember, setNewMember] = useState({ email: '', name: '', role: 'serveur' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [event.id])

  const fetchMembers = async () => {
    try {
      const { data } = await supabase
        .from('team_members')
        .select('*')
        .eq('event_id', event.id)
        .order('created_at', { ascending: false })
      setMembers(data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMember = async () => {
    if (!newMember.email || !newMember.name) {
      toast.error('Email et nom requis')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.from('team_members').insert({
        event_id: event.id,
        email: newMember.email,
        name: newMember.name,
        role: newMember.role
      })
      if (error) throw error
      toast.success('Membre ajouté!')
      setShowAddDialog(false)
      setNewMember({ email: '', name: '', role: 'serveur' })
      fetchMembers()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteMember = async (id) => {
    if (!confirm('Supprimer ce membre?')) return
    try {
      const { error } = await supabase.from('team_members').delete().eq('id', id)
      if (error) throw error
      toast.success('Membre supprimé')
      fetchMembers()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    }
  }

  const toggleActive = async (member) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
      if (error) throw error
      fetchMembers()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    }
  }

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return <Badge className="bg-red-500">👑 Admin</Badge>
      case 'chef_equipe': return <Badge className="bg-amber-500">⭐ Chef d'équipe</Badge>
      case 'serveur': return <Badge className="bg-blue-500">🍾 Serveur</Badge>
      case 'bar': return <Badge className="bg-purple-500">🍸 Bar</Badge>
      default: return <Badge>{role}</Badge>
    }
  }

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-semibold">Gestion de l'Équipe</h2>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
              <Plus className="w-4 h-4 mr-2" /> Ajouter membre
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau membre</DialogTitle>
              <DialogDescription>Ajoutez un membre de l'équipe avec son rôle</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nom</Label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  placeholder="Jean Dupont"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  placeholder="jean@example.com"
                />
              </div>
              <div>
                <Label>Rôle</Label>
                <Select value={newMember.role} onValueChange={(v) => setNewMember({...newMember, role: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">👑 Admin - Accès complet</SelectItem>
                    <SelectItem value="chef_equipe">⭐ Chef d'équipe - Tout sauf configuration</SelectItem>
                    <SelectItem value="serveur">🍾 Serveur - Prise de commandes uniquement</SelectItem>
                    <SelectItem value="bar">🍸 Bar - Vue bar uniquement</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {newMember.role === 'admin' && 'Peut tout faire : configuration, réservations, factures, service'}
                  {newMember.role === 'chef_equipe' && 'Peut gérer les réservations, factures, guichet et service. Pas de configuration.'}
                  {newMember.role === 'serveur' && 'Accès uniquement à la prise de commandes (Service > Serveur)'}
                  {newMember.role === 'bar' && 'Accès uniquement à la vue bar (Service > Bar)'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
              <Button onClick={addMember} disabled={saving} className="bg-gradient-to-r from-amber-500 to-amber-600 text-black">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Ajouter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {members.length === 0 ? (
          <Card className="p-8 text-center">
            <UserCheck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Aucun membre dans l'équipe</p>
          </Card>
        ) : (
          members.map(member => (
            <Card key={member.id} className={`p-4 ${!member.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${member.role === 'admin' ? 'bg-red-500' : member.role === 'chef_equipe' ? 'bg-amber-500' : member.role === 'serveur' ? 'bg-blue-500' : 'bg-purple-500'}`}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                  {getRoleBadge(member.role)}
                  {!member.is_active && <Badge variant="outline" className="text-orange-500">Inactif</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(member)}>
                    {member.is_active ? 'Désactiver' : 'Activer'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteMember(member.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}


// Pre-Orders Dashboard Component
function PreOrdersView({ event, eventDays }) {
  const [selectedDay, setSelectedDay] = useState('')
  const [tables, setTables] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('status')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedTableDetail, setSelectedTableDetail] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)

  const availableDays = (eventDays || []).map(d => d?.date || d?.day).filter(Boolean).sort()

  // Auto-select current day or first available
  useEffect(() => {
    if (availableDays.length > 0 && !selectedDay) {
      const today = new Date().toISOString().split('T')[0]
      setSelectedDay(availableDays.includes(today) ? today : availableDays[0])
    }
  }, [availableDays])

  // Fetch data when day changes
  useEffect(() => {
    if (selectedDay && event?.id) {
      fetchData()
    }
  }, [selectedDay, event?.id])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch VIP tables (with sold_price > 0)
      const { data: tablesData } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', event.id)
        .eq('day', selectedDay)
        .gt('sold_price', 0)
        .order('table_number')

      // Fetch orders with items for these tables
      const tableIds = (tablesData || []).map(t => t.id)
      let ordersData = []
      
      if (tableIds.length > 0) {
        const { data } = await supabase
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
          .in('table_id', tableIds)
        ordersData = data || []
      }

      setTables(tablesData || [])
      setOrders(ordersData)
    } catch (error) {
      console.error('Error fetching pre-orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get order for a table
  const getOrderForTable = (tableId) => {
    return orders.find(o => o.table_id === tableId)
  }

  // Get status for a table
  const getTableStatus = (table) => {
    const order = getOrderForTable(table.id)
    if (!order) return { status: 'no_link', label: 'Pas de lien', color: 'bg-gray-500', badge: '⚫' }
    if (order.status === 'confirmed') return { status: 'confirmed', label: 'Confirmée', color: 'bg-green-500', badge: '🟢' }
    return { status: 'pending', label: 'En attente', color: 'bg-yellow-500', badge: '🟡' }
  }

  // Calculate stats
  const stats = {
    total: tables.length,
    confirmed: tables.filter(t => getTableStatus(t).status === 'confirmed').length,
    pending: tables.filter(t => getTableStatus(t).status === 'pending').length,
    noLink: tables.filter(t => getTableStatus(t).status === 'no_link').length
  }

  // Filter tables by status
  const filteredTables = tables.filter(table => {
    if (statusFilter === 'all') return true
    return getTableStatus(table).status === statusFilter
  }).sort((a, b) => {
    // Sort: pending first, then no_link, then confirmed
    const statusOrder = { pending: 0, no_link: 1, confirmed: 2 }
    const statusDiff = statusOrder[getTableStatus(a).status] - statusOrder[getTableStatus(b).status]
    if (statusDiff !== 0) return statusDiff
    // Then sort by table number within each status group
    const numA = parseInt(a.display_number || a.table_number || '0', 10)
    const numB = parseInt(b.display_number || b.table_number || '0', 10)
    return numA - numB
  })

  // Get aggregated items for bar recap
  const getAggregatedItems = () => {
    const confirmedOrders = orders.filter(o => o.status === 'confirmed')
    const itemsMap = new Map()

    confirmedOrders.forEach(order => {
      (order.order_items || []).forEach(item => {
        const menuItem = item.menu_items
        if (!menuItem) return
        
        const key = menuItem.id
        if (itemsMap.has(key)) {
          const existing = itemsMap.get(key)
          existing.quantity += item.quantity
          existing.total += item.total_price
        } else {
          itemsMap.set(key, {
            id: menuItem.id,
            name: menuItem.name,
            category: menuItem.category || 'Autre',
            format: menuItem.format || '',
            price: menuItem.price,
            quantity: item.quantity,
            total: item.total_price
          })
        }
      })
    })

    return Array.from(itemsMap.values())
  }

  // Group items by category
  const getGroupedItems = () => {
    const items = getAggregatedItems()
    const grouped = {}
    
    items.forEach(item => {
      const cat = item.category
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(item)
    })

    return grouped
  }

  // Calculate totals
  const calculateTotals = () => {
    const items = getAggregatedItems()
    return items.reduce((acc, item) => acc + item.total, 0)
  }

  // Copy recap to clipboard
  const copyRecap = () => {
    const grouped = getGroupedItems()
    let text = `📦 RÉCAP PRÉ-COMMANDES - ${selectedDay}\n`
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`

    Object.entries(grouped).forEach(([category, items]) => {
      text += `📌 ${category.toUpperCase()}\n`
      items.forEach(item => {
        text += `   ${item.quantity}x ${item.name} (${item.format}) = ${item.total.toLocaleString()} ${event.currency}\n`
      })
      const catTotal = items.reduce((s, i) => s + i.total, 0)
      text += `   ➜ Sous-total: ${catTotal.toLocaleString()} ${event.currency}\n\n`
    })

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    text += `💰 TOTAL GÉNÉRAL: ${calculateTotals().toLocaleString()} ${event.currency}\n`

    navigator.clipboard.writeText(text)
    toast.success('Récap copié dans le presse-papier!')
  }

  // Export to CSV
  const exportCSV = () => {
    const items = getAggregatedItems()
    if (items.length === 0) {
      toast.error('Aucune donnée à exporter')
      return
    }

    const headers = ['Catégorie', 'Nom', 'Format', 'Quantité', 'Prix unitaire', 'Total']
    const rows = items.map(item => [
      item.category,
      item.name,
      item.format,
      item.quantity,
      item.price,
      item.total
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `precommandes_${selectedDay}.csv`
    link.click()
    toast.success('Export CSV téléchargé!')
  }

  // View table detail
  const viewTableDetail = (table) => {
    const order = getOrderForTable(table.id)
    setSelectedTableDetail({ table, order })
    setShowDetailModal(true)
  }

  const formatSwiss = (amount) => (amount || 0).toLocaleString('de-CH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">📦 Pré-commandes VIP</h2>
            <p className="text-sm text-muted-foreground">Suivi des commandes anticipées</p>
          </div>
        </div>

        <Select value={selectedDay} onValueChange={setSelectedDay}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Sélectionner un jour" />
          </SelectTrigger>
          <SelectContent>
            {availableDays.map(day => (
              <SelectItem key={day} value={day}>
                {day ? format(parseISO(day), 'EEEE dd MMM', { locale: fr }) : day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-card">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Tables VIP</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-green-500/10 border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-500">{stats.confirmed}</p>
              <p className="text-xs text-muted-foreground">Confirmées</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">En attente</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gray-500/10 border-gray-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-500/20 rounded-lg">
              <LinkIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">{stats.noLink}</p>
              <p className="text-xs text-muted-foreground">Sans lien</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        <Button
          variant={activeTab === 'status' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('status')}
          className={activeTab === 'status' ? 'bg-purple-500 text-white' : ''}
        >
          📊 Statut tables
        </Button>
        <Button
          variant={activeTab === 'recap' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('recap')}
          className={activeTab === 'recap' ? 'bg-purple-500 text-white' : ''}
        >
          🍾 Récap bar
        </Button>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={statusFilter === 'all' ? 'bg-purple-500' : ''}
            >
              Toutes ({stats.total})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('confirmed')}
              className={statusFilter === 'confirmed' ? 'bg-green-500' : ''}
            >
              🟢 Confirmées ({stats.confirmed})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'pending' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('pending')}
              className={statusFilter === 'pending' ? 'bg-yellow-500 text-black' : ''}
            >
              🟡 En attente ({stats.pending})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'no_link' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('no_link')}
              className={statusFilter === 'no_link' ? 'bg-gray-500' : ''}
            >
              ⚫ Sans lien ({stats.noLink})
            </Button>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTables.map(table => {
              const status = getTableStatus(table)
              const order = getOrderForTable(table.id)
              const budget = table.sold_price || 0
              const ordered = order?.total_amount || 0
              const excess = order?.extra_amount || 0

              return (
                <Card 
                  key={table.id}
                  className={`p-4 border-2 ${
                    status.status === 'confirmed' ? 'border-green-500/50 bg-green-500/5' :
                    status.status === 'pending' ? 'border-yellow-500/50 bg-yellow-500/5' :
                    'border-gray-500/30 bg-gray-500/5'
                  }`}
                >
                  {/* Numéro de table en grand */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-black text-white">{table.display_number || table.table_number}</span>
                      <span className="text-2xl">{status.badge}</span>
                    </div>
                    <Badge variant="outline" className={
                      status.status === 'confirmed' ? 'border-green-500 text-green-500' :
                      status.status === 'pending' ? 'border-yellow-500 text-yellow-500' :
                      'border-gray-500 text-gray-500'
                    }>
                      {status.label}
                    </Badge>
                  </div>
                  
                  {/* Date/Jour */}
                  <p className="text-xs text-purple-400 mb-2">
                    📅 {table.day ? format(parseISO(table.day), 'EEEE dd MMM', { locale: fr }) : selectedDay}
                  </p>
                  
                  <p className="text-sm text-muted-foreground truncate mb-3">
                    {table.client_name || 'Client'}
                  </p>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Budget boisson</span>
                      <span className="font-medium">{formatSwiss(budget)} {event.currency}</span>
                    </div>
                    
                    {order && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commandé</span>
                          <span className="font-medium text-purple-400">{formatSwiss(ordered)} {event.currency}</span>
                        </div>
                        
                        {excess > 0 && (
                          <div className="flex justify-between">
                            <span className="text-red-400">Excédent</span>
                            <span className="font-bold text-red-400">+{formatSwiss(excess)} {event.currency}</span>
                          </div>
                        )}

                        {order.confirmed_at && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Confirmé le</span>
                            <span>{format(new Date(order.confirmed_at), 'dd/MM à HH:mm')}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-3"
                    onClick={() => viewTableDetail(table)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Voir détail
                  </Button>
                </Card>
              )
            })}
          </div>

          {filteredTables.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune table trouvée avec ce filtre</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'recap' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={copyRecap} variant="outline">
              <Copy className="w-4 h-4 mr-2" />
              Copier le récap
            </Button>
            <Button onClick={exportCSV} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exporter CSV
            </Button>
          </div>

          {/* Grouped Items */}
          {Object.entries(getGroupedItems()).length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Wine className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune commande confirmée pour ce jour</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(getGroupedItems()).map(([category, items]) => {
                const categoryTotal = items.reduce((s, i) => s + i.total, 0)
                
                return (
                  <Card key={category} className="overflow-hidden">
                    <div className="bg-purple-500/20 px-4 py-2 border-b border-border">
                      <h3 className="font-bold text-purple-400">{category}</h3>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map(item => (
                        <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.format}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{item.quantity}x</p>
                            <p className="text-xs text-muted-foreground">{formatSwiss(item.price)} {event.currency}/u</p>
                          </div>
                          <div className="text-right ml-4 min-w-[100px]">
                            <p className="font-bold text-purple-400">{formatSwiss(item.total)} {event.currency}</p>
                          </div>
                        </div>
                      ))}
                      <div className="px-4 py-3 bg-muted/30 flex justify-between">
                        <span className="font-medium">Sous-total {category}</span>
                        <span className="font-bold">{formatSwiss(categoryTotal)} {event.currency}</span>
                      </div>
                    </div>
                  </Card>
                )
              })}

              {/* Grand Total */}
              <Card className="p-4 bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-500/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold">💰 Total général</p>
                    <p className="text-sm text-muted-foreground">{stats.confirmed} commandes confirmées</p>
                  </div>
                  <p className="text-3xl font-bold text-purple-400">
                    {formatSwiss(calculateTotals())} {event.currency}
                  </p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selectedTableDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-2xl font-black">{selectedTableDetail.table.display_number || selectedTableDetail.table.table_number}</span>
                  <span className="text-xl">{getTableStatus(selectedTableDetail.table).badge}</span>
                  <span className="text-sm text-purple-400 font-normal">
                    📅 {selectedTableDetail.table.day ? format(parseISO(selectedTableDetail.table.day), 'EEEE dd MMM', { locale: fr }) : ''}
                  </span>
                </DialogTitle>
                <DialogDescription>
                  {selectedTableDetail.table.client_name || 'Client'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Budget Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Budget boisson</p>
                    <p className="text-lg font-bold">{formatSwiss(selectedTableDetail.table.sold_price)} {event.currency}</p>
                  </div>
                  {selectedTableDetail.order && (
                    <div className="p-3 bg-purple-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground">Commandé</p>
                      <p className="text-lg font-bold text-purple-400">
                        {formatSwiss(selectedTableDetail.order.total_amount)} {event.currency}
                      </p>
                    </div>
                  )}
                </div>

                {/* Order Items */}
                {selectedTableDetail.order?.order_items?.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-2">Articles commandés</h4>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedTableDetail.order.order_items.map((item, idx) => (
                        <div key={idx} className="flex justify-between p-2 bg-muted/30 rounded">
                          <div>
                            <p className="font-medium">{item.menu_items?.name || 'Article'}</p>
                            <p className="text-xs text-muted-foreground">{item.menu_items?.category}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity}x</p>
                            <p className="text-sm text-purple-400">{formatSwiss(item.total_price)} {event.currency}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Aucun article commandé</p>
                  </div>
                )}

                {/* Client Notes */}
                {selectedTableDetail.order?.client_notes && (
                  <div>
                    <h4 className="font-medium mb-2">📝 Notes du client</h4>
                    <div className="p-3 bg-muted/30 rounded-lg italic">
                      {selectedTableDetail.order.client_notes}
                    </div>
                  </div>
                )}

                {/* Excess Warning */}
                {selectedTableDetail.order?.extra_amount > 0 && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 text-red-400">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-bold">
                        Excédent: +{formatSwiss(selectedTableDetail.order.extra_amount)} {event.currency}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      À régler sur place le jour de l'événement
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Comptabilité Component
function ComptabiliteView({ event, tables, eventDays }) {
  const [payments, setPayments] = useState([])
  const [bankTransfers, setBankTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({
    amount: '',
    reference: '',
    date: new Date().toISOString().split('T')[0],
    client_name: '',
    table_ids: []
  })
  const [selectedTables, setSelectedTables] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch all payments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*, tables(table_number, display_number, client_name, day)')
        .eq('tables.event_id', event.id)
        .order('created_at', { ascending: false })
      
      setPayments(paymentsData || [])
      setLoading(false)
    }
    
    if (event?.id) fetchData()
  }, [event?.id])

  // Calculate stats
  const stats = {
    totalCA: tables.filter(t => ['confirme', 'paye'].includes(t.status)).reduce((sum, t) => {
      const total = (t.sold_price || 0) + ((t.additional_persons || 0) * (t.additional_person_price || 0)) + (t.on_site_additional_revenue || 0)
      return sum + total
    }, 0),
    totalPaid: tables.reduce((sum, t) => sum + (t.total_paid || 0), 0),
    totalCommissions: tables.reduce((sum, t) => sum + (t.commission_amount || 0), 0),
    tableCount: tables.filter(t => t.status !== 'libre').length,
    paidCount: tables.filter(t => t.status === 'paye').length
  }
  stats.remaining = stats.totalCA - stats.totalPaid

  // Group tables by client
  const clientGroups = tables
    .filter(t => t.client_name && t.status !== 'libre')
    .reduce((groups, table) => {
      const name = table.client_name
      if (!groups[name]) {
        groups[name] = { 
          name, 
          tables: [], 
          totalAmount: 0, 
          totalPaid: 0,
          concierge: table.concierge_nom,
          commission: 0
        }
      }
      const tableTotal = (table.sold_price || 0) + ((table.additional_persons || 0) * (table.additional_person_price || 0)) + (table.on_site_additional_revenue || 0)
      groups[name].tables.push(table)
      groups[name].totalAmount += tableTotal
      groups[name].totalPaid += (table.total_paid || 0)
      groups[name].commission += (table.commission_amount || 0)
      return groups
    }, {})

  // Export functions
  const exportToCSV = (data, filename) => {
    const BOM = '\uFEFF'
    const csv = BOM + data
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  const exportTables = () => {
    const headers = ['Date', 'Table', 'Client', 'Email', 'Téléphone', 'Statut', 'Prix Table', 'Pers. Supp.', 'Prix Total', 'Payé', 'Reste', 'Concierge', 'Commission']
    const rows = tables
      .filter(t => t.status !== 'libre')
      .map(t => {
        const total = (t.sold_price || 0) + ((t.additional_persons || 0) * (t.additional_person_price || 0)) + (t.on_site_additional_revenue || 0)
        const paid = t.total_paid || 0
        return [
          t.day,
          t.display_number || t.table_number,
          t.client_name || '',
          t.client_email || '',
          t.client_phone || '',
          t.status,
          t.sold_price || 0,
          t.additional_persons || 0,
          total,
          paid,
          total - paid,
          t.concierge_nom || '',
          t.commission_amount || 0
        ]
      })
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    exportToCSV(csv, `tables_${event.name}_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Export des tables téléchargé!')
  }

  const exportCommissions = () => {
    const headers = ['Concierge', 'Client', 'Table', 'Date', 'Prix Table', 'Taux Commission', 'Montant Commission']
    const rows = tables
      .filter(t => t.concierge_nom && t.commission_amount > 0)
      .map(t => [
        t.concierge_nom,
        t.client_name || '',
        t.display_number || t.table_number,
        t.day,
        t.sold_price || 0,
        t.concierge_commission || 0,
        t.commission_amount || 0
      ])
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    exportToCSV(csv, `commissions_${event.name}_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Export des commissions téléchargé!')
  }

  const exportPayments = () => {
    const headers = ['Date', 'Table', 'Client', 'Montant', 'Méthode', 'Notes']
    const rows = payments.map(p => [
      p.created_at ? new Date(p.created_at).toLocaleDateString('fr-CH') : '',
      p.tables?.display_number || p.tables?.table_number || '',
      p.tables?.client_name || '',
      p.amount || 0,
      p.method || '',
      p.notes || ''
    ])
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    exportToCSV(csv, `paiements_${event.name}_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Export des paiements téléchargé!')
  }

  const exportSummary = () => {
    const headers = ['Client', 'Nb Tables', 'Total Dû', 'Total Payé', 'Reste', 'Concierge', 'Commission']
    const rows = Object.values(clientGroups).map(c => [
      c.name,
      c.tables.length,
      c.totalAmount,
      c.totalPaid,
      c.totalAmount - c.totalPaid,
      c.concierge || '',
      c.commission
    ])
    
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n')
    exportToCSV(csv, `resume_${event.name}_${new Date().toISOString().split('T')[0]}.csv`)
    toast.success('Export du résumé téléchargé!')
  }

  // Register a bank transfer
  const registerTransfer = async () => {
    if (!transferForm.amount || selectedTables.length === 0) {
      toast.error('Montant et au moins une table requis')
      return
    }

    try {
      const amount = parseFloat(transferForm.amount)
      const amountPerTable = amount / selectedTables.length

      // Create payments for each selected table
      for (const tableId of selectedTables) {
        const table = tables.find(t => t.id === tableId)
        if (!table) continue

        // Insert payment
        await supabase.from('payments').insert({
          table_id: tableId,
          amount: amountPerTable,
          method: 'virement',
          notes: `Réf: ${transferForm.reference || 'N/A'} - Virement du ${transferForm.date}`
        })

        // Update table total_paid
        const newTotalPaid = (table.total_paid || 0) + amountPerTable
        const tableTotal = (table.sold_price || 0) + ((table.additional_persons || 0) * (table.additional_person_price || 0)) + (table.on_site_additional_revenue || 0)
        const newStatus = newTotalPaid >= tableTotal ? 'paye' : table.status

        await supabase
          .from('tables')
          .update({ 
            total_paid: newTotalPaid,
            status: newStatus
          })
          .eq('id', tableId)
      }

      toast.success(`Virement de ${amount.toLocaleString()} ${event.currency} enregistré pour ${selectedTables.length} table(s)!`)
      setShowTransferModal(false)
      setTransferForm({ amount: '', reference: '', date: new Date().toISOString().split('T')[0], client_name: '', table_ids: [] })
      setSelectedTables([])
      
      // Refresh data
      window.location.reload()
    } catch (error) {
      toast.error(error.message)
    }
  }

  // Get tables for selected client
  const getClientTables = (clientName) => {
    return tables.filter(t => t.client_name === clientName && t.status !== 'libre')
  }

  // Format currency
  const formatCurrency = (amount) => {
    return amount.toLocaleString('fr-CH') + ' ' + event.currency
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Banknote className="w-6 h-6 text-amber-500" />
          Comptabilité
        </h2>
        <Button onClick={() => setShowTransferModal(true)} className="bg-green-500 hover:bg-green-600">
          <Plus className="w-4 h-4 mr-2" /> Enregistrer un virement
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="w-4 h-4" />
              Chiffre d'affaires
            </div>
            <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.totalCA)}</p>
            <p className="text-xs text-muted-foreground">{stats.tableCount} tables réservées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Banknote className="w-4 h-4" />
              Encaissé
            </div>
            <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground">{stats.paidCount} tables payées</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="w-4 h-4" />
              Reste à encaisser
            </div>
            <p className="text-2xl font-bold text-amber-500">{formatCurrency(stats.remaining)}</p>
            <p className="text-xs text-muted-foreground">{stats.tableCount - stats.paidCount} en attente</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Users className="w-4 h-4" />
              Commissions
            </div>
            <p className="text-2xl font-bold text-purple-500">{formatCurrency(stats.totalCommissions)}</p>
            <p className="text-xs text-muted-foreground">À verser aux concierges</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="w-4 h-4" />
              Net (après commissions)
            </div>
            <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.totalCA - stats.totalCommissions)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Résumé par client</TabsTrigger>
          <TabsTrigger value="payments">Paiements reçus</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="space-y-3">
            {Object.values(clientGroups).map(client => {
              const remaining = client.totalAmount - client.totalPaid
              const isPaid = remaining <= 0
              return (
                <Card key={client.name} className={isPaid ? 'border-green-500/30 bg-green-500/5' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{client.name}</span>
                          {isPaid && <Badge className="bg-green-500 text-xs">Payé</Badge>}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {client.tables.length} table(s): {client.tables.map(t => t.display_number || t.table_number).join(', ')}
                        </div>
                        {client.concierge && (
                          <div className="text-xs text-purple-400">
                            Concierge: {client.concierge} (commission: {formatCurrency(client.commission)})
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(client.totalAmount)}</div>
                        {client.totalPaid > 0 && (
                          <div className="text-sm text-green-500">Payé: {formatCurrency(client.totalPaid)}</div>
                        )}
                        {remaining > 0 && (
                          <div className="text-sm text-amber-500">Reste: {formatCurrency(remaining)}</div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des paiements</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-2">
                  {payments.map(payment => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <div className="font-medium">{payment.tables?.client_name || 'Client inconnu'}</div>
                        <div className="text-sm text-muted-foreground">
                          Table {payment.tables?.display_number || payment.tables?.table_number} • {payment.method}
                          {payment.notes && ` • ${payment.notes}`}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-500">+{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {payment.created_at && new Date(payment.created_at).toLocaleDateString('fr-CH')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Commissions par concierge</CardTitle>
              <CardDescription>Montants à verser aux concierges</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const conciergeGroups = tables
                  .filter(t => t.concierge_nom && t.commission_amount > 0)
                  .reduce((groups, t) => {
                    const name = t.concierge_nom
                    if (!groups[name]) groups[name] = { name, total: 0, tables: [] }
                    groups[name].total += t.commission_amount
                    groups[name].tables.push(t)
                    return groups
                  }, {})
                
                if (Object.keys(conciergeGroups).length === 0) {
                  return <p className="text-center text-muted-foreground py-8">Aucune commission enregistrée</p>
                }

                return (
                  <div className="space-y-4">
                    {Object.values(conciergeGroups).map(concierge => (
                      <div key={concierge.name} className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-purple-400">{concierge.name}</span>
                          <span className="font-bold text-purple-400">{formatCurrency(concierge.total)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {concierge.tables.map(t => (
                            <div key={t.id} className="flex justify-between">
                              <span>{t.client_name} (Table {t.display_number || t.table_number})</span>
                              <span>{formatCurrency(t.commission_amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exports Tab */}
        <TabsContent value="exports" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:border-amber-500/50 transition-colors" onClick={exportTables}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-amber-500/20 rounded-lg">
                  <Table2 className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Tables</h3>
                  <p className="text-sm text-muted-foreground">Toutes les réservations avec détails</p>
                </div>
                <Download className="w-5 h-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-purple-500/50 transition-colors" onClick={exportCommissions}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-purple-500/20 rounded-lg">
                  <Users className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Commissions</h3>
                  <p className="text-sm text-muted-foreground">Détail par concierge</p>
                </div>
                <Download className="w-5 h-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-green-500/50 transition-colors" onClick={exportPayments}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-green-500/20 rounded-lg">
                  <Banknote className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Paiements</h3>
                  <p className="text-sm text-muted-foreground">Historique complet des encaissements</p>
                </div>
                <Download className="w-5 h-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:border-blue-500/50 transition-colors" onClick={exportSummary}>
              <CardContent className="p-6 flex items-center gap-4">
                <div className="p-3 bg-blue-500/20 rounded-lg">
                  <FileSpreadsheet className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold">Export Résumé</h3>
                  <p className="text-sm text-muted-foreground">Vue synthétique par client</p>
                </div>
                <Download className="w-5 h-5 ml-auto text-muted-foreground" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Bank Transfer Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Enregistrer un virement bancaire</DialogTitle>
            <DialogDescription>
              Le montant sera réparti entre les tables sélectionnées
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Montant ({event.currency})</Label>
                <Input
                  type="number"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={transferForm.date}
                  onChange={(e) => setTransferForm({...transferForm, date: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <Label>Référence bancaire</Label>
              <Input
                value={transferForm.reference}
                onChange={(e) => setTransferForm({...transferForm, reference: e.target.value})}
                placeholder="Ex: VIREMENT-12345"
              />
            </div>

            <div>
              <Label>Sélectionner le client</Label>
              <select
                value={transferForm.client_name}
                onChange={(e) => {
                  const clientName = e.target.value
                  setTransferForm({...transferForm, client_name: clientName})
                  if (clientName) {
                    const clientTables = getClientTables(clientName)
                    setSelectedTables(clientTables.map(t => t.id))
                  } else {
                    setSelectedTables([])
                  }
                }}
                className="w-full p-2 border rounded bg-background"
              >
                <option value="">-- Sélectionner --</option>
                {Object.keys(clientGroups).map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>

            {transferForm.client_name && (
              <div>
                <Label>Tables à associer ({selectedTables.length} sélectionnées)</Label>
                <div className="space-y-2 mt-2 max-h-40 overflow-y-auto">
                  {getClientTables(transferForm.client_name).map(table => {
                    const tableTotal = (table.sold_price || 0) + ((table.additional_persons || 0) * (table.additional_person_price || 0))
                    const remaining = tableTotal - (table.total_paid || 0)
                    const isSelected = selectedTables.includes(table.id)
                    
                    return (
                      <div
                        key={table.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTables(selectedTables.filter(id => id !== table.id))
                          } else {
                            setSelectedTables([...selectedTables, table.id])
                          }
                        }}
                        className={`p-2 rounded border cursor-pointer ${isSelected ? 'border-green-500 bg-green-500/10' : 'border-muted'}`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-medium">Table {table.display_number || table.table_number}</span>
                            <span className="text-sm text-muted-foreground ml-2">{table.day}</span>
                          </div>
                          <div className="text-sm">
                            {remaining > 0 ? (
                              <span className="text-amber-500">Reste: {formatCurrency(remaining)}</span>
                            ) : (
                              <span className="text-green-500">Payé</span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedTables.length > 0 && transferForm.amount && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>{parseFloat(transferForm.amount).toLocaleString()} {event.currency}</strong> sera réparti sur <strong>{selectedTables.length} table(s)</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Soit {(parseFloat(transferForm.amount) / selectedTables.length).toLocaleString()} {event.currency} par table
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferModal(false)}>Annuler</Button>
            <Button 
              onClick={registerTransfer} 
              disabled={!transferForm.amount || selectedTables.length === 0}
              className="bg-green-500 hover:bg-green-600"
            >
              Enregistrer le virement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Guichet d'Accueil Component
function GuichetView({ event, eventDays }) {
  const [selectedDay, setSelectedDay] = useState('')
  const [tables, setTables] = useState([])
  const [payments, setPayments] = useState({})
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPayment, setFilterPayment] = useState('all') // all, paid, partial, pending
  const [filterBracelets, setFilterBracelets] = useState('all') // all, given, notgiven
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('especes')
  const [newNote, setNewNote] = useState('')
  const [savingPayment, setSavingPayment] = useState(false)
  const [savingNote, setSavingNote] = useState(false)

  // Get unique days from eventDays - filter out undefined/null values
  // Note: event_days table uses 'date' column, not 'day'
  const availableDays = (eventDays || []).map(d => d?.date || d?.day).filter(Boolean).sort()

  useEffect(() => {
    if (availableDays.length > 0 && !selectedDay) {
      // Default to today if available, otherwise first day
      const today = new Date().toISOString().split('T')[0]
      if (availableDays.includes(today)) {
        setSelectedDay(today)
      } else {
        setSelectedDay(availableDays[0])
      }
    }
  }, [availableDays])

  useEffect(() => {
    if (selectedDay) {
      fetchTablesForDay()
      fetchPayments()
    }
  }, [selectedDay])

  const fetchTablesForDay = async () => {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('tables')
        .select('*')
        .eq('event_id', event.id)
        .eq('day', selectedDay)
        .neq('status', 'libre')
        .order('client_name')
      setTables(data || [])
    } catch (error) {
      console.error('Error fetching tables:', error)
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

  // Calculate total for a table
  const calculateTableTotal = (table) => {
    const basePrice = table.sold_price || table.standard_price || 0
    const additionalPersons = (table.additional_persons || 0) * (table.additional_person_price || 0)
    const onSiteRevenue = table.on_site_additional_revenue || 0
    return basePrice + additionalPersons + onSiteRevenue
  }

  // Get paid amount for a table
  const getPaidAmount = (tableId) => {
    const tablePayments = payments[tableId] || []
    return tablePayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  }

  // Calculate bracelets for a table
  const calculateBracelets = (table) => {
    const base = table.persons || table.capacity || 0
    const additional = table.additional_persons || 0
    const onSite = table.on_site_persons || 0
    return { base, additional, onSite, total: base + additional + onSite }
  }

  // Group tables by client
  const groupByClient = () => {
    const grouped = tables.reduce((acc, table) => {
      const key = table.client_email || table.client_name || table.id
      if (!acc[key]) {
        acc[key] = {
          client_name: table.client_name,
          client_email: table.client_email,
          client_phone: table.client_phone,
          tables: []
        }
      }
      acc[key].tables.push(table)
      return acc
    }, {})
    return Object.values(grouped)
  }

  // Filter and search
  const getFilteredClients = () => {
    let clients = groupByClient()

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      clients = clients.filter(c => 
        (c.client_name || '').toLowerCase().includes(query) ||
        (c.client_email || '').toLowerCase().includes(query) ||
        c.tables.some(t => t.table_number.toLowerCase().includes(query))
      )
    }

    // Payment filter
    if (filterPayment !== 'all') {
      clients = clients.filter(c => {
        const total = c.tables.reduce((s, t) => s + calculateTableTotal(t), 0)
        const paid = c.tables.reduce((s, t) => s + getPaidAmount(t.id), 0)
        if (filterPayment === 'paid') return paid >= total
        if (filterPayment === 'partial') return paid > 0 && paid < total
        if (filterPayment === 'pending') return paid === 0
        return true
      })
    }

    // Bracelets filter
    if (filterBracelets !== 'all') {
      clients = clients.filter(c => {
        const allGiven = c.tables.every(t => t.bracelets_given)
        if (filterBracelets === 'given') return allGiven
        if (filterBracelets === 'notgiven') return !allGiven
        return true
      })
    }

    return clients
  }

  // Toggle bracelets given
  const toggleBracelets = async (table) => {
    const newValue = !table.bracelets_given
    try {
      const { error } = await supabase
        .from('tables')
        .update({
          bracelets_given: newValue,
          bracelets_given_at: newValue ? new Date().toISOString() : null
        })
        .eq('id', table.id)
      
      if (error) throw error
      fetchTablesForDay()
      toast.success(newValue ? 'Bracelets marqués comme remis' : 'Bracelets non remis')
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    }
  }

  // Add payment
  const handleAddPayment = async () => {
    if (!selectedClient || !paymentAmount) return
    setSavingPayment(true)
    try {
      // Add payment to the first table of the client
      const tableId = selectedClient.tables[0].id
      const { error } = await supabase.from('payments').insert({
        table_id: tableId,
        amount: parseFloat(paymentAmount),
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: paymentMethod
      })
      if (error) throw error
      
      toast.success('Paiement enregistré!')
      setShowPaymentModal(false)
      setPaymentAmount('')
      fetchPayments()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setSavingPayment(false)
    }
  }

  // Add note - uses the shared 'notes' field (bidirectional with staff notes)
  const handleAddNote = async () => {
    if (!selectedClient || !newNote) return
    setSavingNote(true)
    try {
      // Add note to all tables of the client
      for (const table of selectedClient.tables) {
        const existingNotes = table.notes || ''
        const timestamp = format(new Date(), 'dd/MM HH:mm')
        const updatedNotes = existingNotes 
          ? `${existingNotes}\n[Guichet ${timestamp}] ${newNote}`
          : `[Guichet ${timestamp}] ${newNote}`
        
        const { error } = await supabase
          .from('tables')
          .update({ notes: updatedNotes })
          .eq('id', table.id)
        if (error) throw error
      }
      
      toast.success('Note ajoutée!')
      setShowNoteModal(false)
      setNewNote('')
      fetchTablesForDay()
    } catch (error) {
      toast.error('Erreur: ' + error.message)
    } finally {
      setSavingNote(false)
    }
  }

  // Format Swiss currency
  const formatSwiss = (amount) => {
    return (amount || 0).toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  // Get payment status color and label
  const getPaymentStatus = (total, paid) => {
    if (paid >= total) return { color: 'bg-green-500', label: 'Payé', icon: '🟢' }
    if (paid > 0) return { color: 'bg-yellow-500', label: 'Partiel', icon: '🟡' }
    return { color: 'bg-red-500', label: 'En attente', icon: '🔴' }
  }

  const filteredClients = getFilteredClients()

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Ticket className="w-6 h-6 text-amber-500" />
          <h2 className="text-xl font-semibold">Guichet d'Accueil</h2>
        </div>
        
        {/* Day Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedDay} onValueChange={setSelectedDay}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sélectionner un jour" />
            </SelectTrigger>
            <SelectContent>
              {availableDays.length > 0 ? availableDays.map(day => (
                <SelectItem key={day} value={day}>
                  {day ? format(parseISO(day), 'EEEE dd MMMM', { locale: fr }) : 'Date invalide'}
                </SelectItem>
              )) : (
                <div className="p-2 text-sm text-muted-foreground">Aucun jour configuré</div>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Rechercher par nom, email ou n° table..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterPayment} onValueChange={setFilterPayment}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Paiement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous paiements</SelectItem>
            <SelectItem value="paid">🟢 Payé</SelectItem>
            <SelectItem value="partial">🟡 Partiel</SelectItem>
            <SelectItem value="pending">🔴 En attente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBracelets} onValueChange={setFilterBracelets}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Bracelets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous bracelets</SelectItem>
            <SelectItem value="given">✅ Remis</SelectItem>
            <SelectItem value="notgiven">⏳ Non remis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : filteredClients.length === 0 ? (
        <Card className="p-8 text-center">
          <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            {selectedDay ? 'Aucune réservation pour ce jour' : 'Sélectionnez un jour'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client, idx) => {
            const clientTotal = client.tables.reduce((s, t) => s + calculateTableTotal(t), 0)
            const clientPaid = client.tables.reduce((s, t) => s + getPaidAmount(t.id), 0)
            const clientRemaining = clientTotal - clientPaid
            const clientBracelets = client.tables.reduce((s, t) => s + calculateBracelets(t).total, 0)
            const allBraceletsGiven = client.tables.every(t => t.bracelets_given)
            const paymentStatus = getPaymentStatus(clientTotal, clientPaid)
            const tableNumbers = client.tables.map(t => t.table_number).join(', ')
            const clientNotes = client.tables.map(t => t.notes).filter(Boolean).join('\n')

            return (
              <Card key={idx} className={`overflow-hidden ${allBraceletsGiven ? 'border-green-500/50 bg-green-500/5' : ''}`}>
                {/* Client Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${allBraceletsGiven ? 'bg-green-500' : 'bg-amber-500'}`} />
                      <div>
                        <h3 className="font-semibold text-lg">{client.client_name || 'Client sans nom'}</h3>
                        <p className="text-sm text-muted-foreground">
                          {client.client_email} {client.client_phone && `• ${client.client_phone}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-sm">
                      Tables: {tableNumbers}
                    </Badge>
                  </div>
                </div>

                {/* Bracelets Section */}
                <div className="p-4 bg-muted/30 border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <Ticket className="w-5 h-5 text-amber-500" />
                      <div>
                        <span className="text-2xl font-bold">{clientBracelets}</span>
                        <span className="text-muted-foreground ml-2">bracelets</span>
                        <div className="text-xs text-muted-foreground">
                          {client.tables.map(t => {
                            const b = calculateBracelets(t)
                            return `${t.table_number}: ${b.base} base${b.additional ? ` + ${b.additional} supp.` : ''}${b.onSite ? ` + ${b.onSite} sur place` : ''}`
                          }).join(' | ')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.tables.map(table => (
                        <Button
                          key={table.id}
                          variant={table.bracelets_given ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleBracelets(table)}
                          className={table.bracelets_given ? "bg-green-600 hover:bg-green-700" : ""}
                        >
                          {table.bracelets_given ? (
                            <>
                              <UserCheck className="w-4 h-4 mr-1" />
                              {table.table_number} ✓
                            </>
                          ) : (
                            <>
                              <Ticket className="w-4 h-4 mr-1" />
                              {table.table_number}
                            </>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {client.tables.some(t => t.bracelets_given_at) && (
                    <div className="mt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Remis: {client.tables.filter(t => t.bracelets_given_at).map(t => 
                        `${t.table_number} à ${format(new Date(t.bracelets_given_at), 'HH:mm')}`
                      ).join(', ')}
                    </div>
                  )}
                </div>

                {/* Payment Section */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="font-semibold ml-1">{formatSwiss(clientTotal)} {event.currency}</span>
                        </div>
                        <div className="text-muted-foreground">|</div>
                        <div>
                          <span className="text-muted-foreground">Payé:</span>
                          <span className="text-green-500 font-semibold ml-1">{formatSwiss(clientPaid)}</span>
                        </div>
                        {clientRemaining > 0 && (
                          <>
                            <div className="text-muted-foreground">|</div>
                            <div>
                              <span className="text-muted-foreground">Reste:</span>
                              <span className="text-orange-500 font-semibold ml-1">{formatSwiss(clientRemaining)}</span>
                            </div>
                          </>
                        )}
                        <Badge className={paymentStatus.color}>{paymentStatus.icon} {paymentStatus.label}</Badge>
                      </div>
                    </div>
                    {clientRemaining > 0 && (
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedClient(client)
                          setPaymentAmount(clientRemaining.toString())
                          setShowPaymentModal(true)
                        }}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white"
                      >
                        <CreditCard className="w-4 h-4 mr-1" />
                        Encaisser
                      </Button>
                    )}
                  </div>
                </div>

                {/* Notes Section */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1">
                      <StickyNote className="w-5 h-5 text-purple-500 mt-0.5" />
                      <div className="flex-1">
                        {clientNotes ? (
                          <p className="text-sm whitespace-pre-line">{clientNotes}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Aucune note</p>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSelectedClient(client)
                        setShowNoteModal(true)
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Note
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encaisser - {selectedClient?.client_name}</DialogTitle>
            <DialogDescription>
              Tables: {selectedClient?.tables.map(t => t.table_number).join(', ')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Montant ({event.currency})</Label>
              <Input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
                className="text-2xl font-bold"
              />
            </div>
            <div>
              <Label>Méthode de paiement</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="especes">💵 Espèces</SelectItem>
                  <SelectItem value="carte">💳 Carte</SelectItem>
                  <SelectItem value="twint">📱 TWINT</SelectItem>
                  <SelectItem value="virement">🏦 Virement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Annuler</Button>
            <Button 
              onClick={handleAddPayment}
              disabled={savingPayment || !paymentAmount}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white"
            >
              {savingPayment ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Modal */}
      <Dialog open={showNoteModal} onOpenChange={setShowNoteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter une note - {selectedClient?.client_name}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Ex: Client VIP - champagne offert, Arrivée prévue 22h..."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoteModal(false)}>Annuler</Button>
            <Button 
              onClick={handleAddNote}
              disabled={savingNote || !newNote}
              className="bg-gradient-to-r from-purple-500 to-purple-600 text-white"
            >
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <StickyNote className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Invoices View Component
function InvoicesView({ event, onEventUpdate }) {
  const [reservedTables, setReservedTables] = useState([])
  const [payments, setPayments] = useState({})
  const [loading, setLoading] = useState(true)
  const [sendingEmail, setSendingEmail] = useState(null)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedTableForPayment, setSelectedTableForPayment] = useState(null)
  const [paymentForm, setPaymentForm] = useState({ amount: '', method: 'virement', reference: '', notes: '' })
  
  // Invoice preview modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedInvoiceTable, setSelectedInvoiceTable] = useState(null)
  const [selectedInvoiceTables, setSelectedInvoiceTables] = useState([]) // For consolidated
  const [isConsolidated, setIsConsolidated] = useState(false)
  const [invoiceRecipient, setInvoiceRecipient] = useState('vip')
  const [customEmail, setCustomEmail] = useState('')
  
  // Billing settings tab
  const [activeTab, setActiveTab] = useState('invoices')
  const [billingSettings, setBillingSettings] = useState({
    billing_company_name: event.billing_company_name || 'VIP Gstaad',
    billing_beneficiary: event.billing_beneficiary || '',
    billing_address: event.billing_address || '',
    billing_account_number: event.billing_account_number || '',
    billing_iban: event.billing_iban || '',
    billing_bic: event.billing_bic || '',
    billing_bank_name: event.billing_bank_name || '',
    billing_bank_address: event.billing_bank_address || '',
    billing_logo_url: event.billing_logo_url || '',
    billing_terms: event.billing_terms || 'Payment must be completed within eight days from the date of issue, after which the table will be put back on sale.\nIn case of table cancellation by the client less than two weeks before the event will result in a penalty of 30% of the amount collected.',
    billing_vat_text: event.billing_vat_text || 'VAT not applicable at this stage',
    billing_thank_you: event.billing_thank_you || 'Thank you for your trust',
    billing_email: event.billing_email || 'vip@caprices.ch'
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => {
    fetchReservedTables()
    fetchPayments()
  }, [event.id])
  
  useEffect(() => {
    // Update billing settings when event changes
    setBillingSettings({
      billing_company_name: event.billing_company_name || 'VIP Gstaad',
      billing_beneficiary: event.billing_beneficiary || '',
      billing_address: event.billing_address || '',
      billing_account_number: event.billing_account_number || '',
      billing_iban: event.billing_iban || '',
      billing_bic: event.billing_bic || '',
      billing_bank_name: event.billing_bank_name || '',
      billing_bank_address: event.billing_bank_address || '',
      billing_logo_url: event.billing_logo_url || '',
      billing_terms: event.billing_terms || 'Payment must be completed within eight days from the date of issue, after which the table will be put back on sale.\nIn case of table cancellation by the client less than two weeks before the event will result in a penalty of 30% of the amount collected.',
      billing_vat_text: event.billing_vat_text || 'VAT not applicable at this stage',
      billing_thank_you: event.billing_thank_you || 'Thank you for your trust',
      billing_email: event.billing_email || 'vip@caprices.ch'
    })
  }, [event])

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

  // Save billing settings
  const saveBillingSettings = async () => {
    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('events')
        .update(billingSettings)
        .eq('id', event.id)
      
      if (error) throw error
      toast.success('Billing settings saved!')
      if (onEventUpdate) onEventUpdate()
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setSavingSettings(false)
    }
  }

  // Upload logo
  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', event.id)
      
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        body: formData
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      setBillingSettings(prev => ({ ...prev, billing_logo_url: data.logoUrl }))
      toast.success('Logo uploaded!')
      if (onEventUpdate) onEventUpdate()
    } catch (error) {
      toast.error('Error: ' + error.message)
    } finally {
      setUploadingLogo(false)
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

  // Safe date format helper
  const formatDate = (dateStr, formatStr = 'dd/MM/yyyy') => {
    try {
      if (!dateStr) return 'N/A'
      return format(parseISO(dateStr), formatStr, { locale: fr })
    } catch {
      return dateStr || 'N/A'
    }
  }

  // Generate PDF Invoice via API
  const generateInvoice = async (table) => {
    try {
      toast.info('Génération du PDF...')
      
      const response = await fetch('/api/invoice/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table, event, consolidated: false })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      // Convert base64 to blob and trigger download
      const base64Data = data.pdf.split(',')[1]
      const byteCharacters = atob(base64Data)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      // Create and click download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('PDF téléchargé!')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Erreur: ' + error.message)
    }
  }

  // Generate Consolidated PDF Invoice via API
  const generateConsolidatedInvoice = async (clientTables) => {
    try {
      toast.info('Génération de la facture consolidée...')
      
      const response = await fetch('/api/invoice/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: clientTables[0], 
          event, 
          consolidated: true,
          tables: clientTables
        })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      
      // Convert base64 to blob and download
      const byteCharacters = atob(data.pdf.split(',')[1])
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: 'application/pdf' })
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Facture consolidée téléchargée!')
    } catch (error) {
      console.error('PDF error:', error)
      toast.error('Erreur: ' + error.message)
    }
  }

  // Open invoice preview modal (single table)
  const openInvoicePreview = (table) => {
    setSelectedInvoiceTable(table)
    setSelectedInvoiceTables([table])
    setIsConsolidated(false)
    setInvoiceRecipient('vip')
    setCustomEmail('')
    setShowInvoiceModal(true)
  }

  // Open invoice preview modal (consolidated - multiple tables)
  const openConsolidatedInvoicePreview = (tables) => {
    setSelectedInvoiceTable(tables[0])
    setSelectedInvoiceTables(tables)
    setIsConsolidated(true)
    setInvoiceRecipient('vip')
    setCustomEmail('')
    setShowInvoiceModal(true)
  }

  // Get recipient email based on selection
  const getRecipientEmail = () => {
    switch (invoiceRecipient) {
      case 'vip': return billingSettings.billing_email || 'vip@caprices.ch'
      case 'client': return selectedInvoiceTable?.client_email || ''
      case 'custom': return customEmail
      default: return ''
    }
  }

  // Get all unique days from selected tables
  const getInvoiceDays = () => {
    const days = [...new Set(selectedInvoiceTables.map(t => t.day))].sort()
    return days
  }

  // Get tables for a specific day
  const getTablesForDay = (day) => {
    return selectedInvoiceTables.filter(t => t.day === day)
  }

  // Calculate grand total for all selected tables
  const getGrandTotal = () => {
    return selectedInvoiceTables.reduce((sum, t) => sum + calculateTableTotal(t), 0)
  }

  // Send invoice by email with selected recipient (supports single and consolidated)
  const sendInvoiceEmail = async () => {
    const recipientEmail = getRecipientEmail()
    
    if (!recipientEmail || !recipientEmail.includes('@')) {
      toast.error('Invalid email address')
      return
    }

    const table = selectedInvoiceTable
    if (!table) return

    setSendingEmail(table.id)
    
    try {
      const doc = new jsPDF()
      const currency = event?.currency || 'CHF'
      const grandTotal = getGrandTotal()
      const tables = selectedInvoiceTables
      const days = getInvoiceDays()
      // Use display_number if available, otherwise table_number
      const getTableDisplay = (t) => t.display_number || t.table_number
      const tableNumbers = tables.map(t => getTableDisplay(t)).join(', ')
      const companyName = billingSettings.billing_company_name || event.billing_company_name || 'VIP'
      
      // Colors
      const primaryColor = [70, 130, 180] // Steel blue like the PDF
      
      // Header - Company name
      doc.setFontSize(24)
      doc.setTextColor(...primaryColor)
      doc.setFont(undefined, 'bold')
      doc.text(companyName, 105, 20, { align: 'center' })
      
      // Subtitle
      doc.setFontSize(14)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      const docType = isConsolidated ? 'Consolidated Proforma - Table Reservations' : 'Proforma - Table Reservation'
      doc.text(docType, 105, 30, { align: 'center' })
      
      // Date right aligned
      doc.setFontSize(10)
      doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, 190, 40, { align: 'right' })
      
      // Two columns: Client Info and Reservation Summary
      let yPos = 55
      
      // Client Information - Left box
      doc.setFillColor(...primaryColor)
      doc.rect(20, yPos, 80, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.setFontSize(10)
      doc.text('Client Information', 25, yPos + 6)
      
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.text(`Name: ${table.client_name || 'N/A'}`, 25, yPos + 18)
      if (table.client_email) doc.text(`Email: ${table.client_email}`, 25, yPos + 26)
      if (table.client_phone) doc.text(`Phone: ${table.client_phone}`, 25, yPos + 34)
      
      // Reservation Summary - Right box
      doc.setFillColor(...primaryColor)
      doc.rect(110, yPos, 80, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.text('Reservation Summary', 115, yPos + 6)
      
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.text(`Total Tables: ${tables.length}`, 115, yPos + 18)
      doc.text(`Days: ${days.join(', ')}`, 115, yPos + 26)
      doc.text(`Table Numbers: ${tableNumbers}`, 115, yPos + 34)
      
      // Detailed Reservations
      yPos = 110
      doc.setFillColor(...primaryColor)
      doc.rect(20, yPos, 170, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.text('Detailed Reservations', 25, yPos + 6)
      
      yPos += 15
      doc.setTextColor(0, 0, 0)
      
      // Group by day
      days.forEach(day => {
        const dayTables = getTablesForDay(day)
        const dayTotal = dayTables.reduce((sum, t) => sum + calculateTableTotal(t), 0)
        
        // Day header
        doc.setFont(undefined, 'bold')
        doc.setFontSize(10)
        doc.text(`Day ${day}`, 25, yPos)
        doc.setFont(undefined, 'normal')
        doc.text(`Tables: ${dayTables.map(t => getTableDisplay(t)).join(', ')}`, 60, yPos)
        yPos += 8
        
        // Table header row
        doc.setFillColor(240, 240, 240)
        doc.rect(25, yPos - 4, 160, 7, 'F')
        doc.setFontSize(9)
        doc.text('Description', 28, yPos)
        doc.text('Qty', 100, yPos)
        doc.text('Unit Price', 120, yPos)
        doc.text('Total', 165, yPos)
        yPos += 8
        
        // Table rows
        dayTables.forEach(t => {
          const tTotal = calculateTableTotal(t)
          doc.text(`Table ${getTableDisplay(t)} Reservation`, 28, yPos)
          doc.text('1', 100, yPos)
          doc.text(`${formatSwiss(tTotal)} ${currency}`, 120, yPos)
          doc.text(`${formatSwiss(tTotal)} ${currency}`, 165, yPos)
          yPos += 7
        })
        
        // Day subtotal
        doc.setFont(undefined, 'bold')
        doc.text(`Day ${day} Subtotal: ${formatSwiss(dayTotal)} ${currency}`, 130, yPos, { align: 'right' })
        doc.setFont(undefined, 'normal')
        yPos += 12
      })
      
      // Grand Total
      yPos += 5
      doc.setFillColor(...primaryColor)
      doc.rect(20, yPos, 170, 12, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.text(`Grand Total: ${formatSwiss(grandTotal)} ${currency}`, 105, yPos + 9, { align: 'center' })
      
      // Banking Information
      yPos += 25
      doc.setTextColor(0, 0, 0)
      doc.setFillColor(...primaryColor)
      doc.rect(20, yPos, 170, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text('Banking Information', 25, yPos + 6)
      
      yPos += 15
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(9)
      
      const beneficiary = billingSettings.billing_beneficiary || event.billing_beneficiary
      const address = billingSettings.billing_address || event.billing_address
      const accountNumber = billingSettings.billing_account_number || event.billing_account_number
      const iban = billingSettings.billing_iban || event.billing_iban
      const bic = billingSettings.billing_bic || event.billing_bic
      const bankName = billingSettings.billing_bank_name || event.billing_bank_name
      const bankAddress = billingSettings.billing_bank_address || event.billing_bank_address
      
      if (beneficiary) {
        doc.text(`Beneficiary: ${beneficiary}`, 25, yPos)
        yPos += 6
      }
      if (address) {
        doc.text(`Address: ${address}`, 25, yPos)
        yPos += 6
      }
      if (accountNumber) {
        doc.text(`Account Number: ${accountNumber}`, 25, yPos)
        yPos += 6
      }
      if (iban) {
        doc.text(`IBAN: ${iban}`, 25, yPos)
        yPos += 6
      }
      if (bic) {
        doc.text(`BIC/SWIFT: ${bic}`, 25, yPos)
        yPos += 6
      }
      if (bankName) {
        doc.text(`Bank: ${bankName}`, 25, yPos)
        yPos += 6
      }
      if (bankAddress) {
        doc.text(`Bank Address: ${bankAddress}`, 25, yPos)
        yPos += 6
      }
      
      // Terms & Conditions
      yPos += 10
      doc.setFillColor(...primaryColor)
      doc.rect(20, yPos, 170, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont(undefined, 'bold')
      doc.text('Terms & Conditions', 25, yPos + 6)
      
      yPos += 15
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, 'normal')
      doc.setFontSize(8)
      
      const termsText = billingSettings.billing_terms || event.billing_terms || ''
      const terms = termsText.split('\n')
      terms.forEach(term => {
        if (term.trim()) {
          doc.text(`• ${term.trim()}`, 25, yPos)
          yPos += 5
        }
      })
      
      // Footer
      const thankYou = billingSettings.billing_thank_you || event.billing_thank_you || 'Thank you for your trust'
      const vatText = billingSettings.billing_vat_text || event.billing_vat_text || 'VAT not applicable at this stage'
      const contactEmail = billingSettings.billing_email || event.billing_email || 'vip@caprices.ch'
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.text(`${thankYou} - ${companyName}!`, 105, 270, { align: 'center' })
      doc.setFontSize(8)
      doc.text(vatText, 105, 277, { align: 'center' })
      doc.text(`This ${isConsolidated ? 'consolidated proforma' : 'proforma'} was automatically generated on ${format(new Date(), 'dd/MM/yyyy')}`, 105, 283, { align: 'center' })
      
      const pdfBase64 = doc.output('datauristring').split(',')[1]
      const clientNameClean = (table.client_name || 'Client').replace(/[^a-zA-Z0-9]/g, '_')
      const fileName = isConsolidated 
        ? `Invoice_${clientNameClean}_${companyName}.pdf`
        : `Invoice_Table_${table.table_number}_${companyName}.pdf`
      
      const response = await fetch('/api/invoice/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `${companyName} - ${isConsolidated ? 'Consolidated ' : ''}Invoice - ${table.client_name || 'Client'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4682B4;">${companyName}</h2>
              <p>Dear ${table.client_name || 'Client'},</p>
              <p>Please find attached your ${isConsolidated ? 'consolidated ' : ''}invoice for your VIP table reservation.</p>
              <p><strong>Total Amount: ${formatSwiss(grandTotal)} ${currency}</strong></p>
              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Best regards,<br>The ${companyName} Team</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 12px; color: #666;">${contactEmail}</p>
            </div>
          `,
          pdfBase64,
          fileName
        })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      toast.success(`Invoice sent to ${recipientEmail}`)
      setShowInvoiceModal(false)
    } catch (error) {
      toast.error(`Error: ${error.message}`)
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
      // Insert without payment_method constraint issue
      const { error } = await supabase.from('payments').insert({
        table_id: selectedTableForPayment.id,
        amount: parseFloat(paymentForm.amount),
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
      {/* Tab Navigation */}
      <div className="flex items-center gap-4 border-b border-border">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'invoices' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Receipt className="w-4 h-4 inline mr-2" />
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'settings' ? 'border-b-2 border-amber-500 text-amber-500' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Cog className="w-4 h-4 inline mr-2" />
          Billing Settings
        </button>
      </div>

      {/* Billing Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>These details will appear on your invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Company Name</Label>
                  <Input 
                    value={billingSettings.billing_company_name}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_company_name: e.target.value})}
                    placeholder="VIP Gstaad"
                  />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input 
                    type="email"
                    value={billingSettings.billing_email}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_email: e.target.value})}
                    placeholder="vip@caprices.ch"
                  />
                </div>
              </div>
              
              <div>
                <Label>Beneficiary Name</Label>
                <Input 
                  value={billingSettings.billing_beneficiary}
                  onChange={(e) => setBillingSettings({...billingSettings, billing_beneficiary: e.target.value})}
                  placeholder="Gstaad Electronic Music Festival SA"
                />
              </div>
              
              <div>
                <Label>Address</Label>
                <Input 
                  value={billingSettings.billing_address}
                  onChange={(e) => setBillingSettings({...billingSettings, billing_address: e.target.value})}
                  placeholder="c/o T&R Oberland AG, Kirchstrasse 7, 3780 Gstaad"
                />
              </div>
              
              <div>
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {billingSettings.billing_logo_url && (
                    <img 
                      src={billingSettings.billing_logo_url} 
                      alt="Logo" 
                      className="h-16 object-contain bg-white p-2 rounded"
                    />
                  )}
                  <div>
                    <Input 
                      type="file" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="max-w-xs"
                    />
                    {uploadingLogo && <span className="text-sm text-muted-foreground ml-2">Uploading...</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Banking Information</CardTitle>
              <CardDescription>Payment details for your invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Account Number</Label>
                  <Input 
                    value={billingSettings.billing_account_number}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_account_number: e.target.value})}
                    placeholder="E56536850"
                  />
                </div>
                <div>
                  <Label>IBAN</Label>
                  <Input 
                    value={billingSettings.billing_iban}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_iban: e.target.value})}
                    placeholder="CH9300767000E56536850"
                  />
                </div>
                <div>
                  <Label>BIC/SWIFT</Label>
                  <Input 
                    value={billingSettings.billing_bic}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_bic: e.target.value})}
                    placeholder="BCVLCH2LXXX"
                  />
                </div>
                <div>
                  <Label>Bank Name</Label>
                  <Input 
                    value={billingSettings.billing_bank_name}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_bank_name: e.target.value})}
                    placeholder="Banque Cantonale Vaudoise"
                  />
                </div>
              </div>
              <div>
                <Label>Bank Address</Label>
                <Input 
                  value={billingSettings.billing_bank_address}
                  onChange={(e) => setBillingSettings({...billingSettings, billing_bank_address: e.target.value})}
                  placeholder="Place St-François 14, 1003 Lausanne, Switzerland"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Terms & Footer</CardTitle>
              <CardDescription>Legal terms and footer text for invoices</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Terms & Conditions (one per line)</Label>
                <Textarea 
                  value={billingSettings.billing_terms}
                  onChange={(e) => setBillingSettings({...billingSettings, billing_terms: e.target.value})}
                  placeholder="Payment must be completed within eight days..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Thank You Message</Label>
                  <Input 
                    value={billingSettings.billing_thank_you}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_thank_you: e.target.value})}
                    placeholder="Thank you for your trust"
                  />
                </div>
                <div>
                  <Label>VAT Text</Label>
                  <Input 
                    value={billingSettings.billing_vat_text}
                    onChange={(e) => setBillingSettings({...billingSettings, billing_vat_text: e.target.value})}
                    placeholder="VAT not applicable at this stage"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button 
              onClick={saveBillingSettings}
              disabled={savingSettings}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 hover:to-amber-700"
            >
              {savingSettings ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Billing Settings
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Client Invoices</h2>
            <Badge variant="outline">{reservedTables.length} reservations</Badge>
          </div>
          
          {Object.keys(groupedByClient).length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No reservations to invoice</p>
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
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => openConsolidatedInvoicePreview(client.tables)}
                          className="text-amber-400 border-amber-400 hover:bg-amber-400/10"
                          title="Send consolidated invoice by email"
                        >
                          <FileText className="w-4 h-4 mr-1" /> Facture
                        </Button>
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
                              <span className="font-medium">{table.display_number || table.table_number}</span>
                              {table.display_number && <span className="text-xs text-muted-foreground">({table.table_number})</span>}
                              <span className="text-muted-foreground text-sm">
                                {formatDate(table.day, 'dd MMM yyyy')}
                              </span>
                              <Badge variant={table.status === 'paye' ? 'default' : 'secondary'} className="text-xs">
                                {table.status}
                              </Badge>
                              <span className="text-xs italic text-muted-foreground">
                                (Budget: {formatSwiss(table.sold_price || 0)})
                              </span>
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
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => openInvoicePreview(table)}
                                title="Envoyer par email"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {/* Show payments */}
                          {payments[table.id]?.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <div className="text-xs text-muted-foreground mb-1">Paiements:</div>
                              {payments[table.id].map(p => (
                                <div key={p.id} className="flex justify-between text-xs">
                                  <span>{formatDate(p.payment_date, 'dd/MM/yy')} - {p.payment_method}</span>
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
        </>
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

      {/* Invoice Preview Modal */}
      <Dialog open={showInvoiceModal} onOpenChange={setShowInvoiceModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-500" />
              Invoice Preview {isConsolidated && '(Consolidated)'}
            </DialogTitle>
            <DialogDescription>
              {isConsolidated 
                ? `${selectedInvoiceTables.length} tables - ${selectedInvoiceTable?.client_name || 'Client'}`
                : `Table ${selectedInvoiceTable?.table_number} - ${selectedInvoiceTable?.client_name || 'Client'}`
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvoiceTable && (
            <div className="space-y-6">
              {/* Invoice Preview - New English Format */}
              <div className="border rounded-lg p-6 bg-white text-black text-sm">
                {/* Header */}
                <div className="text-center mb-4">
                  {(billingSettings.billing_logo_url || event.billing_logo_url) && (
                    <img 
                      src={billingSettings.billing_logo_url || event.billing_logo_url} 
                      alt="Logo" 
                      className="h-12 mx-auto mb-2 object-contain" 
                    />
                  )}
                  <h2 className="text-xl font-bold text-[#4682B4]">
                    {billingSettings.billing_company_name || event.billing_company_name || 'VIP'}
                  </h2>
                  <p className="text-gray-600">
                    {isConsolidated ? 'Consolidated Proforma - Table Reservations' : 'Proforma - Table Reservation'}
                  </p>
                  <p className="text-gray-500 text-xs">Date: {format(new Date(), 'dd/MM/yyyy')}</p>
                </div>
                
                {/* Two column info */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#4682B4]/10 p-3 rounded">
                    <h3 className="font-bold text-[#4682B4] text-xs mb-2">Client Information</h3>
                    <p className="font-medium">{selectedInvoiceTable.client_name || 'N/A'}</p>
                    {selectedInvoiceTable.client_email && <p className="text-xs">{selectedInvoiceTable.client_email}</p>}
                  </div>
                  <div className="bg-[#4682B4]/10 p-3 rounded">
                    <h3 className="font-bold text-[#4682B4] text-xs mb-2">Reservation Summary</h3>
                    <p className="text-xs">Total Tables: {selectedInvoiceTables.length}</p>
                    <p className="text-xs">Days: {getInvoiceDays().join(', ')}</p>
                    <p className="text-xs">Tables: {selectedInvoiceTables.map(t => t.display_number || t.table_number).join(', ')}</p>
                  </div>
                </div>
                
                {/* Detailed Reservations */}
                <div className="mb-4">
                  <div className="bg-[#4682B4] text-white px-3 py-1 rounded-t font-bold text-xs">
                    Detailed Reservations
                  </div>
                  <div className="border border-t-0 rounded-b p-2">
                    {getInvoiceDays().map(day => (
                      <div key={day} className="mb-2">
                        <p className="font-semibold text-xs">{format(parseISO(day), 'EEEE dd MMMM yyyy', { locale: fr })} - Table(s): {getTablesForDay(day).map(t => t.display_number || t.table_number).join(', ')}</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="text-left p-1">Description</th>
                              <th className="text-center p-1">Qty</th>
                              <th className="text-right p-1">Unit Price</th>
                              <th className="text-right p-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {getTablesForDay(day).map(t => (
                              <tr key={t.id}>
                                <td className="p-1">
                                  Table {t.display_number || t.table_number} - {format(parseISO(day), 'dd/MM/yyyy')}
                                  <br/><span className="text-[10px] italic text-gray-500">(Beverage budget: {formatSwiss(t.sold_price || 0)} {event.currency})</span>
                                </td>
                                <td className="text-center p-1">1</td>
                                <td className="text-right p-1">{formatSwiss(calculateTableTotal(t))} {event.currency}</td>
                                <td className="text-right p-1">{formatSwiss(calculateTableTotal(t))} {event.currency}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <p className="text-right text-xs font-semibold mt-1">
                          Subtotal: {formatSwiss(getTablesForDay(day).reduce((s, t) => s + calculateTableTotal(t), 0))} {event.currency}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Grand Total */}
                <div className="bg-[#4682B4] text-white p-3 rounded text-center mb-4">
                  <span className="font-bold text-lg">Grand Total: {formatSwiss(getGrandTotal())} {event.currency}</span>
                </div>
                
                {/* Banking Info - Always show if any field is filled */}
                {(billingSettings.billing_iban || billingSettings.billing_beneficiary || billingSettings.billing_bank_name || 
                  event.billing_iban || event.billing_beneficiary || event.billing_bank_name) && (
                  <div className="mb-4">
                    <div className="bg-[#4682B4] text-white px-3 py-1 rounded-t font-bold text-xs">
                      Banking Information
                    </div>
                    <div className="border border-t-0 rounded-b p-2 text-xs space-y-1">
                      {(billingSettings.billing_beneficiary || event.billing_beneficiary) && (
                        <p>Beneficiary: {billingSettings.billing_beneficiary || event.billing_beneficiary}</p>
                      )}
                      {(billingSettings.billing_address || event.billing_address) && (
                        <p>Address: {billingSettings.billing_address || event.billing_address}</p>
                      )}
                      {(billingSettings.billing_account_number || event.billing_account_number) && (
                        <p>Account Number: {billingSettings.billing_account_number || event.billing_account_number}</p>
                      )}
                      {(billingSettings.billing_iban || event.billing_iban) && (
                        <p>IBAN: {billingSettings.billing_iban || event.billing_iban}</p>
                      )}
                      {(billingSettings.billing_bic || event.billing_bic) && (
                        <p>BIC/SWIFT: {billingSettings.billing_bic || event.billing_bic}</p>
                      )}
                      {(billingSettings.billing_bank_name || event.billing_bank_name) && (
                        <p>Bank: {billingSettings.billing_bank_name || event.billing_bank_name}</p>
                      )}
                      {(billingSettings.billing_bank_address || event.billing_bank_address) && (
                        <p>Bank Address: {billingSettings.billing_bank_address || event.billing_bank_address}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Footer */}
                <div className="text-center text-xs text-gray-500">
                  <p>{billingSettings.billing_thank_you || event.billing_thank_you || 'Thank you for your trust'} - {billingSettings.billing_company_name || event.billing_company_name || 'VIP'}!</p>
                  <p>{billingSettings.billing_vat_text || event.billing_vat_text || 'VAT not applicable at this stage'}</p>
                </div>
              </div>
              
              {/* Email Options */}
              <div className="space-y-4">
                <Label className="text-base font-semibold">Send to:</Label>
                
                <div className="space-y-3">
                  {/* Option VIP */}
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${invoiceRecipient === 'vip' ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-muted/50'}`}
                    onClick={() => setInvoiceRecipient('vip')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceRecipient === 'vip' ? 'border-amber-500' : 'border-muted-foreground'}`}>
                      {invoiceRecipient === 'vip' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Internal Copy</p>
                      <p className="text-sm text-muted-foreground">{billingSettings.billing_email || 'vip@caprices.ch'}</p>
                    </div>
                  </div>
                  
                  {/* Option Client */}
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${invoiceRecipient === 'client' ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-muted/50'} ${!selectedInvoiceTable.client_email ? 'opacity-50' : ''}`}
                    onClick={() => selectedInvoiceTable.client_email && setInvoiceRecipient('client')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceRecipient === 'client' ? 'border-amber-500' : 'border-muted-foreground'}`}>
                      {invoiceRecipient === 'client' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Client Email</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInvoiceTable.client_email || 'Not provided'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Option Custom */}
                  <div 
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${invoiceRecipient === 'custom' ? 'border-amber-500 bg-amber-500/10' : 'border-border hover:bg-muted/50'}`}
                    onClick={() => setInvoiceRecipient('custom')}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${invoiceRecipient === 'custom' ? 'border-amber-500' : 'border-muted-foreground'}`}>
                      {invoiceRecipient === 'custom' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Other Email Address</p>
                      {invoiceRecipient === 'custom' && (
                        <Input 
                          type="email"
                          className="mt-2 bg-background"
                          placeholder="email@example.com"
                          value={customEmail}
                          onChange={(e) => setCustomEmail(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowInvoiceModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={sendInvoiceEmail}
              disabled={sendingEmail === selectedInvoiceTable?.id || (invoiceRecipient === 'custom' && !customEmail)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-600 hover:to-amber-700"
            >
              {sendingEmail === selectedInvoiceTable?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Send Invoice
                </>
              )}
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

