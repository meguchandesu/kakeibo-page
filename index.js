const STORAGE_KEY = "kakeiboEntries";

const form = document.querySelector("#entry-form");
const list = document.querySelector("#entry-list");
const totalAmount = document.querySelector("#total-amount");
const status = document.querySelector("#app-status");

let entries = [];

function setStatus(message, state = "success") {
  status.textContent = message;
  status.dataset.state = state;
}

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    (value.type === "expense" || value.type === "income") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function renderEntries() {
  const fragment = document.createDocumentFragment();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録されたデータはありません。";
    row.append(cell);
    fragment.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "expense" ? "支出" : "収入",
        `${entry.amount.toLocaleString("ja-JP")} 円`,
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      fragment.append(row);
    }
  }

  list.replaceChildren(fragment);

  const balance = entries.reduce(
    (total, entry) =>
      total + (entry.type === "income" ? entry.amount : -entry.amount),
    0,
  );
  totalAmount.textContent = balance.toLocaleString("ja-JP");
}

function loadEntries() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData === null) {
      return true;
    }

    const parsedData = JSON.parse(savedData);
    if (!Array.isArray(parsedData) || !parsedData.every(isEntry)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    entries = parsedData;
    return true;
  } catch (error) {
    console.error("家計簿データを読み込めませんでした。", error);
    setStatus(
      "保存データを読み込めませんでした。ブラウザーの保存設定とデータを確認してください。",
      "error",
    );
    return false;
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const entry = {
    date: formData.get("date"),
    item: formData.get("item").trim(),
    type: formData.get("type"),
    amount: Number(formData.get("amount")),
  };

  if (!isEntry(entry)) {
    setStatus("入力内容を確認してください。金額は1円以上で入力してください。", "error");
    return;
  }

  const updatedEntries = [...entries, entry];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error("家計簿データを保存できませんでした。", error);
    setStatus(
      "データを保存できませんでした。ブラウザーの保存設定や空き容量を確認してください。",
      "error",
    );
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  setStatus("家計簿に追加しました。");
});

if (loadEntries()) {
  renderEntries();
}
