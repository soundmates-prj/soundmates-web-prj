import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Headphones,
  Loader2,
  Mic2,
  Music,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
  Upload,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  liveSessionApiService,
  type EpisodeResult,
  type PodcastRequestResult,
  type PodcastResult,
} from "../../../services/liveSessionApiService";
import { showError, showSuccess } from "../../../components/common/toastUtils";
import { uploadAudio, uploadImage } from "../../../utils/cloudinaryUpload";
import { resolveAuthor } from "../../../types/podcast";
import "./LiveOps.css";

/* ────────────────────────────────────────────
   Helpers
   ──────────────────────────────────────────── */

const getAudioDuration = (file: File): Promise<number> =>
  new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.preload = "metadata";
    const url = URL.createObjectURL(file);
    audio.src = url;

    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    };

    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Không thể đọc metadata audio"));
    };
  });

const fmtDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainSeconds = seconds % 60;
  return `${minutes}:${String(remainSeconds).padStart(2, "0")}`;
};

const fmtDate = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const fmtDateTime = (value: string | null) => {
  if (!value) return "—";
  return new Date(value).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const normalizeStatus = (status?: string | null) =>
  (status || "").trim().toLowerCase();

const getAuthorName = (request: PodcastRequestResult) =>
  typeof request.authorInfo?.name === "string" && request.authorInfo.name.trim()
    ? request.authorInfo.name
    : "Không rõ";

const getAuthorEmail = (request: PodcastRequestResult) =>
  typeof request.authorInfo?.email === "string" ? request.authorInfo.email : "";

const getAuthorPlan = (request: PodcastRequestResult) =>
  typeof request.authorInfo?.plan === "string" && request.authorInfo.plan.trim()
    ? request.authorInfo.plan
    : "—";

const getRequestType = (request: PodcastRequestResult) =>
  typeof request.type === "string" && request.type.trim()
    ? request.type
    : "Podcast";

const getRequestPrice = (request: PodcastRequestResult) =>
  typeof request.price === "number"
    ? request.price
    : Number(request.price || 0);

type PodcastTab = "podcasts" | "requests";

type ConfirmDialogState = {
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: "danger" | "primary";
  onConfirm: () => void;
} | null;

type RejectDialogState = {
  id: string;
  title: string;
  reason: string;
} | null;

/* ══════════════════════════════════════════════
   PodcastPage
   ══════════════════════════════════════════════ */

export default function PodcastPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<PodcastTab>("podcasts");

  const [podcasts, setPodcasts] = useState<PodcastResult[]>([]);
  const [loadingPodcasts, setLoadingPodcasts] = useState(true);

  const [requests, setRequests] = useState<PodcastRequestResult[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateEp, setShowCreateEp] = useState<string | null>(null);

  const [requestSearch, setRequestSearch] = useState("");
  const [requestKeyword, setRequestKeyword] = useState("");
  const [requestStatus, setRequestStatus] = useState("all");

  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [rejectDialog, setRejectDialog] = useState<RejectDialogState>(null);

  const pendingCount = useMemo(
    () =>
      requests.filter((item) => normalizeStatus(item.status) === "pending")
        .length,
    [requests],
  );

  const requestSummary = useMemo(
    () => ({
      pending: requests.filter(
        (item) => normalizeStatus(item.status) === "pending",
      ).length,
      approved: requests.filter(
        (item) => normalizeStatus(item.status) === "approved",
      ).length,
      rejected: requests.filter(
        (item) => normalizeStatus(item.status) === "rejected",
      ).length,
    }),
    [requests],
  );

  const loadPodcasts = async () => {
    setLoadingPodcasts(true);
    try {
      const data = await liveSessionApiService.getPodcasts();
      setPodcasts(data);
    } catch {
      showError("Lỗi", "Không thể tải danh sách podcast");
    } finally {
      setLoadingPodcasts(false);
    }
  };

  const loadRequests = async (options?: {
    silent?: boolean;
    status?: string;
    search?: string;
  }) => {
    const status = options?.status ?? requestStatus;
    const search = options?.search ?? requestKeyword;

    if (!options?.silent) {
      setLoadingRequests(true);
    }

    try {
      const data = await liveSessionApiService.getPodcastRequests({
        status: status === "all" ? undefined : status,
        search: search.trim() || undefined,
      });
      setRequests(data);
    } catch {
      showError("Không thể tải podcast request");
    } finally {
      if (!options?.silent) {
        setLoadingRequests(false);
      }
    }
  };

  const refreshActiveTab = () => {
    if (activeTab === "podcasts") {
      void loadPodcasts();
      return;
    }

    void loadRequests();
  };

  useEffect(() => {
    void loadPodcasts();
    void loadRequests({ silent: true, status: "all", search: "" });
  }, []);

  useEffect(() => {
    if (activeTab === "requests") {
      void loadRequests();
    }
  }, [activeTab, requestStatus]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const deletePodcast = async (id: string) => {
    try {
      await liveSessionApiService.deletePodcast(id);
      setPodcasts((prev) => prev.filter((item) => item.id !== id));
      if (expandedId === id) {
        setExpandedId(null);
      }
      showSuccess("Đã xóa podcast");
    } catch {
      showError("Xóa podcast thất bại");
    }
  };

  const askDeletePodcast = (id: string, title: string) => {
    setConfirmDialog({
      title: "Xóa podcast",
      message: `Bạn có chắc muốn xóa "${title}"? Tất cả các tập trong podcast này cũng sẽ bị xóa.`,
      confirmText: "Xóa",
      confirmVariant: "danger",
      onConfirm: () => {
        setConfirmDialog(null);
        void deletePodcast(id);
      },
    });
  };

  const askApproveRequest = (request: PodcastRequestResult) => {
    const authorName = getAuthorName(request);

    setConfirmDialog({
      title: "Duyệt podcast request",
      message: `Bạn có chắc muốn duyệt podcast "${request.title}" của ${authorName} không?`,
      confirmText: "Duyệt",
      confirmVariant: "primary",
      onConfirm: () => {
        setConfirmDialog(null);
        void reviewRequest(request.id, "approve");
      },
    });
  };

  const askRejectRequest = (request: PodcastRequestResult) => {
    setRejectDialog({
      id: request.id,
      title: request.title,
      reason: "",
    });
  };

  const reviewRequest = async (
    id: string,
    action: "approve" | "reject",
    rejectReason?: string,
  ) => {
    try {
      setReviewingId(id);

      await liveSessionApiService.reviewPodcastRequest(id, {
        action,
        rejectReason: action === "reject" ? rejectReason?.trim() : undefined,
      });

      showSuccess(
        action === "approve"
          ? "Duyệt podcast request thành công"
          : "Đã từ chối podcast request",
      );

      await loadRequests({ status: requestStatus, search: requestKeyword });

      if (activeTab === "podcasts") {
        await loadPodcasts();
      }
    } catch {
      showError(
        action === "approve"
          ? "Duyệt podcast request thất bại"
          : "Từ chối podcast request thất bại",
      );
    } finally {
      setReviewingId(null);
    }
  };

  const submitRequestSearch = () => {
    const keyword = requestSearch.trim();
    setRequestKeyword(keyword);
    void loadRequests({
      status: requestStatus,
      search: keyword,
    });
  };

  const clearRequestFilters = () => {
    setRequestSearch("");
    setRequestKeyword("");
    setRequestStatus("Pending");
    void loadRequests({
      status: "Pending",
      search: "",
    });
  };

  const renderRequestsToolbar = () => (
    <>
      <div className="ops-card pod-requests-toolbar-card">
        <div className="pod-requests-toolbar">
          <div className="pod-search-wrap">
            <Search size={16} className="pod-search-icon" />
            <input
              className="ops-input pod-search-input"
              placeholder="Tìm theo tên podcast hoặc người gửi..."
              value={requestSearch}
              onChange={(e) => setRequestSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  submitRequestSearch();
                }
              }}
            />
          </div>

          <select
            className="ops-select pod-filter-select"
            value={requestStatus}
            onChange={(e) => setRequestStatus(e.target.value)}
          >
            <option value="Pending">Chờ duyệt</option>
            <option value="Approved">Đã duyệt</option>
            <option value="Rejected">Đã từ chối</option>
            <option value="all">Tất cả trạng thái</option>
          </select>

          <button
            className="ops-btn ops-btn--ghost"
            type="button"
            onClick={submitRequestSearch}
          >
            <Search size={14} />
            Tìm
          </button>

          <button
            className="ops-btn ops-btn--ghost"
            type="button"
            onClick={clearRequestFilters}
          >
            <X size={14} />
            Xóa lọc
          </button>
        </div>
      </div>

      <div className="pod-request-summary">
        <div className="pod-summary-chip">
          <span className="dot pending" />
          Chờ duyệt: {requestSummary.pending}
        </div>
        <div className="pod-summary-chip">
          <span className="dot approved" />
          Đã duyệt: {requestSummary.approved}
        </div>
        <div className="pod-summary-chip">
          <span className="dot rejected" />
          Đã từ chối: {requestSummary.rejected}
        </div>
      </div>
    </>
  );

  const renderRequestList = (
    list: PodcastRequestResult[],
    isLoading: boolean,
    emptyText: string,
  ) => (
    <div className="pod-request-list">
      {isLoading ? (
        <div className="ops-card">
          <div className="ops-stack">
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
            <div className="ops-skeleton" />
          </div>
        </div>
      ) : list.length === 0 ? (
        <div className="ops-card">
          <div className="ops-empty">{emptyText}</div>
        </div>
      ) : (
        list.map((request) => (
          <PodcastRequestCard
            key={request.id}
            request={request}
            reviewing={reviewingId === request.id}
            onApprove={() => askApproveRequest(request)}
            onReject={() => askRejectRequest(request)}
          />
        ))
      )}
    </div>
  );

  const renderContent = () => {
    if (activeTab === "podcasts") {
      return (
        <div className="ops-card">
          {loadingPodcasts ? (
            <div className="ops-stack">
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
            </div>
          ) : podcasts.length === 0 ? (
            <div className="ops-empty">Chưa có podcast nào</div>
          ) : (
            <div className="ops-stack" style={{ gap: 0 }}>
              {podcasts.map((podcast) => (
                <PodcastRow
                  key={podcast.id}
                  podcast={podcast}
                  expanded={expandedId === podcast.id}
                  onToggle={() => toggleExpand(podcast.id)}
                  onEdit={() => navigate(`/admin/podcasts/${podcast.id}`)}
                  onDelete={() => askDeletePodcast(podcast.id, podcast.title)}
                  onCreateEpisode={() => setShowCreateEp(podcast.id)}
                  onEpisodeChange={loadPodcasts}
                  onAskConfirm={setConfirmDialog}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        {renderRequestsToolbar()}
        {renderRequestList(
          requests,
          loadingRequests,
          "Không có podcast request phù hợp",
        )}
      </>
    );
  };

  return (
    <div className="ops-page">
      <div className="ops-header">
        <div>
          <h1 className="ops-title">Trang Podcast</h1>
          <p className="ops-subtitle">
            Quản lý podcast hệ thống và podcast người dùng gửi lên
          </p>

          <div className="pod-tabs">
            <button
              className={`pod-tab${activeTab === "podcasts" ? " active" : ""}`}
              onClick={() => setActiveTab("podcasts")}
              type="button"
            >
              <Mic2 size={15} />
              Tất cả podcast
              <span className="pod-tab-count">{podcasts.length}</span>
            </button>

            <button
              className={`pod-tab${activeTab === "requests" ? " active" : ""}`}
              onClick={() => setActiveTab("requests")}
              type="button"
            >
              <User size={15} />
              Podcast chờ duyệt
              <span className="pod-tab-count">{pendingCount}</span>
            </button>
          </div>
        </div>

        <div className="ops-actions">
          <button className="ops-btn ops-btn--ghost" onClick={refreshActiveTab}>
            <RefreshCw size={15} />
            Làm mới
          </button>

          {activeTab === "podcasts" && (
            <button
              className="ops-btn ops-btn--primary"
              onClick={() => navigate("/admin/podcasts/new")}
            >
              <Plus size={15} />
              Tạo podcast
            </button>
          )}
        </div>
      </div>

      {renderContent()}

      {showCreateEp && (
        <CreateEpisodeModal
          podcastId={showCreateEp}
          onClose={() => setShowCreateEp(null)}
          onCreated={() => {
            setShowCreateEp(null);
            void loadPodcasts();
            setExpandedId((prev) => {
              if (prev === showCreateEp) {
                setTimeout(() => setExpandedId(showCreateEp), 50);
                return null;
              }
              return showCreateEp;
            });
          }}
        />
      )}

      {confirmDialog && (
        <div
          className="ops-modal-overlay"
          onClick={() => setConfirmDialog(null)}
        >
          <div
            className="ops-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 420 }}
          >
            <div
              className="ops-modal-body"
              style={{ padding: "28px 24px", textAlign: "center" }}
            >
              <div className="pe-confirm-icon">
                <AlertTriangle size={28} />
              </div>
              <h3 className="pe-confirm-title">{confirmDialog.title}</h3>
              <p className="pe-confirm-message">{confirmDialog.message}</p>

              <div className="pe-confirm-actions">
                <button
                  className="ops-btn ops-btn--ghost"
                  onClick={() => setConfirmDialog(null)}
                >
                  Hủy
                </button>

                <button
                  className={
                    confirmDialog.confirmVariant === "primary"
                      ? "pe-confirm-approve"
                      : "pe-confirm-delete"
                  }
                  onClick={confirmDialog.onConfirm}
                >
                  {confirmDialog.confirmVariant === "primary" ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  {confirmDialog.confirmText || "Xác nhận"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectDialog && (
        <div
          className="ops-modal-overlay"
          onClick={() => setRejectDialog(null)}
        >
          <div
            className="ops-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520 }}
          >
            <div
              className="ops-modal-head"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                <XCircle
                  size={16}
                  style={{
                    marginRight: 8,
                    verticalAlign: "middle",
                    color: "#ef4444",
                  }}
                />
                Từ chối podcast request
              </h3>

              <button
                className="ops-btn ops-btn--ghost"
                onClick={() => setRejectDialog(null)}
                style={{ height: 30, padding: "0 6px" }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="ops-modal-body">
              <div className="ops-stack" style={{ gap: 14 }}>
                <div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      marginBottom: 6,
                      color: "var(--text-primary, #1e293b)",
                    }}
                  >
                    {rejectDialog.title}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-muted, #94a3b8)",
                      lineHeight: 1.6,
                    }}
                  >
                    Vui lòng nhập lý do từ chối để gửi phản hồi rõ ràng cho
                    người dùng.
                  </div>
                </div>

                <div className="pe-field">
                  <label className="pe-label">
                    Lý do từ chối <span className="pe-required">*</span>
                  </label>
                  <textarea
                    className="ops-textarea"
                    rows={5}
                    value={rejectDialog.reason}
                    onChange={(e) =>
                      setRejectDialog((prev) =>
                        prev ? { ...prev, reason: e.target.value } : prev,
                      )
                    }
                    placeholder="Ví dụ: Nội dung chưa phù hợp, thiếu mô tả rõ ràng, banner chưa đạt yêu cầu..."
                  />
                </div>
              </div>
            </div>

            <div className="ops-modal-foot">
              <button
                className="ops-btn ops-btn--ghost"
                onClick={() => setRejectDialog(null)}
                disabled={reviewingId === rejectDialog.id}
              >
                Hủy
              </button>

              <button
                className="pe-confirm-delete"
                onClick={() => {
                  const reason = rejectDialog.reason.trim();

                  if (!reason) {
                    showError("Vui lòng nhập lý do từ chối");
                    return;
                  }

                  const id = rejectDialog.id;
                  setRejectDialog(null);
                  void reviewRequest(id, "reject", reason);
                }}
                disabled={reviewingId === rejectDialog.id}
              >
                {reviewingId === rejectDialog.id ? (
                  <Loader2 size={14} className="pe-spin" />
                ) : (
                  <XCircle size={14} />
                )}
                Từ chối request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PodcastRequestCard({
  request,
  reviewing,
  onApprove,
  onReject,
}: {
  request: PodcastRequestResult;
  reviewing: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const status = normalizeStatus(request.status);
  const authorName = getAuthorName(request);
  const authorEmail = getAuthorEmail(request);
  const authorPlan = getAuthorPlan(request);
  const requestType = getRequestType(request);
  const price = getRequestPrice(request);

  const statusNode = (() => {
    switch (status) {
      case "approved":
        return <span className="ops-badge ops-badge--good">Approved</span>;
      case "rejected":
        return <span className="ops-badge ops-badge--danger">Rejected</span>;
      default:
        return <span className="ops-badge ops-badge--warn">Pending</span>;
    }
  })();

  const canReview = status === "pending" && onApprove && onReject;

  return (
    <div className="ops-card pod-request-card">
      <div className="pod-request-cover">
        {request.bannerUrl ? (
          <img src={request.bannerUrl} alt={request.title} />
        ) : (
          <div className="pod-request-cover-placeholder">
            <Mic2 size={28} />
          </div>
        )}
      </div>

      <div className="pod-request-content">
        <div className="pod-request-top">
          <div className="pod-request-headings">
            <h3 className="pod-request-title">{request.title}</h3>
            <p className="pod-request-desc">
              {typeof request.description === "string" &&
                request.description.trim()
                ? request.description
                : "Chưa có mô tả cho podcast này."}
            </p>
          </div>

          <div className="pod-request-badges">
            {statusNode}
            {request.isPaid ? (
              <span className="ops-badge ops-badge--warn">
                Paid • {price.toLocaleString("vi-VN")}đ
              </span>
            ) : (
              <span className="ops-badge">Miễn phí</span>
            )}
          </div>
        </div>

        <div className="pod-request-meta">
          <div className="pod-request-meta-item">
            <User size={14} />
            <span>
              <strong>{authorName}</strong>
              {authorEmail ? ` • ${authorEmail}` : ""}
            </span>
          </div>

          <div className="pod-request-meta-item">
            <Tag size={14} />
            <span>{requestType}</span>
          </div>

          <div className="pod-request-meta-item">
            <Headphones size={14} />
            <span>Gói: {authorPlan}</span>
          </div>

          <div className="pod-request-meta-item">
            <RefreshCw size={14} />
            <span>Gửi lúc: {fmtDateTime(request.requestedAt)}</span>
          </div>
        </div>

        <div className="pod-request-actions">
          {canReview ? (
            <>
              <button
                className="ops-btn ops-btn--primary"
                onClick={onApprove}
                disabled={reviewing}
              >
                {reviewing ? (
                  <Loader2 size={14} className="pe-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Duyệt
              </button>

              <button
                className="ops-btn ops-btn--ghost"
                onClick={onReject}
                disabled={reviewing}
              >
                <XCircle size={14} />
                Từ chối
              </button>
            </>
          ) : (
            <div className="pod-request-readonly-status">
              Request này đã được xử lý.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   PodcastRow
   ──────────────────────────────────────────── */

function PodcastRow({
  podcast,
  expanded,
  onToggle,
  onEdit,
  onDelete,
  onCreateEpisode,
  onEpisodeChange,
  onAskConfirm,
}: {
  podcast: PodcastResult;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onCreateEpisode: () => void;
  onEpisodeChange: () => void;
  onAskConfirm: (dialog: ConfirmDialogState) => void;
}) {
  const [episodes, setEpisodes] = useState<EpisodeResult[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [editingEpisode, setEditingEpisode] = useState<EpisodeResult | null>(
    null,
  );

  const loadEpisodes = async () => {
    setLoadingEpisodes(true);
    try {
      const data = await liveSessionApiService.getEpisodes(podcast.id);
      setEpisodes(data);
    } finally {
      setLoadingEpisodes(false);
    }
  };

  useEffect(() => {
    if (expanded) {
      void loadEpisodes();
    }
  }, [expanded, podcast.id]);

  const deleteEpisode = async (episodeId: string) => {
    try {
      await liveSessionApiService.deleteEpisode(podcast.id, episodeId);
      setEpisodes((prev) => prev.filter((item) => item.id !== episodeId));
      onEpisodeChange();
      showSuccess("Đã xóa tập");
    } catch {
      showError("Xóa tập thất bại");
    }
  };

  const askDeleteEpisode = (episode: EpisodeResult) => {
    onAskConfirm({
      title: "Xóa tập podcast",
      message: `Bạn có chắc muốn xóa tập "${episode.title}"?`,
      confirmText: "Xóa",
      confirmVariant: "danger",
      onConfirm: () => {
        onAskConfirm(null);
        void deleteEpisode(episode.id);
      },
    });
  };

  const authorText = resolveAuthor(podcast.author as any) || "—";

  const statusBadge = () => {
    switch (podcast.status?.toLowerCase()) {
      case "published":
        return <span className="ops-badge ops-badge--good">Published</span>;
      case "archived":
        return <span className="ops-badge ops-badge--warn">Archived</span>;
      default:
        return <span className="ops-badge">Draft</span>;
    }
  };

  return (
    <div className={`pe-podcast-row${expanded ? " expanded" : ""}`}>
      <div className="pe-podcast-main" onClick={onToggle}>
        <div className="pe-podcast-expand">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </div>

        <div className="pe-podcast-info">
          <span className="pe-podcast-name">{podcast.title}</span>
          <span className="pe-podcast-author">{authorText}</span>
        </div>

        <div className="pe-podcast-meta">
          {statusBadge()}
          <span className="pe-podcast-ep-count">
            <Headphones size={13} />
            {podcast.episodeCount} tập
          </span>
        </div>

        <div
          className="pe-podcast-actions"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onCreateEpisode}
            title="Tạo tập mới"
          >
            <Plus size={14} />
            Tạo tập
          </button>

          <button
            className="ops-btn ops-btn--ghost"
            onClick={onEdit}
            title="Sửa podcast"
          >
            <Pencil size={14} />
          </button>

          <button
            className="ops-btn ops-btn--ghost"
            onClick={onDelete}
            title="Xóa podcast"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="pe-episodes">
          {loadingEpisodes ? (
            <div className="ops-stack" style={{ padding: 16 }}>
              <div className="ops-skeleton" />
              <div className="ops-skeleton" />
            </div>
          ) : episodes.length === 0 ? (
            <div className="pe-episodes-empty">
              <Music size={20} />
              <span>Chưa có tập nào</span>
              <button
                className="ops-btn ops-btn--primary"
                onClick={onCreateEpisode}
                style={{ height: 32, fontSize: 12 }}
              >
                <Plus size={13} />
                Tạo tập đầu tiên
              </button>
            </div>
          ) : (
            <div className="pe-episodes-list">
              <div className="pe-episodes-header">
                <span>#</span>
                <span>Tiêu đề</span>
                <span>Thời lượng</span>
                <span>Ngày phát</span>
                <span />
              </div>

              {episodes.map((episode) => (
                <div key={episode.id} className="pe-episode-item">
                  <span className="pe-ep-number">
                    {episode.episodeNumber || "—"}
                  </span>

                  <div className="pe-ep-info">
                    <span className="pe-ep-title">{episode.title}</span>
                    {episode.description && (
                      <span className="pe-ep-desc">{episode.description}</span>
                    )}
                  </div>

                  <span className="pe-ep-duration">
                    {episode.duration > 0 ? fmtDuration(episode.duration) : "—"}
                  </span>

                  <span className="pe-ep-date">
                    {fmtDate(episode.publishDate)}
                  </span>

                  <div className="pe-ep-actions">
                    {episode.audioUrl && (
                      <a
                        href={episode.audioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="ops-btn ops-btn--ghost"
                        style={{ height: 30, fontSize: 11 }}
                        title="Nghe"
                      >
                        <Play size={13} />
                      </a>
                    )}

                    <button
                      className="ops-btn ops-btn--ghost"
                      style={{ height: 30, fontSize: 11 }}
                      onClick={() => setEditingEpisode(episode)}
                      title="Sửa tập"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      className="ops-btn ops-btn--ghost"
                      style={{ height: 30, fontSize: 11 }}
                      onClick={() => askDeleteEpisode(episode)}
                      title="Xóa tập"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {editingEpisode && (
        <EditEpisodeModal
          podcastId={podcast.id}
          episode={editingEpisode}
          onClose={() => setEditingEpisode(null)}
          onUpdated={() => {
            setEditingEpisode(null);
            void loadEpisodes();
            onEpisodeChange();
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────
   EditEpisodeModal
   ──────────────────────────────────────────── */

function EditEpisodeModal({
  podcastId,
  episode,
  onClose,
  onUpdated,
}: {
  podcastId: string;
  episode: EpisodeResult;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [title, setTitle] = useState(episode.title);
  const [description, setDescription] = useState(episode.description || "");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">(
    episode.episodeNumber || "",
  );
  const [publishDate, setPublishDate] = useState(() =>
    episode.publishDate ? episode.publishDate.slice(0, 16) : "",
  );
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [duration, setDuration] = useState<number | null>(null);

  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = async (file: File | null) => {
    setAudioFile(file);

    if (!file) {
      setDuration(null);
      return;
    }

    try {
      const audioDuration = await getAudioDuration(file);
      setDuration(audioDuration);
    } catch {
      setDuration(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề tập");
      return;
    }

    setSaving(true);

    try {
      let audioUrl = "";
      let thumbnailUrl = "";

      if (audioFile) {
        setUploadStatus("Đang upload audio...");
        try {
          const result = await uploadAudio(audioFile);
          audioUrl = result.url;
        } catch (error) {
          console.warn("Cloudinary audio upload failed:", error);
        }
      }

      if (thumbnailFile) {
        setUploadStatus("Đang upload ảnh...");
        try {
          thumbnailUrl = await uploadImage(thumbnailFile);
        } catch (error) {
          console.warn("Cloudinary image upload failed:", error);
        }
      }

      setUploadStatus("Đang cập nhật...");

      const formData = new FormData();
      formData.append("Title", title);
      formData.append("Description", description);

      if (episodeNumber)
        formData.append("EpisodeNumber", String(episodeNumber));
      if (publishDate) {
        formData.append("PublishDate", new Date(publishDate).toISOString());
      }
      if (duration !== null) {
        formData.append("Duration", String(duration));
      }

      if (audioUrl) formData.append("AudioUrl", audioUrl);
      else if (audioFile) formData.append("AudioFile", audioFile);

      if (thumbnailUrl) formData.append("ThumbnailUrl", thumbnailUrl);
      else if (thumbnailFile) formData.append("ThumbnailFile", thumbnailFile);

      await liveSessionApiService.updateEpisode(
        podcastId,
        episode.id,
        formData,
      );

      showSuccess("Cập nhật tập thành công");
      onUpdated();
    } catch (error: any) {
      showError("Cập nhật thất bại", error?.message || "");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="ops-modal-overlay" onClick={onClose}>
      <div
        className="ops-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <div
          className="ops-modal-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            <Pencil
              size={16}
              style={{
                marginRight: 8,
                verticalAlign: "middle",
                color: "#55c5f1",
              }}
            />
            Chỉnh sửa tập
          </h3>

          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            style={{ height: 30, padding: "0 6px" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ops-modal-body">
          <div className="ops-stack" style={{ gap: 14 }}>
            <div className="pe-field">
              <label className="pe-label">
                Tiêu đề <span className="pe-required">*</span>
              </label>
              <input
                className="ops-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên tập..."
              />
            </div>

            <div className="pe-row">
              <div className="pe-field pe-field--half">
                <label className="pe-label">Số tập</label>
                <input
                  className="ops-input"
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) =>
                    setEpisodeNumber(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                />
              </div>

              <div className="pe-field pe-field--half">
                <label className="pe-label">Ngày phát sóng</label>
                <input
                  className="ops-input"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="pe-field">
              <label className="pe-label">Mô tả</label>
              <textarea
                className="ops-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">
                <Music size={13} /> Đổi file âm thanh
              </label>

              {episode.audioUrl && !audioFile && (
                <div className="pe-current-file">
                  Audio hiện tại:{" "}
                  <a href={episode.audioUrl} target="_blank" rel="noreferrer">
                    Nghe thử
                  </a>
                  {episode.duration > 0 && (
                    <span> • {fmtDuration(episode.duration)}</span>
                  )}
                </div>
              )}

              <div
                className="pe-file-pick"
                onClick={() => audioRef.current?.click()}
              >
                <Upload size={16} />
                {audioFile ? (
                  <span>
                    {audioFile.name} (
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                    {duration !== null && ` • ${fmtDuration(duration)}`}
                  </span>
                ) : (
                  <span>Chọn file mới (bỏ trống = giữ nguyên)</span>
                )}
              </div>

              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => handleAudioChange(e.target.files?.[0] || null)}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">Đổi thumbnail</label>

              <div
                className="pe-file-pick"
                onClick={() => thumbRef.current?.click()}
              >
                <Upload size={16} />
                {thumbnailFile ? (
                  <span>{thumbnailFile.name}</span>
                ) : (
                  <span>Chọn ảnh mới (bỏ trống = giữ nguyên)</span>
                )}
              </div>

              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            {uploadStatus && (
              <div className="pe-upload-status">
                <RefreshCw size={14} className="pe-spin" />
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        <div className="ops-modal-foot">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          <button
            className="ops-btn ops-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Cập nhật"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────
   CreateEpisodeModal
   ──────────────────────────────────────────── */

function CreateEpisodeModal({
  podcastId,
  onClose,
  onCreated,
}: {
  podcastId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState<number | "">("");
  const [publishDate, setPublishDate] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  const handleAudioChange = async (file: File | null) => {
    setAudioFile(file);

    if (!file) {
      setDuration(null);
      return;
    }

    try {
      const audioDuration = await getAudioDuration(file);
      setDuration(audioDuration);
    } catch {
      setDuration(null);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      showError("Vui lòng nhập tiêu đề tập");
      return;
    }

    setSaving(true);

    try {
      let audioUrl = "";
      let thumbnailUrl = "";

      if (audioFile) {
        setUploadStatus("Đang upload audio...");
        try {
          const result = await uploadAudio(audioFile);
          audioUrl = result.url;
        } catch (error) {
          console.warn("Cloudinary audio upload failed:", error);
        }
      }

      if (thumbnailFile) {
        setUploadStatus("Đang upload ảnh...");
        try {
          thumbnailUrl = await uploadImage(thumbnailFile);
        } catch (error) {
          console.warn("Cloudinary image upload failed:", error);
        }
      }

      setUploadStatus("Đang tạo tập...");

      const formData = new FormData();
      formData.append("Title", title);

      if (description) formData.append("Description", description);
      if (episodeNumber)
        formData.append("EpisodeNumber", String(episodeNumber));
      if (publishDate) {
        formData.append("PublishDate", new Date(publishDate).toISOString());
      }
      if (duration !== null) {
        formData.append("Duration", String(duration));
      }

      if (audioUrl) formData.append("AudioUrl", audioUrl);
      else if (audioFile) formData.append("AudioFile", audioFile);

      if (thumbnailUrl) formData.append("ThumbnailUrl", thumbnailUrl);
      else if (thumbnailFile) formData.append("ThumbnailFile", thumbnailFile);

      await liveSessionApiService.createEpisode(podcastId, formData);

      showSuccess("Tạo tập thành công");
      onCreated();
    } catch (error: any) {
      showError("Tạo tập thất bại", error?.message || "");
    } finally {
      setSaving(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="ops-modal-overlay" onClick={onClose}>
      <div
        className="ops-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 560 }}
      >
        <div
          className="ops-modal-head"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            <Mic2
              size={16}
              style={{
                marginRight: 8,
                verticalAlign: "middle",
                color: "#55c5f1",
              }}
            />
            Tạo tập mới
          </h3>

          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            style={{ height: 30, padding: "0 6px" }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="ops-modal-body">
          <div className="ops-stack" style={{ gap: 14 }}>
            <div className="pe-field">
              <label className="pe-label">
                Tiêu đề <span className="pe-required">*</span>
              </label>
              <input
                className="ops-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Tên tập phát sóng..."
              />
            </div>

            <div className="pe-row">
              <div className="pe-field pe-field--half">
                <label className="pe-label">Số tập</label>
                <input
                  className="ops-input"
                  type="number"
                  min={1}
                  value={episodeNumber}
                  onChange={(e) =>
                    setEpisodeNumber(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  placeholder="1"
                />
              </div>

              <div className="pe-field pe-field--half">
                <label className="pe-label">Ngày phát sóng</label>
                <input
                  className="ops-input"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
              </div>
            </div>

            <div className="pe-field">
              <label className="pe-label">Mô tả</label>
              <textarea
                className="ops-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về tập này..."
                rows={3}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">
                <Music size={13} />
                File âm thanh
              </label>

              <div
                className="pe-file-pick"
                onClick={() => audioRef.current?.click()}
              >
                <Upload size={16} />
                {audioFile ? (
                  <span>
                    {audioFile.name} (
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                    {duration !== null && ` • ${fmtDuration(duration)}`}
                  </span>
                ) : (
                  <span>Chọn file MP3, WAV, OGG...</span>
                )}
              </div>

              <input
                ref={audioRef}
                type="file"
                accept="audio/*"
                style={{ display: "none" }}
                onChange={(e) => handleAudioChange(e.target.files?.[0] || null)}
              />
            </div>

            <div className="pe-field">
              <label className="pe-label">Ảnh thumbnail</label>

              <div
                className="pe-file-pick"
                onClick={() => thumbRef.current?.click()}
              >
                <Upload size={16} />
                {thumbnailFile ? (
                  <span>{thumbnailFile.name}</span>
                ) : (
                  <span>Chọn ảnh thumbnail (không bắt buộc)</span>
                )}
              </div>

              <input
                ref={thumbRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            {uploadStatus && (
              <div className="pe-upload-status">
                <RefreshCw size={14} className="pe-spin" />
                {uploadStatus}
              </div>
            )}
          </div>
        </div>

        <div className="ops-modal-foot">
          <button
            className="ops-btn ops-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </button>

          <button
            className="ops-btn ops-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? "Đang xử lý..." : "Tạo tập"}
          </button>
        </div>
      </div>
    </div>
  );
}
