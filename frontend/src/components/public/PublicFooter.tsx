import Link from 'next/link';
import { HeartHandshake, ShieldCheck, Mail, MapPin, Phone, ExternalLink } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-700 text-white">
                <HeartHandshake className="h-4 w-4" />
              </div>
              <span className="text-base font-bold text-slate-900">Fundo Foundation</span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              A transparent, community-governed foundation pioneering zero-interest revolving capital, verified sadaqa distribution, and sustainable social infrastructure.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>501(c)(3) Registered Non-Profit Organization</span>
            </div>
          </div>

          {/* Foundation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Foundation</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/about" className="hover:text-teal-700">About Us</Link></li>
              <li><Link href="/mission" className="hover:text-teal-700">Mission & Vision</Link></li>
              <li><Link href="/goals" className="hover:text-teal-700">Strategic Goals</Link></li>
              <li><Link href="/people" className="hover:text-teal-700">Leadership & Board</Link></li>
              <li><Link href="/transparency" className="hover:text-teal-700">Transparency & Audits</Link></li>
            </ul>
          </div>

          {/* Impact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Our Work</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/projects" className="hover:text-teal-700">Active Projects</Link></li>
              <li><Link href="/activities" className="hover:text-teal-700">Community Activities</Link></li>
              <li><Link href="/beneficiaries" className="hover:text-teal-700">Beneficiary Directory</Link></li>
              <li><Link href="/stories" className="hover:text-teal-700">Impact Stories</Link></li>
              <li><Link href="/news" className="hover:text-teal-700">Press & Annual Reports</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 mb-3">Headquarters</h4>
            <ul className="space-y-2.5 text-xs text-slate-500">
              <li className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-teal-700 shrink-0" />
                <span>100 Global Hope Way, Suite 400, Geneva / NY</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>contact@fundo.org</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-teal-700 shrink-0" />
                <span>+1 (800) 555-FUNDO</span>
              </li>
              <li className="pt-2">
                <Link href="/admin/login" className="inline-flex items-center gap-1 text-teal-700 hover:underline">
                  <span>Authorized Management Login</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} Fundo Foundation Platform. Built with open integrity.</p>
          <div className="flex gap-4">
            <Link href="/transparency" className="hover:text-slate-600">Financial Disclosures</Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-slate-600">Whistleblower Hotline</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
