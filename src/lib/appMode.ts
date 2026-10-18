export type AppModeSetting = 'auto' | 'election' | 'normal';
export type AppMode = 'election' | 'normal';

export const resolveAppMode = (setting: AppModeSetting, isOver: boolean): AppMode =>
  setting === 'auto' ? (isOver ? 'normal' : 'election') : setting;

/** Unknown inputs must never be interpreted as an active election. */
export function getAppModeState(
  setting: AppModeSetting | undefined,
  isOver: boolean | null,
  settingsError: boolean,
  scheduleError: boolean,
  scheduleLoading: boolean,
) {
  const needsSchedule = setting === 'auto';
  const isError = settingsError || (needsSchedule && (
    scheduleError || (!scheduleLoading && isOver === null)
  ));
  const mode = isError || setting === undefined || (needsSchedule && isOver === null)
    ? null
    : resolveAppMode(setting, isOver === true);
  return { mode, isError, isLoading: !isError && mode === null };
}