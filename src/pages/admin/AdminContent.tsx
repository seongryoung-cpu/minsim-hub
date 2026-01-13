import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Users, Newspaper, HelpCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/hooks/useAdmin';

export function AdminContent() {
  const navigate = useNavigate();
  const { isAdmin, isLoading } = useAdmin();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate('/');
    return null;
  }

  const contentTypes = [
    { 
      icon: Users, 
      label: '후보자 관리', 
      description: '후보자 정보 등록 및 수정',
      count: '데모 데이터',
      color: 'bg-blue-500'
    },
    { 
      icon: Newspaper, 
      label: '뉴스 관리', 
      description: '뉴스 기사 등록 및 수정',
      count: '데모 데이터',
      color: 'bg-green-500'
    },
    { 
      icon: HelpCircle, 
      label: '퀴즈 관리', 
      description: '퀴즈 문제 등록 및 수정',
      count: '데모 데이터',
      color: 'bg-purple-500'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <FileText size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">콘텐츠 관리</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <p className="text-sm text-amber-600 dark:text-amber-400">
            ⚠️ 현재 앱은 데모 데이터를 사용 중입니다. 실제 운영 시 이 페이지에서 콘텐츠를 관리할 수 있습니다.
          </p>
        </div>

        <div className="space-y-3">
          {contentTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 shadow-app-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${type.color} flex items-center justify-center`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.description}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 bg-secondary rounded-full text-muted-foreground">
                    {type.count}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1" disabled>
                    목록 보기
                  </Button>
                  <Button size="sm" className="gap-1" disabled>
                    <Plus size={16} />
                    추가
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            실제 서비스 시 DB 연동 후 콘텐츠 관리가 가능합니다
          </p>
        </div>
      </main>
    </div>
  );
}
