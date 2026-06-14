import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6 bg-canvas dark:bg-[#0a0a0a]">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }} className="text-center">
        <p className="text-8xl sm:text-9xl font-semibold tracking-[-0.06em] text-ink dark:text-white">404</p>
        <h1 className="text-xl font-semibold text-ink dark:text-white mt-6">{t('common.notFound')}</h1>
        <p className="text-body dark:text-[#888888] mt-2 max-w-md mx-auto text-sm">{t('common.notFoundDesc')}</p>
        <div className="mt-8 flex justify-center">
          <Shield className="h-12 w-12 text-hairline dark:text-[#333333]" strokeWidth={1.5} />
        </div>
        <Link to="/">
          <Button className="mt-8">{t('common.goHome')}</Button>
        </Link>
      </motion.div>
    </div>
  );
}
