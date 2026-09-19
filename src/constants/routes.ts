/**
 * 앱 전역에서 쓰는 경로 문자열을 한 곳에 모아둔 것.
 * navigate('/mypage?tab=experiences') 같은 리터럴이 여러 파일에 흩어져 있으면
 * 경로 구조가 바뀔 때 호출부를 전부 찾아 고쳐야 하므로, 값 자체는 여기서만 정의한다.
 *
 * 주의: react-router의 라우트 "정의"(main.tsx)는 부모 경로에 상대적인 세그먼트
 * 문자열('activities/create')을 쓰기 때문에 절대경로인 이 상수와 형식이 다르다.
 * main.tsx는 그대로 두고, navigate()/Link 등 "호출부"만 이 상수를 쓰도록 한다.
 */

export type MyPageTab = 'profile' | 'reservation' | 'experiences' | 'status';

export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  activityCreate: '/activities/create',
  activityDetail: (activityId: number | string) => `/activities/${activityId}`,
  activityEdit: (activityId: number | string) => `/activities/edit/${activityId}`,
  myPage: (tab: MyPageTab) => `/mypage?tab=${tab}`,
} as const;
