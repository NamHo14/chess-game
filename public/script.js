let ChessBoardPosition =
    "rnbqkbnrpppppppp00000000000000000000000000000000PPPPPPPPRNBQKBNR";
const vh = window.innerHeight / 100;
//const squareSizePx = 11 * vh;
let promotion = false;
let AllyPiece = "RNBKQP";
let EnemyPiece = "rnbkqp";
let selected = false;
let moveLog = [];
let squareAttack = [];
let CHESSAI = false;
let AIPiece;
let multiplayer = false;
let socket;
let numberOfPlayers = 0;
let ON = false;
const sound = new Audio("piece/move-self.mp3");
const capture = new Audio("piece/capture.mp3");
let serverUrl = "https://chessgame.herokuapp.com";

let mode = localStorage.getItem("gameMode");
if (mode === "pve") {
    multiplayer = false;
    CHESSAI = true;
    let color = localStorage.getItem("color");
    if (color === "white") {
        AIPiece = "rnbkqp";
        const cont = document.querySelector(".main-cont");
        cont.style.flexWrap = "wrap";
    } else {
        AIPiece = "RNBKQP";
        const cont = document.querySelector(".main-cont");
        cont.style.flexWrap = "wrap-reverse";
        if (CHESSAI === true && AIPiece === "RNBKQP") {
            AIMoveMaker();
        }
    }
} else if (mode === "pvp") {
    AllyPiece = "RNBKQP";
    EnemyPiece = "rnbkqp";
    multiplayer = false;
    CHESSAI = false;
    AIPiece = "";
    const body = document.querySelector("body");
    const slider = document.createElement("input");
    const label = document.createElement("label");
    body.appendChild(label);
    label.textContent = "Flip";
    label.prepend(slider);
    slider.classList.add("slider");
    slider.type = "checkbox";
    slider.addEventListener("change", () => {
        slider.checked ? (ON = true) : (ON = false);
    });
} else if (mode === "online") {
    CHESSAI = false;
    AIPiece = "";
    multiplayer = true;
    socket = io(serverUrl);
}
function createSquare() {
    const cont = document.querySelector(".main-cont");
    for (let i = 0; i < 64; i++) {
        let r = Math.floor(i / 8);
        let c = i % 8;
        let div = document.createElement("div");
        div.classList.add("square");
        div.id = `${i}`;
        div.addEventListener("click", handleClick);
        if ((r + c) % 2 === 0)
            div.style.backgroundColor = "rgb(184,139,74,255)";
        else div.style.backgroundColor = "rgb(228,193,111,255)";
        cont.appendChild(div);
    }
}

const castleMoves = {
    "04k02": (pos) => "0" + pos.substring(1, 3) + "r" + pos.substring(4),
    "04k06": (pos) => pos.substring(0, 5) + "rk0" + pos.substring(8),
    "60K58": (pos) => pos.substring(0, 56) + "00KR" + pos.substring(60),
    "60K62": (pos) => pos.substring(0, 61) + "RK0",
};

function legalMoves(possibleMoves, ChessBoardPosition, piece, position) {
    let tempChessBoardPosition;
    let possibleMovesTemp;
    let possibleMovesListTemp = possibleMoves;
    for (let i = 0; i < possibleMoves.length; i++) {
        tempChessBoardPosition = ChessBoardPosition;
        possibleMovesTemp =
            position.toString().padStart(2, "0") +
            piece +
            possibleMoves[i].toString().padStart(2, "0");
        tempChessBoardPosition = performMoves(
            possibleMovesTemp,
            tempChessBoardPosition,
            false
        );
        if (
            SquaresUnderAttack(tempChessBoardPosition).includes(
                tempChessBoardPosition.indexOf("K")
            ) ||
            SquaresUnderAttack(tempChessBoardPosition).includes(
                tempChessBoardPosition.indexOf("k")
            )
        ) {
            possibleMovesListTemp = possibleMovesListTemp.filter(
                (move) => move !== possibleMoves[i]
            );
        }
    }
    return possibleMovesListTemp;
}

let highlighted = [];
let possMoves = [];
let selectedPiece = null;

