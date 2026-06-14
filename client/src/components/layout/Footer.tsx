import { useTranslation } from 'react-i18next'
import { Shield, Github, Twitter, Mail } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="bg-canvas border-t border-hairline dark:bg-[#0a0a0a] dark:border-[#333333]">
      <div className="mx-auto max-w-[1400px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <Shield className="h-5 w-5 text-ink dark:text-white" strokeWidth={2} />
              <span className="text-base font-semibold text-ink dark:text-white">SafeStay</span>
            </Link>
            <p className="text-sm text-body dark:text-[#888888] max-w-xs leading-relaxed">
              Making student accommodation safer across India with AI-powered safety insights.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-mute dark:text-[#666666] mb-4 font-mono">
              Product
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/dashboard" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <Link to="/map" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('nav.safetyMap')}
                </Link>
              </li>
              <li>
                <Link to="/report/new" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('nav.submitReport')}
                </Link>
              </li>
              <li>
                <Link to="/accommodations" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  Accommodations
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-mute dark:text-[#666666] mb-4 font-mono">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('footer.privacy')}
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-mute dark:text-[#666666] mb-4 font-mono">
              Contact
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:support@safestay.in" className="text-sm text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  support@safestay.in
                </a>
              </li>
              <li className="flex gap-3 pt-1">
                <a href="https://github.com/safestay" target="_blank" rel="noopener noreferrer" className="text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  <Github className="h-4 w-4" />
                </a>
                <a href="https://twitter.com/safestay" target="_blank" rel="noopener noreferrer" className="text-body hover:text-ink dark:text-[#888888] dark:hover:text-white transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-hairline dark:border-[#333333] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-mute dark:text-[#666666]">
            © {new Date().getFullYear()} SafeStay. {t('footer.rights')}
          </p>
          <div className="flex items-center gap-1 text-xs text-mute dark:text-[#666666]">
            <span>Built for</span>
            <span className="text-ink dark:text-white font-medium">safer stays</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
