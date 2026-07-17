import type { PostReactions } from "../types/post";

type ReactionType = keyof PostReactions;

interface ReactionButtonsProps {
  reactions: PostReactions;
  onReact: (type: ReactionType) => void;
  disabled?: boolean;
}

const labels: Record<ReactionType, string> = {
  confirm: "Confirm",
  useful: "Useful",
  fake: "Fake",
  resolved: "Resolved",
};

export function ReactionButtons({
  reactions,
  onReact,
  disabled = false,
}: ReactionButtonsProps) {
  return (
    <div className="reaction-buttons">
      {(Object.keys(labels) as ReactionType[]).map((type) => (
        <button
          key={type}
          type="button"
          className="btn btn-small"
          onClick={() => onReact(type)}
          disabled={disabled}
        >
          {labels[type]} ({reactions[type]})
        </button>
      ))}
    </div>
  );
}
