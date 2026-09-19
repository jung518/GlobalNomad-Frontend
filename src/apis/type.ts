/**
 * API 요청/응답 타입 정의
 *
 * 이 파일은 API 통신에 사용되는 요청(Request)과 응답(Response) 타입을 정의합니다.
 * 각 API 엔드포인트별로 타입을 그룹화하여 관리합니다.
 *
 * @example
 * import type {
    ActivityDetailResponse,
    ActivityRequest,
    ActivityResponse,
    CreateActivityRequest,
    CreateActivityResponse,
  } from '@/apis/type';

 * const activityApi = {
    // 체험 리스트 조회
    getActivities: async (params: ActivityRequest) => {
      return http.get<ActivityResponse>('/activities', {
        params,
      });
    },
    // 체험 등록
    createActivity: async (data: CreateActivityRequest) => {
      return http.post<CreateActivityResponse>('/activities', data);
    },
    // 체험 상세 조회
    getActivityDetail: async (activityId: number) => {
      return http.get<ActivityDetailResponse>(`/activities/${activityId}`);
    },
  };
 */

import type { ReservationStatus } from '@/types/reservation';

export type ActivityCategory = '문화 · 예술' | '식음료' | '투어' | '스포츠' | '관광' | '웰빙';

// 사용자 인증 관련 타입
export interface SignupRequest {
  email: string;
  password: string;
  passwordConfirm: string;
}

/**
 * 활동(Activity) 관련 타입
 */

