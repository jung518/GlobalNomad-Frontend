import { useNavigate } from 'react-router-dom';
import { FilterButton } from '@/components/common/button/FilterButton';
import Pagination from '@/components/common/pagination';
import Title from '@/components/common/Title';
import { Art, Food, Sport, Tour, Bus, Wellbeing } from '@/assets/icons';
import Dropdown from '@/components/common/dropdown/Dropdown';
import DropdownTrigger from '@/components/common/dropdown/DropdownTrigger';
import DropdownList from '@/components/common/dropdown/DropdownList';
import DropdownItem from '@/components/common/dropdown/DropdownItem';
import ActivityGridCard from '@/components/ActivityGridCard';
import type { Activity, ActivityCategory } from '@/apis/type';

// 카테고리 타입 정의
type Category = '전체' | ActivityCategory;

// 가격 정렬 타입 정의
type PriceSort = 'price_asc' | 'price_desc' | null;

// 카테고리 아이콘 매핑
const categoryIconMap: Record<ActivityCategory, React.ReactNode> = {
  '문화 · 예술': <Art />,
  식음료: <Food />,
  스포츠: <Sport />,
  투어: <Tour />,
  관광: <Bus />,
  웰빙: <Wellbeing />,
};

// 전체 카테고리 목록
const categories: Category[] = ['전체', ...Object.keys(categoryIconMap)] as Category[];

// 가격 정렬 옵션
const priceSortOptions: { label: string; value: PriceSort }[] = [
  { label: '가격 낮은 순', value: 'price_asc' },
  { label: '가격 높은 순', value: 'price_desc' },
];

interface AllActivitiesProps {
  activities: Activity[];
  isLoading: boolean;
  searchKeyword: string;
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
  priceSort: PriceSort;
  onPriceSortChange: (sort: PriceSort) => void;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function AllActivities({
  activities,
  isLoading,
  searchKeyword,
  selectedCategory,
  onCategoryChange,
  priceSort,
  onPriceSortChange,
  currentPage,
  totalPages,
  onPageChange,
}: AllActivitiesProps) {
  const navigate = useNavigate();

  // 현재 선택된 가격 정렬 라벨
  const currentPriceSortLabel = priceSort
    ? priceSortOptions.find((option) => option.value === priceSort)?.label
    : '가격';

  return (
    <section className='mb-20'>
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Title as='h2' size='2xl' weight='bold'>
            모든 체험
          </Title>
        </div>

        {/* 가격 정렬 드롭다운 */}
        <Dropdown className='relative'>
          <DropdownTrigger className='font-md-medium flex items-center gap-1 text-gray-700 transition-colors hover:text-gray-900'>
            <span>{currentPriceSortLabel}</span>
            <svg
              className='h-5 w-5'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
              xmlns='http://www.w3.org/2000/svg'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M19 9l-7 7-7-7'
              />
            </svg>
          </DropdownTrigger>
          <DropdownList className='absolute top-full right-0 z-10 mt-2 min-w-35 rounded-lg border border-gray-200 bg-white shadow-lg'>
            {priceSortOptions.map((option) => (
              <DropdownItem
                key={option.value}
                onClick={() => onPriceSortChange(option.value)}
                className='font-md-medium cursor-pointer px-4 py-2.5 text-gray-900 transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50'>
                {option.label}
              </DropdownItem>
            ))}
          </DropdownList>
        </Dropdown>
      </div>

      {/* 카테고리 필터 */}
      <div className='scrollbar-hide -mx-6 mb-8 overflow-x-auto px-6 sm:-mx-7.5 sm:px-7.5 lg:-mx-10 lg:px-10'>
        <div className='flex gap-2 sm:gap-3'>
          {categories.map((category) => (
            <FilterButton
              key={category}
              size='md'
              icon={category === '전체' ? null : categoryIconMap[category as ActivityCategory]}
              selected={selectedCategory === category}
              onClick={() => onCategoryChange(category)}
              className='shrink-0'>
              {category}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* 체험 카드 그리드 */}
      {isLoading ? (
        <div className='flex h-100 items-center justify-center'>
          <span className='font-lg-medium text-gray-500'>체험을 불러오는 중...</span>
        </div>
      ) : activities.length > 0 ? (
        <div className='mb-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4'>
          {activities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => navigate(`/activities/${activity.id}`)}
              className='cursor-pointer'>
              <ActivityGridCard activity={activity} />
            </div>
          ))}
        </div>
      ) : (
        <div className='flex h-100 items-center justify-center'>
          <span className='font-lg-medium text-gray-500'>
            {searchKeyword.trim() ? '검색 결과가 없습니다.' : '체험이 없습니다.'}
          </span>
        </div>
      )}

      {/* 페이지네이션 */}
      <div className='flex justify-center'>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange}>
          <Pagination.Prev />
          <Pagination.Items />
          <Pagination.Next />
        </Pagination>
      </div>
    </section>
  );
}

export type { Category, PriceSort };
