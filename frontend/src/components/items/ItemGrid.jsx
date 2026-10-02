import ItemCard from './ItemCard';
import ItemRow from './ItemRow';

export default function ItemGrid({ items, viewMode = 'grid', ...handlers }) {
  if (viewMode === 'list') {
    return (
      <div className="overflow-hidden rounded-card border border-line bg-paper-card">
        {items.map((item) => (
          <ItemRow key={item._id} item={item} {...handlers} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <ItemCard key={item._id} item={item} {...handlers} />
      ))}
    </div>
  );
}
