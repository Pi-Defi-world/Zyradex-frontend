export default function TradeLoading() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 p-4">
      <div className="container mx-auto animate-pulse space-y-6">
        <div className="h-8 w-24 bg-muted rounded" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-96 bg-card rounded-2xl" />
          <div className="h-96 bg-card rounded-2xl" />
        </div>
      </div>
    </div>
  )
}
