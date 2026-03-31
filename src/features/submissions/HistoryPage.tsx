import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/contexts/ProfileContext'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

const statutColors: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  soumis: 'bg-blue-100 text-blue-700',
  valide: 'bg-green-100 text-green-700',
  rejete: 'bg-red-100 text-red-700',
}
const statutLabel: Record<string, string> = {
  brouillon: 'Brouillon', soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté',
}

export function HistoryPage() {
  const profile = useProfile()
  const navigate = useNavigate()
  const [submissions, setSubmissions] = useState<any[]>([])
  const [forms, setForms] = useState<{ id: string; nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [filterForm, setFilterForm] = useState('all')
  const [filterStatut, setFilterStatut] = useState('all')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 50

  useEffect(() => {
    supabase.from('forms').select('id, nom').then(({ data }) => setForms(data ?? []))
  }, [])

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    let query = supabase
      .from('submissions')
      .select('id, created_at, statut, user_id, form_id, profiles(first_name, last_name, telephone), forms(nom)')
      .order('created_at', { ascending: sortOrder === 'asc' })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

    // Superviseur : uniquement les soumissions de ses employés
    if (profile.role === 'superviseur') {
      query = query.eq('profiles.parent_id', profile.id)
    }
    if (filterForm !== 'all') query = query.eq('form_id', filterForm)
    if (filterStatut !== 'all') query = query.eq('statut', filterStatut)
    if (filterDateFrom) query = query.gte('created_at', filterDateFrom)
    if (filterDateTo) query = query.lte('created_at', filterDateTo + 'T23:59:59')

    query.then(({ data }) => {
      if (page === 0) setSubmissions(data ?? [])
      else setSubmissions(prev => [...prev, ...(data ?? [])])
      setLoading(false)
    })
  }, [profile, filterForm, filterStatut, filterDateFrom, filterDateTo, sortOrder, page])

  // Reset pagination when filters change
  function applyFilter(fn: () => void) { setPage(0); fn() }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <h2 className="text-lg font-bold">Historique des remontées</h2>

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 h-9"
          placeholder="Rechercher par nom ou téléphone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 bg-white border rounded-md p-3">
        <Select value={filterForm} onValueChange={v => applyFilter(() => setFilterForm(v ?? 'all'))}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <span>{filterForm === 'all' ? 'Tous les formulaires' : (forms.find(f => f.id === filterForm)?.nom ?? filterForm)}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les formulaires</SelectItem>
            {forms.map(f => <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterStatut} onValueChange={v => applyFilter(() => setFilterStatut(v ?? 'all'))}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <span>{{ all: 'Tous les statuts', soumis: 'Soumis', valide: 'Validé', rejete: 'Rejeté', brouillon: 'Brouillon' }[filterStatut] ?? filterStatut}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="soumis">Soumis</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="rejete">Rejeté</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
          </SelectContent>
        </Select>

        <Input type="date" className="h-8 w-36 text-sm"
          value={filterDateFrom}
          onChange={e => applyFilter(() => setFilterDateFrom(e.target.value ?? ''))} />
        <Input type="date" className="h-8 w-36 text-sm"
          value={filterDateTo}
          onChange={e => applyFilter(() => setFilterDateTo(e.target.value ?? ''))} />

        <Select value={sortOrder} onValueChange={v => applyFilter(() => setSortOrder(v as 'desc' | 'asc'))}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <span>{sortOrder === 'desc' ? "Plus récent d'abord" : "Plus ancien d'abord"}</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Plus récent d'abord</SelectItem>
            <SelectItem value="asc">Plus ancien d'abord</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Liste */}
      {loading && page === 0 ? (
        <p className="text-gray-500 text-sm">Chargement...</p>
      ) : submissions.length === 0 ? (
        <p className="text-gray-500 text-sm">Aucune remontée trouvée.</p>
      ) : (
        <div className="divide-y border rounded-md bg-white">
          {submissions.filter(s => {
            if (!search) return true
            const q = search.toLowerCase()
            const name = `${s.profiles?.first_name ?? ''} ${s.profiles?.last_name ?? ''}`.toLowerCase()
            const tel = (s.profiles?.telephone ?? '').toLowerCase()
            return name.includes(q) || tel.includes(q)
          }).map(s => (
            <div key={s.id}
              className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/submissions/${s.id}`)}>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {s.profiles?.first_name} {s.profiles?.last_name}
                  <span className="text-gray-400 text-xs ml-2">{s.profiles?.telephone}</span>
                </p>
                <p className="text-xs text-gray-400">
                  {s.forms?.nom} · {new Date(s.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${statutColors[s.statut ?? 'brouillon']}`}>
                {statutLabel[s.statut ?? 'brouillon']}
              </span>
            </div>
          ))}
        </div>
      )}

      {submissions.length >= PAGE_SIZE * (page + 1) && (
        <Button variant="outline" className="w-full" onClick={() => setPage(p => p + 1)} disabled={loading}>
          {loading ? 'Chargement...' : 'Charger plus'}
        </Button>
      )}
    </div>
  )
}
