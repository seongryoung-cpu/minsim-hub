import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export function useAdmin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      // 로그인 세션을 복원하는 동안에는 '관리자 아님'으로 판정하지 않는다
      // (새로고침 직후 관리자 화면에서 홈으로 튕기던 문제)
      if (authLoading) return;
      if (!isAuthenticated || !user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('is_admin', { _user_id: user.id });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
        } else {
          setIsAdmin(data === true);
        }
      } catch (err) {
        console.error('Admin check failed:', err);
        setIsAdmin(false);
      }
      
      setIsLoading(false);
    };

    checkAdminStatus();
    // user 객체는 토큰 갱신 때마다 바뀌므로 id 기준으로만 다시 확인 (화면이 로딩으로 깜빡이지 않게)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isAuthenticated, authLoading]);

  return { isAdmin, isLoading };
}
