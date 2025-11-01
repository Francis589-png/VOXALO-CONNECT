
'use client';

import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { AlertTriangle, Crown, Loader2, X } from 'lucide-react';
import type { Board, CheckersGame, Player } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { forfeitCheckersGame, makeMove } from '@/lib/actions/checkers-actions';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CheckersGameViewProps {
  game: CheckersGame;
  currentUser: FirebaseUser;
  onClose: () => void;
}

const SquareComponent = ({
  isBlack,
  piece,
  isSelected,
  isPossibleMove,
  onClick,
  isLastMove,
}: {
  isBlack: boolean;
  piece: any;
  isSelected: boolean;
  isPossibleMove: boolean;
  onClick: () => void;
  isLastMove: boolean;
}) => {
  return (
    <div
      className={cn(
        'w-12 h-12 flex items-center justify-center',
        isBlack ? 'bg-muted' : 'bg-background',
        isPossibleMove && 'bg-primary/20 cursor-pointer',
        isSelected && 'bg-primary/40',
        isLastMove && 'bg-primary/10'
      )}
      onClick={onClick}
    >
      {piece && (
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center shadow-md',
            piece.player === 'red' ? 'bg-red-600' : 'bg-zinc-800 dark:bg-zinc-900',
            piece.player === 'red' ? 'text-zinc-900' : 'text-red-600'
          )}
        >
          {piece.isKing && <Crown className="w-6 h-6" />}
        </div>
      )}
    </div>
  );
};

export default function CheckersGameView({ game, currentUser, onClose }: CheckersGameViewProps) {
  const [selectedPiece, setSelectedPiece] = useState<[number, number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const myPlayer = game.players.red === currentUser.uid ? 'red' : 'black';
  const isMyTurn = myPlayer === game.turn;

  const handleSquareClick = async (row: number, col: number) => {
    if (!isMyTurn || game.gameOver || isLoading) return;

    if (selectedPiece) {
      const piece = game.board[selectedPiece[0]][selectedPiece[1]];
      if (piece && piece.player === myPlayer) {
        setIsLoading(true);
        try {
          await makeMove(game.id, selectedPiece, [row, col]);
          setSelectedPiece(null);
        } catch (error: any) {
          toast({
            title: 'Invalid Move',
            description: error.message || 'You cannot make that move.',
            variant: 'destructive',
          });
          setSelectedPiece(null);
        } finally {
          setIsLoading(false);
        }
      }
    } else {
      const piece = game.board[row][col];
      if (piece && piece.player === myPlayer) {
        setSelectedPiece([row, col]);
      }
    }
  };

  const getPossibleMoves = (fromRow: number, fromCol: number): [number, number][] => {
    const piece = game.board[fromRow][fromCol];
    if (!piece) return [];
    
    const moves: [number, number][] = [];
    const directions = piece.isKing
      ? [[-1,-1], [-1,1], [1,-1], [1,1]]
      : piece.player === 'red'
      ? [[-1,-1], [-1,1]]
      : [[1,-1], [1,1]];

    // Regular moves
    for (const [dr, dc] of directions) {
      const toRow = fromRow + dr;
      const toCol = fromCol + dc;
      if (toRow >= 0 && toRow < 8 && toCol >= 0 && toCol < 8 && !game.board[toRow][toCol]) {
        moves.push([toRow, toCol]);
      }
    }
    // Capture moves
     for (const [dr, dc] of directions) {
      const hopRow = fromRow + dr;
      const hopCol = fromCol + dc;
      const landRow = fromRow + dr * 2;
      const landCol = fromCol + dc * 2;

       if (
        landRow >= 0 && landRow < 8 && landCol >= 0 && landCol < 8 &&
        !game.board[landRow][landCol] &&
        game.board[hopRow] && game.board[hopRow][hopCol] &&
        game.board[hopRow][hopCol]?.player !== piece.player
      ) {
        moves.push([landRow, landCol]);
      }
    }

    return moves;
  }
  
  const possibleMoves = selectedPiece ? getPossibleMoves(selectedPiece[0], selectedPiece[1]) : [];
  
  const handleForfeit = async () => {
    try {
      await forfeitCheckersGame(game.id, currentUser.uid);
      toast({ title: 'Game Forfeited', description: 'You have forfeited the game.' });
    } catch(e) {
      toast({ title: 'Error', description: 'Could not forfeit the game.', variant: 'destructive'});
    }
  }
  
  let statusText = '';
  if (game.gameOver) {
    if (game.winner) {
        statusText = game.winner === myPlayer ? "You won!" : "You lost.";
    } else {
        statusText = "Game Over";
    }
  } else {
    statusText = isMyTurn ? "Your Turn" : "Opponent's Turn";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-background chat-background p-4 relative">
       <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4">
        <X className="h-5 w-5" />
      </Button>
      
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-2xl font-bold">Checkers</h2>
        <div className='text-center'>
            <p className='font-semibold text-lg'>{statusText}</p>
             <p className='text-sm text-muted-foreground'>You are playing as {myPlayer}.</p>
        </div>
        
        <div className="border-4 border-card shadow-lg relative">
         {game.board.map((row, rowIndex) => (
            <div key={rowIndex} className="flex">
              {row.map((piece, colIndex) => {
                const isPossible = possibleMoves.some(m => m[0] === rowIndex && m[1] === colIndex);
                const isLastMoveSquare = game.lastMove && 
                    ((game.lastMove.from[0] === rowIndex && game.lastMove.from[1] === colIndex) || 
                     (game.lastMove.to[0] === rowIndex && game.lastMove.to[1] === colIndex));

                return (
                  <SquareComponent
                    key={colIndex}
                    isBlack={(rowIndex + colIndex) % 2 !== 0}
                    piece={piece}
                    isSelected={selectedPiece?.[0] === rowIndex && selectedPiece?.[1] === colIndex}
                    isPossibleMove={isPossible}
                    onClick={() => handleSquareClick(rowIndex, colIndex)}
                    isLastMove={!!isLastMoveSquare}
                  />
                );
              })}
            </div>
          ))}
          {isLoading && (
            <div className='absolute inset-0 bg-background/50 flex items-center justify-center'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          )}
        </div>
        
        <div className="flex gap-4 items-center">
            {selectedPiece && (
                <Button variant="outline" onClick={() => setSelectedPiece(null)}>Cancel Selection</Button>
            )}
             {!game.gameOver && (
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Forfeit Game</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to forfeit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone and your opponent will be declared the winner.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction className='bg-destructive text-destructive-foreground hover:bg-destructive/90' onClick={handleForfeit}>Forfeit</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            )}
            {game.gameOver && (
                <Button onClick={onClose}>Back to Chat</Button>
            )}
        </div>

        {game.gameOver && game.winner && (
            <div className="mt-4 text-center">
                <p className="font-bold text-xl">{game.playerNames[game.winner]} wins!</p>
            </div>
        )}
      </div>
    </div>
  );
}
