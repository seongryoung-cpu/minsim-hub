/**
 * 로그아웃·탈퇴 때 이 기기에 남은 '사람에 딸린' 데이터를 지운다.
 * 지역(minsim-region), 화면 테마, 안내를 본 기록처럼 기기 설정에 가까운 값은 남긴다.
 */
const USER_KEYS = ['followed-candidates', 'minsim-quiz-stats'];

export function clearUserLocalData() {
  for (const key of USER_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* 저장소를 못 쓰는 환경이면 지울 것도 없다 */
    }
  }
}

/** 탈퇴 때만: 이 기기의 웹 푸시 구독도 끊는다 (서버 쪽 구독 행은 계정과 함께 지워진다). */
export async function unsubscribeWebPush() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    await sub?.unsubscribe();
  } catch {
    /* 푸시를 안 쓰는 기기면 무시 */
  }
}
