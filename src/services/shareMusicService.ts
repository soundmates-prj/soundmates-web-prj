import api from "./axios";
import type { Post } from "../types/post";
import type { ShareCardTemplate } from "../components/blog/ShareCard";

export interface ShareMusicRequest {
  trackId: string;
  title: string;
  artist: string;
  albumImage: string;
  previewUrl?: string | null;
  template: ShareCardTemplate;
}

class ShareMusicService {
  async share(payload: ShareMusicRequest): Promise<Post> {
    const res = await api.post("posts/share-music", payload);
    return res.data?.data ?? res.data;
  }
}

export default new ShareMusicService();
