export default function SwapLoading() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 p-4">
      <div className="container mx-auto max-w-md">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-80 bg-card rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
