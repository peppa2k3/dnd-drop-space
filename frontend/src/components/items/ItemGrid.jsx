import ItemCard from './ItemCard';
import ItemRow from './ItemRow';

export default function ItemGrid({ items, viewMode = 'grid', ...handlers }) {
  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-card border border-border bg-surface">
        {items.map((item) => (
          <ItemRow key={item._id} item={item} {...handlers} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} {...handlers} />
      ))}
    </div>
  );
}
