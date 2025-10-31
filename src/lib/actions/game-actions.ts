
'use server';

import { db } from '@/lib/firebase';
import type { User, Board, Game, Player } from '@/types';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';


const createInitialBoard = (): Board => {
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


export async function createCheckersGame(user1: User, user2: User): Promise<Game> {
    const initialBoard = createInitialBoard();
    const now = serverTimestamp();

    const newGame = {
        type: 'checkers',
        players: {
            red: user1.uid,
            black: user2.uid,
        },
        playerInfos: [user1, user2],
        boardState: initialBoard,
        currentPlayer: 'red' as const,
        status: 'active' as const,
        createdAt: now,
        updatedAt: now,
    };

    const docRef = await addDoc(collection(db, 'games'), newGame);

    return { id: docRef.id, ...newGame } as Game;
}

export async function updateGameState(gameId: string, newBoard: Board, nextPlayer: Player, winner?: Player) {
    const gameRef = doc(db, 'games', gameId);
    
    const updateData: any = {
        boardState: newBoard,
        currentPlayer: nextPlayer,
        updatedAt: serverTimestamp(),
    };

    if (winner) {
        updateData.status = 'finished';
        updateData.winner = winner;
    }

    await updateDoc(gameRef, updateData);
}
