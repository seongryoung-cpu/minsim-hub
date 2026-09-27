import type { AgendaChoice } from '@/hooks/useAgendas';

/** 선택된 버튼 색. 동의=파랑, 비동의=주황, 유보=회색 (글자로도 구분되니 색만으로 의미를 싣지 않음) */
export const CHOICE_SELECTED: Record<AgendaChoice, string> = {
  agree: 'bg-primary text-primary-foreground border-primary',
  disagree: 'bg-accent text-accent-foreground border-accent',
  hold: 'bg-slate-600 text-white border-slate-600 dark:bg-slate-400 dark:text-slate-950 dark:border-slate-400',
};

export const CHOICE_BAR: Record<AgendaChoice, string> = {
  agree: 'bg-primary',
  disagree: 'bg-accent',
  hold: 'bg-slate-500',
};
