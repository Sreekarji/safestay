import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, MapPin, Calendar, User, Loader2, ThumbsUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AIVerdict } from '@/components/reports/AIVerdict';
import { cn, formatDate, getSeverityColor, getStatusColor, getSSIColor, getSSILabel } from '@/lib/utils';
import { useReportStore } from '@/stores/reportStore';
import type { Report } from '@/types';

const categoryLabels: Record<string, string> = {
  fire_safety: 'Fire Safety', water_quality: 'Water Quality', structural: 'Structural',
  electrical: 'Electrical', hygiene: 'Hygiene', security: 'Security',
  food_safety: 'Food Safety', other: 'Other',
};

export function ReportDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentReport: report, loading, fetchReport } = useReportStore();

  useEffect(() => {
    if (id) fetchReport(id);
  }, [id, fetchReport]);

  if (loading) return <div className="flex flex-col items-center justify-center h-64 gap-3" aria-live="polite"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /><span className="text-sm text-slate-500">Loading...</span></div>;
  if (!report) return (
    <div className="p-6 text-center text-slate-500">
      <p className="mb-4">Report not found</p>
      <div className="flex items-center justify-center gap-3">
        <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="ghost" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    </div>
  );

  const accommodation = typeof report.accommodationId === 'object' ? report.accommodationId : null;
  const reporter = typeof report.userId === 'object' ? report.userId : null;
  const severityLabel = report.severity <= 3 ? 'Low' : report.severity <= 6 ? 'Medium' : report.severity <= 8 ? 'High' : 'Critical';
  const severityColor = report.severity <= 3 ? 'text-emerald-600 bg-emerald-50' : report.severity <= 6 ? 'text-amber-600 bg-amber-50' : report.severity <= 8 ? 'text-orange-600 bg-orange-50' : 'text-red-600 bg-red-50';

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Button>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{report.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary">{categoryLabels[report.category] || report.category}</Badge>
              <Badge className={severityColor}>{severityLabel} ({report.severity}/10)</Badge>
              <Badge className={getStatusColor(report.status)}>{report.status}</Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <ThumbsUp className="h-4 w-4" /> {report.upvotes || 0} upvotes
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 mb-6">
          {accommodation && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{accommodation.name}, {accommodation.area}</span>}
          <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(report.createdAt)}</span>
          {reporter && <span className="flex items-center gap-1"><User className="h-4 w-4" />{report.isAnonymous ? 'Anonymous' : reporter.name}</span>}
        </div>

        <Card className="mb-6"><CardHeader><CardTitle>Description</CardTitle></CardHeader><CardContent><p className="text-slate-700 leading-relaxed">{report.description}</p></CardContent></Card>

        {report.images && report.images.length > 0 && (
          <Card className="mb-6"><CardHeader><CardTitle>Evidence</CardTitle></CardHeader>
            <CardContent><div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {report.images.map((img, i) => <img key={i} src={img} alt={`Evidence photo ${i + 1} for report: ${report.title}`} className="rounded-lg object-cover h-40 w-full" />)}
            </div></CardContent>
          </Card>
        )}

        {report.aiVerification && (report.aiVerification.mistral || report.aiVerification.groq || report.aiVerification.gemini) && (
          <div className="mb-6">
            <AIVerdict
              verdicts={[
                report.aiVerification.mistral && { model: 'Mistral Pixtral', verdict: report.aiVerification.mistral.verdict === 'accept' ? 'authentic' : report.aiVerification.mistral.verdict === 'reject' ? 'fake' : 'suspicious', confidence: Math.round((report.aiVerification.mistral.confidence || 0) * 100), analysis: report.aiVerification.mistral.reasoning },
                report.aiVerification.groq && { model: 'Groq Llama', verdict: report.aiVerification.groq.verdict === 'accept' ? 'authentic' : report.aiVerification.groq.verdict === 'reject' ? 'fake' : 'suspicious', confidence: Math.round((report.aiVerification.groq.confidence || 0) * 100), analysis: report.aiVerification.groq.reasoning },
                report.aiVerification.gemini && { model: 'Gemini Flash', verdict: report.aiVerification.gemini.verdict === 'accept' ? 'authentic' : report.aiVerification.gemini.verdict === 'reject' ? 'fake' : 'suspicious', confidence: Math.round((report.aiVerification.gemini.confidence || 0) * 100), analysis: report.aiVerification.gemini.reasoning },
              ].filter(Boolean) as any}
            />
            <p className="mt-2 text-sm text-slate-500 text-center">
              Consensus: <span className="font-semibold">{report.aiVerification.consensus}</span>
              {report.aiVerification.overallConfidence != null && <> ({Math.round(report.aiVerification.overallConfidence * 100)}% confidence)</>}
            </p>
          </div>
        )}

        {accommodation && (
          <Card className="mb-6">
            <CardHeader><CardTitle>Safety Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-4xl font-bold" style={{ color: getSSIColor(accommodation.ssi) }}>{accommodation.ssi}</p>
                <p className="text-sm text-slate-500">{getSSILabel(accommodation.ssi)}</p>
              </div>
              <div className="mt-4 max-w-xs mx-auto"><div className="h-3 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full" style={{ width: accommodation.ssi + '%', backgroundColor: getSSIColor(accommodation.ssi) }} /></div></div>
            </CardContent>
          </Card>
        )}

        {(report.ownerResponse || report.resolution) && (
          <Card className="mb-6 border-l-4 border-blue-500">
            <CardHeader><CardTitle>Owner Response</CardTitle></CardHeader>
            <CardContent>
              <p className="text-slate-700">{report.ownerResponse?.response || report.resolution?.description}</p>
              {(report.ownerResponse?.proofImages?.length > 0 || report.resolution?.images?.length > 0) && (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {(report.ownerResponse?.proofImages || report.resolution?.images || []).map((img, i) => <img key={i} src={img} alt={`Owner response proof photo ${i + 1}`} className="rounded-lg h-24 w-full object-cover" />)}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
