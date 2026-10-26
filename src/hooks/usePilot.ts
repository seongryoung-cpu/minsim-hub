import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

/**
 * 오프라인 행사 참가 신청 (첫 행사: 2026-12-05 대학생 공론장)
 * - 신청은 로그인한 사람만, 행사마다 한 번 (다시 내면 고쳐짐)
 * - 연락처는 이 앱 데이터베이스에만 둔다. 본인과 운영진만 본다
 */
export interface PilotEvent {
  id: string;
  slug: string;
  title: string;
  summary: string;
  event_at: string;
  venue: string;
  apply_closes_at: string;
  announce_at: string | null;
  capacity: number;
  agenda_id: string | null;
  schools: string[];
  allow_public: boolean;
  is_published: boolean;
  personal_purged_at: string | null;
}

export type PilotStatus = 'applied' | 'selected' | 'waitlist' | 'declined' | 'cancelled';

export const PILOT_STATUS_LABELS: Record<PilotStatus, string> = {
  applied: '신청함',
  selected: '선발',
  waitlist: '대기',
  declined: '미선발',
  cancelled: '취소',
};

export interface MyPilotApplication {
  id: string;
  name: string;
  phone: string;
  is_student: boolean;
  school: string;
  major: string;
  grade: string;
  heard_from: string;
  consent_photo: boolean;
  status: PilotStatus;
  created_at: string;
}

export interface PilotApplyInput {
  name: string;
  phone: string;
  isStudent: boolean;
  school: string;
  major: string;
  grade: string;
  heardFrom: string;
  consentPrivacy: boolean;
  consentPhoto: boolean;
}

export const GRADE_OPTIONS = ['1학년', '2학년', '3학년', '4학년', '5학년 이상', '대학원생', '휴학생'];
export const HEARD_FROM_OPTIONS = ['에브리타임', '학교 포스터', '수업·교수님', '학생회·학과', '친구·지인', '대외활동 사이트', 'SNS', '기관 안내', '그 밖'];

export class PilotError extends Error {}

export const PILOT_ERROR_TEXT: Record<string, string> = {
  login_required: '로그인한 뒤 신청할 수 있어요',
  not_found: '지금은 신청을 받지 않는 행사예요',
  closed: '신청이 마감됐어요',
  consent_required: '개인정보 수집·이용에 동의해야 신청할 수 있어요',
  invalid_input: '이름(2자 이상), 휴대전화 번호, 학교를 확인해 주세요',
};

/** 휴대전화 번호를 010-1234-5678 꼴로 */
export function formatPhone(raw: string) {
  const d = raw.replace(/\D/g, '').slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
}

export function isValidPhone(raw: string) {
  return /^01[0-9]{8,9}$/.test(raw.replace(/\D/g, ''));
}

export function usePilotEvent(slug: string | undefined) {
  return useQuery({
    queryKey: ['pilot-event', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from('pilot_events').select('*').eq('slug', slug!).maybeSingle();
      if (error) throw error;
      return (data as PilotEvent | null) ?? null;
    },
  });
}

export function usePilotApplicationCount(slug: string | undefined) {
  return useQuery({
    queryKey: ['pilot-count', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('pilot_application_count', { p_slug: slug! });
      if (error) throw error;
      return (data as number) ?? 0;
    },
  });
}

export function useMyPilotApplication(eventId: string | undefined) {
  const { user } = useAuthContext();
  return useQuery({
    queryKey: ['pilot-mine', eventId, user?.id],
    enabled: !!eventId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pilot_applications')
        .select('id, name, phone, is_student, school, major, grade, heard_from, consent_photo, status, created_at')
        .eq('event_id', eventId!)
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as MyPilotApplication | null) ?? null;
    },
  });
}

export function useApplyPilot(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: PilotApplyInput) => {
      const { data, error } = await supabase.rpc('apply_pilot', {
        p_slug: slug,
        p_name: v.name.trim(),
        p_phone: v.phone,
        p_is_student: v.isStudent,
        p_school: v.isStudent ? v.school.trim() : '',
        p_major: v.isStudent ? v.major.trim() : '',
        p_grade: v.isStudent ? v.grade : '',
        p_heard_from: v.heardFrom,
        p_consent_privacy: v.consentPrivacy,
        p_consent_photo: v.consentPhoto,
      });
      if (error) throw error;
      const r = data as { ok?: boolean; updated?: boolean; error?: string };
      if (r?.error) throw new PilotError(r.error);
      return { updated: !!r?.updated };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilot-mine'] });
      qc.invalidateQueries({ queryKey: ['pilot-count', slug] });
    },
  });
}