if (multiplayer) {
    socket.on("ChessboardPosition", (data) => {
        console.log("Update from server:", data);
        ChessBoardPosition = data;
        positionUpdate(ChessBoardPosition);
        socket.emit("GameOver", CheckmateAndStalemate(ChessBoardPosition));
    });

    socket.on("moves", (data) => {
        console.log("Update from server:", data);
        moveLog = data;
    });

    socket.on("full", (data) => {
        wait(true);
    });

    socket.on("GameOver", (data) => {
        console.log("Checkmate/Stalemate:", data);
        AlertCheckAndCheckMate(data, true);
    });

    socket.on("Promotion", (data) => {
        promotion = data;
    });

    socket.on("numberOfPlayers", (data) => {
        numberOfPlayers = data;
        console.log("numberOfPlayers", data);
        if (numberOfPlayers < 2) wait();
    });

    socket.on("AllyPiece", (data) => {
        if (
            !ChessBoardPosition.substring(0, 8).includes("P") &&
            !ChessBoardPosition.substring(56, 64).includes("p")
        ) {
            AllyPiece = data;
        }

        if (AllyPiece === "rnbkqp") {
            const cont = document.querySelector(".main-cont");
            cont.style.flexWrap = "wrap-reverse";
        } else {
            const cont = document.querySelector(".main-cont");
            cont.style.flexWrap = "wrap";
        }
    });
    socket.on("EnemyPiece", (data) => {
        if (
            !ChessBoardPosition.substring(0, 8).includes("P") &&
            !ChessBoardPosition.substring(56, 64).includes("p")
        ) {
            EnemyPiece = data;
        }
    });
}

function wait(full = false) {
    const body = document.querySelector("body");
    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    body.appendChild(overlay);
    const div = document.createElement("div");
    div.classList.add("cont");
    div.style.width = "60%";
    div.style.height = "60%";
    overlay.appendChild(div);

    div.textContent = full ? "Server Full" : "Waiting for second player ...";
    const quitBtn = document.createElement("div");
    quitBtn.classList.add("options");
    quitBtn.textContent = "Main Menu";
    quitBtn.addEventListener("click", quit);
    div.appendChild(quitBtn);
    socket.on("numberOfPlayers", (data) => {
        numberOfPlayers = data;
        if (numberOfPlayers === 2) {
            const all = [overlay, ...overlay.querySelectorAll("*")];
            all.forEach((elem) => {
                elem.remove();
            });
        }
    });
}

function handleClick(e) {
    console.log(moveLog);
    const divId = e.target.id;
    if (
        (multiplayer === true &&
            AllyPiece === "RNBKQP" &&
            moveLog.length % 2 === 0 &&
            numberOfPlayers === 2) ||
        (multiplayer === true &&
            AllyPiece === "rnbkqp" &&
            moveLog.length % 2 === 1 &&
            numberOfPlayers === 2) ||
        multiplayer === false
    ) {
        if (
            AllyPiece.includes(ChessBoardPosition[divId]) &&
            !possMoves.includes(parseInt(divId)) &&
            promotion === false &&
            AllyPiece !== AIPiece
        ) {
            const arr = legalMoves(
                possibleMoves(ChessBoardPosition[divId], parseInt(divId)),
                ChessBoardPosition,
                ChessBoardPosition[divId],
                parseInt(divId)
            );

            highlighted.forEach((prev) => {
                const id = document.getElementById(prev);
                id.style.border = "";
                id.style.outline = "";
            });

            if (!selected) {
                sound.play();

                e.target.style.border = "3px white double";

                arr.forEach((square) => {
                    const id = document.getElementById(square);
                    id.style.border = "3px white double";
                    selected = true;
                });

                highlighted = [divId, ...arr];
                possMoves = [...arr];
                selectedPiece = parseInt(divId);
            } else if (selected && selectedPiece === parseInt(divId)) {
                e.target.style.border = "";

                arr.forEach((square) => {
                    const id = document.getElementById(square);
                    id.style.border = "";
                    selected = false;
                });

                highlighted = [];
                possMoves = [];
                selectedPiece = null;
            } else {
                sound.play();
                e.target.style.border = "3px white double";

                arr.forEach((square) => {
                    const id = document.getElementById(square);
                    id.style.border = "3px white double";
                    selected = true;
                });

                highlighted = [divId, ...arr];
                possMoves = [...arr];
                selectedPiece = parseInt(divId);
            }
        } else if (promotion === false && AllyPiece !== AIPiece) {
            if (possMoves.includes(parseInt(divId))) {
                sound.play();
                RecentMove =
                    selectedPiece.toString().padStart(2, "0") +
                    ChessBoardPosition[selectedPiece] +
                    divId.padStart(2, "0");
                ChessBoardPosition = performMoves(
                    RecentMove,
                    ChessBoardPosition
                );
                positionUpdate(ChessBoardPosition);
                moveLog.push(RecentMove);
                promotionPieceInput = multiplayer ? AllyPiece : EnemyPiece;

                if (ChessBoardPosition.substring(0, 8).includes("P")) {
                    promotion = true;
                    pawnPromotion(
                        ChessBoardPosition.substring(0, 8).indexOf("P"),
                        promotionPieceInput
                    );
                } else if (ChessBoardPosition.substring(56, 64).includes("p")) {
                    promotion = true;
                    pawnPromotion(
                        ChessBoardPosition.substring(56, 64).indexOf("p"),
                        promotionPieceInput
                    );
                } else {
                    if (CHESSAI) {
                        AIMoveMaker();
                    }
                }
                if (multiplayer) {
                    socket.emit("moves", moveLog);
                    socket.emit("Promotion", promotion);
                    socket.emit("ChessboardPosition", ChessBoardPosition);
                }
            }
            highlighted.forEach((square) => {
                const id = document.getElementById(square);
                id.style.border = "";
                id.style.outline = "";
                selected = false;
            });
        }
    }
}

