import { useNavigate } from 'react-router-dom';
import { useAppSettings } from '@/hooks/useAppSettings';

export function DesktopFooter() {
  const navigate = useNavigate();
  const { settings } = useAppSettings();

  return (
    <footer className="hidden lg:block bg-card border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <span className="text-xl">🗳️</span>
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">
                  {settings?.app_name || '민심잇다'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {settings?.app_slogan || '지역 정치 참여 플랫폼'}
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              시민의 목소리가 정치가 되는 곳.<br />
              더 나은 민주주의를 함께 만들어갑니다.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">바로가기</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/')} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  홈
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/election')} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  선거 정보
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/discussion')} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  토론 참여
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/my')} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  마이페이지
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">정보</h3>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => navigate('/app-info')} 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  앱 기획서
                </button>
              </li>
              <li>
                {settings?.link_terms ? (
                  <a 
                    href={settings.link_terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    이용약관
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">이용약관</span>
                )}
              </li>
              <li>
                {settings?.link_privacy ? (
                  <a 
                    href={settings.link_privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    개인정보처리방침
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">개인정보처리방침</span>
                )}
              </li>
              <li>
                {settings?.contact_email ? (
                  <a 
                    href={`mailto:${settings.contact_email}`}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    문의하기
                  </a>
                ) : (
                  <span className="text-sm text-muted-foreground">문의하기</span>
                )}
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">연락처</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {settings?.contact_email && (
                <li>
                  <a href={`mailto:${settings.contact_email}`} className="hover:text-primary transition-colors">
                    이메일: {settings.contact_email}
                  </a>
                </li>
              )}
              {settings?.contact_phone && (
                <li>
                  <a href={`tel:${settings.contact_phone}`} className="hover:text-primary transition-colors">
                    전화: {settings.contact_phone}
                  </a>
                </li>
              )}
              {!settings?.contact_email && !settings?.contact_phone && (
                <>
                  <li>이메일: contact@minsimitda.kr</li>
                  <li>전화: 02-000-0000</li>
                </>
              )}
            </ul>
            <div className="mt-4 flex gap-3">
              {settings?.social_x ? (
                <a
                  href={settings.social_x}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="X (Twitter)"
                >
                  𝕏
                </a>
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  𝕏
                </div>
              )}
              {settings?.social_facebook ? (
                <a
                  href={settings.social_facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Facebook"
                >
                  f
                </a>
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  f
                </div>
              )}
              {settings?.social_instagram ? (
                <a
                  href={settings.social_instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label="Instagram"
                >
                  in
                </a>
              ) : (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">
                  in
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 {settings?.app_name || '민심잇다'}. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ for Korean Democracy
          </p>
        </div>
      </div>
    </footer>
  );
}
