import { useTranslation } from 'react-i18next'
import { type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  titleKey: string
  descriptionKey: string
  actionKey?: string
  onAction?: () => void
}

export function EmptyState({ icon: Icon, titleKey, descriptionKey, actionKey, onAction }: EmptyStateProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 mb-4">
        <Icon className="h-8 w-8 text-primary-600" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">
        {t(titleKey)}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {t(descriptionKey)}
      </p>
      {actionKey && onAction && (
        <Button onClick={onAction}>
          {t(actionKey)}
        </Button>
      )}
    </div>
  )
}
