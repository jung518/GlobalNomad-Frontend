import ProfileImageUpload from '@/components/common/image-upload/ProfileImageUpload';
import SidebarButton from '@/components/common/SidebarButton';
import { cn } from '@/utils/cn';
import type { MyPageTab } from '@/constants/routes';

type Props = {
  variant: 'desktop' | 'tablet' | 'mobile';
  activePage: MyPageTab;
  defaultImageUrl?: string | null;
  onProfileClick?: () => void;
  onBookingsClick?: () => void;
  onExperiencesClick?: () => void;
  onBookingStatusClick?: () => void;
};

export default function CardsideBar({
  variant,
  activePage,
  defaultImageUrl,
  onProfileClick,
  onBookingsClick,
  onExperiencesClick,
  onBookingStatusClick,
}: Props) {
  return (
    <div
      className={cn(
        'scrollbar-hide flex shrink-0 flex-col items-center rounded-xl border border-gray-50',
        variant === 'desktop' && 'h-112.5 w-72.5 gap-6 px-3.5 py-6',
        variant === 'tablet' && 'h-85.5 w-44.5 gap-3 overflow-y-auto px-3.5 py-4',
        variant === 'mobile' && 'h-full w-full gap-6 border-t-0 px-4 py-6'
      )}>
      <ProfileImageUpload
        size={variant === 'tablet' ? 'medium' : 'large'}
        edit
        defaultImageUrl={defaultImageUrl}
        activePage={activePage}
      />

      <div
        className={cn(
          'flex w-full flex-col',
          variant === 'mobile' && 'gap-6',
          variant === 'tablet' && 'gap-3',
          variant === 'desktop' && 'gap-3.5'
        )}>
        <SidebarButton
          theme='MyProfile'
          onClick={onProfileClick}
          selected={activePage === 'profile'}
        />
        <SidebarButton
          theme='MyBookings'
          onClick={onBookingsClick}
          selected={activePage === 'reservation'}
        />
        <SidebarButton
          theme='MyExperiences'
          onClick={onExperiencesClick}
          selected={activePage === 'experiences'}
        />
        <SidebarButton
          theme='BookingStatus'
          onClick={onBookingStatusClick}
          selected={activePage === 'status'}
        />
      </div>
    </div>
  );
}
