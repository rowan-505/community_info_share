import type { PostReactions } from "../types/post";

type ReactionType = keyof PostReactions;

interface ReactionButtonsProps {
  reactions: PostReactions;
  onReact?: (type: ReactionType) => void;
  disabled?: boolean;
  readonly?: boolean;
}

const labels: Record<ReactionType, string> = {
  confirm: "Confirm",
  useful: "Useful",
  fake: "Fake",
  resolved: "Resolved",
};

const reactionClasses: Record<ReactionType, string> = {
  confirm: "reaction-confirm",
  useful: "reaction-useful",
  fake: "reaction-fake",
  resolved: "reaction-resolved",
};

export function ReactionButtons({
  reactions,
  onReact,
  disabled = false,
  readonly = false,
}: ReactionButtonsProps) {
  return (
    <div className="reaction-buttons" aria-label="Reaction counts">
      {(Object.keys(labels) as ReactionType[]).map((type) =>
        readonly || !onReact ? (
          <span
            key={type}
            className={`reaction-count ${reactionClasses[type]}`}
          >
            <span>{labels[type]}</span>
            <strong>{reactions[type]}</strong>
          </span>
        ) : (
          <button
            key={type}
            type="button"
            className={`button btn-small reaction-button ${reactionClasses[type]}`}
            onClick={() => onReact(type)}
            disabled={disabled}
          >
            <span>{labels[type]}</span>
            <strong>{reactions[type]}</strong>
          </button>
        ),
      )}
    </div>
  );
}
