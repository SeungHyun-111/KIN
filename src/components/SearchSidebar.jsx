function getStatusLabel(status = "") {
  return String(status || "").trim() || "검토";
}

function getStatusClass(status = "") {
  if (status === "확정") return "status-confirm";
  if (status === "조정요청") return "status-adjust";
  if (status === "반려") return "status-reject";
  if (status === "추가") return "status-added";
  return "status-review";
}

export default function SearchSidebar({ keyword, rows, onItemClick }) {
  const hasKeyword = String(keyword || "").trim().length > 0;

  if (!hasKeyword) return null;

  return (
    <aside className="search-sidebar">
      <div className="search-sidebar__header">
        <h3>검색 결과</h3>
        <span>{rows.length}건</span>
      </div>

      <div className="search-sidebar__body">
        {rows.length === 0 ? (
          <div className="search-sidebar__empty">검색 결과가 없습니다.</div>
        ) : (
          <ul className="search-sidebar__list">
            {rows.map((item) => (
              <li key={item.id} className="search-sidebar__item">
                <button
                  type="button"
                  className="search-sidebar__card"
                  onClick={() => onItemClick(item)}
                >
                  <div className="search-sidebar__top">
                    <span className="search-sidebar__date">
                      {normalizeDate(item.requestDate)}
                    </span>
                    <span className={`search-sidebar__status ${getStatusClass(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </div>

                  <div className="search-sidebar__title">
                    {item.scheduleCodeName}
                  </div>

                  <div className="search-sidebar__meta">
                    <span>{String(item.requestTimeBand || "").trim()}</span>
                    <span>{String(item.orgName || "").trim()}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function normalizeDate(value = "") {
  return String(value).replace(/\//g, "-").slice(0, 10);
}