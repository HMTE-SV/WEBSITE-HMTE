'use client'

import Image from 'next/image'
import { useMediaSlot } from '@/components/site/MediaSlotProvider'

type LogoMarkProps = {
  size?: number
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function LogoMark({ size = 40, width, height, className, priority = false }: LogoMarkProps) {
  const logo = useMediaSlot('brand.logo.primary')

  return (
    <Image
      src={logo.url}
      alt={logo.alt}
      width={width ?? size}
      height={height ?? size}
      className={className}
      priority={priority}
    />
  )
}
