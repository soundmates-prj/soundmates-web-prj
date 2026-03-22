import { Music2, Play } from "lucide-react";
import "./ShareCard.css";

export type ShareCardTemplate = "dark" | "light" | "gradient" | "minimal";

export interface ShareCardData {
  trackId: string;
  title: string;
  artist: string;
  albumImage: string;
  previewUrl?: string | null;
  template: ShareCardTemplate;
}

interface ShareCardProps {
  data: ShareCardData;
  compact?: boolean;
}

export default function ShareCard({ data, compact = false }: ShareCardProps) {
  const normalizedTemplate = (data.template || "gradient").toLowerCase();
  const template: ShareCardTemplate =
    normalizedTemplate === "dark" ||
    normalizedTemplate === "light" ||
    normalizedTemplate === "gradient" ||
    normalizedTemplate === "minimal"
      ? normalizedTemplate
      : "gradient";

  return (
    <div className={`sm-share-card sm-share-card--${template} ${compact ? "sm-share-card--compact" : ""}`}>
      <div className="sm-share-card__bg-glow" />
      <div className="sm-share-card__content">
        <div className="sm-share-card__album-wrap">
          <img
            src={data.albumImage}
            alt={data.title}
            className="sm-share-card__album"
            loading="lazy"
          />
        </div>

        <div className="sm-share-card__meta">
          <div className="sm-share-card__tag">
            <Music2 size={13} />
            <span>SoundMates Share</span>
          </div>

          <h4 className="sm-share-card__title">{data.title}</h4>
          <p className="sm-share-card__artist">{data.artist}</p>

          <div className="sm-share-card__footer">
            <span className="sm-share-card__logo">SoundMates</span>
            {data.previewUrl ? (
              <span className="sm-share-card__preview">
                <Play size={12} />
                Preview
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
