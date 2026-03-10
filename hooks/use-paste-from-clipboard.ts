"use client"

import { useCallback } from "react"
import { useToast } from "@/hooks/use-toast"

interface UsePasteFromClipboardOptions {
  /** Called with trimmed clipboard text on success */
  onPaste: (text: string) => void
  /** Optional success message (default: "Pasted from clipboard") */
  successTitle?: string
  /** Optional label for the pasted content (e.g. "Address") for success description */
  successLabel?: string
}

export function usePasteFromClipboard({
  onPaste,
  successTitle = "Pasted",
  successLabel = "Content",
}: UsePasteFromClipboardOptions) {
  const { toast } = useToast()

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText()
      const trimmed = text?.trim()
      if (trimmed) {
        onPaste(trimmed)
        toast({
          title: successTitle,
          description: successLabel ? `${successLabel} pasted from clipboard.` : "Pasted from clipboard.",
        })
      } else {
        toast({
          title: "Clipboard empty",
          description: "No text found in clipboard.",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Paste failed",
        description: "Could not read clipboard. Check permissions.",
        variant: "destructive",
      })
    }
  }, [onPaste, successTitle, successLabel, toast])

  return { handlePaste }
}
