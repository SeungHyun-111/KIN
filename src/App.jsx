import { useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import FilterBar from "./components/FilterBar";
import CalendarMonth from "./components/CalendarMonth";
import SearchSidebar from "./components/SearchSidebar";
import Detail from "./routes/Detail";
import LoadingScreen from "./components/LoadingScreen";
import { fetchList } from "./services/api";

function normalizeText(value = "") {
  return String(value).toLowerCase().trim();
}

function normalizeDateValue(value = "") {
  const raw = String(value).trim();
  const m = raw.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);

  if (!m) return "";

  const year = m[1];
  const month = String(m[2]).padStart(2, "0");
  const day = String(m[3]).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeMonthValue(value = "") {
  const date = normalizeDateValue(value);
  return date ? date.slice(0, 7) : "";
}

function normalizeTimeValue(value = "") {
  const raw = String(value).trim();

  let m = raw.match(/^(\d{1,2})\s*시$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  m = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (m) return `${String(m[1]).padStart(2, "0")}시`;

  return raw;
}

function getStatusValue(status = "") {
  const s = String(status).trim();
  return s || "검토";
}

function sortRows(list = []) {
  return [...list].sort((a, b) => {
    const da = normalizeDateValue(a.requestDate);
    const db = normalizeDateValue(b.requestDate);

    if (da < db) return -1;
    if (da > db) return 1;

    const ta =
      parseInt(
        normalizeTimeValue(a.requestTimeBand).replace(/[^\d]/g, ""),
        10
      ) || 0;
    const tb =
      parseInt(
        normalizeTimeValue(b.requestTimeBand).replace(/[^\d]/g, ""),
        10
      ) || 0;

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

function MainPage() {
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState("");
  const [org, setOrg] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState("");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const hasKeyword = keyword.trim().length > 0;

  async function loadData(withRefresh = false) {
    try {
      setError("");

      if (withRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const list = await fetchList();
      const sorted = sortRows(list);
      setRows(sorted);

      if (sorted.length > 0) {
        const firstMonth = normalizeMonthValue(sorted[0].requestDate);
        if (firstMonth) {
          setMonth((prev) => prev || firstMonth);
        }
      }
    } catch (e) {
      const message = e.message || "데이터를 불러오지 못했습니다.";
      setError(message);
      window.alert(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData(false);
  }, []);

  useEffect(() => {
    function handleMessage(event) {
      if (event.origin !== window.location.origin) return;

      const type = event.data?.type;
      if (type === "DETAIL_SAVED" || type === "DETAIL_ITEM_ADDED") {
        loadData(true);
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const orgs = useMemo(() => {
    return [
      ...new Set(
        rows
          .map((row) => String(row.orgName || "").trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [rows]);

  const times = useMemo(() => {
    const list = [
      ...new Set(
        rows
          .map((row) => normalizeTimeValue(row.requestTimeBand))
          .filter(Boolean)
      ),
    ];

    return list.sort((a, b) => {
      const aa = parseInt(a.replace(/[^\d]/g, ""), 10) || 0;
      const bb = parseInt(b.replace(/[^\d]/g, ""), 10) || 0;
      return aa - bb;
    });
  }, [rows]);

  const statuses = useMemo(() => {
    const base = ["검토", "조정요청", "확정", "반려", "추가"];

    return [
      ...new Set([
        ...base,
        ...rows.map((row) => getStatusValue(row.status)).filter(Boolean),
      ]),
    ];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const keywordTokens = normalizeText(keyword).split(/\s+/).filter(Boolean);

    return rows.filter((row) => {
      const rowMonth = normalizeMonthValue(row.requestDate);
      const rowOrg = String(row.orgName || "").trim();
      const rowTime = normalizeTimeValue(row.requestTimeBand);
      const rowStatus = getStatusValue(row.status);

      const itemText = [
        row.scheduleCodeName,
        row.orgName,
        row.requestTimeBand,
        row.status,
        row.opinion,
        row.id,
      ]
        .map((v) => String(v || ""))
        .join(" ");

      const normalizedItemText = normalizeText(itemText);

      if (month && rowMonth !== month) return false;
      if (org && rowOrg !== org) return false;
      if (time && rowTime !== time) return false;
      if (status && rowStatus !== status) return false;

      if (
        keywordTokens.length > 0 &&
        !keywordTokens.every((token) => normalizedItemText.includes(token))
      ) {
        return false;
      }

      return true;
    });
  }, [rows, month, org, time, status, keyword]);

  const sidebarRows = useMemo(() => {
    if (!hasKeyword) return [];
    return filteredRows;
  }, [filteredRows, hasKeyword]);

  const statusSummary = useMemo(() => {
    const counts = {
      검토: 0,
      조정요청: 0,
      확정: 0,
      반려: 0,
      추가: 0,
    };

    filteredRows.forEach((row) => {
      const rowStatus = getStatusValue(row.status);
      if (counts[rowStatus] !== undefined) {
        counts[rowStatus] += 1;
      }
    });

    return counts;
  }, [filteredRows]);

  const commitCount = useMemo(() => {
    return (
      statusSummary.검토 +
      statusSummary.조정요청 +
      statusSummary.확정 +
      statusSummary.반려 +
      statusSummary.추가
    );
  }, [statusSummary]);

  function openDetailByDate(date) {
    const url = `/detail?date=${date}`;
    window.open(url, "_blank", "width=1400,height=900");
  }

  function handleDateClick(date) {
    openDetailByDate(date);
  }

  function handleItemClick(item) {
    const date = normalizeDateValue(item.requestDate);
    if (!date) return;
    openDetailByDate(date);
  }

  function handleSearchItemClick(item) {
    const date = normalizeDateValue(item.requestDate);
    if (!date) return;
    openDetailByDate(date);
  }

  function handleRefresh() {
    loadData(true);
  }

  function handleCommit() {
    window.alert("전송 기능은 아직 연결되지 않았습니다.");
  }

  const pageMonth = month || "-";
  const pageMonthLabel = pageMonth !== "-" ? pageMonth.replace("-", ". ") : "-";

  return (
    <div className="app">
      <header className="app-header">
        <h1>월간 사전 편성 회의_편성팀</h1>
      </header>

      <main className="app-body">
        <FilterBar
          month={month}
          setMonth={setMonth}
          org={org}
          setOrg={setOrg}
          time={time}
          setTime={setTime}
          status={status}
          setStatus={setStatus}
          keyword={keyword}
          setKeyword={setKeyword}
          orgs={orgs}
          times={times}
          statuses={statuses}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          commitCount={commitCount}
          onCommit={handleCommit}
          committing={false}
        />

        {error && <div className="state-box error">{error}</div>}

        <div className="page-summary">
          <div className="summary-card">
            <div className="summary-card__label">대상 월</div>
            <div className="summary-card__value">{pageMonthLabel}</div>
          </div>

          <div className="summary-card">
            <div className="summary-card__label">조회 건수</div>
            <div className="summary-card__value">
              <strong>총 {filteredRows.length}건</strong>
              <span className="summary-sub">
                {" "}| 검토 {statusSummary.검토}
                {" "}| 조정요청 {statusSummary.조정요청}
                {" "}| 확정 {statusSummary.확정}
                {" "}| 반려 {statusSummary.반려}
                {" "}| 추가 {statusSummary.추가}
              </span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card__label">검색어</div>
            <div className="summary-card__value">{keyword || "-"}</div>
          </div>
        </div>

        <div
          className={`main-layout ${hasKeyword ? "has-sidebar" : "no-sidebar"}`}
        >
          <div className="main-layout__calendar">
            <CalendarMonth
              month={pageMonth}
              rows={filteredRows}
              onDateClick={handleDateClick}
              onItemClick={handleItemClick}
            />
          </div>

          {hasKeyword && (
            <SearchSidebar
              keyword={keyword}
              rows={sidebarRows}
              onItemClick={handleSearchItemClick}
            />
          )}
        </div>

        {loading && (
          <LoadingScreen
            overlay
            text="로딩 중..."
            subText="조금만 기다려주세요!"
          />
        )}

        {refreshing && (
          <LoadingScreen
            overlay
            text="새로고침 중..."
            subText="최신 데이터를 다시 불러오고 있어요!"
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/detail" element={<Detail />} />
    </Routes>
  );
}