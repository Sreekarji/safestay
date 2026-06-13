import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AIVerdict } from '@/components/reports/AIVerdict';
import { cn, formatDate, getSeverityColor, getStatusColor, getSSIColor, getSSILabel } from '@/lib/utils';
import type { Report, AIVerdict as AIVerdictType } from '@/types';

const mockReport: Report & { aiVerdict: AIVerdictType[] } = {
  id: '1', title: 'Harassment near Gachibowli hostel entrance',
  description: 'Multiple students have reported being harassed by unknown individuals near the main entrance of the Gachibowli hostel complex during evening hours (7-9 PM). The incidents involve verbal abuse and intimidation. Several female students feel unsafe walking to the hostel after classes. The area lacks proper lighting and CCTV coverage.',
  category: 'harassment', severity: 'high', status: 'verified', location: 'Gachibowli Hostel Main Gate, Hyderabad',
  accommodation: { id: '1', name: 'Gachibowli Hostel', area: 'Gachibowli', address: 'Gachibowli', ssi: 82, totalReports: 12, verifiedReports: 8, coordinates: { lat: 17.44, lng: 78.35 } },
  images: [], aiVerdict: [
    { model: 'Mistral Pixtral', verdict: 'authentic', confidence: 92, analysis: 'Consistent details with verified incident patterns. Multiple corroborating data points.' },
    { model: 'Groq Llama', verdict: 'authentic', confidence: 88, analysis: 'Cross-referencing shows alignment with known harassment patterns.' },
    { model: 'Gemini Flash', verdict: 'suspicious', confidence: 71, analysis: 'Some inconsistencies in timing. Core claims align with area intelligence.' },
  ],
  ssiImpact: { before: 85, after: 82 },
  reporter: { id: '1', name: 'Priya S.', email: 'priya@example.com', phone: '9876543210', role: 'student', createdAt: '2025-01-01' },
  createdAt: '2025-01-10T10:30:00Z', updatedAt: '2025-01-11T14:20:00Z',
};

export function ReportDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const report = mockReport;
  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Reports</Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary">{report.category}</Badge>
              <Badge className={getSeverityColor(report.severity)}>{report.severity}</Badge>
              <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
          <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{report.location}</span>
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(report.createdAt)}</span>
          <span className="flex items-center gap-1"><User className="h-4 w-4" />{report.reporter.name}</span>
        </div>
        <Card className="mb-6"><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p className="text-slate-700 leading-relaxed">{report.description}</p></CardContent></Card>
        <div className="mb-6"><AIVerdict verdicts={report.aiVerdict} /></div>
        <Card className="mb-6">
          <CardHeader><CardTitle>Safety Score Impact</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">Before</p><p className="text-3xl font-bold" style={{ color: getSSIColor(report.ssiImpact.before) }}>{report.ssiImpact.before}</p><p className="text-xs text-slate-400">{getSSILabel(report.ssiImpact.before)}</p></div>
              <div className="text-2xl text-slate-300">→</div>
              <div className="text-center"><p className="text-sm text-slate-500 mb-1">After</p><p className="text-3xl font-bold" style={{ color: getSSIColor(report.ssiImpact.after) }}>{report.ssiImpact.after}</p><p className="text-xs text-slate-400">{getSSILabel(report.ssiImpact.after)}</p></div>
            </div>
            <div className="mt-4 max-w-xs mx-auto"><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: report.ssiImpact.after + '%', backgroundColor: getSSIColor(report.ssiImpact.after) }} /></div></div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
