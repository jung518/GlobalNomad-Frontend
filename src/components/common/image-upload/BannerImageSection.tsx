import ImageUpload from '@/components/common/image-upload/ImageUpload';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

type BannerImageSectionProps = {
  images: File[];
  maxFiles?: number;
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;
  existingUrl?: string;
  onRemoveExisting?: () => void;
};

export default function BannerImageSection({
  images,
  maxFiles = 1,
  onAdd,
  onRemove,
  onRemoveExisting,
  existingUrl,
}: BannerImageSectionProps) {
  const hasFile = images.length > 0;

  const handleAdd = (file: File) => {
    if (file.size > MAX_IMAGE_SIZE) {
      alert('이미지 용량은 2MB 이하만 업로드할 수 있어요.');
      return;
    }

    onAdd(file);
  };

  return (
    <div className='flex items-center gap-3'>
      {hasFile || existingUrl ? (
        <ImageUpload
          file={hasFile ? images[0] : undefined}
          imageUrl={hasFile ? undefined : existingUrl} // ✅ 이게 맞아 (새 파일 우선)
          onAdd={handleAdd}
          onRemove={() => {
            if (hasFile) {
              onRemove(0);
            } else {
              onRemoveExisting?.();
            } // ✅ 기존 URL 삭제는 이걸로
          }}
          fileCount={1}
          maxFiles={maxFiles}
        />
      ) : (
        <ImageUpload onAdd={handleAdd} fileCount={0} maxFiles={maxFiles} />
      )}
    </div>
  );
}
