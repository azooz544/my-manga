import { Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-secondary border-t border-border mt-16">
      <div className="container py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">عن الموقع</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              موقع متخصص في توفير أفضل الأنمي والأفلام اليابانية بجودة عالية وتحميل سريع.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">روابط سريعة</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">الرئيسية</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">الأنمي</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">الأفلام</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">الأخبار</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">الأنواع</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">أكشن</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">دراما</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">رومانسية</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">خيال</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-4">تواصل معنا</h3>
            <ul className="space-y-2">
              <li><a href="mailto:info@example.com" className="text-gray-400 hover:text-accent transition-colors text-sm">البريد الإلكتروني</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">تويتر</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">فيسبوك</a></li>
              <li><a href="#" className="text-gray-400 hover:text-accent transition-colors text-sm">ديسكورد</a></li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-right gap-4">
          <p className="text-gray-400 text-sm">
            © 2024 موقع الأنمي. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <span>تم إنشاؤه بـ</span>
            <Heart className="w-4 h-4 text-red-500 fill-red-500" />
            <span>لمحبي الأنمي</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
