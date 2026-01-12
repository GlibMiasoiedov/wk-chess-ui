import { Board } from './Board';
import {
  ChessboardOptions,
  ChessboardProvider,
  useChessboardContext,
} from './ChessboardProvider';

export function Chessboard(props: ChessboardOptions) {
  const { isWrapped } = useChessboardContext() ?? { isWrapped: false };

  if (isWrapped) {
    return <Board />;
  }

  return (
    <ChessboardProvider options={props}>
      <Board />
    </ChessboardProvider>
  );
}
