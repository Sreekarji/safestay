import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  PenLine,
  Brain,
  ShieldCheck,
  BarChart3,
  Globe,
  Volume2,
  MapPin,
  Zap,
  ArrowRight,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import api from '@/services/api';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export function Landing() {
  const { t } = useTranslation();
  const [statsLoading, setStatsLoading] = useState(true);
  const [liveStats, setLiveStats] = useState<{ accommodations: number; reports: number; cities: number } | null>(null);

  useEffect(() => {
    api.get('/admin/stats')
      .then((res) => {
        const d = res.data?.data || res.data;
        if (d) {
          setLiveStats({
            accommodations: d.totalAccommodations ?? d.accommodations ?? null,
            reports: d.totalReports ?? d.reports ?? null,
            cities: d.totalCities ?? d.cities ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const stats = [
    { value: statsLoading ? '...' : liveStats?.accommodations ? `${liveStats.accommodations}+` : '500+', label: t('landing.stat1') },
    { value: statsLoading ? '...' : liveStats?.reports ? `${(liveStats.reports / 1000).toFixed(0)}K+` : '10K+', label: t('landing.stat2') },
    { value: '3', label: t('landing.stat3') },
    { value: statsLoading ? '...' : liveStats?.cities ? `${liveStats.cities}+` : '15+', label: t('landing.stat4') },
  ];

  const steps = [
    { num: 1, icon: PenLine, title: t('landing.step1Title'), desc: t('landing.step1Desc') },
    { num: 2, icon: Brain, title: t('landing.step2Title'), desc: t('landing.step2Desc') },
    { num: 3, icon: ShieldCheck, title: t('landing.step3Title'), desc: t('landing.step3Desc') },
  ];

  const features = [
    { icon: Brain, title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
    { icon: BarChart3, title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
    { icon: Globe, title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
    { icon: Volume2, title: t('landing.feature4Title'), desc: t('landing.feature4Desc') },
    { icon: MapPin, title: t('landing.feature5Title'), desc: t('landing.feature5Desc') },
    { icon: Zap, title: t('landing.feature6Title'), desc: t('landing.feature6Desc') },
  ];

  return (
    <div className="bg-canvas dark:bg-[#0a0a0a]">
      {/* ── Announcement Banner ─────────────────────────── */}
      <div className="relative z-10 flex justify-center pt-20 pb-4">
        <Link
          to="/register"
          className="inline-flex items-center gap-2 rounded-full bg-canvas-soft dark:bg-[#1a1a1a] border border-hairline dark:border-[#333333] px-4 py-1.5 text-xs font-medium text-body dark:text-[#888888] hover:border-hairline-strong dark:hover:border-[#555555] transition-colors"
        >
          <Sparkles className="h-3 w-3" />
          Introducing SafeStay — AI-powered safety for students
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      {/* ── Hero Section ────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Mesh gradient backdrop */}
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        <div className="absolute inset-0 grid-pattern opacity-40" />

        <div className="relative mx-auto max-w-[1400px] px-6 pt-16 pb-32 lg:pt-24 lg:pb-40">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="max-w-3xl"
          >
            <motion.h1
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-[-0.04em] leading-[1.1] text-ink dark:text-white"
            >
              {t('landing.hero')}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
              className="mt-6 text-lg sm:text-xl text-body dark:text-[#888888] max-w-xl leading-relaxed"
            >
              {t('landing.heroSub')}
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }} className="mt-10 flex flex-wrap gap-3">
              <Link to="/register">
                <Button size="lg" className="h-12 px-6 text-base">
                  {t('landing.getStarted')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="h-12 px-6 text-base">
                  {t('landing.viewMap')}
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Decorative mesh orbs */}
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#007cf0]/10 via-[#7928ca]/8 to-[#ff0080]/6 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -translate-x-1/2 translate-y-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-[#50e3c2]/10 to-[#007cf0]/8 blur-3xl pointer-events-none" />
        </div>
      </section>

      {/* ── Stats Strip ─────────────────────────────────── */}
      <section className="relative z-10 -mt-12 mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <Card className="p-5 text-center card-shadow-3 hover:card-shadow-4 transition-shadow">
                <p className="text-2xl font-semibold text-ink dark:text-white tracking-tight">{s.value}</p>
                <p className="text-xs text-body dark:text-[#888888] mt-1 font-medium">{s.label}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────── */}
      <section className="py-24 sm:py-32 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mute dark:text-[#666666] font-mono">
              How it works
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
              {t('landing.howItWorks')}
            </h2>
          </motion.div>
          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <Card className="p-8 h-full card-shadow-2 hover:card-shadow-3 transition-all group">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-canvas-soft dark:bg-[#1a1a1a] border border-hairline dark:border-[#333333] group-hover:border-ink/20 dark:group-hover:border-white/20 transition-colors">
                      <s.icon className="h-5 w-5 text-ink dark:text-white" />
                    </div>
                    <span className="text-[11px] font-mono font-medium text-mute dark:text-[#666666] uppercase tracking-wider">
                      Step {s.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink dark:text-white mb-2 tracking-tight">
                    {s.title}
                  </h3>
                  <p className="text-sm text-body dark:text-[#888888] leading-relaxed">
                    {s.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ───────────────────────────────── */}
      <section className="py-24 sm:py-32 px-6 bg-canvas-soft dark:bg-[#111111]">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-[11px] font-medium uppercase tracking-wider text-mute dark:text-[#666666] font-mono">
              Features
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-ink dark:text-white">
              {t('landing.features')}
            </h2>
          </motion.div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Card className="p-6 h-full card-shadow-1 hover:card-shadow-2 transition-all group">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-canvas dark:bg-[#1a1a1a] border border-hairline dark:border-[#333333] group-hover:border-ink/20 dark:group-hover:border-white/20 transition-colors">
                    <f.icon className="h-5 w-5 text-ink dark:text-white" />
                  </div>
                  <h3 className="text-sm font-semibold text-ink dark:text-white mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-body dark:text-[#888888] leading-relaxed">
                    {f.desc}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Dark CTA Band ───────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-ink dark:bg-white" />
        <div className="absolute inset-0 grid-pattern opacity-20 dark:opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)' }} />
        <div className="relative mx-auto max-w-3xl text-center py-24 sm:py-32 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em] text-white dark:text-ink mb-4">
              {t('landing.cta')}
            </h2>
            <p className="text-[#888888] dark:text-body mb-10 text-lg max-w-lg mx-auto">
              {t('landing.heroSub')}
            </p>
            <Link to="/register">
              <Button
                size="lg"
                className="h-12 px-8 text-base bg-white text-ink hover:bg-gray-100 dark:bg-ink dark:text-white dark:hover:bg-black"
              >
                {t('landing.ctaButton')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
