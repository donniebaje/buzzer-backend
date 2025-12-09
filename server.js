// server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory game state (reset when server restarts)
let state = {
  roundId: 1,
  winner: null,        // string: player/laptop name
  winnerTime: null     // ISO string
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

  // "Critical section": first one to set winner wins, others just see who won
  if (!state.winner) {
    state.winner = playerName.trim();
    state.winnerTime = new Date().toISOString();
    return res.json({
      ok: true,
      first: true,
      winner: state.winner,
      winnerTime: state.winnerTime,
      roundId: state.roundId
    });
  } else {
    return res.json({
      ok: true,
      first: false,
      winner: state.winner,
      winnerTime: state.winnerTime,
      roundId: state.roundId
    });
  }
});

// Reset round (simple "admin" endpoint)
// If you want, add a reset code: e.g. check req.query.code
app.post("/api/reset", (req, res) => {
  state = {
    roundId: state.roundId + 1,
    winner: null,
    winnerTime: null
  };
  res.json({ ok: true, ...state });
});

app.get("/", (req, res) => {
  res.send("Buzzer backend is running.");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