function AIMoveMaker() {
    getAIMove(moveLog, ChessBoardPosition).then((aiMove) => {
        aiMove = aiMove.replace(/(?<!\d)(\d)(?!\d)/g, "0$1");
        console.log("AI move:", aiMove);
        if (!aiMove) return;
        moveLog.push(aiMove);
        ChessBoardPosition = performMoves(aiMove, ChessBoardPosition);
        sound.play();
        if (ChessBoardPosition.substring(0, 8).includes("P")) {
            c = ChessBoardPosition.indexOf("P", 0);
            ChessBoardPosition =
                ChessBoardPosition.substring(0, c) +
                "Q" +
                ChessBoardPosition.substring(parseInt(c) + 1);
            moveLog.pop();
            moveLog.push(aiMove + "Q");
        }
        if (ChessBoardPosition.substring(56, 64).includes("p")) {
            c = ChessBoardPosition.indexOf("p", 56);
            ChessBoardPosition =
                ChessBoardPosition.substring(0, parseInt(c)) +
                "q" +
                ChessBoardPosition.substring(parseInt(c) + 1);
            moveLog.pop();
            moveLog.push(aiMove + "q");
        }
        positionUpdate(ChessBoardPosition);
    });
}
function performMoves(moves, chessBoardPosition, realBoard = true) {
    iniPos = parseInt(moves.substring(0, 2));
    ChessPiece = chessBoardPosition[iniPos];
    afterPos = parseInt(moves.substring(3, 5));

    PieceEaten = chessBoardPosition[parseInt(moves.substring(3, 5))];

    chessBoardPosition =
        chessBoardPosition.substring(0, afterPos) +
        ChessPiece +
        chessBoardPosition.substring(afterPos + 1);
    chessBoardPosition =
        chessBoardPosition.substring(0, iniPos) +
        "0" +
        chessBoardPosition.substring(iniPos + 1);

    if (castleMoves[moves]) {
        chessBoardPosition = castleMoves[moves](chessBoardPosition);
    }
    if (
        (Math.abs(parseInt(afterPos) - parseInt(iniPos)) === 7 ||
            Math.abs(parseInt(afterPos) - parseInt(iniPos)) === 9) &&
        (ChessPiece === "p" || ChessPiece === "P") &&
        PieceEaten === "0"
    ) {
        if (ChessPiece === "p") {
            chessBoardPosition =
                chessBoardPosition.substring(0, parseInt(afterPos) - 8) +
                "0" +
                chessBoardPosition.substring(parseInt(afterPos) - 8 + 1);
        } else {
            chessBoardPosition =
                chessBoardPosition.substring(0, parseInt(afterPos) + 8) +
                "0" +
                chessBoardPosition.substring(parseInt(afterPos) + 8 + 1);
        }
    }
    possMoves = [];

    if (realBoard) {
        if (!multiplayer) {
            const cont = document.querySelector(".main-cont");
            const isUpperCase = AllyPiece === "RNBKQP";
            AllyPiece = isUpperCase ? "rnbkqp" : "RNBKQP";
            EnemyPiece = isUpperCase ? "RNBKQP" : "rnbkqp";
            if (!CHESSAI && ON && mode === "pvp") {
                if (AllyPiece === "rnbkqp") {
                    cont.style.flexWrap = "wrap-reverse";
                } else {
                    cont.style.flexWrap = "wrap";
                }
            }
        }

        let state = CheckmateAndStalemate(chessBoardPosition);
        AlertCheckAndCheckMate(state);
    }
    return chessBoardPosition;
}

