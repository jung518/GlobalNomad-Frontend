import { useEffect, useRef } from 'react';

type Params = {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

/**
 * react-query useInfiniteQuery와 함께 쓰는 무한 스크롤 관찰용 훅.
 * 반환한 ref를 리스트 하단의 sentinel 엘리먼트에 걸어두면
 * 화면에 보일 때 자동으로 fetchNextPage를 호출한다.
 *
 * MyActivitiesPage / ReservationPage에 동일하게 복붙되어 있던
 * IntersectionObserver 설정을 공통화한 것.
 */
export function useInfiniteScrollObserver({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Params) {
  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!targetRef.current || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    observer.observe(targetRef.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  return targetRef;
}