export function useCancelPilot(slug: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('cancel_pilot_application', { p_slug: slug });
      if (error) throw error;
      const r = data as { ok?: boolean; error?: string };
      if (r?.error) throw new PilotError(r.error);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pilot-mine'] });
      qc.invalidateQueries({ queryKey: ['pilot-count', slug] });
    },
  });
}

// ── 운영진 ──────────────────────────────────────────────

export interface AdminPilotApplication {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  is_student: boolean;
  school: string;
  major: string;
  grade: string;
  heard_from: string;
  consent_photo: boolean;
  status: PilotStatus;
  admin_note: string;
  created_at: string;
  pre_choice: 'agree' | 'disagree' | 'hold' | null;
}

export function useAdminPilotEvents() {
  return useQuery({
    queryKey: ['admin-pilot-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pilot_events').select('*').order('event_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as PilotEvent[];
    },
  });
}

export type PilotEventDraft = Omit<PilotEvent, 'id' | 'personal_purged_at'> & { id?: string };

export function useSavePilotEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: PilotEventDraft) => {
      const row = {
        slug: v.slug.trim(),
        title: v.title.trim(),
        summary: v.summary.trim(),
        event_at: v.event_at,
        venue: v.venue.trim(),
        apply_closes_at: v.apply_closes_at,
        announce_at: v.announce_at,
        capacity: v.capacity,
        agenda_id: v.agenda_id,
        schools: v.schools.map((s) => s.trim()).filter(Boolean),
        allow_public: v.allow_public,
        is_published: v.is_published,
        updated_at: new Date().toISOString(),
      };
      const q = v.id
        ? supabase.from('pilot_events').update(row).eq('id', v.id).select('id').single()
        : supabase.from('pilot_events').insert(row).select('id').single();
      const { data, error } = await q;
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pilot-events'] });
      qc.invalidateQueries({ queryKey: ['pilot-event'] });
    },
  });
}

export function useAdminPilotApplications(eventId: string | undefined) {
  return useQuery({
    queryKey: ['admin-pilot-apps', eventId],
    enabled: !!eventId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_pilot_applications', { p_event_id: eventId! });
      if (error) throw error;
      return (data ?? []) as unknown as AdminPilotApplication[];
    },
  });
}

export function useSetPilotStatus(eventId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: { ids: string[]; status: Exclude<PilotStatus, 'cancelled'> }) => {
      const { data, error } = await supabase.rpc('admin_set_pilot_status', { p_ids: v.ids, p_status: v.status });
      if (error) throw error;
      const r = data as { ok?: boolean; updated?: number; error?: string };
      if (r?.error) throw new PilotError(r.error);
      return r.updated ?? 0;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-pilot-apps', eventId] }),
  });
}

export function usePurgePilotPersonal(eventId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('admin_pilot_purge_personal', { p_event_id: eventId! });
      if (error) throw error;
      const r = data as { ok?: boolean; purged?: number; error?: string };
      if (r?.error) throw new PilotError(r.error);
      return r.purged ?? 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-pilot-apps', eventId] });
      qc.invalidateQueries({ queryKey: ['admin-pilot-events'] });
    },
  });
}

/** 신청자 목록을 CSV로 (엑셀에서 한글이 깨지지 않게 BOM을 붙인다) */
export function pilotCsv(rows: AdminPilotApplication[], columns: { key: keyof AdminPilotApplication | 'pre'; label: string }[]) {
  const pre: Record<string, string> = { agree: '찬성', disagree: '반대', hold: '잘 모르겠다' };
  const cell = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map((c) => cell(c.label)).join(',')];
  for (const r of rows) {
    lines.push(
      columns
        .map((c) => {
          if (c.key === 'pre') return cell(r.pre_choice ? pre[r.pre_choice] : '');
          if (c.key === 'status') return cell(PILOT_STATUS_LABELS[r.status]);
          if (c.key === 'is_student') return cell(r.is_student ? '학생' : '일반');
          if (c.key === 'consent_photo') return cell(r.consent_photo ? '동의' : '');
          if (c.key === 'phone') return cell(formatPhone(r.phone));
          return cell(r[c.key as keyof AdminPilotApplication]);
        })
        .join(','),
    );
  }
  return '﻿' + lines.join('\n');
}
