export default function Loading() {
  return (
    <div className="min-h-screen premium-gradient pt-24 pb-24 lg:pb-6 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading ZyraDex...</p>
      </div>
    </div>
  )
}
