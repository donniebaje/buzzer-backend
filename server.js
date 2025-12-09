// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory game state (reset when server restarts)
let state = {
  roundId: 1,            // still tracked, but not shown in UI
  winner: null,          // string: player/laptop name
  winnerTime: null,      // ISO string
  buzzes: [],            // array of { playerName, time }
  showRanking: false,    // facilitator-controlled toggle
  armed: false,          // buzzers armed (true only after reset)
  readyPlayers: []       // list of participants who are in "ready" state
};

app.use(cors());
app.use(express.json());

// Get current state
app.get("/api/state", (req, res) => {
  res.json(state);
});

// Player buzzes
app.post("/api/buzz", (req, res) => {
  const { playerName } = req.body;
  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ ok: false, error: "playerName is required" });
  }

  // If not armed yet, ignore buzzes
  if (!state.armed) {
    return res.json({ ok: false, error: "Buzzers not armed yet", ...state });
  }

  const name = playerName.trim();
  const now = new Date().toISOString();

  // Track EVERY buzz in order
  state.buzzes.push({ playerName: name, time: now });

  let first = false;

  // First one to set winner wins
  if (!state.winner) {
    state.winner = name;
    state.winnerTime = now;
    first = true;
  }

  return res.json({
    ok: true,
    first,
    ...state
  });
});

// Reset round (facilitator) – arms the buzzers
app.post("/api/reset", (req, res) => {
  state = {
    roundId: state.roundId + 1,
    winner: null,
    winnerTime: null,
    buzzes: [],
    showRanking: state.showRanking,   // keep same setting
    armed: true,                      // now buzzers are armed
    readyPlayers: state.readyPlayers  // keep ready list
  };
  res.json({ ok: true, ...state });
});

// Update settings (e.g., showRanking)
app.post("/api/settings", (req, res) => {
  const { showRanking } = req.body;

  if (typeof showRanking !== "boolean") {
    return res.status(400).json({ ok: false, error: "showRanking must be boolean" });
  }

  state.showRanking = showRanking;
  return res.json({ ok: true, showRanking: state.showRanking });
});

// Mark participants as ready / not ready
app.post("/api/ready", (req, res) => {
  const { playerName, ready } = req.body;
  if (!playerName || typeof playerName !== "string") {
    return res.status(400).json({ ok: false, error: "playerName is required" });
  }
  const name = playerName.trim();
  const isReady = !!ready;

  // ensure uniqueness
  const idx = state.readyPlayers.findIndex(p => p === name);

  if (isReady) {
    if (idx === -1) {
      state.readyPlayers.push(name);
    }
  } else {
    if (idx !== -1) {
      state.readyPlayers.splice(idx, 1);
    }
  }

  return res.json({ ok: true, readyPlayers: state.readyPlayers });
});

app.get("/", (req, res) => {
  res.send("Buzzer backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
