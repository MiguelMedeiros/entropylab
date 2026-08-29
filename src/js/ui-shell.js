(() => {
  const app = document.getElementById("btc-calc");
  const privacyButton = document.getElementById("privacy-toggle");
  const privacyLabel = privacyButton?.querySelector(".privacy-label");
  const networkStatus = document.getElementById("network-status");

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
