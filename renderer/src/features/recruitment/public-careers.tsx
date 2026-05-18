import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BriefcaseIcon, MapPinIcon, ClockIcon, SendIcon, UploadIcon, CheckCircleIcon, ArrowLeftIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getPublishedOffers, applyPublic } from './api'

export function PublicCareers() {
  const [selected, setSelected] = useState<any>(null)
  const [showApply, setShowApply] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [form, setForm] = useState({ nom: '', prenom: '', email: '', telephone: '' })

  const { data: offers = [], isLoading } = useQuery({ queryKey: ['public-offers'], queryFn: getPublishedOffers })

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cvFile) { setError('Veuillez joindre votre CV.'); return }
    setLoading(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      fd.append('id_offer', selected.id_offer)
      fd.append('cv', cvFile)
      await applyPublic(fd)
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium text-white/80 transition-all">
              <ArrowLeftIcon className="h-4 w-4" /> Espace RH
            </Link>
            <h1 className="text-2xl font-black tracking-tight">OptiRH <span className="text-primary">Carrières</span></h1>
          </div>
          <p className="text-sm text-white/60">Rejoignez notre équipe</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {!selected ? (
          <>
            <div className="text-center mb-10">
              <h2 className="text-4xl font-bold mb-3">Nos Offres d'Emploi</h2>
              <p className="text-white/60 text-lg">Découvrez nos opportunités et rejoignez une équipe dynamique.</p>
            </div>

            {isLoading && <p className="text-center text-white/60">Chargement des offres...</p>}

            <div className="grid gap-4">
              {offers.map((offer: any) => (
                <Card key={offer.id_offer} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all cursor-pointer" onClick={() => setSelected(offer)}>
                  <CardContent className="p-6 flex items-start justify-between">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">{offer.title}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-white/70">
                        <span className="flex items-center gap-1"><BriefcaseIcon className="h-4 w-4" /> {offer.department}</span>
                        <span className="flex items-center gap-1"><ClockIcon className="h-4 w-4" /> {offer.contract_type}</span>
                        {offer.location && <span className="flex items-center gap-1"><MapPinIcon className="h-4 w-4" /> {offer.location}</span>}
                        {offer.salary && <span className="flex items-center gap-1">💰 {offer.salary}</span>}
                      </div>
                    </div>
                    <Button className="ml-4 bg-primary hover:bg-primary/80 whitespace-nowrap">
                      Voir l'offre →
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {offers.length === 0 && !isLoading && (
                <p className="text-center text-white/60 py-12">Aucune offre disponible actuellement. Revenez bientôt !</p>
              )}
            </div>
          </>
        ) : (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => { setSelected(null); setShowApply(false); setSubmitted(false) }} className="text-white/60 hover:text-white text-sm mb-6 flex items-center gap-1">
              ← Retour aux offres
            </button>

            {!showApply ? (
              <>
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2">{selected.title}</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-white/70 mb-6">
                    <span className="bg-white/10 px-3 py-1 rounded-full">{selected.department}</span>
                    <span className="bg-white/10 px-3 py-1 rounded-full">{selected.contract_type}</span>
                    {selected.location && <span className="bg-white/10 px-3 py-1 rounded-full">📍 {selected.location}</span>}
                    {selected.salary && <span className="bg-white/10 px-3 py-1 rounded-full">💰 {selected.salary}</span>}
                  </div>
                  <div className="bg-white/10 rounded-lg p-6 text-white/90 whitespace-pre-wrap leading-relaxed">
                    {selected.description}
                  </div>
                </div>
                <Button size="lg" className="w-full bg-primary hover:bg-primary/80" onClick={() => setShowApply(true)}>
                  <SendIcon className="mr-2 h-5 w-5" /> Postuler à cette offre
                </Button>
              </>
            ) : submitted ? (
              <div className="text-center py-16">
                <CheckCircleIcon className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Candidature envoyée !</h3>
                <p className="text-white/70 mb-6">Nous avons bien reçu votre candidature pour le poste de <strong>{selected.title}</strong>. Nous vous contacterons prochainement.</p>
                <Button variant="outline" onClick={() => { setSelected(null); setShowApply(false); setSubmitted(false) }}>
                  Voir d'autres offres
                </Button>
              </div>
            ) : (
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-6 text-white">Formulaire de Candidature</h3>
                  <form onSubmit={handleApply} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-white/80">Nom *</label>
                        <input required className="flex h-10 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40" value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-white/80">Prénom *</label>
                        <input required className="flex h-10 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/40" value={form.prenom} onChange={e => setForm({ ...form, prenom: e.target.value })} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Email *</label>
                      <input required type="email" className="flex h-10 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80">Téléphone</label>
                      <input className="flex h-10 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white" value={form.telephone} onChange={e => setForm({ ...form, telephone: e.target.value })} />
                    </div>

                    {/* CV Upload */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-white/80 flex items-center gap-1"><UploadIcon className="h-3 w-3" /> CV (PDF/DOC) *</label>
                      <label className={`flex flex-col items-center justify-center h-24 w-full border-2 border-dashed rounded-md cursor-pointer transition-colors ${cvFile ? 'border-green-400 bg-green-400/10' : 'border-white/30 hover:border-white/50'}`}>
                        <UploadIcon className={`h-6 w-6 mb-1 ${cvFile ? 'text-green-400' : 'text-white/50'}`} />
                        <span className="text-sm text-white/70">{cvFile ? cvFile.name : 'Cliquez pour joindre votre CV'}</span>
                        <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={e => setCvFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <div className="flex gap-3 pt-2">
                      <Button type="button" variant="ghost" className="text-white/60" onClick={() => setShowApply(false)}>Retour</Button>
                      <Button type="submit" className="flex-1 bg-primary hover:bg-primary/80" disabled={loading}>
                        {loading ? 'Envoi en cours...' : 'Envoyer ma Candidature'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
