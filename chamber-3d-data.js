(function () {
  const connection = document.querySelector("#connection");
  const note = document.querySelector("#scene-note");

  function showWorld(world) {
    const body = world.bodies && world.bodies[0];
    if (!body) throw new Error("El runtime no entregó un cuerpo observable.");
    document.querySelector("#scene-tick").textContent = `TICK ${world.tick}`;
    document.querySelector("#subject-name").textContent = body.name || "Naia";
    document.querySelector("#body-form").textContent = body.form || "básico";
    document.querySelector("#body-position").textContent = `${body.x}, ${body.y}`;
    document.querySelector("#body-direction").textContent = body.directionName || "—";
    const energy = Math.max(0, Math.min(1, body.energy));
    const fatigue = Math.max(0, Math.min(1, body.fatigue));
    document.querySelector("#energy-value").textContent = `${Math.round(energy * 100)}%`;
    document.querySelector("#fatigue-value").textContent = `${Math.round(fatigue * 100)}%`;
    document.querySelector("#energy-meter").style.width = `${energy * 100}%`;
    document.querySelector("#fatigue-meter").style.width = `${fatigue * 100}%`;
    const event = world.recentEvents && world.recentEvents[0];
    document.querySelector("#latest-event").textContent = event
      ? `${event.action} · ${event.outcome}${event.details && event.details.touched ? ` · ${event.details.touched}` : ""}`
      : "Sin eventos todavía.";
    document.querySelector("#capabilities").innerHTML = (body.capabilities || []).map((value) => `<span>${value}</span>`).join("") || "—";
    connection.classList.add("ok");
    connection.querySelector("span").textContent = "Runtime conectado";
    note.textContent = "Telemetría corporal recibida del runtime. La representación gráfica es una capa independiente.";
    window.genesisWorldSnapshot = world;
    window.dispatchEvent(new CustomEvent("genesis-world-update", { detail: world }));
  }

  async function refreshTelemetry() {
    try {
      const response = await fetch("/api/world", { cache: "no-store" });
      if (!response.ok) throw new Error(`Runtime respondió ${response.status}.`);
      showWorld(await response.json());
    } catch (error) {
      connection.classList.remove("ok");
      connection.querySelector("span").textContent = "Sin conexión al runtime";
      note.textContent = `No fue posible obtener la telemetría: ${error.message}`;
    }
  }

  refreshTelemetry();
  setInterval(refreshTelemetry, 750);
}());
