import { useState, useRef, useEffect } from 'react';
import { mapUrl, scrapeUrl, scrapeBranding, scrapeSnapshot } from './lib/firecrawl.js';
import styles from './styles.js';
import Sidebar from './components/Sidebar.jsx';
import SnapshotSidebar from './components/SnapshotSidebar.jsx';
import Terminal from './components/Terminal.jsx';
import ReportPanel from './components/ReportPanel.jsx';
import { runChecks, checkDuplicateTitles } from './lib/checks.js';
import { kimiSummary } from './lib/kimiSummary.js';
import { groqSummary } from './lib/groqSummary.js';
import { buildGraphData, normaliseUrl } from './lib/graphBuilder.js';
import { calculateSeoScore } from './lib/seoScore.js';

export default function App() {
  const [url, setUrl]             = useState(() => localStorage.getItem('sa_url') || '');
  const [fcKey, setFcKey]         = useState(() => localStorage.getItem('sa_fc_key') || import.meta.env.VITE_FC_API_KEY || '');
  const [llmProvider, setLlmProvider] = useState(() => localStorage.getItem('sa_llm_provider') || 'nvidia');
  const [nvidiaKey, setNvidiaKey] = useState(() => localStorage.getItem('sa_nvidia_key') || import.meta.env.VITE_NVIDIA_API_KEY || '');
  const [groqKey, setGroqKey]     = useState(() => localStorage.getItem('sa_groq_key') || import.meta.env.VITE_GROQ_API_KEY || '');
  const [status, setStatus]   = useState('idle');
  const [logs, setLogs]       = useState([]);
  const [issues, setIssues]   = useState([]);
  const [stats, setStats]     = useState({ crawled: 0, total: 0, crits: 0, warnings: 0 });
  const [report, setReport]   = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState(() =>
    JSON.parse(localStorage.getItem('sa_history') || '[]')
  );
  const [graphData, setGraphData]   = useState(null);
  const [branding, setBranding]     = useState(null);
  const [screenshot, setScreenshot]     = useState(null);
  const [siteSummary, setSiteSummary]   = useState(null);
  const [rootScrape, setRootScrape]     = useState(null);
  const [activeTab, setActiveTab]       = useState('feed');
  const [seoScore, setSeoScore]         = useState(null);

  const startTimeRef  = useRef(null);
  const abortRef      = useRef(null);
  const linkMapRef    = useRef({});
  const scannedUrls   = useRef([]);
  const rootScrapeRef = useRef(null);

  const persist = (key, val) => localStorage.setItem(key, val);
  const domain  = url ? (() => { try { return new URL(url).hostname; } catch { return url; } })() : '';

  const isRunning      = status === 'running';
  const missingFcKey   = !fcKey;
  const missingGroqKey = !(llmProvider === 'nvidia' ? nvidiaKey : groqKey);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'r' || e.key === 'R') && !isRunning && url) runAutopsy();
      if (e.key === 'Escape' && isRunning) stopAutopsy();
      if (e.key === '1') setActiveTab('feed');
      if (e.key === '2') setActiveTab('graph');
      if (e.key === '3') setActiveTab('profile');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [url, isRunning]);

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
    setBranding(null);
    setScreenshot(null);
    setSiteSummary(null);
    setRootScrape(null);
    setSeoScore(null);
    rootScrapeRef.current = null;
    setStats({ crawled: 0, total: 0, crits: 0, warnings: 0 });
    startTimeRef.current = Date.now();

    const activeKey = llmProvider === 'nvidia' ? nvidiaKey : groqKey;
    const providerLabel = llmProvider === 'nvidia' ? 'NVIDIA (Kimi K2.5)' : 'Groq (Llama 3.3)';

    if (!fcKey) {
      pushLog('CRITICAL', 'Firecrawl API key required — add it in the sidebar (fc-...)');
      setStatus('error');
      return;
    }
    if (!activeKey) {
      pushLog('WARNING', `${providerLabel} key missing — scan will run but AI summary will be skipped`);
    }

    let currentDomain;
    let resolvedUrl = url.trim();
    if (resolvedUrl && !/^https?:\/\//i.test(resolvedUrl)) {
      resolvedUrl = 'https://' + resolvedUrl;
      setUrl(resolvedUrl);
    }
    try {
      currentDomain = new URL(resolvedUrl).hostname;
    } catch {
      pushLog('CRITICAL', 'Invalid URL — please enter a valid domain or full URL');
      setStatus('error');
      return;
    }

    const rootUrl = normaliseUrl(resolvedUrl, currentDomain) || resolvedUrl;

    pushLog('SYSTEM', `Initializing autopsy on ${currentDomain}`);

    const PAGE_LIMIT = 20;
    const NON_HTML = /\.(xml|txt|pdf|json|rss|atom|csv|xlsx|docx|zip|png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$/i;

    const isHtmlUrl = (u) => { try { return !NON_HTML.test(new URL(u).pathname); } catch { return true; } };

    let initialUrls;
    try {
      const mapRes = await mapUrl(url, fcKey);
      initialUrls = (mapRes.links || [url]).filter(isHtmlUrl).slice(0, PAGE_LIMIT);
    } catch {
      pushLog('WARNING', 'mapUrl failed — falling back to root URL only');
      initialUrls = [url];
    }

    if (controller.signal.aborted) { setStatus('done'); return; }

    const queued  = new Set(initialUrls.map(u => normaliseUrl(u, currentDomain) || u));
    const queue   = [...queued];

    pushLog('SYSTEM', `Discovered ${queue.length} pages — beginning scan`);
    setStats(s => ({ ...s, total: queue.length + (activeKey ? 1 : 0) }));

    for (const norm of queued) linkMapRef.current[norm] = [];

    const allIssues   = [];
    const pageMetadata = [];

    for (let qi = 0; qi < queue.length; qi++) {
      const pageUrl = queue[qi];
      if (controller.signal.aborted) {
        pushLog('SYSTEM', 'Scan stopped');
        break;
      }

      const path = (() => { try { return new URL(pageUrl).pathname; } catch { return pageUrl; } })();
      pushLog('URL', `Scanning ${path}`);

      try {
        const res = await scrapeUrl(pageUrl, fcKey);

        if (!rootScrapeRef.current) {
          rootScrapeRef.current = { url: pageUrl, res };
          setRootScrape({ url: pageUrl, res });
        }

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

        const rawLinks = [...(res.links || [])];
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

    updateGraph(rootUrl);

    // Calculate deterministic SEO score
    const rootHtml = rootScrapeRef.current?.res?.rawHtml || rootScrapeRef.current?.res?.html || '';
    const rootMeta = rootScrapeRef.current?.res?.metadata || {};
    const crawledCount = scannedUrls.current.length || 1;
    const calculatedScore = calculateSeoScore(allIssues, crawledCount, rootHtml, resolvedUrl, rootMeta);
    setSeoScore(calculatedScore);

    if (!controller.signal.aborted) {
      pushLog('SYSTEM', 'Extracting branding & snapshot...');
      await Promise.allSettled([
        scrapeBranding(rootUrl, fcKey).then(bd => {
          if (bd) setBranding({ ...bd, domain: currentDomain });
        }),
        scrapeSnapshot(rootUrl, fcKey).then(({ screenshot, summary }) => {
          if (screenshot) setScreenshot(screenshot);
          if (summary)    setSiteSummary(summary);
        }),
      ]);
    }

    let summary = null;
    if (!controller.signal.aborted && activeKey) {
      pushLog('SYSTEM', `Generating AI summary via ${providerLabel}...`);
      try {
        summary = llmProvider === 'groq'
          ? await groqSummary(allIssues, currentDomain, activeKey, controller.signal)
          : await kimiSummary(allIssues, currentDomain, activeKey, controller.signal);
        setReport(summary);
        if (summary.siteSummary && !siteSummary) setSiteSummary(summary.siteSummary);
        setStats(s => ({ ...s, crawled: s.crawled + 1 }));
        pushLog('SYSTEM', `Autopsy complete — health score: ${calculatedScore.score}/100`);
      } catch (err) {
        if (err.name !== 'AbortError') {
          pushLog('WARNING', `AI summary failed — ${err.message || err}`);
          setStats(s => ({ ...s, crawled: s.crawled + 1 }));
        }
      }
    }

    if (!controller.signal.aborted) {
      const crits    = allIssues.filter(i => i.sev === 'CRITICAL').length;
      const warnings = allIssues.filter(i => i.sev === 'WARNING').length;
      const entry = {
        url:     currentDomain,
        score:   calculatedScore.score,
        crits,
        warnings,
        elapsed: elapsedSec,
        ts:      Date.now(),
      };
      const prev = JSON.parse(localStorage.getItem('sa_history') || '[]');
      const next = [entry, ...prev].slice(0, 50);
      localStorage.setItem('sa_history', JSON.stringify(next));
      setHistory(next);
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

      <div className={`app-layout${activeTab === 'feed' ? ' report-wide' : ''}`}>
        {/* ── Left sidebar ── */}
        <div className="col-sidebar">
          {activeTab === 'profile' ? (
            <SnapshotSidebar rootScrape={rootScrape} issues={issues} stats={stats} />
          ) : (
            <Sidebar
              stats={stats} status={status} elapsed={elapsed}
              report={report} seoScore={seoScore}
            />
          )}
        </div>

        {/* ── Center — content panels ── */}
        <div className="col-center">
          <Terminal
            logs={logs} status={status}
            url={url} setUrl={setUrl}
            persist={persist}
            onRun={runAutopsy}
            onStop={stopAutopsy}
            missingFcKey={missingFcKey}
            missingGroqKey={missingGroqKey}
            graphData={graphData}
            issues={issues}
            branding={branding}
            screenshot={screenshot}
            siteSummary={siteSummary}
            rootScrape={rootScrape}
            domain={domain}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            report={report}
            fcKey={fcKey} setFcKey={setFcKey}
            llmProvider={llmProvider} setLlmProvider={setLlmProvider}
            nvidiaKey={nvidiaKey} setNvidiaKey={setNvidiaKey}
            groqKey={groqKey} setGroqKey={setGroqKey}
            history={history}
            onClearHistory={clearHistory}
            onSelectHistory={(domain) => {
              const full = domain.startsWith('http') ? domain : `https://${domain}`;
              setUrl(full);
              persist('sa_url', full);
            }}
          />
        </div>

        {/* ── Right — report ── */}
        <div className="col-right">
          <ReportPanel
            issues={issues} report={report} status={status}
            domain={domain} stats={stats} seoScore={seoScore}
            rootScrape={rootScrape} branding={branding}
            screenshot={screenshot} siteSummary={siteSummary}
          />
        </div>
      </div>
    </div>
  );
}
