import Dropdown from '@/components/common/dropdown/Dropdown';
import DropdownTrigger from '@/components/common/dropdown/DropdownTrigger';
import DropdownList from '@/components/common/dropdown/DropdownList';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { useDropdown } from '@/hooks/useDropdown';
import { ArrowDown, Calendar } from '@/assets/icons';
import { dayPickerKoreanProps, toShortYmd } from '@/utils/dateUtils';

function formatDate(date?: Date | string | null) {
  if (!date) {
    return '';
  }

  const parsed = typeof date === 'string' ? new Date(date) : date;

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toShortYmd(parsed);
}

function DateInput({ value }: { value?: Date }) {
  return (
    <div className='flex h-13.5 w-full items-center justify-between rounded-xl border border-gray-100 bg-white px-3 py-4 md:rounded-2xl md:px-5'>
      <span
        className={`font-md-medium md:font-lg-medium ${value ? 'text-gray-950' : 'text-gray-400'}`}>
        {value ? formatDate(value) : 'yy/mm/dd'}
      </span>
      <Calendar />
    </div>
  );
}

/**
 * DatePicker 컴포넌트
 *
 * - 날짜는 항상 하나 선택됩니다.
 * - 기존 날짜 → 새 날짜로 교체 가능합니다.
 * - 추가/삭제 버튼 없음 (부모에서 제어)
 */
export function DatePicker({ value, onChange }: { value?: Date; onChange: (date: Date) => void }) {
  return (
    <Dropdown className='relative w-full lg:max-w-90'>
      <DropdownTrigger className='w-full cursor-pointer'>
        <DateInput value={value} />
      </DropdownTrigger>
      <DropdownList className='absolute right-0 z-50 mt-2'>
        <InnerCalendar selectedDate={value} onSelect={onChange} />
      </DropdownList>
    </Dropdown>
  );
}

function InnerCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate?: Date;
  onSelect: (date: Date) => void;
}) {
  const { close } = useDropdown();

  const handleSelectDate = (date?: Date) => {
    if (!date) {
      return;
    }

    onSelect(date);
    close();
  };

  return (
    <DayPicker
      {...dayPickerKoreanProps}
      mode='single'
      selected={selectedDate}
      onSelect={handleSelectDate}
      className='font-md-medium h-80 w-full overflow-auto rounded-xl border border-gray-100 bg-white p-2 md:rounded-2xl'
      classNames={{
        // 캡션 전체(컨테이너)
        caption: 'relative mb-3 flex items-center justify-center',
        caption_label:
          'px-[10px] md:px-0 whitespace-nowrap text-base font-md-bold text-gray-900 pointer-events-none absolute top-3 lg:left-3 md:left-3 left-1',
      }}
      modifiersClassNames={{
        selected: 'bg-primary-100 text-primary-500 font-md-bold rounded-full',
        today: 'text-primary-950 font-md-medium',
        disabled: 'text-gray-300 cursor-not-allowed',
      }}
      components={{
        Chevron: ({ orientation, className, ...props }) => {
          const rotate = orientation === 'left' ? 'rotate-90' : '-rotate-90';
          return <ArrowDown {...props} className={`${className ?? ''} ${rotate} h-5 w-5`} />;
        },
      }}
      disabled={[{ before: new Date() }]}
    />
  );
}
