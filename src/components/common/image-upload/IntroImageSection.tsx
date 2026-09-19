import ImageUpload from '@/components/common/image-upload/ImageUpload';

type ExistingSubImage = { id: number; imageUrl: string };

type IntroImageSectionProps = {
  images: File[];
  maxFiles: number;
  onAdd: (file: File) => void;
  onRemove: (index: number) => void;

  existingUrls?: ExistingSubImage[];
  onRemoveExisting?: (id: number) => void;
};

export default function IntroImageSection({
  images,
  maxFiles,
  onAdd,
  onRemove,
  existingUrls = [],
  onRemoveExisting,
}: IntroImageSectionProps) {
  const totalCount = existingUrls.length + images.length;
  const canAdd = totalCount < maxFiles;

  return (
    <div className='flex items-center gap-3'>
      {/* ✅ 업로드 슬롯: 항상 첫 칸 (추가 가능할 때만 표시) */}
      {canAdd && (
        <div className='relative z-0 shrink-0'>
          <ImageUpload onAdd={onAdd} fileCount={totalCount} maxFiles={maxFiles} />
        </div>
      )}

      {/* ✅ 기존 이미지들 */}
      {existingUrls.map((img) => (
        <div key={img.id} className='relative z-10 shrink-0'>
          <ImageUpload
            imageUrl={img.imageUrl}
            onRemove={() => onRemoveExisting?.(img.id)}
            fileCount={totalCount}
            maxFiles={maxFiles}
          />
        </div>
      ))}

      {/* ✅ 새로 추가한 파일들 */}
      {images.map((file, index) => (
        <div key={`${file.name}-${file.lastModified}`} className='relative z-10 shrink-0'>
          <ImageUpload
            file={file}
            onRemove={() => onRemove(index)}
            fileCount={totalCount}
            maxFiles={maxFiles}
          />
        </div>
      ))}
    </div>
  );
}
