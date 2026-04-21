const API_URL =
  "https://script.google.com/macros/s/AKfycbyrdH0pSS_jQ--m9RyuNfp2wm475Xyd8tUxQuJK_4zvOqC-0GZYdpgYE-o0vMXSnQkEQA/exec";

// 조회
export async function fetchList() {
  const res = await fetch(`${API_URL}?action=list`);
  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "list 실패");
  }

  return data.data || [];
}

// 추가
export async function addItem(payload) {
  const res = await fetch(`${API_URL}?action=add`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "add 실패");
  }

  return data;
}

// 상태/의견 commit
export async function commitOverlay(overlay) {
  const res = await fetch(`${API_URL}?action=commit`, {
    method: "POST",
    body: JSON.stringify({ overlay }),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "commit 실패");
  }

  return data.result;
}

// upsert (필요 시)
export async function updateItem(payload) {
  const res = await fetch(`${API_URL}?action=update`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  const data = await res.json();

  if (!data.ok) {
    throw new Error(data.error || "update 실패");
  }

  return data;
}