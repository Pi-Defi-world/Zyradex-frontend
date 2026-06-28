"use client"

import { useEffect, useState } from "react"
import { useTokenMetadataMap } from "@/hooks/useTokenMetadataMap"

const GRADIENTS = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-orange-500 to-red-500",
  "from-green-500 to-emerald-500",
  "from-indigo-500 to-violet-500",
  "from-violet-500 to-fuchsia-500",
]

interface TokenIconProps {
  image?: string | null
  code: string
  issuer?: string | null
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeMap = {
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
}

export function TokenIcon({ image, code, issuer, size = "md", className = "" }: TokenIconProps) {
  const sizeClass = sizeMap[size]
  const gradientIndex = (code || "").charCodeAt(0) % GRADIENTS.length
  const fallback = (code || "").slice(0, 2).toUpperCase()
  const isNative = code === "PI"
  const { lookup, fetchMetadata } = useTokenMetadataMap()

  const existing = !image && !isNative && issuer ? lookup(code, issuer)?.image : undefined
  const [resolvedImage, setResolvedImage] = useState<string | null>(
    image || existing || (isNative ? "/pi.png" : null)
  )

  useEffect(() => {
    if (image) {
      setResolvedImage(image)
      return
    }
    if (isNative) {
      setResolvedImage("/pi.png")
      return
    }
    if (!issuer || !code) return

    const found = lookup(code, issuer)
    if (found?.image) {
      setResolvedImage(found.image)
      return
    }

    let cancelled = false
    fetchMetadata(code, issuer).then((meta) => {
      if (!cancelled && meta?.image) {
        setResolvedImage(meta.image)
      }
    })

    return () => { cancelled = true }
  }, [image, code, issuer, isNative, lookup, fetchMetadata])

  return (
    <span
      className={`${sizeClass} rounded-full inline-flex items-center justify-center shrink-0 overflow-hidden ${isNative && resolvedImage ? "bg-purple-900" : `bg-gradient-to-br ${GRADIENTS[gradientIndex]}`} ${className}`}
    >
      {resolvedImage ? (
        <img
          src={resolvedImage}
          alt={code}
          className="object-contain w-full h-full"
          loading="lazy"
        />
      ) : (
        <span className="text-white font-bold">{fallback}</span>
      )}
    </span>
  )
}
