import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <p className="text-9xl font-black bg-gradient-to-r from-primary-600 to-indigo-600 bg-clip-text text-transparent">404</p>
        <h1 className="text-2xl font-bold text-slate-900 mt-4">{t('common.notFound')}</h1>
        <p className="text-slate-500 mt-2 max-w-md mx-auto">{t('common.notFoundDesc')}</p>
        <div className="mt-6 flex justify-center"><Shield className="h-16 w-16 text-slate-200" /></div>
        <Link to="/"><Button className="mt-6">{t('common.goHome')}</Button></Link>
      </motion.div>
    </div>
  );
}
