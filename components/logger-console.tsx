"use client"

import { useLogger } from "@/hooks/use-logger"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

export function LoggerConsole() {
  const { logs, clearLogs } = useLogger()

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {logs.length} {logs.length === 1 ? "log" : "logs"}
        </span>
        <Button variant="ghost" size="sm" onClick={clearLogs}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-2">
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No logs yet. Perform an action to see logs here.
            </p>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="p-3 rounded-lg border border-border bg-card text-sm">
                <div className="flex items-center justify-between mb-1">
                  <Badge
                    variant={log.type === "error" ? "destructive" : log.type === "success" ? "default" : "secondary"}
                  >
                    {log.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
                <p className="text-foreground">{log.message}</p>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
