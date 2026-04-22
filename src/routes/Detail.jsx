import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen";
import AddItemModal from "../components/AddItemModal";
import { fetchList, addItem, commitOverlay } from "../services/api";

function normalizeDateValue(value = "") {
  const raw = String(value).trim();
  const m = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return "";
  const year = m[1];
  const month = String(m[2]).padStart(2, "0");
  const day = String(m[3]).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeTimeValue(value = "") {
  const raw = String(value).trim();

  let m = raw.match(/^(\d{1,2})\s*시$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  m = raw.match(/^(\d{1,2})$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  return raw;
}

function getStatusValue(status = "") {
  const s = String(status).trim();
  return s || "검토";
}

function getStatusClassName(status = "") {
  const value = getStatusValue(status);

  if (value === "확정") return "status-confirm";
  if (value === "조정요청") return "status-adjust";
  if (value === "반려") return "status-reject";
  if (value === "추가") return "status-added";
  return "status-review";
}

function sortRows(list = []) {
  return [...list].sort((a, b) => {
    const ta =
      parseInt(normalizeTimeValue(a.requestTimeBand).replace(/[^\d]/g, ""), 10) || 0;
    const tb =
      parseInt(normalizeTimeValue(b.requestTimeBand).replace(/[^\d]/g, ""), 10) || 0;

    if (ta !== tb) return ta - tb;

    const oa = String(a.orgName || "").trim();
    const ob = String(b.orgName || "").trim();
    if (oa < ob) return -1;
    if (oa > ob) return 1;

    const na = String(a.scheduleCodeName || "").trim();
    const nb = String(b.scheduleCodeName || "").trim();
    if (na < nb) return -1;
    if (na > nb) return 1;

    return 0;
  });
}

function cloneRows(rows = []) {
  return rows.map((row) => ({ ...row }));
}

function makeAddedItem(date) {
  const uid = `ADD_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    orgName: "",
    mdCategory: "",
    requestDate: date,
    requestTimeBand: "",
    weightMin: "",
    scheduleCodeName: "",
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
    expectedGmv: "",
    expectedProfit: "",
    id: uid,
    status: "추가",
    opinion: "",
    __isAdded: true,
  };
}

function groupRowsByTime(rows = []) {
  const map = new Map();

  rows.forEach((row) => {
    const key = normalizeTimeValue(row.requestTimeBand) || "시간 미지정";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  });

  return Array.from(map.entries()).map(([time, items]) => ({
    time,
    items,
  }));
}

function buildDisplayTitle(row) {
  const timeText = normalizeTimeValue(row.requestTimeBand) || "-";
  const dealTypeText = row.dealType ? `[${row.dealType}] ` : "";
  const codeNameText = row.scheduleCodeName || "-";
  return `${timeText} ${dealTypeText}[${codeNameText}]`;
}

export default function Detail() {
  const [searchParams] = useSearchParams();
  const selectedDate = normalizeDateValue(searchParams.get("date") || "");

  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStage, setSaveStage] = useState("");
  const [saveProgress, setSaveProgress] = useState(0);
  const [saveTotal, setSaveTotal] = useState(0);
  const [error, setError] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const list = await fetchList();
      const dateRows = sortRows(
        list.filter((row) => normalizeDateValue(row.requestDate) === selectedDate)
      );

      setRows(cloneRows(dateRows));
      setOriginalRows(cloneRows(dateRows));
    } catch (e) {
      const message = e.message || "상세 데이터를 불러오지 못했습니다.";
      setError(message);
      window.alert(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedDate) return;
    loadData();
  }, [selectedDate]);

  const changedOverlay = useMemo(() => {
    const originalMap = new Map(
      originalRows.map((row) => [
        row.id,
        {
          status: getStatusValue(row.status),
          opinion: String(row.opinion || ""),
        },
      ])
    );

    const overlay = {};

    rows.forEach((row) => {
      if (!row.id) return;
      if (row.__isAdded) return;

      const prev = originalMap.get(row.id) || { status: "검토", opinion: "" };
      const nextStatus = getStatusValue(row.status);
      const nextOpinion = String(row.opinion || "");

      if (prev.status !== nextStatus || prev.opinion !== nextOpinion) {
        overlay[row.id] = {
          status: nextStatus,
          opinion: nextOpinion,
        };
      }
    });

    return overlay;
  }, [rows, originalRows]);

  const addedRows = useMemo(() => {
    return rows.filter((row) => row.__isAdded);
  }, [rows]);

  const groupedRows = useMemo(() => {
    return groupRowsByTime(rows);
  }, [rows]);

  function updateRow(id, key, value) {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [key]: value } : row))
    );
  }

  function handleAddItem() {
    setIsAddOpen(true);
  }

  async function handleCreateItem(form) {
    const newItem = {
      ...makeAddedItem(selectedDate),
      ...form,
      requestDate: selectedDate,
      requestTimeBand: normalizeTimeValue(form.requestTimeBand),
      status: form.status ? form.status : "추가",
      opinion: form.opinion || "",
      dealType: form.dealType || "",
    };

    setRows((prev) => sortRows([newItem, ...prev]));
    return true;
  }

  async function handleSave() {
    const changedIds = Object.keys(changedOverlay);
    const totalSteps =
      addedRows.length +
      (changedIds.length > 0 ? 1 : 0) +
      2; // 정리 + 새로고침

    try {
      setSaving(true);
      setSaveStage("변경 사항을 정리하고 있습니다...");
      setSaveProgress(0);
      setSaveTotal(totalSteps);

      let currentStep = 1;
      setSaveProgress(currentStep);

      if (addedRows.length > 0) {
        for (let i = 0; i < addedRows.length; i += 1) {
          const row = addedRows[i];
          setSaveStage(`신규 아이템 전송 중... (${i + 1}/${addedRows.length})`);

          const payload = {
            ...row,
            requestDate: normalizeDateValue(row.requestDate),
            requestTimeBand: normalizeTimeValue(row.requestTimeBand),
            status: getStatusValue(row.status),
            opinion: String(row.opinion || ""),
            dealType: String(row.dealType || ""),
          };

          delete payload.__isAdded;
          await addItem(payload);

          currentStep += 1;
          setSaveProgress(currentStep);
        }
      }

      if (changedIds.length > 0) {
        setSaveStage(`상태/의견 반영 중... (${changedIds.length}건)`);
        await commitOverlay(changedOverlay);
        currentStep += 1;
        setSaveProgress(currentStep);
      }

      setSaveStage("최신 데이터를 다시 불러오는 중...");
      await loadData();
      currentStep += 1;
      setSaveProgress(currentStep);

      setSaveStage("저장이 완료되었습니다.");
      window.opener?.postMessage(
        { type: "DETAIL_SAVED", date: selectedDate },
        window.location.origin
      );

      window.alert("저장되었습니다.");
    } catch (e) {
      const message = e.message || "저장에 실패했습니다.";
      setError(message);
      window.alert(message);
    } finally {
      setSaving(false);
      setSaveStage("");
      setSaveProgress(0);
      setSaveTotal(0);
    }
  }

  const summary = useMemo(() => {
    const total = rows.length;
    const changed = Object.keys(changedOverlay).length;
    const added = addedRows.length;
    return `총 ${total}건 | 변경 ${changed} | 추가 ${added}`;
  }, [rows.length, changedOverlay, addedRows.length]);

  const saveSubText = useMemo(() => {
    if (!saveTotal) return "잠시만 기다려주세요.";
    return `${saveProgress}/${saveTotal} 단계 진행 중 · 브라우저를 닫지 마세요.`;
  }, [saveProgress, saveTotal]);

  if (!selectedDate) {
    return <div className="detail-page">날짜 정보가 없습니다.</div>;
  }

  return (
    <div className="detail-page">
      <div className="detail-page__header">
        <div>
          <h1 className="detail-page__title">상세 편성</h1>
          <div className="detail-page__date">{selectedDate}</div>
          <div className="detail-page__count">{summary}</div>
        </div>

        <div className="detail-page__actions">
          <button
            type="button"
            className="detail-page__button detail-page__button--ghost"
            onClick={handleAddItem}
            disabled={saving}
          >
            아이템 추가
          </button>
          <button
            type="button"
            className="detail-page__button detail-page__button--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>

      {error && <div className="state-box error">{error}</div>}

      <div className="detail-table">
        <div className="detail-table__head">
          <div className="detail-table__cell">편성 정보</div>
          <div className="detail-table__cell">상태</div>
          <div className="detail-table__cell">의견</div>
        </div>

        {rows.length === 0 ? (
          <div className="detail-table__empty">데이터가 없습니다.</div>
        ) : (
          groupedRows.map((group) => (
            <div key={group.time}>
              <div className="detail-table__row">
                <div
                  className="detail-table__cell"
                  style={{ fontWeight: 800, background: "#f8f9fb" }}
                >
                  {group.time}
                </div>
                <div
                  className="detail-table__cell"
                  style={{ background: "#f8f9fb" }}
                />
                <div
                  className="detail-table__cell"
                  style={{ background: "#f8f9fb" }}
                />
              </div>

              {group.items.map((row) => (
                <div className="detail-table__row" key={row.id}>
                  <div className="detail-table__cell">
                    <div className="detail-item__name">
                      {buildDisplayTitle(row)}
                    </div>
                    <div className="detail-item__meta">
                      <span>{row.orgName || "-"}</span>
                      <span>/</span>
                      <span>{row.mdCategory || "-"}</span>
                    </div>
                  </div>

                  <div className="detail-table__cell">
                    <select
                      className={`detail-select ${getStatusClassName(row.status)}`}
                      value={getStatusValue(row.status)}
                      onChange={(e) => updateRow(row.id, "status", e.target.value)}
                    >
                      <option value="검토">검토</option>
                      <option value="조정요청">조정요청</option>
                      <option value="확정">확정</option>
                      <option value="반려">반려</option>
                      {row.__isAdded && <option value="추가">추가</option>}
                    </select>
                  </div>

                  <div className="detail-table__cell">
                    <input
                      className="detail-input"
                      value={row.opinion || ""}
                      onChange={(e) => updateRow(row.id, "opinion", e.target.value)}
                      placeholder="의견 입력"
                    />
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      <AddItemModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreateItem}
      />

      {loading && (
        <LoadingScreen
          overlay
          text="로딩 중..."
          subText="상세 데이터를 불러오는 중입니다."
        />
      )}

      {saving && (
        <LoadingScreen
          overlay
          text={saveStage || "저장 중..."}
          subText={saveSubText}
        />
      )}
    </div>
  );
}