export interface Activity {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  price: number;
  address: string;
  bannerImageUrl: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

// 체험 리스트 조회
export interface ActivityRequest {
  method: 'cursor' | 'offset';
  cursorId?: number;
  category?: ActivityCategory;
  keyword?: string;
  sort?: 'most_reviewed' | 'price_asc' | 'price_desc' | 'latest';
  page?: number;
  size?: number;
}

// 체험 리스트 응답
export interface ActivityResponse {
  cursorId: number;
  totalCount: number;
  activities: Activity[];
}

// 체험 등록 요청
export interface CreateActivityRequest {
  title: string;
  category: string;
  description: string;
  address: string;
  price: number;
  bannerImageUrl: string;
  subImageUrls: string[];
  schedules: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}
// 체험 등록 응답
export interface CreateActivityResponse {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  price: number;
  address: string;
  bannerImageUrl: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  subImages: { id: number; imageUrl: string }[];
  schedules: { times: { endTime: string; startTime: string; id: number }[]; date: string }[];
}

// 체험 상세 조회 응답
export interface ActivityDetailResponse {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  price: number;
  address: string;
  bannerImageUrl: string;
  subImages: { id: number; imageUrl: string }[];
  schedules: { id: number; date: string; startTime: string; endTime: string }[];
  reviewCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

// 체험 예약 가능일 조회 요청 /  내 체험 월별 예약 현황 조회 요청
export interface ActivityScheduleParams {
  activityId: number;
  year: number; // Example : 2024
  month: number; // Example : 01
}

// 체험 예약 가능일 조회 응답
export type ActivityScheduleResponse = {
  date: string;
  times: {
    id: number;
    startTime: string;
    endTime: string;
  }[];
};

// 체험 리뷰 조회 요청
export interface ActivityReviewParams {
  activityId: number;
  page?: number; // Default value : 1
  size?: number; // Default value : 3
}

// 체험 리뷰 조회 응답
export interface ActivityReviewResponse {
  averageRating: number;
  totalCount: number;
  reviews: {
    id: number;
    user: {
      profileImageUrl: string;
      nickname: string;
      id: number;
    };
    activityId: number;
    rating: number;
    content: string;
    createdAt: string; // "2025-12-30T14:24:12.367Z"
    updatedAt: string; // "2025-12-30T14:24:12.367Z"
  }[];
}

// 체험 예약 신청 요청
export interface ActivityReservationRequest {
  scheduleId: number;
  headCount: number;
}

// 체험 이미지 url 생성
export interface CreateActivityImageRequest {
  image: string;
}

// 체험 이미지 url 생성 응답
export interface CreateActivityImageResponse {
  activityImageUrl: string;
}

/**
 * Auth 타입
 */
export interface LoginRequest {
  email: string;
  password: string;
}

// 로그인 응답
export interface LoginResponse extends RefreshTokenResponse {
  user: User;
}

// 토큰 재발급 응답
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

/**
 * MyActivites 타입
 */

// 내 체험 리스트 조회 요청
export interface MyActivitiesParams {
  cursorId?: number;
  size?: number; // Default value : 20
}
// 내 체험 리스트 조회 응답
export interface MyActivitiesResponse {
  cursorId: number;
  totalCount: number;
  activities: Activity[];
}
// 내 체험 월별 예약 현황 조회 응답 ( MyActivitySchedule[]로 사용)
export interface MyActivitySchedulesResponse {
  date: string;
  reservations: {
    completed: number;
    confirmed: number;
    pending: number;
  };
}
// 내 체험 날짜별 예약 정보(신청, 승인, 거절)가 있는 스케줄 요청 파라미터
export interface MyActivityScheduleParams {
  activityId: number;
  date: string;
}
// 내 체험 날짜별 예약 정보(신청, 승인, 거절)가 있는 스케줄 조회 응답
export interface MyActivitySchedule {
  scheduleId: number;
  startTime: string;
  endTime: string;
  count: {
    declined: number;
    confirmed: number;
    pending: number;
  };
}
// 내 체험 예약 시간대별 예약 내역 조회 요청 파라미터
export interface MyActivityReservationParams {
  activityId: number;
  cursorId?: number;
  size?: number; // Default value : 10
  scheduleId: number;
  status: 'declined' | 'pending' | 'confirmed';
}
// 내 체험 예약 시간대별 예약 내역 조회 응답
export interface MyActivityReservationResponse {
  cursorId: number;
  totalCount: number;
  reservations: {
    id: number;
    nickname: string;
    userId: number;
    teamId: string;
    activityId: number;
    scheduleId: number;
    status: 'declined' | 'pending' | 'confirmed';
    reviewSubmitted: boolean;
    totalPrice: number;
    headCount: number;
    date: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
  }[];
}
// 내 체험 예약 상태(승인, 거절) 업데이트 요청 파라미터
export interface UpdateMyActivityReservationStatusParams {
  activityId: number;
  reservationId: number;
}
// 내 체험 예약 상태(승인, 거절) 업데이트 요청
export interface UpdateMyActivityReservationStatusRequest {
  status: 'declined';
}
// 내 체험 예약 상태(승인, 거절) 업데이트 응답
export interface UpdateMyActivityReservationStatusResponse {
  id: number;
  userId: number;
  teamId: string;
  activityId: number;
  scheduleId: number;
  status: string;
  reviewSubmitted: boolean;
  totalPrice: number;
  headCount: number;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

// 내 체험 수정 요청
export type MyActivityEditRequest = {
  title: string;
  category: ActivityCategory;
  description: string;
  price: number;
  address: string;
  bannerImageUrl: string;
  subImageIdsToRemove: number[];
  subImageUrlsToAdd: string[];
  scheduleIdsToRemove: number[];
  schedulesToAdd: { date: string; startTime: string; endTime: string }[];
};

// 내 체험 수정 응답
export interface MyActivityEditResponse {
  id: number;
  userId: number;
  title: string;
  description: string;
  category: string;
  price: number;
  address: string;
  bannerImageUrl: string;
  subImages: { id: number; imageUrl: string }[];
  schedules: { times: { endTime: string; startTime: string; id: number }[]; date: string }[];
  reviewCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * MyNotifications 타입
 */
export interface MyNotification {
  id: number;
  teamId: string;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

// 내 알림 리스트 조회 응답
export interface NotificationsResponse {
  totalCount: number;
  notifications: MyNotification[];
  cursorId: number;
}

/**
 * MyReservation 타입
 */

// 내 예약 리스트 조회 응답
export interface MyReservationsResponse {
  cursorId: number;
  reservations: {
    id: number;
    teamId: string;
    userId: number;
    activity: {
      bannerImageUrl: string;
      title: string;
      id: number;
    };
    scheduleId: number;
    status: ReservationStatus;
    reviewSubmitted: boolean;
    totalPrice: number;
    headCount: number;
    date: string;
    startTime: string;
    endTime: string;
    createdAt: string;
    updatedAt: string;
  }[];
  totalCount: number;
}
// 내 예약 수정(취소) 요쳥
export interface MyReservationEditRequest {
  status: 'canceled';
}
// 내 예약 수정(취소) 응답
export interface MyReservationEditResponse {
  id: number;
  teamId: string;
  userId: number;
  activityId: number;
  scheduleId: number;
  status: string;
  reviewSubmitted: boolean;
  totalPrice: number;
  headCount: number;
  date: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
}

// 내 예약 리뷰 작성
export interface MyReservationReviewRequest {
  rating: number;
  content: string;
}
// 내 예약 리뷰 작성 응답
export interface MyReservationReviewResponse {
  id: number;
  userId: number;
  activityId: number;
  rating: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  teamId: string;
}

/**
 * OAuth 타입
 */
// 간편 로그인 파라미터
export interface OAuthParams {
  provider: 'google' | 'kakao';
}

// 간편 로그인 App 등록/수정
export interface OAuthAppRequest {
  appKey: string;
  provider: OAuthParams;
}
// 간편 회원가입 요청
export interface OAuthSignupRequest {
  nickname: string;
  redirectUri: string;
  token: string;
}
// 간편 회원가입/로그인 응답
export interface OAuthSignupResponse {
  user: {
    id: number;
    email: string;
    nickname: string;
    profileImageUrl: string;
    createdAt: string;
    updatedAt: string;
  } & RefreshTokenResponse;
}

// 간편 로그인 요청
export interface OAuthLoginRequest {
  redirectUri: string;
  token: string;
}

/**
 * User 타입
 */
// 회원가입 요청
export interface UserSignupRequest {
  email: string;
  nickname: string;
  password: string;
}
// 회원가입 응답 / 내 정보 조회 응답 / 내 정보 수정 응답
export interface User {
  id: number;
  email: string;
  nickname: string;
  profileImageUrl: string;
  createdAt: string;
  updatedAt: string;
}
// 내 정보 수정
export interface UserEditRequest {
  nickname: string;
  profileImageUrl: string;
  newPassword: string;
}
