import Card from '@/components/common/card';
import type { Activity } from '@/apis/type';

type Props = {
  activity: Activity;
};

/**
 * 그리드형 체험 카드(이미지 + 제목 + 별점 + 가격).
 * PopularActivities / AllActivities에서 동일하게 반복되던 Card 조합을 통합.
 */
export default function ActivityGridCard({ activity }: Props) {
  return (
    <Card variant='grid'>
      <Card.Image src={activity.bannerImageUrl} alt={activity.title} />
      <Card.Content>
        <Card.Title title={activity.title} />
        <Card.Rating rating={activity.rating} reviewCount={activity.reviewCount} />
        <Card.Price price={activity.price} />
      </Card.Content>
    </Card>
  );
}
