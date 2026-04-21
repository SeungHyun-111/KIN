import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { addItem, commitOverlay, fetchList } from "../services/api";
import AddItemModal from "../components/AddItemModal";

function normalizeDateValue(value = "") {
  return String(value).trim().replace(/\//g, "-").slice(0, 10);
}

function normalizeStatus(value = "") {
  return String(value || "").trim() || "검토";
}

function sortRowsByTime(list) {
  return [...list].sort((a, b) => {
    const aa =
      parseInt(String(a.requestTimeBand || "").replace(/[^\d]/g, ""), 10) || 0;
    const bb =
      parseInt(String(b.requestTimeBand || "").replace(/[^\d]/g, ""), 10) || 0;

    if (aa !== bb) return aa - bb;

    const oa = String(a.orgName || "").trim();
    const ob = String(b.orgName || "").trim();
    if (oa < ob) return -1;
    if (oa > ob) return 1;

    return 0;
  });
}

function formatHeaderDate(date = "") {
  const normalized = normalizeDateValue(date);
  if (!normalized) return "-";

  const [y, m, d] = normalized.split("-");
  const day = new Date(Number(y), Number(m) - 1, Number(d)).getDay();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];

  return `${m}월 ${d}일 (${dayNames[day]})`;
}

export default function Detail() {
  const location = useLocation();
  const date = new URLSearchParams(location.search).get("date") || "";

  const [rows, setRows] = useState([]);
  const [draftRows, setDraftRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [isAddOpen, setIsAddOpen] = useState(false);

  const statusOptions = ["검토", "조정요청", "확정", "반려", "추가"];

  async function loadDetailRows() {
    try {
      setLoading(true);

      const list = await fetchList();
      const filtered = sortRowsByTime(
        list.filter((row) => normalizeDateValue(row.requestDate) === date)
      );

      setRows(filtered);
      setDraftRows(
        filtered.map((row) => ({
          ...row,
          status: normalizeStatus(row.status),
          opinion: String(row.opinion || ""),
        }))
      );
    } catch (e) {
      window.alert(e.message || "디테일 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (date) {
      loadDetailRows();
    }
  }, [date]);

  const changedCount = useMemo(() => {
    const originalMap = new Map(rows.map((row) => [row.id, row]));

    return draftRows.filter((row) => {
      const original = originalMap.get(row.id);
      if (!original) return false;

      const prevStatus = normalizeStatus(original.status);
      const nextStatus = normalizeStatus(row.status);
      const prevOpinion = String(original.opinion || "");
      const nextOpinion = String(row.opinion || "");

      return prevStatus !== nextStatus || prevOpinion !== nextOpinion;
    }).length;
  }, [rows, draftRows]);

  function handleStatusChange(id, value) {
    setDraftRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, status: value } : row
      )
    );
  }

  function handleOpinionChange(id, value) {
    setDraftRows((prev) =>
      prev.map((row) =>
        row.id === id ? { ...row, opinion: value } : row
      )
    );
  }

  async function handleSave() {
    try {
      const originalMap = new Map(rows.map((row) => [row.id, row]));
      const overlay = {};

      draftRows.forEach((row) => {
        const original = originalMap.get(row.id);
        if (!original) return;

        const prevStatus = normalizeStatus(original.status);
        const nextStatus = normalizeStatus(row.status);
        const prevOpinion = String(original.opinion || "");
        const nextOpinion = String(row.opinion || "");

        if (prevStatus !== nextStatus || prevOpinion !== nextOpinion) {
          overlay[row.id] = {
            status: nextStatus,
            opinion: nextOpinion,
          };
        }
      });

      if (Object.keys(overlay).length === 0) {
        window.alert("저장할 변경사항이 없습니다.");
        return;
      }

      setSaving(true);
      await commitOverlay(overlay);
      await loadDetailRows();

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "DETAIL_SAVED", date },
          window.location.origin
        );
      }

      window.alert("저장되었습니다.");
    } catch (e) {
      window.alert(e.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddItem(form) {
    try {
      const payload = {
        orgName: String(form.orgName || "").trim(),
        mdCategory: "",
        requestDate: date,
        requestTimeBand: String(form.requestTimeBand || "").trim(),
        weightMin: "",
        scheduleCodeName: String(form.scheduleCodeName || "").trim(),
        isNewProduct: "",
        dealType: "",
        salePrice: "",
        package: "",
        marginRate: "",
        fixedCostPerMin: "",
        gmvPerMin: "",
        profitPerMin: "",
        profitPerMin_2: "",
        blankR: "",
        inputValue: "",
        expectedGmv: "0",
        expectedProfit: "0",
        id: `ADD_${Date.now()}`,
        status: String(form.status || "").trim() || "추가",
        opinion: String(form.opinion || "").trim(),
      };

      if (!payload.requestTimeBand || !payload.orgName || !payload.scheduleCodeName) {
        window.alert("시간, 조직, 아이템명은 필수입니다.");
        return false;
      }

      await addItem(payload);
      await loadDetailRows();

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage(
          { type: "DETAIL_ITEM_ADDED", date },
          window.location.origin
        );
      }

      return true;
    } catch (e) {
      window.alert(e.message || "아이템 추가에 실패했습니다.");
      return false;
    }
  }

  return (
    <div className="detail-page">
      <div className="detail-page__header">
        <div>
          <h1 className="detail-page__title">일자 상세 조정</h1>
          <div className="detail-page__date">{date || "-"}</div>
          <div className="detail-page__count">총 {draftRows.length}건</div>
        </div>

        <div className="detail-page__actions">
          <button
            type="button"
            className="detail-page__button detail-page__button--ghost"
            onClick={() => setIsAddOpen(true)}
          >
            아이템 추가
          </button>

          <button
            type="button"
            className="detail-page__button detail-page__button--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : `저장${changedCount > 0 ? ` (${changedCount})` : ""}`}
          </button>

          <button
            type="button"
            className="detail-page__button"
            onClick={() => window.close()}
          >
            닫기
          </button>
        </div>
      </div>

      <div className="detail-table">
        <div className="detail-table__head">
          <div className="detail-table__cell detail-table__cell--item">
            {formatHeaderDate(date)} 요청 현황
          </div>
          <div className="detail-table__cell detail-table__cell--status">
            상태
            <div className="detail-table__sub">(검토 / 조정요청 / 확정 / 반려 / 추가)</div>
            <div className="detail-table__sub">* default = 검토</div>
          </div>
          <div className="detail-table__cell detail-table__cell--opinion">
            의견
          </div>
        </div>

        {loading ? (
          <div className="detail-table__empty">불러오는 중...</div>
        ) : draftRows.length === 0 ? (
          <div className="detail-table__empty">
            해당 날짜 데이터가 없습니다.
          </div>
        ) : (
          <div className="detail-table__body">
            {draftRows.map((row) => (
              <div className="detail-table__row" key={row.id}>
                <div className="detail-table__cell detail-table__cell--item">
                  <div className="detail-item__name">
                    {row.scheduleCodeName || "-"}
                  </div>
                  <div className="detail-item__meta">
                    <span>{String(row.requestTimeBand || "").trim() || "-"}</span>
                    <span>{String(row.orgName || "").trim() || "-"}</span>
                  </div>
                </div>

                <div className="detail-table__cell detail-table__cell--status">
                  <select
                    className="detail-select"
                    value={normalizeStatus(row.status)}
                    onChange={(e) => handleStatusChange(row.id, e.target.value)}
                  >
                    {statusOptions.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="detail-table__cell detail-table__cell--opinion">
                  <input
                    className="detail-input"
                    type="text"
                    value={row.opinion || ""}
                    onChange={(e) => handleOpinionChange(row.id, e.target.value)}
                    placeholder="의견 입력"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleAddItem}
      />
    </div>
  );
}