import { useState, useRef } from 'react';
import { mapUrl, scrapeUrl } from './lib/firecrawl.js';
import styles from './styles.js';
import InputPanel from './components/InputPanel.jsx';
import Sidebar from './components/Sidebar.jsx';
import Terminal from './components/Terminal.jsx';
import ReportPanel from './components/ReportPanel.jsx';
import { runChecks, checkDuplicateTitles } from './lib/checks.js';
import { kimiSummary } from './lib/kimiSummary.js';
import { buildGraphData, normaliseUrl } from './lib/graphBuilder.js';

export default function App() {
  const [url, setUrl]         = useState(() => localStorage.getItem('sa_url') || '');
  const [fcKey, setFcKey]     = useState(() => localStorage.getItem('sa_fc_key') || import.meta.env.VITE_FC_API_KEY || '');
  const [groqKey, setGroqKey] = useState(() => localStorage.getItem('sa_nvidia_key') || import.meta.env.VITE_NVIDIA_API_KEY || '');
  const [status, setStatus]   = useState('idle');
  const [logs, setLogs]       = useState([]);
  const [issues, setIssues]   = useState([]);
  const [stats, setStats]     = useState({ crawled: 0, total: 0, crits: 0, warnings: 0 });
  const [report, setReport]   = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem('sa_history') || '[]')
  );
  const [graphData, setGraphData] = useState(null);

  const startTimeRef = useRef(null);
  const abortRef     = useRef(null);
  const linkMapRef   = useRef({});  // { pageUrl: [internalUrl, ...] }
  const scannedUrls  = useRef([]);

  const persist = (key, val) => localStorage.setItem(key, val);
  const domain  = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : '';

  const pushLog = (sev, msg, path = '') =>
    setLogs(prev => [...prev, {
      sev, msg, path,
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
    }]);

  function stopAutopsy() {
    abortRef.current?.abort();
  }

  function clearHistory() {
    localStorage.removeItem('sa_history');
    setHistory([]);
  }

  function updateGraph(rootUrl) {
    const data = buildGraphData(linkMapRef.current, rootUrl);
    setGraphData(data);
  }

  async function runAutopsy() {
    const controller = new AbortController();
    abortRef.current   = controller;
    linkMapRef.current = {};
    scannedUrls.current = [];

    setStatus('running');
    setLogs([]);
    setIssues([]);
    setReport(null);
    setElapsed(0);
    setGraphData(null);
    setStats({ crawled: 0, total: 0, crits: 0, warnings: 0 });
    startTimeRef.current = Date.now();

    if (!fcKey && !groqKey) {
      pushLog('CRITICAL', 'Firecrawl API key required — add it in the sidebar');
      pushLog('CRITICAL', 'Groq API key required — add it in the sidebar');
      setStatus('error');
      return;
    }
    if (!fcKey) {
      pushLog('CRITICAL', 'Firecrawl API key required — add it in the sidebar (fc-...)');
      setStatus('error');
      return;
    }
    if (!groqKey) {
      pushLog('WARNING', 'NVIDIA API key missing — scan will run but AI summary will be skipped');
    }

    let currentDomain;
    try {
      currentDomain = new URL(url).hostname;
    } catch {
      pushLog('CRITICAL', 'Invalid URL — please enter a full URL including https://');
      setStatus('error');
      return;
    }

    // Normalise root URL — must go through normaliseUrl so it's canonical
    const rootUrl = normaliseUrl(url, currentDomain) || url;

    pushLog('SYSTEM', `Initializing autopsy on ${currentDomain}`);

    let urls;
    try {
      const mapRes = await mapUrl(url, fcKey);
      urls = (mapRes.links || [url]).slice(0, 20);
    } catch {
      pushLog('WARNING', 'mapUrl failed — falling back to root URL only');
      urls = [url];
    }

    if (controller.signal.aborted) { setStatus('done'); return; }

    // Filter out non-HTML resources (sitemaps, PDFs, assets) — they pollute the graph
    const NON_HTML = /\.(xml|txt|pdf|json|rss|atom|csv|xlsx|docx|zip|png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/i;
    urls = urls.filter(u => {
      try { return !NON_HTML.test(new URL(u).pathname); } catch { return true; }
    });

    pushLog('SYSTEM', `Discovered ${urls.length} pages — beginning scan`);
    setStats(s => ({ ...s, total: urls.length }));

    // Initialise link map with all discovered HTML URLs
    for (const u of urls) {
      const norm = normaliseUrl(u, currentDomain) || u;
      linkMapRef.current[norm] = [];
    }

    const allIssues   = [];
    const pageMetadata = [];

    for (const pageUrl of urls) {
      if (controller.signal.aborted) {
        pushLog('SYSTEM', 'Scan stopped');
        break;
      }

      const path = (() => { try { return new URL(pageUrl).pathname; } catch { return pageUrl; } })();
      pushLog('URL', `Scanning ${path}`);

      try {
        const res = await scrapeUrl(pageUrl, fcKey);

        // --- SEO checks ---
        // rawHtml is the unprocessed page HTML — includes <head>, <script>, <link> tags
        // that Firecrawl strips from the cleaned 'html' format
        const checkHtml = res.rawHtml || res.html;
        const found = runChecks(pageUrl, res.metadata, checkHtml);
        pageMetadata.push({ url: pageUrl, title: res.metadata?.title || '' });

        found.forEach(issue => {
          allIssues.push(issue);
          if (issue.sev !== 'OK') pushLog(issue.sev, issue.msg, path);
        });

        if (!found.some(i => i.sev === 'CRITICAL' || i.sev === 'WARNING')) {
          pushLog('OK', 'No issues found', path);
        }

        // --- Internal link extraction ---
        const rawLinks = [...(res.links || [])];
        // Parse both html (cleaned) and rawHtml (full) — rawHtml catches links in
        // JS-rendered navigation (Wix, Webflow, etc.) that the cleaned version strips
        for (const htmlSrc of [res.html, res.rawHtml]) {
          if (!htmlSrc) continue;
          try {
            const doc = new DOMParser().parseFromString(htmlSrc, 'text/html');
            for (const sel of ['a[href]', 'area[href]']) {
              for (const el of doc.querySelectorAll(sel)) {
                const href = (el.getAttribute('href') || '').trim();
                if (!href || /^(mailto:|tel:|javascript:|#)/i.test(href)) continue;
                try { rawLinks.push(new URL(href, pageUrl).href); } catch { /* skip */ }
              }
            }
          } catch { /* skip HTML parse errors */ }
        }
        const internalLinks = [...new Set(rawLinks)]
          .map(href => normaliseUrl(href, currentDomain))
          .filter(Boolean);

        const normPageUrl = normaliseUrl(pageUrl, currentDomain) || pageUrl;
        linkMapRef.current[normPageUrl] = internalLinks;
        scannedUrls.current.push(normPageUrl);

      } catch (err) {
        if (controller.signal.aborted) { pushLog('SYSTEM', 'Scan stopped'); break; }
        pushLog('WARNING', `Scrape failed: ${err.message}`, path);
      }

      setIssues([...allIssues]);
      setStats(s => ({
        ...s,
        crawled: s.crawled + 1,
        crits:    allIssues.filter(i => i.sev === 'CRITICAL').length,
        warnings: allIssues.filter(i => i.sev === 'WARNING').length,
      }));

    }

    if (!controller.signal.aborted) {
      const dupIssues = checkDuplicateTitles(allIssues, pageMetadata);
      if (dupIssues.length > 0) {
        dupIssues.forEach(issue => {
          allIssues.push(issue);
          pushLog(issue.sev, issue.msg, issue.path);
        });
        setIssues([...allIssues]);
        setStats(s => ({
          ...s,
          warnings: allIssues.filter(i => i.sev === 'WARNING').length,
        }));
      }
    }

    const elapsedSec = Math.round((Date.now() - startTimeRef.current) / 1000);
    setElapsed(elapsedSec);

    // Final graph rebuild
    updateGraph(rootUrl);

    if (!controller.signal.aborted && groqKey) {
      pushLog('SYSTEM', 'Generating AI summary...');
      let summary = null;
      try {
        summary = await kimiSummary(allIssues, currentDomain, groqKey, controller.signal);
        setReport(summary);
        pushLog('SYSTEM', `Autopsy complete — health score: ${summary.score}/100`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          pushLog('WARNING', `AI summary failed — ${err.message || err}`);
        }
      }

      if (summary) {
        const entry = {
          url:      currentDomain,
          score:    summary.score,
          crits:    allIssues.filter(i => i.sev === 'CRITICAL').length,
          warnings: allIssues.filter(i => i.sev === 'WARNING').length,
          elapsed:  elapsedSec,
          ts:       Date.now(),
        };
        const prev = JSON.parse(localStorage.getItem('sa_history') || '[]');
        const next = [entry, ...prev].slice(0, 5);
        localStorage.setItem('sa_history', JSON.stringify(next));
        setHistory(next);
      }
    }

    setStatus('done');
  }

  return (
    <div className="app">
      <style>{styles}</style>

      <header className="header">
        <span className="header-logo">Site Autopsy</span>
        <span className="header-meta">seo forensics · real-time</span>
      </header>

      <div className="app-layout">
        <div className="col-sidebar">
          <InputPanel
            fcKey={fcKey} setFcKey={setFcKey}
            groqKey={groqKey} setGroqKey={setGroqKey}
            persist={persist}
            status={status}
          />
          <Sidebar
            stats={stats} status={status} elapsed={elapsed}
            history={history} onClearHistory={clearHistory}
          />
        </div>

        <div className="col-center">
          <Terminal
            logs={logs} status={status}
            url={url} setUrl={setUrl}
            persist={persist}
            onRun={runAutopsy}
            onStop={stopAutopsy}
            missingFcKey={!fcKey}
            missingGroqKey={!groqKey}
            graphData={graphData}
          />
        </div>

        <div className="col-right">
          <ReportPanel
            issues={issues} report={report} status={status}
            domain={domain} stats={stats}
          />
        </div>
      </div>
    </div>
  );
}
