/**
 * Shared helpers for grouping Security Activity rows by user UID and timestamp minute bucket.
 */

export function tallyField(items, getValue) {
  const counts = {};
  for (const item of items) {
    const val = getValue(item);
    if (!val) continue;
    counts[val] = (counts[val] || 0) + 1;
  }
  return counts;
}

export function groupByUidAndTime(items, { getUid, getTimeKey, toChildEvent, buildGroup }) {
  if (!Array.isArray(items) || items.length === 0) return [];

  const groupMap = new Map();
  const orderedKeys = [];

  for (const item of items) {
    const uid = getUid(item);
    const timeKey = getTimeKey(item) || "—";
    const key = `${uid ?? "system"}::${timeKey}`;
    const incomingChildren =
      Array.isArray(item.events) && item.events.length > 0
        ? item.events.map((ev) => toChildEvent(ev, item))
        : [toChildEvent(item, item)];

    if (!groupMap.has(key)) {
      orderedKeys.push(key);
      groupMap.set(key, {
        key,
        uid: uid ?? null,
        timeKey,
        lead: item,
        events: [...incomingChildren],
      });
    } else {
      const existing = groupMap.get(key);
      const seenIds = new Set(existing.events.map((e) => e.id).filter((id) => id != null));
      for (const child of incomingChildren) {
        if (child.id == null || !seenIds.has(child.id)) {
          existing.events.push(child);
          if (child.id != null) seenIds.add(child.id);
        }
      }
    }
  }

  return orderedKeys.map((key) => {
    const entry = groupMap.get(key);
    return buildGroup(entry.lead, entry.events, entry.key, entry.timeKey);
  });
}

export function toggleKeyInSet(prevSet, key) {
  const next = new Set(prevSet);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  return next;
}
