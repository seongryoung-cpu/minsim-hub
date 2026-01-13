import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Shield, ShieldCheck, CheckCircle2, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, VerificationLevel } from '@/types/auth';
import { toast } from 'sonner';

export function AdminUsers() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<VerificationLevel | 'all'>('all');

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        let query = supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (filterLevel !== 'all') {
          query = query.eq('verification_level', filterLevel);
        }

        const { data, error } = await query;

        if (error) throw error;
        setUsers((data as UserProfile[]) || []);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        toast.error('사용자 목록을 불러오지 못했습니다');
      }
      
      setIsLoading(false);
    };

    fetchUsers();
  }, [isAdmin, filterLevel]);

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.phone_number?.includes(query)
    );
  });

  const handleGrantAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;
      toast.success('관리자 권한이 부여되었습니다');
    } catch (error) {
      console.error('Failed to grant admin:', error);
      toast.error('권한 부여에 실패했습니다');
    }
  };

  if (adminLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const filterOptions: { value: VerificationLevel | 'all'; label: string }[] = [
    { value: 'all', label: '전체' },
    { value: 'social', label: '소셜' },
    { value: 'phone', label: '휴대폰' },
    { value: 'identity', label: '본인인증' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="h-14 flex items-center px-4 gap-3">
          <button onClick={() => navigate('/admin')} className="p-1 rounded-lg hover:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <Users size={22} className="text-primary" />
          <h1 className="font-semibold text-lg">사용자 관리</h1>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-20">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="이름 또는 전화번호 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filterLevel === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterLevel(option.value)}
              className="whitespace-nowrap"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* User List */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            총 {filteredUsers.length}명
          </p>

          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card rounded-xl p-4 shadow-app-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={24} className="text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.display_name || '익명'}</p>
                      <VerificationBadge level={user.verification_level} size="sm" showLabel={false} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.phone_number || '전화번호 미등록'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')} 가입
                    </p>
                  </div>
                </div>
                <button className="p-2 rounded-lg hover:bg-muted">
                  <MoreVertical size={18} className="text-muted-foreground" />
                </button>
              </div>

              {user.region_sido && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    지역: {user.region_sido} {user.region_sigungu}
                  </p>
                </div>
              )}
            </motion.div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">검색 결과가 없습니다</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
