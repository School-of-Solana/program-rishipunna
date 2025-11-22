'use client'

import type { ReactNode } from 'react'
import React, { createContext, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import type {
  GlobalOptions as ConfettiGlobalOptions,
  CreateTypes as ConfettiInstance,
  Options as ConfettiOptions,
} from 'canvas-confetti'
import confetti from 'canvas-confetti'

import { Button } from '@/components/ui/button'

type Api = {
  fire: (options?: ConfettiOptions) => void
}

type Props = React.ComponentPropsWithRef<'canvas'> & {
  options?: ConfettiOptions
  globalOptions?: ConfettiGlobalOptions
  manualstart?: boolean
  children?: ReactNode
}

export type ConfettiRef = Api | null

const ConfettiContext = createContext<Api>({} as Api)

// Define component first
const ConfettiComponent = forwardRef<ConfettiRef, Props>((props, ref) => {
  const { options, globalOptions = { resize: true, useWorker: true }, manualstart = false, children, ...rest } = props
  const instanceRef = useRef<ConfettiInstance | null>(null)

  const canvasRef = useCallback(
    (node: HTMLCanvasElement) => {
      if (node !== null) {
        if (instanceRef.current) return
        instanceRef.current = confetti.create(node, {
          ...globalOptions,
          resize: true,
        })
      } else {
        if (instanceRef.current) {
          instanceRef.current.reset()
          instanceRef.current = null
        }
      }
    },
    [globalOptions],
  )

  const fire = useCallback(
    async (opts = {}) => {
      try {
        await instanceRef.current?.({ ...options, ...opts })
      } catch (error) {
        console.error('Confetti error:', error)
      }
    },
    [options],
  )

  const api = useMemo(
    () => ({
      fire,
    }),
    [fire],
  )

  useImperativeHandle(ref, () => api, [api])

  useEffect(() => {
    if (!manualstart) {
      ;(async () => {
        try {
          await fire()
        } catch (error) {
          console.error('Confetti effect error:', error)
        }
      })()
    }
  }, [manualstart, fire])

  return (
    <ConfettiContext.Provider value={api}>
      <canvas ref={canvasRef} {...rest} />
      {children}
    </ConfettiContext.Provider>
  )
})

// Set display name immediately
ConfettiComponent.displayName = 'Confetti'

// Export as Confetti
export const Confetti = ConfettiComponent

interface ConfettiButtonProps extends React.ComponentProps<'button'> {
  options?: ConfettiOptions & ConfettiGlobalOptions & { canvas?: HTMLCanvasElement }
}

const ConfettiButtonComponent = ({ options, children, ...props }: ConfettiButtonProps) => {
  const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      const rect = event.currentTarget.getBoundingClientRect()
      const x = rect.left + rect.width / 2
      const y = rect.top + rect.height / 2
      await confetti({
        ...options,
        origin: {
          x: x / window.innerWidth,
          y: y / window.innerHeight,
        },
      })
    } catch (error) {
      console.error('Confetti button error:', error)
    }
  }

  return (
    <Button onClick={handleClick} {...props}>
      {children}
    </Button>
  )
}

ConfettiButtonComponent.displayName = 'ConfettiButton'

export const ConfettiButton = ConfettiButtonComponent

export function ConfettiSideCannons() {
  return null // This component doesn't render anything, it just fires confetti
}

// Hook version that can be called programmatically
export function useConfettiSideCannons() {
  const fire = () => {
    const end = Date.now() + 3 * 1000 // 3 seconds
    const colors = ['#a786ff', '#fd8bbc', '#eca184', '#f8deb1']

    const frame = () => {
      if (Date.now() > end) return

      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        startVelocity: 60,
        origin: { x: 0, y: 0.5 },
        colors: colors,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        startVelocity: 60,
        origin: { x: 1, y: 0.5 },
        colors: colors,
      })

      requestAnimationFrame(frame)
    }

    frame()
  }

  return { fire }
}

export function ConfettiEmoji() {
  const handleClick = () => {
    const scalar = 2
    const cryingEmoji = confetti.shapeFromText({ text: '😭', scalar })

    const defaults = {
      spread: 360,
      ticks: 60,
      gravity: 0,
      decay: 0.96,
      startVelocity: 20,
      shapes: [cryingEmoji],
      scalar,
    }

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 30,
      })

      confetti({
        ...defaults,
        particleCount: 5,
      })

      confetti({
        ...defaults,
        particleCount: 15,
        scalar: scalar / 2,
        shapes: ['circle'],
      })
    }

    setTimeout(shoot, 0)
    setTimeout(shoot, 100)
    setTimeout(shoot, 200)
  }

  return (
    <div className="relative justify-center">
      <Button onClick={handleClick}>Trigger Emoji</Button>
    </div>
  )
}

// Hook version for programmatic use
export function useConfettiEmoji() {
  const fire = () => {
    const scalar = 2 // Increased from 2 to 4 for bigger emojis
    const cryingEmoji = confetti.shapeFromText({ text: '😭', scalar })

    const defaults = {
      spread: 360,
      ticks: 120, // Increased from 60 to 120 for longer duration
      gravity: 0.3, // Added gravity to make them fall slowly
      decay: 0.92, // Reduced from 0.96 for slower decay
      startVelocity: 15, // Reduced from 20 for slower initial speed
      shapes: [cryingEmoji],
      scalar,
      flat: true,
    }

    const shoot = () => {
      confetti({
        ...defaults,
        particleCount: 10, // Reduced from 30
      })

      confetti({
        ...defaults,
        particleCount: 3, // Reduced from 5
      })

      confetti({
        ...defaults,
        particleCount: 5, // Reduced from 15
        scalar: scalar / 2,
        shapes: ['circle'],
      })
    }

    setTimeout(shoot, 0)
    setTimeout(shoot, 150) // Increased delay from 100 to 150
    setTimeout(shoot, 300) // Increased delay from 200 to 300
  }

  return { fire }
}
