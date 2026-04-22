export default function FilterBar(props) {
  const {
    org,
    setOrg,
    time,
    setTime,
    status,
    setStatus,
    keyword,
    setKeyword,
    orgs,
    times,
    statuses,
    onRefresh,
    refreshing,
  } = props;

  return (
    <div className="filterbar">
      <div className="filterbox">
        <label>조직 필터</label>
        <select value={org} onChange={(e) => setOrg(e.target.value)}>
          <option value="">전체</option>
          {orgs.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filterbox">
        <label>시간 필터</label>
        <select value={time} onChange={(e) => setTime(e.target.value)}>
          <option value="">전체</option>
          {times.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filterbox">
        <label>상태 필터</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">전체</option>
          {statuses.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="filterbox filterbox--search">
        <label>아이템 검색</label>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="다중검색: 공백으로 구분"
        />
      </div>

      <div className="filterbar-actions">
        <button
          type="button"
          className="action-button action-button--refresh"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "불러오는 중..." : "데이터 새로고침"}
        </button>
      </div>
    </div>
  );
}