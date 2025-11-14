"use client"

import React, { useEffect } from "react"
import { usePasskeyManagement, usePasskeyRegistration } from "@/hooks/usePasskey"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Shield, Trash2, Plus, AlertCircle } from "lucide-react"
import { isWebAuthnSupported } from "@/lib/passkey/webauthn"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"

const PasskeysPage: React.FC = () => {
  const { passkeys, isLoading, error, refresh, deletePasskeyById } = usePasskeyManagement()
  const { register: registerPasskey, isLoading: registeringPasskey } = usePasskeyRegistration()
  const { toast } = useToast()
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const webAuthnSupported = isWebAuthnSupported()

  useEffect(() => {
    refresh()
  }, [refresh])

  const handleDelete = async (credentialId: string) => {
    try {
      await deletePasskeyById(credentialId)
      toast({
        title: "Success",
        description: "Passkey deleted successfully",
      })
      setDeletingId(null)
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to delete passkey"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  const handleAddPasskey = async () => {
    try {
      await registerPasskey()
      await refresh()
      toast({
        title: "Success",
        description: "New passkey registered successfully",
      })
    } catch (err) {
      const message = err && typeof err === "object" && "message" in err ? (err as any).message : "Failed to register passkey"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen premium-gradient pt-16 pb-20 p-3 sm:p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Passkeys</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Manage Passkeys
            </CardTitle>
            <CardDescription>
              Passkeys allow you to sign transactions without entering your secret key.
              Each device can have its own passkey.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!webAuthnSupported && (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-400 text-sm flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">WebAuthn not supported</p>
                  <p className="text-xs mt-1">
                    Your browser does not support WebAuthn (Passkeys). You can use PIN/password authentication instead.
                    Import your account to set up PIN/password authentication.
                  </p>
                </div>
              </div>
            )}
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error.message}
              </div>
            )}

            <Button
              onClick={handleAddPasskey}
              disabled={registeringPasskey || !webAuthnSupported}
              className="w-full"
            >
              {registeringPasskey ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Passkey
                </>
              )}
            </Button>

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : passkeys.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No passkeys registered yet.</p>
                <p className="text-sm mt-2">Add a passkey to enable passwordless transactions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.credentialId}
                    className="p-4 rounded-lg border bg-card space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{passkey.deviceName}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <div>Registered: {format(new Date(passkey.createdAt), "MMM d, yyyy")}</div>
                          {passkey.lastUsedAt && (
                            <div>Last used: {format(new Date(passkey.lastUsedAt), "MMM d, yyyy 'at' h:mm a")}</div>
                          )}
                        </div>
                      </div>
                      {passkeys.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeletingId(passkey.credentialId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deletingId !== null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Passkey?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this passkey? You will need to register a new one
              on this device to use passkey authentication again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingId && handleDelete(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default PasskeysPage

