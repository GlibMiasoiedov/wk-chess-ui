import { useDroppable } from '@dnd-kit/core';

type DroppableProps = {
  children: (props: { isOver: boolean }) => React.ReactNode;
  squareId: string;
};

export function Droppable({ children, squareId }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: squareId,
  });

  return <div ref={setNodeRef} style={{ width: '100%', height: '100%' }}>{children({ isOver })}</div>;
}
