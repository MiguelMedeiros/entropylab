(() => {
  const app = document.getElementById("btc-calc");
  const privacyButton = document.getElementById("privacy-toggle");
  const privacyLabel = privacyButton?.querySelector(".privacy-label");
  const networkStatus = document.getElementById("network-status");

  if (app && !app.querySelector(".skip-link")) {
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link no-print";
    skipLink.href = "#workspace";
    skipLink.textContent = "Skip to calculator";
    app.prepend(skipLink);
  }

  const syncNetworkStatusTitle = () => {
    if (!networkStatus) return;
    const online = networkStatus.dataset.state !== "offline";
    networkStatus.title = online
      ? "A network adapter is available. Use only disposable test data until the computer is air-gapped."
      : "The browser reports no active network adapter. This is not proof of an air gap.";
  };
  if (networkStatus) {
    new MutationObserver(syncNetworkStatusTitle).observe(networkStatus, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
    syncNetworkStatusTitle();
  }

  const headerControls = document.querySelector(".download-controls");
  const headerVersion = document.querySelector(".site-version");
  const githubLink = headerControls?.querySelector(".github-repo-link");
  if (headerControls && (headerVersion || githubLink)) {
    const more = document.createElement("details");
    more.className = "header-more";
    more.innerHTML = `
      <summary class="header-button" aria-label="Open project information">
        <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.5"></circle><circle cx="12" cy="12" r="1.5"></circle><circle cx="19" cy="12" r="1.5"></circle></svg>
        <span class="control-label">More</span>
      </summary>
      <div class="header-menu" aria-label="Project information"></div>`;
    const menu = more.querySelector(".header-menu");
    const paletteStorageKey = "entropylab-palette";
    const palettes = [
      ["aurora", "Aurora"],
      ["tide", "Tide"],
      ["grove", "Grove"],
      ["orchid", "Orchid"],
    ];
    let selectedPalette = "aurora";
    try {
      const storedPalette = localStorage.getItem(paletteStorageKey);
      if (palettes.some(([id]) => id === storedPalette)) selectedPalette = storedPalette;
    } catch (e) {}
    const palettePicker = document.createElement("div");
    palettePicker.className = "palette-picker";
    palettePicker.innerHTML = `
      <span class="palette-picker-label" id="palette-picker-label">Color palette</span>
      <div class="palette-options" role="radiogroup" aria-labelledby="palette-picker-label">
        ${palettes.map(([id, label]) => `<button type="button" role="radio" data-palette-choice="${id}" aria-checked="false"><span class="palette-swatch" aria-hidden="true"></span><span>${label}</span></button>`).join("")}
      </div>
      <span class="sr-only" id="palette-status" aria-live="polite"></span>`;
    const applyPalette = (palette, announceChange = false) => {
      if (!palettes.some(([id]) => id === palette)) palette = "aurora";
      document.documentElement.dataset.palette = palette;
      palettePicker.querySelectorAll("[data-palette-choice]").forEach((button) => {
        const selected = button.dataset.paletteChoice === palette;
        button.setAttribute("aria-checked", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      try { localStorage.setItem(paletteStorageKey, palette); } catch (e) {}
      const label = palettes.find(([id]) => id === palette)?.[1] || "Aurora";
      if (announceChange) palettePicker.querySelector("#palette-status").textContent = `${label} palette selected`;
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.content = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    };
    palettePicker.addEventListener("click", (event) => {
      const button = event.target.closest?.("[data-palette-choice]");
      if (button) applyPalette(button.dataset.paletteChoice, true);
    });
    palettePicker.addEventListener("keydown", (event) => {
      const directions = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
      if (!directions.includes(event.key)) return;
      const buttons = [...palettePicker.querySelectorAll("[data-palette-choice]")];
      const current = event.target.closest?.("[data-palette-choice]");
      const currentIndex = buttons.indexOf(current);
      if (currentIndex < 0) return;
      event.preventDefault();
      const offset = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
      const next = buttons[(currentIndex + offset + buttons.length) % buttons.length];
      applyPalette(next.dataset.paletteChoice, true);
      next.focus();
    });
    menu.append(palettePicker);
    applyPalette(selectedPalette);
    if (headerVersion) menu.append(headerVersion);
    if (githubLink) menu.append(githubLink);
    headerControls.append(more);
    githubLink?.addEventListener("click", () => more.removeAttribute("open"));
    document.addEventListener("click", (event) => {
      if (more.open && !more.contains(event.target)) more.removeAttribute("open");
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && more.open) {
        more.removeAttribute("open");
        more.querySelector("summary")?.focus();
      }
    });
  }

  const heroCopy = document.querySelector(".hero-copy");
  if (heroCopy && !heroCopy.querySelector(".hero-actions")) {
    const heroActions = document.createElement("div");
    heroActions.className = "hero-actions no-print";
    heroActions.innerHTML = `
      <a class="btn primary hero-start" href="#workspace">Start with test data</a>
      <span class="hero-trust"><span aria-hidden="true">✓</span> No entropy is generated here</span>`;
    heroCopy.append(heroActions);
  }

  const workspace = document.getElementById("workspace");
  let workflowGuide = null;
  if (workspace) {
    workflowGuide = document.createElement("nav");
    workflowGuide.className = "workflow-guide no-print";
    workflowGuide.setAttribute("aria-label", "Wallet workflow");
    workflowGuide.innerHTML = `
      <ol>
        <li data-workflow-step="choose"><button type="button"><span>1</span><strong>Choose</strong><small>Pick a workspace</small></button></li>
        <li data-workflow-step="input"><button type="button"><span>2</span><strong>Add data</strong><small>Use test input first</small></button></li>
        <li data-workflow-step="review"><button type="button"><span>3</span><strong>Review</strong><small>Check before deriving</small></button></li>
        <li data-workflow-step="export"><button type="button"><span>4</span><strong>Export</strong><small>Verify independently</small></button></li>
      </ol>`;
    workspace.before(workflowGuide);
  }

  const visiblePanel = () => [...document.querySelectorAll("#calc-card, #msig-card, #psbt-card")]
    .find((panel) => !panel.hidden && panel.offsetParent !== null);
  const hasEnteredData = (panel) => [...(panel?.querySelectorAll("textarea, input:not([type='radio']):not([type='checkbox']):not([type='range']):not([type='number'])") || [])]
    .some((field) => String(field.value || "").trim());
  const hasResults = () => [document.getElementById("out"), document.getElementById("psbt-out")]
    .some((output) => output && String(output.textContent || "").trim());

  const syncWorkflowGuide = () => {
    if (!workflowGuide) return;
    const panel = visiblePanel();
    const primary = panel?.querySelector("#go, #msig-go, #psbt-go");
    const entered = hasEnteredData(panel);
    const ready = Boolean(primary && !primary.disabled && entered);
    const active = hasResults() ? 3 : ready ? 2 : entered ? 1 : 0;
    [...workflowGuide.querySelectorAll("li")].forEach((item, index) => {
      item.classList.toggle("is-complete", index < active);
      item.classList.toggle("is-current", index === active);
      const button = item.querySelector("button");
      if (index === active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
  };

  workflowGuide?.addEventListener("click", (event) => {
    const step = event.target.closest?.("[data-workflow-step]")?.dataset.workflowStep;
    const panel = visiblePanel();
    let target = workspace;
    if (step === "input") target = panel || workspace;
    if (step === "review") target = panel?.querySelector(".current-item-actions, .psbt-actions") || panel || workspace;
    if (step === "export") target = panel?.id === "psbt-card" ? document.getElementById("psbt-out") : document.getElementById("out");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  const output = document.getElementById("out");
  const psbtOutput = document.getElementById("psbt-out");
  output?.setAttribute("data-empty-label", "Results will appear here after a successful derivation.");
  psbtOutput?.setAttribute("data-empty-label", "The decoded PSBT report will appear here.");

  const statusRegion = document.createElement("div");
  statusRegion.className = "action-toast no-print";
  statusRegion.setAttribute("role", "status");
  statusRegion.setAttribute("aria-live", "polite");
  statusRegion.setAttribute("aria-atomic", "true");
  document.body.append(statusRegion);
  let toastTimer = 0;
  const announce = (message) => {
    window.clearTimeout(toastTimer);
    statusRegion.textContent = message;
    statusRegion.classList.remove("is-visible");
    requestAnimationFrame(() => statusRegion.classList.add("is-visible"));
    toastTimer = window.setTimeout(() => statusRegion.classList.remove("is-visible"), 2600);
  };

  const msigActions = document.querySelector("#msig-card .current-item-actions");
  let msigReadiness = document.getElementById("msig-readiness");
  if (msigActions && !msigReadiness) {
    msigReadiness = document.createElement("span");
    msigReadiness.className = "action-readiness";
    msigReadiness.id = "msig-readiness";
    msigReadiness.setAttribute("role", "status");
    msigActions.append(msigReadiness);
  }
  const syncActionHelp = () => {
    const derive = document.getElementById("go");
    const deriveStatus = document.getElementById("derive-readiness");
    if (derive && deriveStatus) {
      derive.setAttribute("aria-describedby", "derive-readiness");
      derive.title = derive.disabled ? deriveStatus.textContent : "Derive wallet from the reviewed input";
    }
    const msig = document.getElementById("msig-go");
    if (msig && msigReadiness) {
      const started = hasEnteredData(document.getElementById("msig-card"));
      const message = msig.disabled
        ? (started ? "Complete valid co-signer keys to derive." : "Add each co-signer public key to begin.")
        : "Inputs valid · ready to derive.";
      if (msigReadiness.textContent !== message) msigReadiness.textContent = message;
      msigReadiness.classList.toggle("is-ready", !msig.disabled);
      msig.setAttribute("aria-describedby", "msig-script-warning msig-readiness");
      msig.title = msig.disabled ? msigReadiness.textContent : "Derive multisig from the reviewed keys";
    }
    document.querySelectorAll(".err").forEach((error) => {
      error.setAttribute("role", "alert");
      error.setAttribute("aria-live", "assertive");
    });
    syncWorkflowGuide();
  };

  let resultWasPresent = hasResults();
  const resultObserver = new MutationObserver(() => {
    const resultIsPresent = hasResults();
    if (resultIsPresent && !resultWasPresent) announce("Results ready. Review every value before exporting.");
    resultWasPresent = resultIsPresent;
    syncActionHelp();
  });
  [app, output, psbtOutput].filter(Boolean).forEach((node) => resultObserver.observe(node, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["hidden", "disabled", "aria-disabled", "aria-pressed"],
  }));
  document.addEventListener("input", syncActionHelp);
  document.addEventListener("change", syncActionHelp);
  document.addEventListener("click", (event) => {
    const control = event.target.closest?.("button, a");
    if (!control) return;
    if (control.matches(".download-html")) announce("Offline HTML download started.");
    if (control.matches(".save-recovery-sheet, .save-wallet-dat")) announce("Export prepared. Store it securely.");
    if (control.matches("#wipe, #msig-wipe, #psbt-wipe")) window.setTimeout(() => announce("Session fields cleared."), 0);
    if (control.matches("#go, #msig-go, #psbt-go") && !control.disabled) {
      const panel = control.closest("#calc-card, #msig-card, #psbt-card");
      panel?.setAttribute("aria-busy", "true");
      window.setTimeout(() => panel?.removeAttribute("aria-busy"), 320);
    }
  });
  syncActionHelp();

  const privacyRoots = ["calc-card", "msig-card", "psbt-card", "out", "psbt-out"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);
  const applyPrivacy = (enabled) => {
    app?.classList.toggle("privacy-mode", enabled);
    privacyButton?.setAttribute("aria-pressed", String(enabled));
    privacyButton?.setAttribute("aria-label", enabled ? "Disable presentation mode" : "Enable presentation mode");
    privacyButton?.setAttribute("title", enabled
      ? "Private values are hidden. Press Escape to exit."
      : "Hide sensitive values while sharing the screen");
    if (privacyLabel) privacyLabel.textContent = enabled ? "Show data" : "Presentation";
    privacyRoots.forEach((element) => {
      element.inert = enabled;
      if (enabled) element.setAttribute("aria-hidden", "true");
      else element.removeAttribute("aria-hidden");
    });
  };
  privacyButton?.addEventListener("click", () => {
    applyPrivacy(!app?.classList.contains("privacy-mode"));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && app?.classList.contains("privacy-mode")) {
      applyPrivacy(false);
      privacyButton?.focus();
    }
  });

  const warnings = [...document.querySelectorAll(".beta-warning, .online-warning, .network-warning")]
    .filter((warning) => !warning.closest("noscript"));
  if (warnings.length) {
    const safetyCenter = document.createElement("details");
    const summary = document.createElement("summary");
    const summaryTitle = document.createElement("span");
    const summaryDetail = document.createElement("span");
    const body = document.createElement("div");
    safetyCenter.className = "safety-center no-print";
    summaryTitle.className = "safety-summary-title";
    summaryDetail.className = "safety-summary-detail";
    body.className = "safety-details";
    summary.append(summaryTitle, summaryDetail);
    safetyCenter.append(summary, body);
    warnings[0].before(safetyCenter);
    warnings.forEach((warning) => body.append(warning));

    const syncSafetyCenter = () => {
      const visible = warnings.filter((warning) => !warning.hidden);
      const serious = visible.some((warning) => warning.matches(".online-warning, .network-warning"));
      safetyCenter.classList.toggle("has-danger", serious);
      summaryTitle.textContent = serious ? "Security action required" : "Safety review";
      summaryDetail.textContent = `${visible.length} ${visible.length === 1 ? "notice" : "notices"} · Review before entering wallet data`;
      safetyCenter.hidden = visible.length === 0;
    };
    warnings.forEach((warning) => new MutationObserver(syncSafetyCenter).observe(warning, {
      attributes: true,
      attributeFilter: ["hidden"],
    }));
    syncSafetyCenter();
  }

  const dialog = document.createElement("dialog");
  dialog.className = "confirm-dialog";
  dialog.innerHTML = `
    <form method="dialog" class="confirm-dialog-card">
      <div class="confirm-dialog-icon" aria-hidden="true">!</div>
      <div>
        <h2 id="confirm-dialog-title">Delete this item?</h2>
        <p id="confirm-dialog-description">Its inputs and derived results will be removed from this session.</p>
      </div>
      <div class="confirm-dialog-actions">
        <button class="btn secondary" value="cancel" type="submit">Keep it</button>
        <button class="btn destructive" value="confirm" type="submit">Delete</button>
      </div>
    </form>`;
  dialog.setAttribute("aria-labelledby", "confirm-dialog-title");
  dialog.setAttribute("aria-describedby", "confirm-dialog-description");
  document.body.append(dialog);

  const dialogTitle = dialog.querySelector("#confirm-dialog-title");
  const dialogDescription = dialog.querySelector("#confirm-dialog-description");
  let pendingDelete = null;
  let confirmedDelete = null;
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.("#delete-key, #delete-msig");
    if (!button || button.disabled || button === confirmedDelete) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    pendingDelete = button;
    dialogTitle.textContent = button.id === "delete-msig" ? "Delete this multisig?" : "Delete this key?";
    dialogDescription.textContent = "Its inputs and derived results will be removed from this session. This action cannot be undone.";
    dialog.returnValue = "";
    dialog.showModal();
  }, true);
  dialog.addEventListener("close", () => {
    const button = pendingDelete;
    pendingDelete = null;
    if (dialog.returnValue !== "confirm" || !button?.isConnected) {
      button?.focus();
      return;
    }
    confirmedDelete = button;
    button.click();
    confirmedDelete = null;
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("cancel");
  });

  const actionRows = [...document.querySelectorAll(".current-item-actions, .psbt-actions")];
  const actionSentinels = new Map(actionRows.map((row) => {
    const sentinel = document.createElement("span");
    sentinel.className = "action-dock-sentinel";
    sentinel.setAttribute("aria-hidden", "true");
    row.before(sentinel);
    return [row, sentinel];
  }));
  const syncDockedActions = () => {
    const viewportHeight = window.innerHeight;
    const activationLine = Math.min(120, viewportHeight * 0.2);
    actionRows.forEach((row) => {
      const panel = row.closest("#calc-card, #msig-card, #psbt-card");
      if (!panel || panel.hidden || row.offsetParent === null) {
        row.classList.remove("is-docked");
        return;
      }
      const panelRect = panel.getBoundingClientRect();
      const naturalActionTop = actionSentinels.get(row).getBoundingClientRect().top;
      const isInsideWorkflow = panelRect.top < activationLine && panelRect.bottom > viewportHeight;
      const actionIsStillBelowViewport = naturalActionTop > viewportHeight - 24;
      row.classList.toggle("is-docked", isInsideWorkflow && actionIsStillBelowViewport);
    });
  };
  let dockFrame = 0;
  const scheduleDockSync = () => {
    if (dockFrame) return;
    dockFrame = requestAnimationFrame(() => {
      dockFrame = 0;
      syncDockedActions();
    });
  };
  window.addEventListener("scroll", scheduleDockSync, { passive: true });
  window.addEventListener("resize", scheduleDockSync);
  document.addEventListener("click", scheduleDockSync);
  syncDockedActions();
})();
