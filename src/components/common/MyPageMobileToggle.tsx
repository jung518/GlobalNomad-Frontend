import { Burger, Delete } from '@/assets/icons';

type Props = {
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
  burgerClassName?: string;
};

const DEFAULT_BURGER_CLASSNAME = 'z-80 block cursor-pointer text-gray-900 md:hidden';
const DELETE_CLASSNAME = 'z-80 mb-1 ml-3 block h-3 w-3 cursor-pointer text-gray-900 md:hidden';

/**
 * 마이페이지 하위 탭(예약내역/체험관리/내정보/예약현황)에서
 * 모바일 사이드바를 여닫는 버거/닫기 아이콘.
 * 4개 페이지에 동일한 JSX가 복붙되어 있던 것을 하나로 통합.
 */
export default function MyPageMobileToggle({
  mobileOpen,
  setMobileOpen,
  burgerClassName = DEFAULT_BURGER_CLASSNAME,
}: Props) {
  if (!mobileOpen) {
    return <Burger className={burgerClassName} onClick={() => setMobileOpen(true)} />;
  }

  return <Delete className={DELETE_CLASSNAME} onClick={() => setMobileOpen(false)} />;
}
