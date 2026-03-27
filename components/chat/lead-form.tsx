"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { UserCheck, Globe, Phone, Mail, Loader2 } from "lucide-react"

export function LeadForm({ onSubmit, loading, companyName, logoUrl }: { 
  onSubmit: (data: any) => void, 
  loading: boolean,
  companyName: string,
  logoUrl?: string
}) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    country: "",
    city: ""
  })

  const countries = [
    "México", "Colombia", "España", "Argentina", "Chile", "Perú", "Panamá", "Otros"
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl">
      <CardHeader className="text-center">
        {logoUrl && (
          <div className="flex justify-center mb-4">
            <img src={logoUrl} alt={companyName} className="h-16 w-16 object-contain" />
          </div>
        )}
        <CardTitle className="text-2xl font-bold uppercase tracking-wider">{companyName}</CardTitle>
        <CardDescription>
          Para brindarte una atención personalizada, por favor completa tus datos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="full_name">Nombre Completo</Label>
            <div className="relative">
              <UserCheck className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                id="full_name" 
                className="pl-9"
                placeholder="Juan Pérez" 
                required 
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                id="email" 
                type="email"
                className="pl-9"
                placeholder="juan@ejemplo.com" 
                required 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
                <Input 
                  id="phone" 
                  className="pl-9"
                  placeholder="+52..." 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">País</Label>
              <Select onValueChange={(v: string | null) => v && setFormData({...formData, country: v})} required>
                <SelectTrigger id="country">
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Ciudad</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
              <Input 
                id="city" 
                className="pl-9"
                placeholder="Ciudad de México" 
                required 
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
              />
            </div>
          </div>
          <Button type="submit" className="w-full mt-2 py-6 text-lg font-bold uppercase tracking-tight" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Iniciando Chat...
              </>
            ) : (
              "Comenzar Ahora"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
