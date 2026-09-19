import { http } from '@/apis/http';
import type { MyActivityReservationResponse } from '@/apis/type';
import type { ReservationStatus } from '@/types/reservation';

export type GetMyActivityReservationsParams = {
  scheduleId: number;
  status: ReservationStatus;
  date?: string;
  cursorId?: number;
  size?: number;
};

export async function getMyActivityReservations(
  activityId: number,
  params: GetMyActivityReservationsParams
) {
  const res = await http.get<MyActivityReservationResponse>(
    `/my-activities/${activityId}/reservations`,
    { params }
  );
  return res.data;
}
