import Image from 'next/image'

type LogoMarkProps = {
  size?: number
  width?: number
  height?: number
  className?: string
  priority?: boolean
}

export function LogoMark({ size = 40, width, height, className, priority = false }: LogoMarkProps) {
  return (
    <Image
      src="/assets/logo-hmte.svg"
      alt="Logo HMTE TRE SV UGM"
      width={width ?? size}
      height={height ?? size}
      className={className}
      priority={priority}
    />
  )
}
