import { useQuery } from '@tanstack/react-query';
import { getMyActivityReservations } from '@/apis/getMyActivityReservations';
import type { MyActivityReservationResponse } from '@/apis/type';
import type { ReservationStatus } from '@/types/reservation';

export function useMyActivityReservations(
  activityId?: number,
  scheduleId?: number | null,
  status?: ReservationStatus,
  dateYmd?: string,
  open?: boolean
) {
  return useQuery<MyActivityReservationResponse>({
    queryKey: ['myActivityReservations', activityId, scheduleId, status, dateYmd],
    queryFn: () =>
      getMyActivityReservations(activityId!, {
        scheduleId: scheduleId!,
        status: status!,
        date: dateYmd,
      }),
    enabled: Boolean(open && activityId && scheduleId && status),
  });
}
