
'use server';

import { db } from '@/lib/firebase-admin';
import { addDoc, collection, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import type { Board, CheckersGame, Piece, Player } from '@/types';

function createInitialBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(null));

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 !== 0) {
        board[i][j] = { player: 'black', isKing: false };
      }
    }
  }

  for (let i = 5; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      if ((i + j) % 2 !== 0) {
        board[i][j] = { player: 'red', isKing: false };
      }
    }
  }

  return board;
}

export async function createCheckersGame(player1Id: string, player2Id: string, player1Name: string, player2Name: string): Promise<string> {
    const board = createInitialBoard();
    const gameData = {
        board,
        players: { red: player1Id, black: player2Id },
        playerNames: { red: player1Name, black: player2Name },
        turn: 'red' as Player,
        winner: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        gameOver: false,
    };

    const gameRef = await addDoc(collection(db, 'checkersGames'), gameData);
    return gameRef.id;
}

function isMoveValid(game: CheckersGame, from: [number, number], to: [number, number], player: Player) {
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;
    const piece = game.board[fromRow][fromCol];

    if (!piece || piece.player !== player || game.turn !== player) {
        return { valid: false, isCapture: false };
    }
    if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7 || game.board[toRow][toCol] !== null) {
        return { valid: false, isCapture: false };
    }

    const rowDiff = toRow - fromRow;
    const colDiff = Math.abs(toCol - fromCol);

    const moveDir = player === 'red' ? -1 : 1;

    // Regular move
    if (Math.abs(rowDiff) === 1 && colDiff === 1) {
        if (piece.isKing) return { valid: true, isCapture: false };
        return { valid: rowDiff === moveDir, isCapture: false };
    }
    
    // Capture move
    if (Math.abs(rowDiff) === 2 && colDiff === 2) {
        const capturedRow = fromRow + rowDiff / 2;
        const capturedCol = fromCol + (toCol - fromCol) / 2;
        const capturedPiece = game.board[capturedRow][capturedCol];

        if (capturedPiece && capturedPiece.player !== player) {
            if (piece.isKing) return { valid: true, isCapture: true };
            return { valid: rowDiff / 2 === moveDir, isCapture: true };
        }
    }

    return { valid: false, isCapture: false };
}

function checkWinCondition(board: Board, currentPlayer: Player): Player | null {
    let redPieces = 0;
    let blackPieces = 0;

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece) {
                if (piece.player === 'red') redPieces++;
                else blackPieces++;
            }
        }
    }

    if (redPieces === 0) return 'black';
    if (blackPieces === 0) return 'red';

    // Add check for no valid moves later
    return null;
}

export async function makeMove(gameId: string, from: [number, number], to: [number, number], playerId: string) {
    const gameRef = doc(db, 'checkersGames', gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) throw new Error("Game not found");

    const game = gameSnap.data() as CheckersGame;
    const player = game.players.red === playerId ? 'red' : 'black';

    const { valid, isCapture } = isMoveValid(game, from, to, player);

    if (!valid) {
        throw new Error("Invalid move");
    }

    const newBoard = game.board.map(row => [...row]);
    const [fromRow, fromCol] = from;
    const [toRow, toCol] = to;

    const piece = newBoard[fromRow][fromCol];
    newBoard[toRow][toCol] = piece;
    newBoard[fromRow][fromCol] = null;

    if (piece && !piece.isKing && ( (piece.player === 'red' && toRow === 0) || (piece.player === 'black' && toRow === 7))) {
        piece.isKing = true;
    }

    if (isCapture) {
        const capturedRow = fromRow + (toRow - fromRow) / 2;
        const capturedCol = fromCol + (toCol - fromCol) / 2;
        newBoard[capturedRow][capturedCol] = null;
    }
    
    const winner = checkWinCondition(newBoard, player);

    await updateDoc(gameRef, {
        board: newBoard,
        turn: game.turn === 'red' ? 'black' : 'red',
        updatedAt: serverTimestamp(),
        lastMove: { from, to },
        winner: winner,
        gameOver: winner !== null,
    });
}

export async function forfeitCheckersGame(gameId: string, playerId: string) {
    const gameRef = doc(db, 'checkersGames', gameId);
    const gameSnap = await getDoc(gameRef);
    if (!gameSnap.exists()) throw new Error("Game not found");

    const game = gameSnap.data() as CheckersGame;
    const forfeitingPlayer = game.players.red === playerId ? 'red' : 'black';
    const winner = forfeitingPlayer === 'red' ? 'black' : 'red';
    
    await updateDoc(gameRef, {
        winner: winner,
        gameOver: true,
        updatedAt: serverTimestamp(),
    });
}
