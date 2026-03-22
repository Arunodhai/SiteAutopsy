const SEV_ORDER = { CRITICAL: 0, WARNING: 1, INFO: 2 };

export function aggregateIssues(issues) {
  const map = {};
  for (const issue of issues) {
    if (issue.sev === 'OK') continue;
    const key = `${issue.sev}||${issue.msg}`;
    if (!map[key]) map[key] = { sev: issue.sev, msg: issue.msg, pages: new Set(), count: 0 };
    map[key].count++;
    if (issue.path) map[key].pages.add(issue.path);
  }
  return Object.values(map)
    .sort((a, b) => {
      const sevDiff = (SEV_ORDER[a.sev] ?? 9) - (SEV_ORDER[b.sev] ?? 9);
      return sevDiff !== 0 ? sevDiff : b.count - a.count;
    })
    .map(({ sev, msg, pages, count }) => `${sev}|${pages.size || count}p|${msg}`);
}
