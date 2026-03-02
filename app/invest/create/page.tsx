"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { listProjects, type Project } from "@/lib/api/projects"
import { createLaunchWithToken } from "@/lib/api/launchpad"

export default function CreateLaunchPage() {
  const { profile, isLoading: profileLoading } = useUserProfile()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    projectRef: "",
    T_available: "",
    stakeDurationDays: "30",
    assetCode: "",
    totalSupply: "",
    name: "",
    description: "",
    distributorSecret: "",
    homeDomain: "",
  })

  useEffect(() => {
    if (!profile) return
    listProjects()
      .then((res) => {
        const approved = (res.data || []).filter((p) => p.status === "approved")
        setProjects(approved)
      })
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false))
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.projectRef || !form.T_available || !form.assetCode || !form.totalSupply || !form.name || !form.description || !form.distributorSecret.trim()) {
      toast({ title: "Missing fields", description: "Fill all required fields.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await createLaunchWithToken({
        projectRef: form.projectRef,
        T_available: form.T_available,
        stakeDurationDays: form.stakeDurationDays ? Number(form.stakeDurationDays) : 30,
        assetCode: form.assetCode.trim(),
        totalSupply: form.totalSupply.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        distributorSecret: form.distributorSecret.trim(),
        homeDomain: form.homeDomain.trim() || undefined,
      })
      toast({ title: "Launch created", description: "Token and launch were created. Open the launch to continue the IPO flow." })
      setForm((f) => ({ ...f, distributorSecret: "" }))
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to create launch"
      toast({ title: "Create failed", description: message, variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20 flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen premium-gradient pt-16 pb-20">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/invest">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Create launch (IPO)</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">Sign in with Pi to create a launch and see your approved projects.</p>
              <Button asChild>
                <Link href="/profile">Go to profile / Sign in</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/invest">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp className="h-7 w-7" />
              Create launch (IPO)
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Create a token and launch in one step. Your project must be approved.
            </p>
          </div>
        </div>

        {loadingProjects ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                You have no approved projects. Register a project and an admin will approve it; then you can create launches here.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button asChild>
                  <Link href="/invest/projects">Register a project</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/invest">Back to Invest</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>New launch with token</CardTitle>
              <CardDescription>Token will be created and linked to this launch. Your wallet (distributor) will hold the supply.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Project</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={form.projectRef}
                    onChange={(e) => setForm((f) => ({ ...f, projectRef: e.target.value }))}
                    required
                  >
                    <option value="">Select approved project</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.projectId})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetCode">Token code</Label>
                    <Input
                      id="assetCode"
                      value={form.assetCode}
                      onChange={(e) => setForm((f) => ({ ...f, assetCode: e.target.value }))}
                      placeholder="MYTOKEN"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="totalSupply">Total supply</Label>
                    <Input
                      id="totalSupply"
                      value={form.totalSupply}
                      onChange={(e) => setForm((f) => ({ ...f, totalSupply: e.target.value }))}
                      placeholder="1000000"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Token name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="My Project Token"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Token description</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Utility token for My Project"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="T_available">T_available (tokens for IPO)</Label>
                  <Input
                    id="T_available"
                    value={form.T_available}
                    onChange={(e) => setForm((f) => ({ ...f, T_available: e.target.value }))}
                    placeholder="500000"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Amount of tokens allocated to this launch (sold + LP).</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stakeDurationDays">Stake duration (days)</Label>
                    <Input
                      id="stakeDurationDays"
                      type="number"
                      value={form.stakeDurationDays}
                      onChange={(e) => setForm((f) => ({ ...f, stakeDurationDays: e.target.value }))}
                      placeholder="30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="homeDomain">Home domain (optional)</Label>
                    <Input
                      id="homeDomain"
                      value={form.homeDomain}
                      onChange={(e) => setForm((f) => ({ ...f, homeDomain: e.target.value }))}
                      placeholder="https://myproject.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distributorSecret">Distributor secret (wallet that receives supply)</Label>
                  <Input
                    id="distributorSecret"
                    type="password"
                    value={form.distributorSecret}
                    onChange={(e) => setForm((f) => ({ ...f, distributorSecret: e.target.value }))}
                    placeholder="S..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">Your project wallet secret. Supply will be sent to this keypair.</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create launch & token"}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/invest">Cancel</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
