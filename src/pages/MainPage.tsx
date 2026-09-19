import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActivities } from '@/hooks/queries/useActivities';
import { SearchInput } from '@/components/SearchInput';
import { ACTIVITY_CATEGORIES } from '@/constants/activityCategory';
import MainBanner from './Main/MainBanner';
import PopularActivities from './Main/PopularActivities';
import AllActivities, { type Category, type PriceSort } from './Main/AllActivities';

// 유효한 카테고리 목록
const validCategories: Category[] = ['전체', ...ACTIVITY_CATEGORIES];

// 유효한 정렬 옵션
const validSorts: ('price_asc' | 'price_desc')[] = ['price_asc', 'price_desc'];

const MainPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const pageSize = 8;

  // URL에서 상태 읽기
  const categoryParam = searchParams.get('category');
  const selectedCategory: Category = validCategories.find((c) => c === categoryParam) ?? '전체';

  const sortParam = searchParams.get('sort');
  const priceSort: PriceSort = (validSorts.find((s) => s === sortParam) as PriceSort) ?? null;

  const searchKeyword = searchParams.get('keyword') || '';

  const pageParam = searchParams.get('page');
  const currentPage = pageParam ? Math.max(1, parseInt(pageParam, 10)) || 1 : 1;

  // 인기 체험 API (most_reviewed 정렬)
  const { data: popularActivitiesData } = useActivities({
    method: 'offset',
    page: 1,
    size: 10,
    sort: 'most_reviewed',
  });

  // 배너용 전체 체험 API (랜덤 선택을 위해 더 많은 데이터 가져오기)
  const { data: bannerActivitiesData, isLoading: isBannerLoading } = useActivities({
    method: 'offset',
    page: 1,
    size: 20,
    sort: 'latest',
  });

  // 랜덤 배너 체험 선택 (배너 데이터가 변경될 때마다 랜덤 체험을 다시 선택)
  const randomBannerActivity = useMemo(() => {
    const activities = bannerActivitiesData?.activities;
    if (!activities || activities.length === 0) {
      return null;
    }
    const randomIndex = Math.floor(Math.random() * activities.length);
    return activities[randomIndex];
  }, [bannerActivitiesData?.activities]);

  // 모든 체험 API (카테고리 필터링 + 페이지네이션 + 정렬 + 검색)
  const { data: allActivitiesData, isLoading } = useActivities({
    method: 'offset',
    page: currentPage,
    size: pageSize,
    category: selectedCategory === '전체' ? undefined : selectedCategory,
    keyword: searchKeyword.trim() || undefined,
    sort: priceSort || 'latest',
  });

  // 실제 로딩 상태 (초기 로딩일 때만 true, 이전 데이터 표시 중에는 false)
  const showLoading = isLoading && !allActivitiesData;

  // 페이지네이션 계산
  const totalPages = allActivitiesData ? Math.ceil(allActivitiesData.totalCount / pageSize) : 1;

  // URL 파라미터 업데이트 헬퍼 함수
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === '전체' || value === '1') {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      setSearchParams(params);
    },
    [searchParams, setSearchParams]
  );

  // 검색 핸들러
  const handleSearch = useCallback(
    (value: string) => {
      updateSearchParams({ keyword: value, page: null });
    },
    [updateSearchParams]
  );

  // 카테고리 필터 핸들러
  const handleCategoryChange = useCallback(
    (category: Category) => {
      updateSearchParams({ category, page: null });
    },
    [updateSearchParams]
  );

  // 가격 정렬 핸들러
  const handlePriceSortChange = useCallback(
    (sortValue: PriceSort) => {
      updateSearchParams({ sort: sortValue, page: null });
    },
    [updateSearchParams]
  );

  // 페이지 변경 핸들러
  const handlePageChange = useCallback(
    (page: number) => {
      updateSearchParams({ page: page.toString() });
    },
    [updateSearchParams]
  );

  return (
    <div className='w-full'>
      {/* 배너 영역 */}
      <MainBanner
        bannerImageUrl={randomBannerActivity?.bannerImageUrl}
        bannerTitle={randomBannerActivity?.title}
        isLoading={isBannerLoading}
      />

      {/* 흰색 배경 영역 */}
      <div className='mx-auto w-full max-w-300 px-6 sm:px-7.5 lg:px-10'>
        {/* 인기 체험 섹션 */}
        <PopularActivities activities={popularActivitiesData?.activities || []} />

        {/* 검색 영역 */}
        <section className='mb-10 sm:mb-16'>
          <SearchInput
            title='무엇을 체험하고 싶으신가요?'
            placeholder='내가 원하는 체험은'
            onSearch={handleSearch}
            searchButtonText='검색하기'
            showButton
            minLength={0}
            enableRealtimeSearch
            debounceMs={300}
          />
        </section>

        {/* 모든 체험 섹션 */}
        <AllActivities
          activities={allActivitiesData?.activities || []}
          isLoading={showLoading}
          searchKeyword={searchKeyword}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          priceSort={priceSort}
          onPriceSortChange={handlePriceSortChange}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default MainPage;
