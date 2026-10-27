"use client";

import CommentSection from "./CommentSection";

export default function MusicCommentSection({
  targetId,
  externalHref,
}: {
  targetId: number;
  externalHref?: string;
}) {
  return (
    <div className="music-comment-section">
      <CommentSection
        targetType="TRACK"
        targetId={targetId}
        title="歌曲评论"
        emptyTitle="还没有评论"
        emptyDescription="成为第一个讨论这首歌的人"
        emptyActionLabel="写评论"
        externalHref={externalHref}
        externalLabel="去网易云查看热评"
      />
    </div>
  );
}
