import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, PenLine, Brain, ShieldCheck, BarChart3, Globe, Volume2, MapPin, Zap, ArrowRight, Mail, Github, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const anim = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

export function Landing() {
  const { t } = useTranslation();
  const stats = [
    { value: '500+', label: t('landing.stat1') },
    { value: '10K+', label: t('landing.stat2') },
    { value: '3', label: t('landing.stat3') },
    { value: '15+', label: t('landing.stat4') },
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
    <div className="bg-white">
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div {...anim}>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-tight">{t('landing.hero')}</h1>
              <p className="mt-6 text-lg text-primary-100 max-w-lg">{t('landing.heroSub')}</p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link to="/register"><Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg">{t('landing.getStarted')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
                <Link to="/map"><Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">{t('landing.viewMap')}</Button></Link>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="flex justify-center">
              <div className="relative"><Shield className="h-48 w-48 text-white/20" strokeWidth={1} /><div className="absolute inset-0 flex items-center justify-center"><Shield className="h-24 w-24 text-white" strokeWidth={1.5} /></div></div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative -mt-8 z-10 mx-auto max-w-5xl px-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-5 text-center hover:shadow-card-hover transition-shadow"><p className="text-2xl font-bold text-primary-600">{s.value}</p><p className="text-sm text-slate-500 mt-1">{s.label}</p></Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">{t('landing.howItWorks')}</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }} whileHover={{ y: -4 }}>
                <Card className="p-6 text-center hover:shadow-card-hover transition-all h-full">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-100"><s.icon className="h-7 w-7 text-primary-600" /></div>
                  <div className="text-xs font-bold text-primary-600 mb-2">Step {s.num}</div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500">{s.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-slate-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-12">{t('landing.features')}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                <Card className="p-6 hover:shadow-card-hover hover:border-primary-200 transition-all h-full">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-100"><f.icon className="h-6 w-6 text-primary-600" /></div>
                  <h3 className="text-base font-semibold text-slate-900 mb-1">{f.title}</h3>
                  <p className="text-sm text-slate-500">{f.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-primary-600">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t('landing.cta')}</h2>
          <p className="text-primary-100 mb-8">{t('landing.heroSub')}</p>
          <Link to="/register"><Button size="lg" className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg">{t('landing.ctaButton')} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>

      <footer className="bg-slate-900 text-white py-12 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div><div className="flex items-center gap-2 mb-4"><Shield className="h-6 w-6 text-primary-400" /><span className="text-lg font-bold">SafeStay</span></div><p className="text-sm text-slate-400">AI-powered safety intelligence for student accommodations.</p></div>
            <div><h3 className="text-sm font-semibold mb-4">{t('landing.product')}</h3><ul className="space-y-2 text-sm text-slate-400"><li><Link to="/map" className="hover:text-white">{t('nav.map')}</Link></li><li><Link to="/report/new" className="hover:text-white">{t('nav.report')}</Link></li><li><Link to="/dashboard" className="hover:text-white">{t('nav.dashboard')}</Link></li></ul></div>
            <div><h3 className="text-sm font-semibold mb-4">{t('landing.resources')}</h3><ul className="space-y-2 text-sm text-slate-400"><li>Documentation</li><li>API Reference</li><li>Safety Guidelines</li></ul></div>
            <div><h3 className="text-sm font-semibold mb-4">{t('landing.contact')}</h3><p className="flex items-center gap-2 text-sm text-slate-400"><Mail className="h-4 w-4" /> support@safestay.in</p><div className="flex gap-3 mt-3"><Twitter className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer" /><Github className="h-5 w-5 text-slate-400 hover:text-white cursor-pointer" /></div></div>
          </div>
          <div className="mt-10 border-t border-slate-800 pt-6 text-center"><p className="text-sm text-slate-400">{t('landing.copyright')}</p></div>
        </div>
      </footer>
    </div>
  );
}
