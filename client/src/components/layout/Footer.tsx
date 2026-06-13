import { useTranslation } from 'react-i18next'
import { Shield, Github, Twitter, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {t('footer.product')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/dashboard" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.safetyMap')}
                </Link>
              </li>
              <li>
                <Link to="/reports/new" className="text-slate-400 hover:text-white transition-colors">
                  {t('nav.submitReport')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {t('footer.resources')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <Link to="/about" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {t('footer.contact')}
            </h3>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="mailto:contact@safestay.com" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  contact@safestay.com
                </a>
              </li>
              <li className="flex gap-4 pt-2">
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Github className="h-5 w-5" />
                </a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors">
                  <Twitter className="h-5 w-5" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-400" />
            <span className="text-lg font-bold text-primary-400">SafeStay</span>
          </div>
          <p className="text-sm text-slate-400">
            © 2025 SafeStay. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  )
}
