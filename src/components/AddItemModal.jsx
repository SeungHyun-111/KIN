import { useEffect, useState } from "react";

export default function AddItemModal({ isOpen, onClose, onSubmit }) {
  const [requestTimeBand, setRequestTimeBand] = useState("");
  const [orgName, setOrgName] = useState("");
  const [scheduleCodeName, setScheduleCodeName] = useState("");
  const [dealType, setDealType] = useState("");
  const [status, setStatus] = useState("추가");
  const [opinion, setOpinion] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRequestTimeBand("");
      setOrgName("");
      setScheduleCodeName("");
      setDealType("");
      setStatus("추가");
      setOpinion("");
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!requestTimeBand.trim() || !orgName.trim() || !scheduleCodeName.trim()) {
      window.alert("시간, 조직, 아이템명은 필수입니다.");
      return;
    }

    try {
      setSubmitting(true);

      const ok = await onSubmit({
        requestTimeBand,
        orgName,
        scheduleCodeName,
        dealType,
        status,
        opinion,
      });

      if (ok) {
        onClose();
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="add-modal__overlay" onClick={onClose}>
      <div className="add-modal" onClick={(e) => e.stopPropagation()}>
        <div className="add-modal__header">
          <h2>아이템 추가</h2>
          <button
            type="button"
            className="add-modal__close"
            onClick={onClose}
          >
            닫기
          </button>
        </div>

        <form className="add-modal__form" onSubmit={handleSubmit}>
          <div className="add-modal__grid">
            <div className="add-modal__field">
              <label>시간</label>
              <input
                type="text"
                value={requestTimeBand}
                onChange={(e) => setRequestTimeBand(e.target.value)}
                placeholder="예: 21시"
              />
            </div>

            <div className="add-modal__field">
              <label>조직</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="예: 문화서비스"
              />
            </div>

            <div className="add-modal__field">
              <label>거래형태</label>
              <input
                type="text"
                value={dealType}
                onChange={(e) => setDealType(e.target.value)}
                placeholder="예: 직매입 / 위수탁 / 혼합"
              />
            </div>

            <div className="add-modal__field">
              <label>상태</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="추가">추가</option>
                <option value="검토">검토</option>
                <option value="조정요청">조정요청</option>
                <option value="확정">확정</option>
                <option value="반려">반려</option>
              </select>
            </div>

            <div className="add-modal__field add-modal__field--wide">
              <label>아이템명</label>
              <input
                type="text"
                value={scheduleCodeName}
                onChange={(e) => setScheduleCodeName(e.target.value)}
                placeholder="추가할 아이템명 입력"
              />
            </div>

            <div className="add-modal__field add-modal__field--wide">
              <label>의견</label>
              <input
                type="text"
                value={opinion}
                onChange={(e) => setOpinion(e.target.value)}
                placeholder="의견 입력"
              />
            </div>
          </div>

          <div className="add-modal__actions">
            <button
              type="button"
              className="add-modal__button add-modal__button--ghost"
              onClick={onClose}
            >
              취소
            </button>

            <button
              type="submit"
              className="add-modal__button add-modal__button--primary"
              disabled={submitting}
            >
              {submitting ? "추가 중..." : "추가"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}