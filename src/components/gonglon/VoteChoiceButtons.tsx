import { cn } from '@/lib/utils';
import { CHOICE_LABELS, type AgendaChoice } from '@/hooks/useAgendas';
import { CHOICE_SELECTED } from './choiceStyles';

const CHOICES: AgendaChoice[] = ['agree', 'disagree', 'hold'];

interface VoteChoiceButtonsProps {
  value: AgendaChoice | null;
  onChoose: (choice: AgendaChoice) => void;
  disabled?: boolean;
  size?: 'md' | 'lg';
  /** 카드 안(주황 배경)에서 쓸 때 테두리 색 */
  tone?: 'default' | 'warm';
  label: string;
}

export function VoteChoiceButtons({ value, onChoose, disabled, size = 'lg', tone = 'default', label }: VoteChoiceButtonsProps) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-2">
      {CHOICES.map((choice) => {
        const selected = value === choice;
        return (
          <button
            key={choice}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChoose(choice)}
            className={cn(
              'rounded-xl border-[1.5px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
              size === 'lg' ? 'h-[52px] text-base' : 'h-11 text-sm',
              selected
                ? CHOICE_SELECTED[choice]
                : cn(
                    'bg-card text-foreground hover:bg-secondary',
                    tone === 'warm' ? 'border-accent/40' : 'border-border',
                  ),
            )}
          >
            {CHOICE_LABELS[choice]}
          </button>
        );
      })}
    </div>
  );
}