function AlertCheckAndCheckMate(state, multiplayer = false) {
    const body = document.querySelector("body");

    let message = "";
    if (state !== 0 && multiplayer === true) socket.disconnect();
    if (state === 1) message = "CHECKMATE";
    else if (state === 2) message = "INSUFFICIENT MATERIAL";
    else if (state === 3) message = "STALEMATE";
    else return;

    const overlay = document.createElement("div");
    overlay.classList.add("overlay");
    const div = document.createElement("div");
    div.classList.add("cont");
    div.style.height = "20%";
    overlay.appendChild(div);
    body.appendChild(overlay);
    div.textContent = `${message}`;
    const ok = document.createElement("div");
    div.appendChild(ok);
    ok.classList.add("ok");
    ok.textContent = "OK";
    ok.addEventListener("click", () => {
        const all = [overlay, ...overlay.querySelectorAll("*")];
        all.forEach((elem) => {
            elem.remove();
        });
    });

    const resetBtn = document.createElement("button");
    resetBtn.classList.add("reset");
    resetBtn.textContent = multiplayer ? "Rejoin Game" : "Reset Game";

    body.appendChild(resetBtn);

    resetBtn.addEventListener("click", () => {
        if (multiplayer === false) {
            reset();
            if (CHESSAI === true && AIPiece === "RNBKQP") AIMoveMaker();
        } else {
            reset();
            window.location.href = "game.html";
            socket = io(serverUrl);
            socket.on("numberOfPlayers", (data) => {
                numberOfPlayers = data;
            });
        }
        resetBtn.remove();
    });
    // }, 0);
}
function reset() {
    AllyPiece = "RNBKQP";
    EnemyPiece = "rnbkqp";
    selected = false;
    selectedPiece = null;
    possMoves = [];
    highlighted = [];
    moveLog = [];
    ChessBoardPosition =
        "rnbqkbnrpppppppp00000000000000000000000000000000PPPPPPPPRNBQKBNR";
    positionUpdate(ChessBoardPosition);
    const cont = document.querySelector(".main-cont");
    if (mode !== "pve") cont.style.flexWrap = "wrap";
    const div = document.querySelectorAll(".square");
    div.forEach((square) => {
        square.style.border = "";
    });
    promotion = false;
    ["ql", "rl", "nl", "bl", "qd", "rd", "nd", "bd"].forEach((id) => {
        const exists = document.getElementById(id);
        if (exists) exists.remove();
    });
}

function possibleMoves(piece, position, chessBoard = ChessBoardPosition) {
    switch (piece) {
        case "r":
            return rookPossibleMoves("B", position, chessBoard);
        case "n":
            return knightPossibleMoves("B", position, chessBoard);
        case "b":
            return bishopPossibleMoves("B", position, chessBoard);
        case "q":
            return queenPossibleMoves("B", position, chessBoard);
        case "k":
            return kingPossibleMoves("B", position, chessBoard);
        case "p":
            return pawnPossibleMoves("B", position, chessBoard);
        case "R":
            return rookPossibleMoves("W", position, chessBoard);
        case "N":
            return knightPossibleMoves("W", position, chessBoard);
        case "B":
            return bishopPossibleMoves("W", position, chessBoard);
        case "Q":
            return queenPossibleMoves("W", position, chessBoard);
        case "K":
            return kingPossibleMoves("W", position, chessBoard);
        case "P":
            return pawnPossibleMoves("W", position, chessBoard);
        default:
            return [];
    }
}

