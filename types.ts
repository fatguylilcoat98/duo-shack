
export type GameView = 'LOGIN' | 'ROOM';

export type PlayerType = 'X' | 'O';

export type BoardState = (string | null)[];

export interface GameStatus {
  winner: string | null;
  isDraw: boolean;
  winningLine: number[] | null;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
