import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Title from '@/components/common/Title';
import { ArrowRight } from '@/assets/icons';
import ActivityGridCard from '@/components/ActivityGridCard';
import type { Activity } from '@/apis/type';

// 슬라이더 설정 상수
const SLIDER_CONFIG = {
  CARD_WIDTH: 384,
  GAP: 24,
} as const;

interface PopularActivitiesProps {
  activities: Activity[];
}

export default function PopularActivities({ activities }: PopularActivitiesProps) {
  const navigate = useNavigate();
  const sliderRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // 스크롤 위치 체크
  const checkScrollPosition = () => {
    if (!sliderRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setShowLeftArrow(scrollLeft > 0);
    setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // 슬라이더 이동 핸들러
  const handleSlide = (direction: 'left' | 'right') => {
    if (!sliderRef.current) {
      return;
    }

    const slider = sliderRef.current;
    const slideDistance = (SLIDER_CONFIG.CARD_WIDTH + SLIDER_CONFIG.GAP) * 2;

    const newScrollLeft =
      direction === 'left' ? slider.scrollLeft - slideDistance : slider.scrollLeft + slideDistance;

    slider.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth',
    });

    setTimeout(checkScrollPosition, 300);
  };

  return (
    <section className='mb-10 sm:mb-20'>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Title as='h2' size='2xl' weight='bold'>
            인기 체험
          </Title>
        </div>
      </div>

      {/* 카드 슬라이더 */}
      <div className='relative -mx-6 px-6 sm:-mx-7.5 sm:px-7.5 lg:-mx-10 lg:px-10'>
        {/* 왼쪽 화살표 버튼 */}
        {showLeftArrow && (
          <button
            onClick={() => handleSlide('left')}
            className='absolute top-1/2 left-0 z-20 hidden -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110 sm:block'
            aria-label='이전 카드'>
            <ArrowRight className='h-6 w-6 rotate-180 text-gray-900' />
          </button>
        )}

        {/* 오른쪽 화살표 버튼 */}
        {showRightArrow && (
          <button
            onClick={() => handleSlide('right')}
            className='absolute top-1/2 right-0 z-20 hidden -translate-y-1/2 rounded-full bg-white p-3 shadow-lg transition-all hover:scale-110 sm:block'
            aria-label='다음 카드'>
            <ArrowRight className='h-6 w-6 text-gray-900' />
          </button>
        )}

        <div
          ref={sliderRef}
          onScroll={checkScrollPosition}
          className='scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth pb-4 sm:gap-6'>
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigate(`/activities/${activity.id}`)}
              className='w-[calc((100%-16px)/2)] shrink-0 cursor-pointer min-[460px]:w-[calc((100%-32px)/3)] sm:w-[calc((100%-24px)/2.5)] lg:w-70.5'>
              <ActivityGridCard activity={activity} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