function SquaresUnderAttack(chessBoardPosition) {
    let SquaresUnderAttackList = new Set();
    let Moves;
    for (let i = 0; i < chessBoardPosition.length; i++) {
        if (EnemyPiece.includes(chessBoardPosition[i])) {
            if (chessBoardPosition[i] === "P") {
                Moves = pawnPossibleMoves("W", i, chessBoardPosition, true);
            } else if (chessBoardPosition[i] === "p") {
                Moves = pawnPossibleMoves("B", i, chessBoardPosition, true);
            } else {
                Moves = possibleMoves(
                    chessBoardPosition[i],
                    i,
                    chessBoardPosition
                );
            }
            for (let move of Moves) {
                SquaresUnderAttackList.add(move);
            }
        }
    }

    squareAttack = [...SquaresUnderAttackList];
    return squareAttack;
}

function CheckmateAndStalemate(chessBoardPosPosition) {
    check = false;
    if (
        SquaresUnderAttack(chessBoardPosPosition).includes(
            chessBoardPosPosition.indexOf("K")
        ) ||
        SquaresUnderAttack(chessBoardPosPosition).includes(
            chessBoardPosPosition.indexOf("k")
        )
    ) {
        check = true;
    }
    let potentialMovesList = new Set();
    let Moves;
    for (let i = 0; i < chessBoardPosPosition.length; i++) {
        if (AllyPiece.includes(chessBoardPosPosition[i])) {
            Moves = legalMoves(
                possibleMoves(
                    chessBoardPosPosition[i],
                    i,
                    chessBoardPosPosition
                ),
                chessBoardPosPosition,
                chessBoardPosPosition[i],
                i
            );
            for (let move of Moves) {
                potentialMovesList.add(move);
            }
        }
    }
    potentialMovesList = [...potentialMovesList];
    if (check && potentialMovesList.length === 0) {
        return 1;
    } else if (insufficientMaterial(chessBoardPosPosition)) {
        return 2;
    } else if (!check && potentialMovesList.length === 0) {
        return 3;
    } else {
        return 0;
    }
}

function insufficientMaterial(chessBoard) {
    let pieces = chessBoard.replace(/0/g, "").split("");

    if (pieces.length === 2) return true;

    if (pieces.length === 3) {
        return (
            pieces.includes("B") ||
            pieces.includes("b") ||
            pieces.includes("N") ||
            pieces.includes("n")
        );
    }
    return false;
}

function positionUpdate(ChessBoardPosition) {
    for (let i = 0; i < ChessBoardPosition.length; i++) {
        let src = "";
        const div = document.getElementById(i);

        const oldImg = div.querySelector("img");
        if (oldImg) oldImg.remove();

        switch (ChessBoardPosition[i]) {
            case "r":
                src = "piece/Chess_rdt60.png";
                break;
            case "n":
                src = "piece/Chess_ndt60.png";
                break;
            case "b":
                src = "piece/Chess_bdt60.png";
                break;
            case "q":
                src = "piece/Chess_qdt60.png";
                break;
            case "k":
                src = "piece/Chess_kdt60.png";
                break;
            case "p":
                src = "piece/Chess_pdt60.png";
                break;
            case "R":
                src = "piece/Chess_rlt60.png";
                break;
            case "N":
                src = "piece/Chess_nlt60.png";
                break;
            case "B":
                src = "piece/Chess_blt60.png";
                break;
            case "Q":
                src = "piece/Chess_qlt60.png";
                break;
            case "K":
                src = "piece/Chess_klt60.png";
                break;
            case "P":
                src = "piece/Chess_plt60.png";
                break;
        }

        if (src !== "") {
            const img = document.createElement("img");
            img.src = src;
            img.style.width = "100%";
            img.style.height = "100%";
            img.style.pointerEvents = "none";
            div.appendChild(img);
        }
    }
}
async function getAIMove(movesLog, board) {
    try {
        const response = await fetch(
            "https://chessgame.herokuapp.com/move",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    move_log: movesLog,
                    board_input: board,
                }),
            }
        );

        const data = await response.json();
        return data.move;
    } catch (error) {
        console.error("Error fetching AI move:", error);
    }
}

createSquare();
positionUpdate(ChessBoardPosition);

