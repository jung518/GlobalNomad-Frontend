import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import CardsideBar from '@/components/common/CardsideBar';
import BookingStatusPage from './MyPage/BookingStatusPage';
import MyExperiencesPage from './MyPage/MyActivitiesPage';
import MyProfilePage from './MyPage/MyProfilePage';
import ReservationPage from './MyPage/ReservationPage';
import { useProfileImageStore } from '@/stores/profileImageStore';
import { useAuthStore } from '@/stores/authStore';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { MyPageTab } from '@/constants/routes';

export default function MyPageLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const { user: myInfo, initialize } = useAuthStore();
  const { setProfileImageUrl } = useProfileImageStore();
  const isMobile = useIsMobile();
  const activePage: MyPageTab =
    tabParam === 'profile' ||
    tabParam === 'reservation' ||
    tabParam === 'experiences' ||
    tabParam === 'status'
      ? tabParam
      : 'reservation';

  const [mobileOpen, setMobileOpen] = useState<boolean>(() => !!tabParam);

  const handleSelect = (page: MyPageTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', page);
    if (page !== 'reservation') {
      params.delete('status');
    }
    setSearchParams(params);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // AuthStore 초기화
  useEffect(() => {
    if (!myInfo) {
      initialize();
    }
  }, [initialize, myInfo]);

  useEffect(() => {
    if (mobileOpen && isMobile) {
      // 모바일에서 사이드바 열려있으면 스크롤 막기
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen, isMobile]);

  // profileImageStore 초기화
  useEffect(() => {
    if (myInfo?.profileImageUrl) {
      setProfileImageUrl(myInfo.profileImageUrl);
    }
  }, [myInfo, setProfileImageUrl]);

  const pageMap: Record<MyPageTab, React.ReactNode> = {
    profile: <MyProfilePage mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />,
    reservation: <ReservationPage mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />,
    experiences: <MyExperiencesPage mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />,
    status: <BookingStatusPage mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />,
  };

  return (
    <div className='mx-auto mb-3 flex min-h-[calc(100vh-140px)] w-full flex-col justify-center gap-6 px-6 sm:gap-7.5 md:max-w-245 md:flex-row md:items-start md:gap-12.5 md:px-7.5 lg:px-0'>
      <aside
        className={`fixed top-27.5 left-0 z-50 h-[calc(100vh-110px)] w-full bg-white transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:sticky md:top-30 md:z-auto md:h-auto md:w-auto md:shrink-0 md:translate-x-0 md:bg-transparent`}>
        <div className='block h-full md:hidden'>
          <CardsideBar
            variant='mobile'
            activePage={activePage}
            onProfileClick={() => handleSelect('profile')}
            onBookingsClick={() => handleSelect('reservation')}
            onExperiencesClick={() => handleSelect('experiences')}
            onBookingStatusClick={() => handleSelect('status')}
          />
        </div>
        <div className='hidden md:block lg:hidden'>
          <CardsideBar
            variant='tablet'
            activePage={activePage}
            onProfileClick={() => handleSelect('profile')}
            onBookingsClick={() => handleSelect('reservation')}
            onExperiencesClick={() => handleSelect('experiences')}
            onBookingStatusClick={() => handleSelect('status')}
          />
        </div>
        <div className='hidden lg:block'>
          <CardsideBar
            variant='desktop'
            activePage={activePage}
            onProfileClick={() => handleSelect('profile')}
            onBookingsClick={() => handleSelect('reservation')}
            onExperiencesClick={() => handleSelect('experiences')}
            onBookingStatusClick={() => handleSelect('status')}
          />
        </div>
      </aside>
      <main className='max-w-160 min-w-0 flex-1'>
        <div className='block md:hidden'>{pageMap[activePage]}</div>
        <div className='hidden md:flex md:flex-1'>{pageMap[activePage]}</div>
      </main>
    </div>
  );
}
