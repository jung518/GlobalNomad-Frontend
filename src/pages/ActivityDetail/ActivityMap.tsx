import { useEffect, useRef, useState } from 'react';
import { KAKAOMAP_KEY } from '@/libs/config';

interface ActivityMapProps {
  address: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

export default function ActivityMap({ address }: ActivityMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState(false);

  // 카카오 지도 스크립트 동적 로드
  useEffect(() => {
    if (!KAKAOMAP_KEY) {
      return;
    }

    // 이미 카카오 지도가 완전히 로드되어 있으면 바로 사용
    if (window.kakao && window.kakao.maps) {
      window.kakao.maps.load(() => {
        setIsKakaoLoaded(true);
      });
      return;
    }

    // 스크립트 동적 추가
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAOMAP_KEY}&libraries=services&autoload=false`;

    script.onload = () => {
      // 카카오 지도 로드 대기
      window.kakao.maps.load(() => {
        setIsKakaoLoaded(true);
      });
    };

    document.head.appendChild(script);

    return () => {
      // 컴포넌트 언마운트 시 스크립트 제거
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (!mapContainer.current || !isKakaoLoaded) {
      return;
    }

    const { kakao } = window;

    // 주소 없이 기본 좌표로 지도 생성 (서울 시청)
    const defaultCoords = new kakao.maps.LatLng(37.5665, 126.978);

    // 지도 생성
    const map = new kakao.maps.Map(mapContainer.current, {
      center: defaultCoords,
      level: 3,
    });

    // 주소로 좌표 검색
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === kakao.maps.services.Status.OK) {
        const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

        // 지도 중심 이동
        map.setCenter(coords);

        // 마커 생성
        const marker = new kakao.maps.Marker({
          map: map,
          position: coords,
        });

        // 인포윈도우 생성
        const infowindow = new kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;">${address}</div>`,
        });
        infowindow.open(map, marker);
      }
    });
  }, [address, isKakaoLoaded]);

  if (!isKakaoLoaded) {
    return (
      <div className='flex h-[476px] w-full items-center justify-center rounded-xl bg-gray-100'>
        <span className='font-md-medium text-gray-500'>지도를 불러오는 중...</span>
      </div>
    );
  }

  return <div ref={mapContainer} className='h-[476px] w-full rounded-xl' />;
}
