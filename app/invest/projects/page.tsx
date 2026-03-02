"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2, TrendingUp, PlusCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useUserProfile } from "@/hooks/useUserProfile"
import { listProjects, createProject, type Project } from "@/lib/api/projects"

const STATUS_VARIANT: Record<string, "secondary" | "default" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
}

export default function MyProjectsPage() {
  const { profile, isLoading: profileLoading } = useUserProfile()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    projectId: "",
    projectAppUrl: "",
    description: "",
  })

  const fetchProjects = () => {
    if (!profile) return
    setLoading(true)
    listProjects()
      .then((res) => setProjects(res.data || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!profile) {
      setLoading(false)
      return
    }
    fetchProjects()
  }, [profile])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.projectId.trim() || !form.projectAppUrl.trim()) {
      toast({ title: "Missing fields", description: "Name, project ID, and app URL are required.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      await createProject({
        name: form.name.trim(),
        projectId: form.projectId.trim().toLowerCase().replace(/\s+/g, "-"),
        projectAppUrl: form.projectAppUrl.trim(),
        description: form.description.trim() || undefined,
      })
      toast({ title: "Project registered", description: "Your project is pending approval. An admin must approve it before you can create launches." })
      setForm({ name: "", projectId: "", projectAppUrl: "", description: "" })
      setShowForm(false)
      fetchProjects()
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Failed to register project"
      toast({ title: "Registration failed", description: message, variant: "destructive" })
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
            <h1 className="text-2xl font-bold">My projects</h1>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-4">Sign in with Pi to register a project and see your applications.</p>
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
              My projects
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Register a project to apply for launchpad (IPO). Approved projects can create launches and tokens.
            </p>
          </div>
        </div>

        {showForm ? (
          <Card>
            <CardHeader>
              <CardTitle>Register a project</CardTitle>
              <CardDescription>Submit for approval. Only approved projects can create token launches.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="My App"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID (slug)</Label>
                  <Input
                    id="projectId"
                    value={form.projectId}
                    onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}
                    placeholder="my-app"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Lowercase, no spaces (e.g. my-app). Must be unique.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectAppUrl">App URL</Label>
                  <Input
                    id="projectAppUrl"
                    type="url"
                    value={form.projectAppUrl}
                    onChange={(e) => setForm((f) => ({ ...f, projectAppUrl: e.target.value }))}
                    placeholder="https://myapp.com"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Your product or app URL (PiRC requires a working app).</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Input
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Short description of your project"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit for approval"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button onClick={() => setShowForm(true)} className="mb-4" variant="secondary">
            <PlusCircle className="h-4 w-4 mr-2" />
            Register a project
          </Button>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-sm">
                You have no projects yet. Register a project above; an admin will review and approve it. Once approved, you can create launches from the Create launch page.
              </p>
              <Button asChild variant="outline" className="mt-4">
                <Link href="/invest/create">Create launch</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 mt-4">
            {projects.map((p) => (
              <Card key={p._id}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {p.projectId} · {p.projectAppUrl}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[p.status] ?? "outline"}>{p.status}</Badge>
                  </div>
                  {p.description && <p className="text-sm text-muted-foreground mt-2">{p.description}</p>}
                  {p.status === "pending" && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">Waiting for admin approval. Once approved, you can create launches.</p>
                  )}
                  {p.status === "approved" && (
                    <Button asChild size="sm" variant="link" className="mt-2 px-0">
                      <Link href="/invest/create">Create launch</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
