"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle } from "lucide-react"

interface DisclaimerPopupProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DisclaimerPopup({ open, onOpenChange }: DisclaimerPopupProps) {
  const [isAgreed, setIsAgreed] = useState(false)

  const handleAgree = () => {
    setIsAgreed(true)
  }

  const handleSaveAndContinue = () => {
    if (isAgreed) {
      // Mark as accepted for this session
      if (typeof window !== "undefined") {
        sessionStorage.setItem("zyradex-disclaimer-accepted", "true")
      }
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl w-[90vw] max-h-[85vh] !p-0 !grid-rows-[auto_1fr_auto] !gap-0"
        showCloseButton={false}
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
            Important Disclaimer
          </DialogTitle>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                This website-hosted user interface (this "Interface") is an open source frontend software portal to the ZyraDex protocol, a decentralized and community-driven collection of blockchain-enabled smart contracts and tools (the "ZyraDex Protocol"). This Interface and the ZyraDex Protocol are made available by the ZyraDex Foundation, however all transactions conducted on the protocol are run by related permissionless smart contracts. As the Interface is open-sourced and the ZyraDex Protocol and its related smart contracts are accessible by any user, entity or third party, there are a number of third party web and mobile user-interfaces that allow for interaction with the ZyraDex Protocol.
              </p>
              
              <p className="font-semibold text-foreground">
                THIS INTERFACE AND THE ZYRADex PROTOCOL ARE PROVIDED "AS IS", AT YOUR OWN RISK, AND WITHOUT WARRANTIES OF ANY KIND. The ZyraDex Foundation does not provide, own, or control the ZyraDex Protocol or any transactions conducted on the protocol or via related smart contracts. By using or accessing this Interface or the ZyraDex Protocol and related smart contracts, you agree that no developer or entity involved in creating, deploying or maintaining this Interface or the ZyraDex Protocol will be liable for any claims or damages whatsoever associated with your use, inability to use, or your interaction with other users of, this Interface or the ZyraDex Protocol, including any direct, indirect, incidental, special, exemplary, punitive or consequential damages, or loss of profits, digital assets, tokens, or anything else of value.
              </p>
              
              <p>
                The ZyraDex Protocol is not available to residents of Belarus, the Central African Republic, The Democratic Republic of Congo, the Democratic People's Republic of Korea, the Crimea, Donetsk People's Republic, and Luhansk People's Republic regions of Ukraine, Cuba, Iran, Libya, Somalia, Sudan, South Sudan, Syria, the USA, Yemen, Zimbabwe and any other jurisdiction in which accessing or using the ZyraDex Protocol is prohibited (the "Prohibited Jurisdictions").
              </p>
              
              <p>
                By using or accessing this Interface, the ZyraDex Protocol, or related smart contracts, you represent that you are not located in, incorporated or established in, or a citizen or resident of the Prohibited Jurisdictions. You also represent that you are not subject to sanctions or otherwise designated on any list of prohibited or restricted parties or excluded or denied persons, including but not limited to the lists maintained by the United States' Department of Treasury's Office of Foreign Assets Control, the United Nations Security Council, the European Union or its Member States, or any other government authority.
              </p>
            </div>
          </ScrollArea>
        </div>
        
        {/* Footer with buttons */}
        <div className="p-6 pt-4 border-t space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="agree-checkbox" 
              checked={isAgreed}
              onCheckedChange={(checked) => setIsAgreed(checked as boolean)}
            />
            <label 
              htmlFor="agree-checkbox" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              I have read and agree to the terms and conditions above
            </label>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={handleAgree}
              variant="outline"
              className="flex-1"
              disabled={isAgreed}
            >
              {isAgreed ? "✓ Agreed" : "I Agree"}
            </Button>
            
            <Button
              onClick={handleSaveAndContinue}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!isAgreed}
            >
              Save to Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
