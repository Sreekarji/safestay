import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface StatsGridProps {
  stats: {
    totalReports: number
    pending?: number
    verified?: number
    resolved?: number
    weeklyTrend?: number
    totalAccommodations?: number
    verifiedReports?: number
    averageSSI?: number
    highRiskCount?: number
    mediumRiskCount?: number
    lowRiskCount?: number
  }
}

const statCards = [
  { key: 'totalReports', icon: FileText, color: 'bg-blue-50 text-blue-600', trendKey: 'dashboard.totalReports' },
  { key: 'pending', icon: Clock, color: 'bg-amber-50 text-amber-600', trendKey: 'dashboard.pending' },
  { key: 'verified', icon: AlertTriangle, color: 'bg-purple-50 text-purple-600', trendKey: 'dashboard.verified' },
  { key: 'resolved', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600', trendKey: 'dashboard.resolved' },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function StatsGrid({ stats }: StatsGridProps) {
  const { t } = useTranslation()
  const trend = stats.weeklyTrend ?? 0

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const value = stats[card.key as keyof typeof stats]
        const isPositive = trend >= 0
        return (
          <motion.div key={card.key} variants={item}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  {trend !== 0 && (
                    <div className="flex items-center gap-1 text-sm">
                      {isPositive ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                      <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>{Math.abs(trend)}%</span>
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-bold text-slate-900">{value}</p>
                  <p className="text-sm text-slate-500 mt-1">{t(card.trendKey)}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )
      })}
    </motion.div>
  )
}
