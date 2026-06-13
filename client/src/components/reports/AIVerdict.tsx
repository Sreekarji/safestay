import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Brain, CheckCircle2, AlertTriangle, XCircle, Volume2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { AIVerdict as AIVerdictType } from '@/types';
interface Props { verdicts: AIVerdictType[]; }
const icons: any = { authentic: CheckCircle2, suspicious: AlertTriangle, fake: XCircle };
const colors: any = { authentic: 'text-emerald-600 bg-emerald-50 border-emerald-200', suspicious: 'text-amber-600 bg-amber-50 border-amber-200', fake: 'text-red-600 bg-red-50 border-red-200' };
export function AIVerdict({ verdicts }: Props) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const consensus: any = {};
  verdicts.forEach((v) => { consensus[v.verdict] = (consensus[v.verdict] || 0) + 1; });
  const top = Object.entries(consensus).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'authentic';
  const avg = Math.round(verdicts.reduce((s, v) => s + v.confidence, 0) / verdicts.length);
  return (
    <Card className="border-primary-100">
      <CardHeader><CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5 text-primary-600" />{t('ai.analysis')}</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
          {verdicts.map((v, i) => { const Icon = icons[v.verdict]; return (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }} className="rounded-lg border border-slate-200 p-4">
              <p className="text-xs font-medium text-slate-500 mb-2">{v.model}</p>
              <div className="flex items-center gap-2 mb-3"><Icon className={`h-5 w-5 ${colors[v.verdict].split(' ')[0]}`} /><Badge className={colors[v.verdict]}>{t(`ai.${v.verdict}`)}</Badge></div>
              <div className="relative h-2 rounded-full bg-slate-100 overflow-hidden"><div className={`absolute left-0 top-0 h-full rounded-full ${v.verdict === 'authentic' ? 'bg-emerald-500' : v.verdict === 'suspicious' ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${v.confidence}%` }} /></div>
              <p className="text-xs text-slate-500 mt-1">{v.confidence}% {t('ai.confidence')}</p>
            </motion.div>
          ); })}
        </div>
        <div className="rounded-lg bg-slate-50 p-4 mb-4">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-slate-700">{t('ai.consensus')}</span><Badge className={colors[top]}>{t(`ai.${top}`)}</Badge></div>
          <div className="relative h-3 rounded-full bg-slate-200 overflow-hidden"><div className="absolute left-0 top-0 h-full rounded-full bg-primary-600" style={{ width: `${avg}%` }} /></div>
          <p className="text-xs text-slate-500 mt-1">{avg}% overall confidence</p>
        </div>
        <Button variant="outline" size="sm" className="mb-4"><Volume2 className="h-4 w-4 mr-2" />{t('ai.listen')}</Button>
        <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-sm text-primary-600 font-medium">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}{expanded ? t('ai.showLess') : t('ai.showMore')}
        </button>
        {expanded && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 space-y-3">
          {verdicts.map((v, i) => <div key={i} className="rounded-lg border border-slate-100 p-3"><p className="text-xs font-medium text-slate-500 mb-1">{v.model}</p><p className="text-sm text-slate-700">{v.analysis}</p></div>)}
        </motion.div>}
        <p className="text-xs text-slate-400 mt-4">{t('ai.poweredBy')}</p>
      </CardContent>
    </Card>
  );
}
