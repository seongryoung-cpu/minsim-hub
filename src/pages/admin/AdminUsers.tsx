import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Search, Shield, ShieldOff, X, Save, Loader2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/auth/VerificationBadge';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, VerificationLevel } from '@/types/auth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserWithRole extends UserProfile {
  isAdmin?: boolean;
  email?: string;
}

export function AdminUsers() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<VerificationLevel | 'all'>('all');
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserWithRole | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editVerificationLevel, setEditVerificationLevel] = useState<VerificationLevel>('social');
  const [editRegionSido, setEditRegionSido] = useState('');
  const [editRegionSigungu, setEditRegionSigungu] = useState('');
  const [editIsAdmin, setEditIsAdmin] = useState(false);

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, adminLoading, navigate]);

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

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      // Fetch admin roles
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);

      // Map users with admin status
      const usersWithRoles: UserWithRole[] = (profilesData || []).map(profile => ({
        ...profile,
        isAdmin: adminUserIds.has(profile.user_id),
      })) as UserWithRole[];

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('사용자 목록을 불러오지 못했습니다');
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [isAdmin, filterLevel]);

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.display_name?.toLowerCase().includes(query) ||
      user.phone_number?.includes(query) ||
      user.region_sido?.toLowerCase().includes(query)
    );
  });

  const openEditModal = (user: UserWithRole) => {
    setEditingUser(user);
    setEditDisplayName(user.display_name || '');
    setEditVerificationLevel(user.verification_level);
    setEditRegionSido(user.region_sido || '');
    setEditRegionSigungu(user.region_sigungu || '');
    setEditIsAdmin(user.isAdmin || false);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setIsSaving(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          display_name: editDisplayName || null,
          verification_level: editVerificationLevel,
          region_sido: editRegionSido || null,
          region_sigungu: editRegionSigungu || null,
        })
        .eq('user_id', editingUser.user_id);

      if (profileError) throw profileError;

      // Handle admin role changes
      if (editIsAdmin && !editingUser.isAdmin) {
        // Grant admin
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: editingUser.user_id, role: 'admin' });
        if (roleError && !roleError.message.includes('duplicate')) throw roleError;
      } else if (!editIsAdmin && editingUser.isAdmin) {
        // Revoke admin
        const { error: roleError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', editingUser.user_id)
          .eq('role', 'admin');
        if (roleError) throw roleError;
      }

      toast.success('사용자 정보가 수정되었습니다');
      setEditingUser(null);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to update user:', error);
      toast.error('수정에 실패했습니다');
    }

    setIsSaving(false);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setIsDeleting(true);

    try {
      // Delete user roles first
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', deletingUser.user_id);

      // Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', deletingUser.user_id);

      if (profileError) throw profileError;

      toast.success('사용자가 삭제되었습니다');
      setDeletingUser(null);
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error('삭제에 실패했습니다');
    }

    setIsDeleting(false);
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
            placeholder="이름, 전화번호, 지역 검색"
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
                      {user.isAdmin && (
                        <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-md font-medium">
                          관리자
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {user.phone_number || '전화번호 미등록'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString('ko-KR')} 가입
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(user)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeletingUser(user)}
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
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

      {/* Edit Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사용자 정보 수정</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">표시 이름</label>
              <Input
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="표시 이름 입력"
              />
            </div>

            {/* Verification Level */}
            <div className="space-y-2">
              <label className="text-sm font-medium">인증 레벨</label>
              <Select value={editVerificationLevel} onValueChange={(v) => setEditVerificationLevel(v as VerificationLevel)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">소셜 로그인</SelectItem>
                  <SelectItem value="phone">휴대폰 인증</SelectItem>
                  <SelectItem value="identity">본인 인증</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Region */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">시/도</label>
                <Input
                  value={editRegionSido}
                  onChange={(e) => setEditRegionSido(e.target.value)}
                  placeholder="서울특별시"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시/군/구</label>
                <Input
                  value={editRegionSigungu}
                  onChange={(e) => setEditRegionSigungu(e.target.value)}
                  placeholder="강남구"
                />
              </div>
            </div>

            {/* Admin Role */}
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
              <div className="flex items-center gap-2">
                {editIsAdmin ? (
                  <Shield size={18} className="text-primary" />
                ) : (
                  <ShieldOff size={18} className="text-muted-foreground" />
                )}
                <span className="font-medium">관리자 권한</span>
              </div>
              <Button
                variant={editIsAdmin ? 'destructive' : 'default'}
                size="sm"
                onClick={() => setEditIsAdmin(!editIsAdmin)}
              >
                {editIsAdmin ? '권한 해제' : '권한 부여'}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditingUser(null)}
            >
              취소
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  저장
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>사용자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{deletingUser?.display_name || '익명'}</span> 사용자를 정말 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
