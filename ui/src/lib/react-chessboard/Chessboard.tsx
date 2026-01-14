// @ts-nocheck
import { Board } from './Board';
import {
  ChessboardOptions,
  ChessboardProvider,
  useChessboardContext,
} from './ChessboardProvider';

type ChessboardProps = {
  options?: ChessboardOptions;
};

export function Chessboard(props: any) {
  const { isWrapped } = useChessboardContext() ?? { isWrapped: false };

  if (isWrapped) {
    return <Board />;
  }

  // Support both options prop (wrapper style) and direct props (standard style)
  const options = props.options || props;

  return (
    <ChessboardProvider options={options}>
      <Board />
    </ChessboardProvider>
  );
}
