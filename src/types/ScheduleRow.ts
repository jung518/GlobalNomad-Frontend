export type ScheduleRow = {
  uiId: string;
  date: Date;
  startTime: string;
  endTime: string;
  /** 서버에 이미 존재하는 스케줄이면 그 id(수정 페이지에서만 존재). 새로 추가한 행이면 undefined */
  serverTimeId?: number;
};
