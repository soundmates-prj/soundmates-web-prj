import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from 'lucide-react';
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from '../../../components/common/toastUtils';
import roleService, { type RoleDto } from '../../../services/roleService';
import './RoleManagementScreen.css';

const ROLE_NAME_REGEX = /^[A-Z][A-Z_]*$/;
const SUGGESTED_ROLE_NAMES = ['ADMIN', 'STAFF', 'HOST', 'MEMBER', 'MODERATOR', 'GUEST'];

const normalizeRoleName = (value: string): string => value.trim().toUpperCase();

function formatDate(value?: string): string {
  if (!value) return 'Chưa có';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Chưa có';

  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function isAdminRole(role: RoleDto): boolean {
  return normalizeRoleName(role.name) === 'ADMIN';
}

export function RoleManagementScreen() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDto | null>(null);
  const [roleName, setRoleName] = useState('');
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<RoleDto | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRoles = useCallback(
    async (options?: { showLoader?: boolean; quiet?: boolean }) => {
      const showLoader = options?.showLoader ?? false;
      const quiet = options?.quiet ?? false;

      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const res = await roleService.getRoles();
      if (res.success) {
        setRoles(Array.isArray(res.data) ? res.data : []);
      } else if (!quiet) {
        showError('Lỗi', res.message || 'Không thể tải danh sách vai trò');
      }

      if (showLoader) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }

      return res;
    },
    [],
  );

  const pollRolesUntil = useCallback(
    async (
      predicate: (items: RoleDto[]) => boolean,
      attempts = 8,
      intervalMs = 700,
    ): Promise<RoleDto[]> => {
      let latestRoles = roles;

      for (let i = 0; i < attempts; i += 1) {
        const res = await roleService.getRoles();
        if (res.success) {
          latestRoles = Array.isArray(res.data) ? res.data : [];
          setRoles(latestRoles);
          if (predicate(latestRoles)) {
            return latestRoles;
          }
        }

        if (i < attempts - 1) {
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, intervalMs);
          });
        }
      }

      return latestRoles;
    },
    [roles],
  );

  useEffect(() => {
    void fetchRoles({ showLoader: true });
  }, [fetchRoles]);

  const filteredRoles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return roles;

    return roles.filter((role) => {
      const inName = normalizeRoleName(role.name).toLowerCase().includes(keyword);
      const inDescription = (role.description || '').toLowerCase().includes(keyword);
      return inName || inDescription;
    });
  }, [roles, searchKeyword]);

  const openCreate = () => {
    setEditingRole(null);
    setRoleName('');
    setIsEditorOpen(true);
  };

  const openEdit = (role: RoleDto) => {
    setEditingRole(role);
    setRoleName(role.name);
    setIsEditorOpen(true);
  };

  const validateRoleName = (name: string): string | null => {
    if (!name) return 'Vui lòng nhập tên vai trò';
    if (name.length < 2 || name.length > 50) {
      return 'Tên vai trò phải từ 2 đến 50 ký tự';
    }
    if (!ROLE_NAME_REGEX.test(name)) {
      return 'Tên vai trò phải viết HOA và chỉ chứa chữ cái hoặc dấu gạch dưới (VD: STAFF, CONTENT_MODERATOR)';
    }

    return null;
  };

  const closeEditor = () => {
    if (saving) return;
    setIsEditorOpen(false);
    setEditingRole(null);
    setRoleName('');
  };

  const handleSave = async () => {
    if (saving) return;

    const normalizedName = normalizeRoleName(roleName);
    const validationError = validateRoleName(normalizedName);
    if (validationError) {
      showError('Lỗi', validationError);
      return;
    }

    if (editingRole && normalizeRoleName(editingRole.name) === normalizedName) {
      showInfo('Không có thay đổi', 'Bạn chưa thay đổi tên vai trò');
      closeEditor();
      return;
    }

    const previousRole = editingRole;

    setSaving(true);
    const res = previousRole
      ? await roleService.updateRole(previousRole.id, { name: normalizedName })
      : await roleService.createRole({ name: normalizedName });
    setSaving(false);

    if (!res.success) {
      showError('Thất bại', res.message || 'Không thể lưu vai trò');
      return;
    }

    showSuccess(
      'Thành công',
      previousRole
        ? `Vai trò ${previousRole.name} đã được cập nhật`
        : `Vai trò ${normalizedName} đã được tạo`,
    );
    closeEditor();

    if (previousRole) {
      await pollRolesUntil((items) =>
        items.some((role) => role.id === previousRole.id && normalizeRoleName(role.name) === normalizedName),
      );
    } else {
      await pollRolesUntil((items) => items.some((role) => normalizeRoleName(role.name) === normalizedName));
    }
  };

  const openDeleteConfirm = (role: RoleDto) => {
    if (isAdminRole(role)) {
      showWarning('Không thể xóa', 'Vai trò ADMIN là vai trò hệ thống và không được phép xóa');
      return;
    }

    setDeleteTarget(role);
  };

  const closeDeleteConfirm = () => {
    if (deleting) return;
    setDeleteTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleting) return;

    if (isAdminRole(deleteTarget)) {
      showWarning('Không thể xóa', 'Vai trò ADMIN là vai trò hệ thống và không được phép xóa');
      return;
    }

    const role = deleteTarget;
    setDeleting(true);
    const res = await roleService.deleteRole(role.id);
    setDeleting(false);

    if (!res.success) {
      showError('Thất bại', res.message || 'Không thể xóa vai trò');
      return;
    }

    showSuccess('Đã xóa', `Vai trò ${role.name} đã được xóa`);
    closeDeleteConfirm();
    await pollRolesUntil((items) => items.every((item) => item.id !== role.id));
  };

  const hasNoRoleData = !loading && roles.length === 0;
  const hasNoFilteredResults = !loading && roles.length > 0 && filteredRoles.length === 0;

  return (
    <div className="role-mgmt-page">
      <div className="role-mgmt-header">
        <div>
          <h1 className="role-mgmt-title">
            Quyền người dùng
          </h1>
          <p className="role-mgmt-subtitle">
            Quản lý vai trò và quyền truy cập trong hệ thống
          </p>
        </div>
      </div>

      <div className="role-mgmt-actions-row">
        <label className="role-mgmt-search-box">
          <Search size={16} />
          <input
            type="text"
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            placeholder="Tìm theo tên hoặc mô tả vai trò..."
          />
        </label>

        <div className="role-mgmt-action-buttons">
          <button
            type="button"
            className="role-mgmt-btn role-mgmt-btn--ghost"
            onClick={() => void fetchRoles({ quiet: true })}
            disabled={refreshing || loading}
          >
            <RefreshCw size={15} className={refreshing ? 'role-mgmt-spin' : ''} />
            Làm mới
          </button>

          <button type="button" className="role-mgmt-btn role-mgmt-btn--primary" onClick={openCreate}>
            <Plus size={15} />
            Tạo vai trò
          </button>
        </div>
      </div>

      {loading ? (
        <div className="role-mgmt-placeholder role-mgmt-placeholder--loading">
          <RefreshCw size={18} className="role-mgmt-spin" />
          Đang tải dữ liệu quyền người dùng...
        </div>
      ) : (
        <div className="role-mgmt-table-card">
          {hasNoRoleData ? (
            <div className="role-mgmt-empty-state">
              <AlertTriangle size={18} />
              <div>
                <p>Hiện chưa có vai trò nào.</p>
                <span>Bạn có thể tạo vai trò mới bằng nút Tạo vai trò.</span>
              </div>
            </div>
          ) : hasNoFilteredResults ? (
            <div className="role-mgmt-placeholder">
              Không tìm thấy vai trò phù hợp với từ khóa hiện tại.
            </div>
          ) : (
            <table className="role-mgmt-table">
              <thead>
                <tr>
                  <th>Tên vai trò</th>
                  <th>Mô tả</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => {
                  const isProtectedRole = isAdminRole(role);

                  return (
                    <tr key={role.id}>
                      <td>
                        <div className="role-name-cell">
                          <ShieldCheck size={16} className="role-icon" />
                          <strong>{normalizeRoleName(role.name)}</strong>
                        </div>
                      </td>
                      <td className="role-desc-cell">{role.description || 'Chưa có mô tả'}</td>
                      <td>{formatDate(role.createdAt)}</td>
                      <td>
                        <div className="role-actions">
                          <button
                            type="button"
                            className="role-action-btn"
                            onClick={() => openEdit(role)}
                            title="Chỉnh sửa"
                          >
                            <Pencil size={14} />
                          </button>

                          <button
                            type="button"
                            className="role-action-btn role-action-btn--delete"
                            onClick={() => openDeleteConfirm(role)}
                            title={isProtectedRole ? 'Vai trò ADMIN không thể xóa' : 'Xóa vai trò'}
                            disabled={isProtectedRole}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {isEditorOpen && (
        <div className="role-mgmt-modal-overlay" onClick={closeEditor}>
          <div className="role-mgmt-modal" onClick={(event) => event.stopPropagation()}>
            <div className="role-mgmt-modal-header">
              <h3>{editingRole ? 'Chỉnh sửa vai trò' : 'Tạo vai trò mới'}</h3>
              <button type="button" onClick={closeEditor}>
                <X size={18} />
              </button>
            </div>

            <div className="role-mgmt-modal-body">
              <div className="role-mgmt-field">
                <label htmlFor="roleNameInput">Tên vai trò *</label>
                <input
                  id="roleNameInput"
                  type="text"
                  value={roleName}
                  onChange={(event) => setRoleName(event.target.value.toUpperCase())}
                  placeholder="VD: STAFF"
                />
                <p className="role-mgmt-field-hint">
                  Chỉ chấp nhận chữ in hoa và dấu gạch dưới. Giá trị hợp lệ thường dùng: ADMIN, STAFF, HOST,
                  MEMBER.
                </p>
              </div>

              <div className="role-mgmt-suggestion-wrap">
                {SUGGESTED_ROLE_NAMES.map((suggestedRole) => (
                  <button
                    key={suggestedRole}
                    type="button"
                    className={`role-mgmt-suggestion-chip ${normalizeRoleName(roleName) === suggestedRole ? 'active' : ''
                      }`}
                    onClick={() => setRoleName(suggestedRole)}
                  >
                    {suggestedRole}
                  </button>
                ))}
              </div>
            </div>

            <div className="role-mgmt-modal-footer">
              <button type="button" className="role-mgmt-btn role-mgmt-btn--ghost" onClick={closeEditor}>
                Hủy
              </button>

              <button
                type="button"
                className="role-mgmt-btn role-mgmt-btn--primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Đang lưu...' : editingRole ? 'Lưu thay đổi' : 'Tạo vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="role-mgmt-modal-overlay" onClick={closeDeleteConfirm}>
          <div className="role-mgmt-modal role-mgmt-modal--confirm" onClick={(event) => event.stopPropagation()}>
            <div className="role-mgmt-modal-header">
              <h3>Xác nhận xóa vai trò</h3>
              <button type="button" onClick={closeDeleteConfirm}>
                <X size={18} />
              </button>
            </div>

            <div className="role-mgmt-modal-body role-mgmt-modal-body--compact">
              <p>
                Bạn chắc chắn muốn xóa vai trò <strong>{normalizeRoleName(deleteTarget.name)}</strong>?
              </p>
              <span>Thao tác này không thể hoàn tác.</span>
            </div>

            <div className="role-mgmt-modal-footer">
              <button type="button" className="role-mgmt-btn role-mgmt-btn--ghost" onClick={closeDeleteConfirm}>
                Hủy
              </button>

              <button
                type="button"
                className="role-mgmt-btn role-mgmt-btn--danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Đang xóa...' : 'Xóa vai trò'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
