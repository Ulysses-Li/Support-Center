/* 選型僅查詢 Quick Pick 明確列出的配對；不由螺距、刀徑或其他牙規外推。 */
function normalizeSearch(value) {
  // 原表內外牙混用 1 與 1.0，查詢時統一數值寫法，保留牙系與英制分數。
  return String(value ?? "").toLowerCase().replace(/[×*]/g, "x").replace(/[‐‑−–—]/g, "-").replace(/\s+/g, "")
    .replace(/\d+\.\d+/g, number => String(Number(number)));
}

function createMccSelector(data) {
  const rows = data.rows;
  const inserts = data.inserts;
  const rowMap = new Map(rows.map(row => [row.id, row]));
  const insertMap = new Map(inserts.map(insert => [insert.id, insert]));
  const standardMap = new Map(data.standards.map(standard => [standard.id, standard]));
  return {
    getRow: id => rowMap.get(id),
    getInsert: id => insertMap.get(id),
    getStandard: id => standardMap.get(id),
    getThreads({ side = "internal", standard = "", insertId = "", query = "" } = {}) {
      const search = normalizeSearch(query);
      return rows.filter(row => row.side === side && (!standard || row.standard === standard)
        && (!insertId || row.insertIds.includes(insertId))
        && (!search || normalizeSearch(`${row.standard} ${row.size}`).includes(search)));
    },
    getInserts({ threadId = "", query = "" } = {}) {
      const row = threadId ? rowMap.get(threadId) : null;
      if (threadId && !row) return [];
      const search = normalizeSearch(query);
      return inserts.filter(insert => (!row || row.insertIds.includes(insert.id))
        && (!search || normalizeSearch(insert.id).includes(search)));
    }
  };
}

if (typeof module !== "undefined") module.exports = { createMccSelector, normalizeSearch };
