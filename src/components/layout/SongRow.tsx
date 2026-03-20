import React from "react";
import { Check, Plus, X } from "lucide-react";
import "./SongRow.css";

export interface Song {
  id: string;
  title: string;
  artist: string;
  cover: string;
  added: boolean;
  albumName?: string;
  itemId?: string;
  source?: string;
  durationMs?: number;
  externalUrl?: string;
}

interface Props {
  song: Song;
  /** "left" = search panel (toggle add/remove),  "right" = favorites panel (remove only) */
  variant: "left" | "right";
  onToggle: (id: string) => void;
}

const SongRow: React.FC<Props> = ({ song, variant, onToggle }) => (
  <div className="song-row">
    <img src={song.cover} alt={song.title} className="song-cover" />

    <div className="song-info">
      <span className="song-title">{song.title}</span>
      <span className="song-artist">{song.artist}</span>
    </div>

    {variant === "left" ? (
      <button
        className={`song-toggle-btn ${song.added ? "is-added" : "is-add"}`}
        onClick={() => onToggle(song.id)}
      >
        {song.added ? (
          <>
            <Check size={12} /> Thêm rồi
          </>
        ) : (
          <>
            <Plus size={12} /> Thêm
          </>
        )}
      </button>
    ) : (
      <button className="song-remove-btn" onClick={() => onToggle(song.id)}>
        <X size={14} />
      </button>
    )}
  </div>
);

export default SongRow;
