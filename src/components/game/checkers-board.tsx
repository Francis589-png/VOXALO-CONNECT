
'use client';

import { useState } from 'react';
import type { Board, Game, Move, Piece, Player, SquareContent, User } from '@/types';
import { cn } from '@/lib/utils';
import { updateGameState } from '@/lib/actions/game-actions';
import { Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckersBoardProps {
  game: Game;
  currentUser: User;
}

const getValidMoves = (board: Board, row: number, col: number): Move[] => {
  const piece = board[row][col];
  if (!piece) return [];

  const moves: Move[] = [];
  const { player, isKing } = piece;
  const directions =
    player === 'red'
      ? [{ r: -1, c: -1 }, { r: -1, c: 1 }]
      : [{ r: 1, c: -1 }, { r: 1, c: 1 }];
  
  if (isKing) {
    directions.push({r: 1, c: -1}, {r: 1, c: 1}, {r: -1, c: -1}, {r: -1, c: 1});
  }

  // Jumps first - if a jump is available, it must be taken.
  const jumpMoves: Move[] = [];
  for (const dir of directions) {
    const jumpRow = row + dir.r * 2;
    const jumpCol = col + dir.c * 2;
    const betweenRow = row + dir.r;
    const betweenCol = col + dir.c;

    if (
      jumpRow >= 0 && jumpRow < 8 && jumpCol >= 0 && jumpCol < 8 &&
      !board[jumpRow][jumpCol] &&
      board[betweenRow][betweenCol] &&
      board[betweenRow][betweenCol]?.player !== player
    ) {
      jumpMoves.push({ from: { row, col }, to: { row: jumpRow, col: jumpCol }, isJump: true, jumpedPiece: { row: betweenRow, col: betweenCol } });
    }
  }

  if (jumpMoves.length > 0) return jumpMoves;


  // Regular moves
  for (const dir of directions) {
    const newRow = row + dir.r;
    const newCol = col + dir.c;
    if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8 && !board[newRow][newCol]) {
      moves.push({ from: { row, col }, to: { row: newRow, col: newCol }, isJump: false });
    }
  }
  
  return moves;
};


export default function CheckersBoard({ game, currentUser }: CheckersBoardProps) {
  const [selectedPiece, setSelectedPiece] = useState<{ row: number, col: number } | null>(null);
  const [validMoves, setValidMoves] = useState<Move[]>([]);
  const { toast } = useToast();

  const isMyTurn = game.playerAssignments[game.currentPlayer] === currentUser.uid;

  const handleSquareClick = (row: number, col: number) => {
    if (!isMyTurn || game.status === 'finished') return;

    const piece = game.boardState[row][col];
    
    // Check for mandatory jumps for the current player
    const allPlayerPieces = game.boardState.flatMap((r, rIdx) => r.map((p, cIdx) => ({ piece: p, row: rIdx, col: cIdx })))
        .filter(item => item.piece && item.piece.player === game.currentPlayer);

    const mandatoryJumps = allPlayerPieces.flatMap(p => getValidMoves(game.boardState, p.row, p.col)).filter(m => m.isJump);

    if (piece && piece.player === game.currentPlayer) {
        if (mandatoryJumps.length > 0 && !mandatoryJumps.some(m => m.from.row === row && m.from.col === col)) {
            toast({
                title: "Mandatory Jump",
                description: "You must make a jump move.",
                variant: 'destructive'
            });
            return;
        }
      setSelectedPiece({ row, col });
      const moves = getValidMoves(game.boardState, row, col);
      setValidMoves(moves);
    } else if (selectedPiece) {
      const move = validMoves.find(m => m.to.row === row && m.to.col === col);
      if (move) {
        handleMove(move);
      } else {
        setSelectedPiece(null);
        setValidMoves([]);
      }
    }
  };

  const handleMove = async (move: Move) => {
    let newBoard: Board = JSON.parse(JSON.stringify(game.boardState)); // Deep copy
    const pieceToMove = newBoard[move.from.row][move.from.col];

    if (!pieceToMove) return;

    // Check for kinging
    if ((pieceToMove.player === 'red' && move.to.row === 0) || (pieceToMove.player === 'black' && move.to.row === 7)) {
        pieceToMove.isKing = true;
    }

    newBoard[move.to.row][move.to.col] = pieceToMove;
    newBoard[move.from.row][move.from.col] = null;

    let jumpedPiece = false;
    if (move.isJump && move.jumpedPiece) {
      newBoard[move.jumpedPiece.row][move.jumpedPiece.col] = null;
      jumpedPiece = true;
    }

    // Check for multi-jump
    if(jumpedPiece) {
        const nextJumps = getValidMoves(newBoard, move.to.row, move.to.col).filter(m => m.isJump);
        if (nextJumps.length > 0) {
             await updateGameState(game.id, newBoard, game.currentPlayer);
             setSelectedPiece({row: move.to.row, col: move.to.col});
             setValidMoves(nextJumps);
             return;
        }
    }


    setSelectedPiece(null);
    setValidMoves([]);
    
    // Check for winner
    const opponent = game.currentPlayer === 'red' ? 'black' : 'red';
    const opponentPieces = newBoard.flat().filter(p => p?.player === opponent);
    let winner: Player | undefined = undefined;
    if (opponentPieces.length === 0) {
        winner = game.currentPlayer;
        toast({ title: "Game Over!", description: `${game.playerInfos.find(p => p.uid === game.playerAssignments[winner!])?.displayName} wins!`});
    }

    await updateGameState(game.id, newBoard, opponent, winner);
  };
  
  const renderPiece = (piece: Piece) => {
    return (
        <div className={cn(
            "h-[80%] w-[80%] rounded-full flex items-center justify-center cursor-pointer transition-transform duration-200 hover:scale-105",
            piece.player === 'red' ? 'bg-rose-600' : 'bg-zinc-800 dark:bg-zinc-700',
            'shadow-[inset_0_4px_6px_rgba(255,255,255,0.2),_inset_0_-4px_6px_rgba(0,0,0,0.3),_0_4px_4px_rgba(0,0,0,0.4)]'
        )}>
            {piece.isKing && <Crown className='h-[60%] w-[60%] text-yellow-400 drop-shadow-lg' />}
        </div>
    )
  }

  return (
    <div className='flex flex-col border-4 border-card rounded-lg overflow-hidden shadow-2xl aspect-square w-full max-w-[500px] mx-auto'>
      {game.boardState.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-1">
          {row.map((square, colIndex) => {
            const isLightSquare = (rowIndex + colIndex) % 2 === 0;
            const isSelected = selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex;
            const isValidMove = validMoves.some(m => m.to.row === rowIndex && m.to.col === colIndex);

            return (
              <div
                key={colIndex}
                className={cn(
                  'w-full h-full flex items-center justify-center',
                  isLightSquare ? 'bg-muted/30' : 'bg-muted/90',
                  isMyTurn && !isLightSquare && 'hover:bg-accent/80 transition-colors',
                  isSelected && 'bg-primary/50',
                  isValidMove && 'bg-green-500/50'
                )}
                onClick={() => handleSquareClick(rowIndex, colIndex)}
              >
                {square && renderPiece(square)}
                {isValidMove && !square && (
                    <div className='h-4 w-4 rounded-full bg-green-500/70' />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
