import { motion } from 'framer-motion';
import { ArrowLeft, HelpCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: '계정 및 로그인',
    icon: '🔐',
    items: [
      {
        question: '회원가입은 어떻게 하나요?',
        answer: '마이 탭에서 "로그인 / 회원가입" 버튼을 눌러 이메일 또는 소셜 계정(카카오, 구글, 애플)으로 가입할 수 있습니다.',
      },
      {
        question: '비밀번호를 잊어버렸어요.',
        answer: '로그인 화면에서 "비밀번호 찾기"를 클릭하면 이메일로 비밀번호 재설정 링크가 발송됩니다.',
      },
      {
        question: '본인 인증은 왜 필요한가요?',
        answer: '본인 인증을 완료하면 투표 참여 등 더 많은 기능을 이용할 수 있습니다. 개인정보는 안전하게 암호화되어 저장됩니다.',
      },
      {
        question: '회원 탈퇴는 어떻게 하나요?',
        answer: '마이 탭에서 로그인 후 휴지통 아이콘을 눌러 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 모든 데이터가 삭제됩니다.',
      },
    ],
  },
  {
    title: '정책 매치',
    icon: '🎯',
    items: [
      {
        question: '정책 매치란 무엇인가요?',
        answer: '다양한 정책 이슈에 대한 여러분의 의견을 스와이프로 표현하면, AI가 여러분과 가장 잘 맞는 후보자를 분석해드립니다.',
      },
      {
        question: '정책 매치 결과는 어떻게 저장되나요?',
        answer: '로그인한 상태에서 정책 매치를 완료하면 결과가 자동으로 저장되어 마이 탭에서 언제든 다시 확인할 수 있습니다.',
      },
      {
        question: '정책 매치를 다시 할 수 있나요?',
        answer: '네, 언제든지 다시 진행할 수 있습니다. 새로운 결과가 저장되며 이전 기록도 함께 보관됩니다.',
      },
    ],
  },
  {
    title: '후보자 정보',
    icon: '👤',
    items: [
      {
        question: '후보자 정보는 어디서 확인하나요?',
        answer: '홈 화면에서 후보자 카드를 탭하면 상세 정보(공약, 경력, 학력 등)를 확인할 수 있습니다.',
      },
      {
        question: '후보자를 팔로우하면 어떤 혜택이 있나요?',
        answer: '팔로우한 후보자의 새 뉴스나 공약 업데이트가 있으면 알림을 받을 수 있습니다.',
      },
      {
        question: '후보자 비교 기능은 어떻게 사용하나요?',
        answer: '선거 탭에서 "후보 비교" 버튼을 누르면 두 후보자의 정보를 나란히 비교할 수 있습니다.',
      },
    ],
  },
  {
    title: '퀴즈 및 리더보드',
    icon: '🏆',
    items: [
      {
        question: '퀴즈는 어떻게 참여하나요?',
        answer: '홈 화면의 퀴즈 배너를 탭하거나 선거 탭에서 퀴즈를 시작할 수 있습니다. 매일 새로운 퀴즈가 추가됩니다.',
      },
      {
        question: '퀴즈 점수는 어떻게 계산되나요?',
        answer: '정답 개수와 연속 정답 스트릭에 따라 점수가 부여됩니다. 어려운 문제일수록 더 높은 점수를 받습니다.',
      },
      {
        question: '리더보드 순위는 언제 업데이트되나요?',
        answer: '퀴즈를 완료하면 실시간으로 순위가 반영됩니다.',
      },
    ],
  },
  {
    title: '알림 설정',
    icon: '🔔',
    items: [
      {
        question: '푸시 알림을 어떻게 켜나요?',
        answer: '마이 탭 > 알림 설정에서 푸시 알림을 활성화할 수 있습니다. 브라우저에서 알림 권한을 허용해야 합니다.',
      },
      {
        question: '특정 알림만 받을 수 있나요?',
        answer: '네, 알림 설정 페이지에서 뉴스, 후보자 업데이트, 퀴즈 등 유형별로 알림을 개별 설정할 수 있습니다.',
      },
      {
        question: '알림이 오지 않아요.',
        answer: '브라우저 설정에서 알림이 차단되어 있는지 확인해주세요. 또한 앱 내 알림 설정이 켜져 있는지도 확인해주세요.',
      },
    ],
  },
  {
    title: '기타',
    icon: '💡',
    items: [
      {
        question: '지역 설정은 어떻게 변경하나요?',
        answer: '마이 탭에서 "내 지역"을 탭하면 지역을 변경할 수 있습니다. 선택한 지역의 선거 정보가 표시됩니다.',
      },
      {
        question: '다크 모드는 어떻게 설정하나요?',
        answer: '마이 탭에서 "다크 모드" 스위치를 켜면 어두운 테마로 변경됩니다.',
      },
      {
        question: '앱을 친구에게 공유하고 싶어요.',
        answer: '마이 탭에서 "앱 공유하기" 버튼을 누르면 카카오톡, 링크 복사 등 다양한 방법으로 공유할 수 있습니다.',
      },
      {
        question: '문의사항이 있어요.',
        answer: '마이 탭 하단의 문의 및 소셜 섹션에서 이메일로 문의하실 수 있습니다.',
      },
    ],
  },
];

export function FAQPage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="min-h-screen bg-background pb-20"
    >
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="h-14 flex items-center px-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <HelpCircle size={22} className="text-primary" />
          <h1 className="font-semibold text-lg text-foreground">자주 묻는 질문</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Intro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-5"
        >
          <h2 className="font-semibold text-lg mb-2">무엇을 도와드릴까요?</h2>
          <p className="text-sm text-muted-foreground">
            아래에서 자주 묻는 질문들을 확인해보세요. 원하는 답변을 찾지 못하셨다면 
            마이 탭에서 직접 문의해주세요.
          </p>
        </motion.div>

        {/* FAQ Categories */}
        {faqData.map((category, categoryIndex) => (
          <motion.section
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (categoryIndex + 1) }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-lg">{category.icon}</span>
              <h3 className="font-semibold text-foreground">{category.title}</h3>
            </div>
            <Accordion type="single" collapsible className="bg-card rounded-2xl overflow-hidden shadow-app-md">
              {category.items.map((item, itemIndex) => (
                <AccordionItem 
                  key={itemIndex} 
                  value={`${category.title}-${itemIndex}`}
                  className="border-b border-border last:border-b-0"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-secondary/30 text-left">
                    <span className="text-sm font-medium pr-4">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-0">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>
        ))}

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-secondary/50 rounded-2xl p-4 text-center"
        >
          <p className="text-sm text-foreground font-medium mb-1">
            원하는 답변을 찾지 못하셨나요?
          </p>
          <p className="text-xs text-muted-foreground">
            마이 탭 하단의 문의 및 소셜 섹션에서 직접 문의해주세요.
          </p>
        </motion.div>
      </main>
    </motion.div>
  );
}
