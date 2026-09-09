export default function StakingLoading() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 p-4">
      <div className="container mx-auto max-w-4xl animate-pulse space-y-6">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="h-10 w-48 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2].map((i) => (<div key={i} className="h-48 bg-card rounded-2xl" />))}
        </div>
      </div>
    </div>
  )
}
