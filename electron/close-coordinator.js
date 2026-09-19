class CloseCoordinator {
  constructor({ send, timeoutMs = 30000 }) {
    this.send = send;
    this.timeoutMs = timeoutMs;
    this.allowed = false;
    this.pending = null;
    this.counter = 0;
    this.lastRequestId = null;
  }

  request(purpose) {
    if (this.pending) {
      if (this.pending.purpose === purpose) return this.pending.promise;
      return Promise.reject(new Error("Une sauvegarde finale est déjà en cours."));
    }
    this.allowed = false;
    const requestId = String(++this.counter);
    this.lastRequestId = requestId;
    const pending = { purpose, requestId };
    pending.promise = new Promise((resolve, reject) => Object.assign(pending, { resolve, reject }));
    this.pending = pending;
    pending.timer = setTimeout(() => this.cancel("timeout"), this.timeoutMs);
    try {
      this.send("mindset:prepare-close", { requestId });
    } catch (error) {
      this.cancel("renderer-error");
    }
    return pending.promise;
  }

  acknowledge(requestId, ok) {
    if (!this.pending || this.pending.requestId !== String(requestId)) return false;
    if (!ok) {
      this.cancel("renderer-error");
      return false;
    }
    const pending = this.pending;
    clearTimeout(pending.timer);
    this.pending = null;
    this.allowed = true;
    pending.resolve();
    return true;
  }

  cancel(reason = "cancelled") {
    const pending = this.pending;
    this.pending = null;
    this.allowed = false;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(reason === "timeout"
        ? "La sauvegarde prend trop de temps. L’installation n’a pas été lancée."
        : "La sauvegarde n’a pas abouti. L’installation n’a pas été lancée."));
    }
    if (this.lastRequestId) {
      this.send("mindset:close-cancelled", { requestId: this.lastRequestId, reason });
      this.lastRequestId = null;
    }
  }

  dispose() {
    if (this.pending) {
      clearTimeout(this.pending.timer);
      this.pending.reject(new Error("La fenêtre a été fermée avant la fin de la sauvegarde."));
      this.pending = null;
    }
  }
}

module.exports = { CloseCoordinator };
