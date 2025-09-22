# chess-game

# ♟️ Online Chess Game with AI and Multiplayer (Full Stack)

This is a full-stack **online chess game** that supports:

-   **Single-player vs AI (PVE)**
-   **Local multiplayer (PVP)**
-   **Online multiplayer (1v1 via sockets)**

It features a custom chess engine powered by **minimax with alpha-beta pruning** and real-time online play with **Socket.IO**.

---

## 🚀 Tech Stack

**Frontend**

-   HTML, CSS, JavaScript
-   Chessboard rendering, move logic, and UI interactions
-   Connects to backend APIs & sockets

**Backend**

-   **Node.js + Express.js + Socket.IO** → real-time online multiplayer server
-   **Flask + Flask-CORS** → REST API for AI move generation

**AI**

-   Python `chess` library + **minimax with alpha-beta pruning**
-   Custom evaluation function with positional piece values
-   ⚠️ Note: AI performance may be slow due to limited CPU allocation (~0.1 CPU) on free Render plan

**Deployment**

-   Full-stack deployed on **Render** (both Node.js and Flask servers)

---

## 🎮 Features

-   **Play vs AI** – Challenge an AI powered by minimax with alpha-beta pruning.
-   **Local Multiplayer** – Two players on the same device.
-   **Online Multiplayer** – Real-time 1v1 using **Socket.IO**.
-   **Game States** – Checkmate, stalemate, and insufficient material detection.
-   **Responsive Board** – Dynamic rendering of chess pieces and legal moves.
-   **Pawn Promotion, Castling, En Passant** – Implemented according to chess rules.

LINK: https://chess-game-pwkg.onrender.com (Start up may take time due to usage of free Render plan) 
made in collaboration with @jerryluo01 
