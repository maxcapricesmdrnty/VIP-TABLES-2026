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
import { Calendar, MapPin, Plus, LogOut, Settings, Users, Table2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { format, parseISO, eachDayOfInterval } from 'date-fns'
import { fr } from 'date-fns/locale'

export default function Home() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [view, setView] = useState('events') // events, dashboard, tables, settings, venues, layout
  const [showAuthDialog, setShowAuthDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Event form state
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

      // Create event days
      if (eventForm.start_date && eventForm.end_date) {
        const days = eachDayOfInterval({
          start: parseISO(eventForm.start_date),
          end: parseISO(eventForm.end_date)
        })
        
        const eventDays = days.map(day => ({
          event_id: data.id,
          date: format(day, 'yyyy-MM-dd'),
          is_active: true
        }))

        await supabase.from('event_days').insert(eventDays)
      }

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
            <Button size="lg" className="vip-gradient text-black font-semibold">
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

  // Event selected - show dashboard or tables view
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

  // Events list
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold vip-gradient bg-clip-text text-transparent">
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

      {/* Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">Mes Événements</h2>
          <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
            <DialogTrigger asChild>
              <Button className="vip-gradient text-black">
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
                <Button onClick={createEvent} className="vip-gradient text-black">Créer</Button>
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
                className="cursor-pointer hover:border-primary transition-colors"
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
  const [venueForm, setVenueForm] = useState({ name: '', capacity: 500 })
  const [layoutForm, setLayoutForm] = useState({
    left: { prefix: 'L', count: 4, rows: 2, capacity: 10, price: 5000 },
    right: { prefix: 'R', count: 4, rows: 2, capacity: 10, price: 5000 },
    back: { prefix: 'B', count: 4, rows: 1, capacity: 10, price: 3000 }
  })

  useEffect(() => {
    fetchVenues()
    fetchEventDays()
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
      .eq('is_active', true)
      .order('date')
    setEventDays(data || [])
    if (data?.length > 0 && !selectedDay) {
      setSelectedDay(data[0].date)
    }
  }

  const fetchTables = async () => {
    if (!selectedVenue || !selectedDay) return
    const { data } = await supabase
      .from('tables')
      .select('*')
      .eq('venue_id', selectedVenue.id)
      .eq('day', selectedDay)
      .order('table_number')
    setTables(data || [])
  }

  const fetchLayouts = async () => {
    if (!selectedVenue) return
    const { data } = await supabase
      .from('table_layouts')
      .select('*')
      .eq('venue_id', selectedVenue.id)
      .order('zone')
    setLayouts(data || [])
    
    // Update form with existing layouts
    if (data?.length > 0) {
      const newForm = { ...layoutForm }
      data.forEach(l => {
        newForm[l.zone] = {
          prefix: l.table_prefix,
          count: l.table_count,
          rows: l.rows,
          capacity: l.capacity_per_table,
          price: l.standard_price
        }
      })
      setLayoutForm(newForm)
    }
  }

  const createVenue = async () => {
    try {
      const { data, error } = await supabase
        .from('venues')
        .insert([{
          event_id: event.id,
          name: venueForm.name,
          capacity: venueForm.capacity,
          sort_order: venues.length
        }])
        .select()
        .single()
      
      if (error) throw error
      toast.success('Salle créée!')
      setShowVenueDialog(false)
      setVenueForm({ name: '', capacity: 500 })
      fetchVenues()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const saveLayout = async () => {
    if (!selectedVenue) {
      toast.error('Sélectionnez une salle d\'abord')
      return
    }

    try {
      // Delete existing layouts for this venue
      await supabase
        .from('table_layouts')
        .delete()
        .eq('venue_id', selectedVenue.id)

      // Insert new layouts
      const layoutsToInsert = ['left', 'right', 'back'].map((zone, idx) => ({
        venue_id: selectedVenue.id,
        zone,
        table_prefix: layoutForm[zone].prefix,
        table_count: layoutForm[zone].count,
        rows: layoutForm[zone].rows,
        capacity_per_table: layoutForm[zone].capacity,
        standard_price: layoutForm[zone].price,
        sort_order: idx
      }))

      await supabase.from('table_layouts').insert(layoutsToInsert)
      toast.success('Configuration sauvegardée!')
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
      // Delete existing tables for this day/venue
      await supabase
        .from('tables')
        .delete()
        .eq('venue_id', selectedVenue.id)
        .eq('day', selectedDay)

      // Generate tables based on layouts
      const tablesToInsert = []
      
      for (const zone of ['left', 'right', 'back']) {
        const config = layoutForm[zone]
        for (let i = 1; i <= config.count; i++) {
          tablesToInsert.push({
            event_id: event.id,
            venue_id: selectedVenue.id,
            table_number: `${config.prefix}${i}`,
            day: selectedDay,
            zone,
            status: 'libre',
            standard_price: config.price,
            sold_price: 0
          })
        }
      }

      await supabase.from('tables').insert(tablesToInsert)
      toast.success(`${tablesToInsert.length} tables générées!`)
      fetchTables()
    } catch (error) {
      toast.error(error.message)
    }
  }

  const getTablesByZone = (zone) => tables.filter(t => t.zone === zone)

  const getStatusClass = (status) => {
    const classes = {
      libre: 'table-libre',
      reserve: 'table-reserve',
      confirme: 'table-confirme',
      paye: 'table-paye'
    }
    return classes[status] || ''
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

  // Navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Calendar },
    { id: 'tables', label: 'Tables', icon: Table2 },
    { id: 'venues', label: 'Salles', icon: Users },
    { id: 'layout', label: 'Plan', icon: Settings },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={onBack}>← Retour</Button>
              <h1 className="text-xl font-bold">{event.name}</h1>
              <Badge>{event.currency}</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex gap-2 mt-4">
            {navItems.map(item => (
              <Button
                key={item.id}
                variant={view === item.id ? 'default' : 'ghost'}
                onClick={() => setView(item.id)}
                className={view === item.id ? 'vip-gradient text-black' : ''}
              >
                <item.icon className="w-4 h-4 mr-2" />
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Tables</CardDescription>
                  <CardTitle className="text-2xl">{stats.total}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-green-500">
                <CardHeader className="pb-2">
                  <CardDescription>Libres</CardDescription>
                  <CardTitle className="text-2xl text-green-500">{stats.libre}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-yellow-500">
                <CardHeader className="pb-2">
                  <CardDescription>Réservées</CardDescription>
                  <CardTitle className="text-2xl text-yellow-500">{stats.reserve}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-blue-500">
                <CardHeader className="pb-2">
                  <CardDescription>Confirmées</CardDescription>
                  <CardTitle className="text-2xl text-blue-500">{stats.confirme}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-purple-500">
                <CardHeader className="pb-2">
                  <CardDescription>Payées</CardDescription>
                  <CardTitle className="text-2xl text-purple-500">{stats.paye}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="vip-gradient">
                <CardHeader className="pb-2">
                  <CardDescription className="text-black/70">CA Total</CardDescription>
                  <CardTitle className="text-2xl text-black">{stats.ca.toLocaleString()} {event.currency}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Résumé Financier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">CA Brut</p>
                    <p className="text-xl font-bold">{stats.ca.toLocaleString()} {event.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Commissions</p>
                    <p className="text-xl font-bold text-red-500">-{stats.commissions.toLocaleString()} {event.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">CA Net</p>
                    <p className="text-xl font-bold text-green-500">{(stats.ca - stats.commissions).toLocaleString()} {event.currency}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tables View */}
        {view === 'tables' && (
          <div className="space-y-6">
            {/* Selectors */}
            <div className="flex gap-4 items-center">
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
                    {eventDays.map(d => (
                      <SelectItem key={d.id} value={d.date}>
                        {format(parseISO(d.date), 'EEEE dd MMM', { locale: fr })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {tables.length === 0 && selectedVenue && selectedDay && (
                <Button onClick={generateTablesForDay} className="mt-6">
                  Générer les tables
                </Button>
              )}
            </div>

            {/* Table Plan */}
            {tables.length > 0 && (
              <div className="bg-card rounded-lg border p-6">
                <div className="flex justify-between items-start">
                  {/* Left Zone */}
                  <div className="flex-1">
                    <h3 className="text-center mb-4 font-semibold">Zone Gauche</h3>
                    <div className="grid grid-cols-2 gap-2">
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

                  {/* DJ Booth */}
                  <div className="mx-8 flex flex-col items-center">
                    <div className="w-32 h-32 bg-gradient-to-b from-primary/50 to-primary/20 rounded-lg flex items-center justify-center border-2 border-primary">
                      <div className="text-center">
                        <div className="text-2xl">🎧</div>
                        <div className="text-xs font-bold mt-1">DJ BOOTH</div>
                      </div>
                    </div>
                  </div>

                  {/* Right Zone */}
                  <div className="flex-1">
                    <h3 className="text-center mb-4 font-semibold">Zone Droite</h3>
                    <div className="grid grid-cols-2 gap-2">
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

                {/* Back Zone */}
                <div className="mt-8">
                  <h3 className="text-center mb-4 font-semibold">Zone Arrière</h3>
                  <div className="flex justify-center gap-2">
                    {getTablesByZone('back').map(table => (
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

                {/* Legend */}
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

            {/* Table Modal */}
            {selectedTable && (
              <TableModal
                table={selectedTable}
                open={showTableModal}
                onClose={() => {
                  setShowTableModal(false)
                  setSelectedTable(null)
                }}
                currency={event.currency}
                onSave={() => {
                  fetchTables()
                  setShowTableModal(false)
                  setSelectedTable(null)
                }}
              />
            )}
          </div>
        )}

        {/* Venues View */}
        {view === 'venues' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Salles</h2>
              <Dialog open={showVenueDialog} onOpenChange={setShowVenueDialog}>
                <DialogTrigger asChild>
                  <Button className="vip-gradient text-black">
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
                        value={venueForm.capacity}
                        onChange={(e) => setVenueForm({...venueForm, capacity: parseInt(e.target.value)})}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVenueDialog(false)}>Annuler</Button>
                    <Button onClick={createVenue} className="vip-gradient text-black">Créer</Button>
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

        {/* Layout View */}
        {view === 'layout' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Configuration du Plan de Tables</h2>
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
            </div>

            {!selectedVenue ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Sélectionnez ou créez une salle d'abord.</p>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {['left', 'right', 'back'].map(zone => (
                    <Card key={zone}>
                      <CardHeader>
                        <CardTitle>Zone {zone === 'left' ? 'Gauche' : zone === 'right' ? 'Droite' : 'Arrière'}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label>Préfixe</Label>
                          <Input
                            value={layoutForm[zone].prefix}
                            onChange={(e) => setLayoutForm({
                              ...layoutForm,
                              [zone]: { ...layoutForm[zone], prefix: e.target.value }
                            })}
                            placeholder="T, B, L..."
                          />
                        </div>
                        <div>
                          <Label>Nombre de tables</Label>
                          <Input
                            type="number"
                            value={layoutForm[zone].count}
                            onChange={(e) => setLayoutForm({
                              ...layoutForm,
                              [zone]: { ...layoutForm[zone], count: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Lignes d'affichage</Label>
                          <Input
                            type="number"
                            value={layoutForm[zone].rows}
                            onChange={(e) => setLayoutForm({
                              ...layoutForm,
                              [zone]: { ...layoutForm[zone], rows: parseInt(e.target.value) || 1 }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Capacité par table</Label>
                          <Input
                            type="number"
                            value={layoutForm[zone].capacity}
                            onChange={(e) => setLayoutForm({
                              ...layoutForm,
                              [zone]: { ...layoutForm[zone], capacity: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                        <div>
                          <Label>Prix standard ({event.currency})</Label>
                          <Input
                            type="number"
                            value={layoutForm[zone].price}
                            onChange={(e) => setLayoutForm({
                              ...layoutForm,
                              [zone]: { ...layoutForm[zone], price: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-4">
                  <Button onClick={saveLayout} className="vip-gradient text-black">
                    Sauvegarder la configuration
                  </Button>
                </div>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle>Prévisualisation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-start p-4 bg-muted rounded-lg">
                      {/* Left Preview */}
                      <div className="flex-1">
                        <p className="text-center text-sm mb-2">Gauche</p>
                        <div className="grid grid-cols-2 gap-1">
                          {Array.from({ length: layoutForm.left.count }).map((_, i) => (
                            <div key={i} className="w-12 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                              {layoutForm.left.prefix}{i + 1}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* DJ */}
                      <div className="mx-4">
                        <div className="w-16 h-16 bg-primary/30 border-2 border-primary rounded flex items-center justify-center">
                          <span className="text-xs">DJ</span>
                        </div>
                      </div>

                      {/* Right Preview */}
                      <div className="flex-1">
                        <p className="text-center text-sm mb-2">Droite</p>
                        <div className="grid grid-cols-2 gap-1">
                          {Array.from({ length: layoutForm.right.count }).map((_, i) => (
                            <div key={i} className="w-12 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                              {layoutForm.right.prefix}{i + 1}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Back Preview */}
                    <div className="mt-4">
                      <p className="text-center text-sm mb-2">Arrière</p>
                      <div className="flex justify-center gap-1">
                        {Array.from({ length: layoutForm.back.count }).map((_, i) => (
                          <div key={i} className="w-12 h-8 bg-green-500/30 border border-green-500 rounded flex items-center justify-center text-xs">
                            {layoutForm.back.prefix}{i + 1}
                          </div>
                        ))}
                      </div>
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

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${getStatusClass(table.status)}`}
    >
      <div className="font-bold text-center">{table.table_number}</div>
      {table.client_name && (
        <div className="text-xs text-center truncate mt-1">{table.client_name}</div>
      )}
      {table.sold_price > 0 && (
        <div className="text-xs text-center text-muted-foreground">
          {table.sold_price.toLocaleString()} {currency}
        </div>
      )}
    </div>
  )
}

// Table Modal Component
function TableModal({ table, open, onClose, currency, onSave }) {
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

  // Calculate derived values
  const beverageBudget = form.sold_price * 0.10
  const commissionAmount = form.sold_price * (form.concierge_commission / 100)
  const totalPrice = form.sold_price + (form.additional_persons * form.additional_person_price) + form.on_site_additional_revenue
  const netAmount = totalPrice - commissionAmount

  const handleSave = async () => {
    setSaving(true)
    try {
      // Auto-update status based on data
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
          {/* Client Info */}
          <div>
            <h3 className="font-semibold mb-3">Informations Client</h3>
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

          {/* Pricing */}
          <div>
            <h3 className="font-semibold mb-3">Tarification</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Prix standard</Label>
                <Input
                  value={table.standard_price}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div>
                <Label>Prix négocié ({currency})</Label>
                <Input
                  type="number"
                  value={form.sold_price}
                  onChange={(e) => setForm({...form, sold_price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Budget boissons (10%)</Label>
                <Input
                  value={beverageBudget.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Concierge */}
          <div>
            <h3 className="font-semibold mb-3">Concierge</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Nom du concierge</Label>
                <Input
                  value={form.concierge_nom}
                  onChange={(e) => setForm({...form, concierge_nom: e.target.value})}
                  placeholder="Nom du concierge"
                />
              </div>
              <div>
                <Label>Commission (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.concierge_commission}
                  onChange={(e) => setForm({...form, concierge_commission: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Montant commission</Label>
                <Input
                  value={commissionAmount.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>

          {/* Additional Persons */}
          <div>
            <h3 className="font-semibold mb-3">Personnes supplémentaires</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nombre de personnes supp.</Label>
                <Input
                  type="number"
                  value={form.additional_persons}
                  onChange={(e) => setForm({...form, additional_persons: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Prix par personne ({currency})</Label>
                <Input
                  type="number"
                  value={form.additional_person_price}
                  onChange={(e) => setForm({...form, additional_person_price: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Personnes ajoutées sur place</Label>
                <Input
                  type="number"
                  value={form.on_site_additional_persons}
                  onChange={(e) => setForm({...form, on_site_additional_persons: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label>Revenus supp. sur place ({currency})</Label>
                <Input
                  type="number"
                  value={form.on_site_additional_revenue}
                  onChange={(e) => setForm({...form, on_site_additional_revenue: parseFloat(e.target.value) || 0})}
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="font-semibold mb-3">Notes</h3>
            <div className="space-y-4">
              <div>
                <Label>Notes staff (internes)</Label>
                <Textarea
                  value={form.staff_notes}
                  onChange={(e) => setForm({...form, staff_notes: e.target.value})}
                  placeholder="Notes internes..."
                />
              </div>
              <div>
                <Label>Précommande boissons</Label>
                <Textarea
                  value={form.drink_preorder}
                  onChange={(e) => setForm({...form, drink_preorder: e.target.value})}
                  placeholder="Préférences boissons du client..."
                />
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-lg">Résumé Financier</CardTitle>
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
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          {form.status !== 'libre' && (
            <Button variant="destructive" onClick={resetTable} disabled={saving}>
              Libérer la table
            </Button>
          )}
          {form.status === 'reserve' && (
            <Button variant="secondary" onClick={confirmTable} disabled={saving}>
              Confirmer réservation
            </Button>
          )}
          {form.status === 'confirme' && (
            <Button className="bg-purple-500 hover:bg-purple-600" onClick={markAsPaid} disabled={saving}>
              Marquer comme payé
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={handleSave} disabled={saving} className="vip-gradient text-black">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sauvegarder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
