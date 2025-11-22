import * as React from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from './card'

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}

export function Empty({ icon, title, description, action, className, ...props }: EmptyProps) {
  return (
    <Card className={cn('border-dashed', className)} {...props}>
      <CardContent className="flex flex-col items-center justify-center p-12 text-center">
        {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
        {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
        {action && <div className="mt-2">{action}</div>}
      </CardContent>
    </Card>
  )
}
