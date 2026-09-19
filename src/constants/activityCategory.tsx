import { Art, Food, Sport, Tour, Bus, Wellbeing } from '@/assets/icons';
import type { ActivityCategory } from '@/apis/type';

/**
 * 체험 카테고리 6종 + 아이콘 매핑의 단일 출처.
 * ActivityForm(등록/수정 폼), AllActivities/MainPage(메인 필터)가 각자
 * 동일한 한글 문자열 배열을 따로 나열하고 있어서, 카테고리가 추가/변경되면
 * 여러 파일을 동시에 고쳐야 했던 것을 여기 하나로 모았다.
 */
export const ACTIVITY_CATEGORIES: ActivityCategory[] = [
  '문화 · 예술',
  '식음료',
  '스포츠',
  '투어',
  '관광',
  '웰빙',
];

export const ACTIVITY_CATEGORY_ICON_MAP: Record<ActivityCategory, React.ReactNode> = {
  '문화 · 예술': <Art />,
  식음료: <Food />,
  스포츠: <Sport />,
  투어: <Tour />,
  관광: <Bus />,
  웰빙: <Wellbeing />,
};
