async function draft() {
  setDrafting(true);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const r = await fetch('/api/agent/draft', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        stage: selected.stage,
        painPoint: selected.painPoint,
        objection: selected.objection
      })
    });

    const j: any = await r.json();

    if (!r.ok) {
      setInput(`KI-Fehler: ${j.error || 'Antwort konnte nicht erzeugt werden.'}`);
      return;
    }

    setInput(j.draft || 'Keine Antwort erhalten.');
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      setInput('KI-Anfrage hat zu lange gedauert. Bitte erneut versuchen.');
    } else {
      setInput('KI-Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    }
  } finally {
    clearTimeout(timeout);
    setDrafting(false);
  }
}
