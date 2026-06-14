import { useTranslation } from 'react-i18next';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface DataPoint {
  day: string;
  reports: number;
}

interface RiskChartProps {
  data?: DataPoint[];
}

export function RiskChart({ data }: RiskChartProps) {
  const { t } = useTranslation();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.reportsOverTime')}</CardTitle>
          <CardDescription>{t('dashboard.last7Days')}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400 text-center py-8">No report data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>{t('dashboard.reportsOverTime')}</CardTitle><CardDescription>{t('dashboard.last7Days')}</CardDescription></CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs><linearGradient id="colorReports" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94A3B8' }} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
              <Area type="monotone" dataKey="reports" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorReports)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
