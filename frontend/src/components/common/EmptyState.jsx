export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      {Icon && (
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-secondary text-text-muted">
          <Icon size={26} />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold text-text-primary">{title}</h3>
        {description && <p className="max-w-sm text-sm text-text-secondary">{description}</p>}
      </div>
      {action}
    </div>
  );
}
