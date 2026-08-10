export default function EarnLoading() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 p-4">
      <div className="container mx-auto animate-pulse space-y-6">
        <div className="h-8 w-20 bg-muted rounded" />
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-card rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
