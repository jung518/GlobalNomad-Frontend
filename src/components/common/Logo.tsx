import { Link } from 'react-router-dom';

import { cn } from '@/utils/cn';
import { LogoSm, LogoTitleSm } from '@/assets/logos';
import { ROUTES } from '@/constants/routes';

type LogoProps = {
  className?: string;
  direction?: 'horizontal' | 'vertical';
  iconClassName?: string;
  titleClassName?: string;
  showTitle?: boolean;
};

/**
 * Logo 컴포넌트
 *
 * 설명:
 * - 사이트의 로고를 표시하는 컴포넌트입니다.
 * - 작은 로고 아이콘(`LogoSm`)과 텍스트 로고(`LogoTitleSm`)를 함께 렌더링합니다.
 * - 텍스트 로고는 md 이상 화면에서만 보이도록 Tailwind `hidden md:block` 클래스를 사용했습니다.
 * - 클릭 시 `/` 경로(메인 페이지)로 이동합니다.
 *
 * 사용 방법:
 * ```tsx
 * function Header() {
 *   return (
 *     <header>
 *       <Logo className="my-custom-class" />
*        <Logo
          direction='vertical'
          iconClassName='h-[144px] w-[144px]'
          titleClassName='h-[31px] w-[255px]'
        />
 *     </header>
 *   );
 * }
 * ```
 * - 위와 같이 Header 등 원하는 위치에서 사용
 * - 클릭 시 항상 메인 페이지('/')로 이동
 */
export function Logo({
  className,
  direction = 'horizontal',
  iconClassName,
  titleClassName,
  showTitle = true,
}: LogoProps) {
  return (
    <div className={cn('inline-flex', className)}>
      <Link
        to={ROUTES.home}
        aria-label='메인 페이지로 이동'
        className={cn(
          'flex items-center',
          direction === 'horizontal' && 'flex-row gap-2',
          direction === 'vertical' && 'flex-col gap-1'
        )}>
        <LogoSm className={cn('block h-6 w-auto', iconClassName)} />

        {showTitle && <LogoTitleSm className={cn('hidden h-4 w-auto sm:block', titleClassName)} />}
      </Link>
    </div>
  );
}
