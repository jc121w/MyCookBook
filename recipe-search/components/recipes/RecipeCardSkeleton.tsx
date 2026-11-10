export const RecipeCardSkeleton = () => (
  <div className="card h-full overflow-hidden bg-base-100 ring-1 ring-base-300">
    <div className="skeleton h-44 w-full rounded-none" />
    <div className="card-body gap-3 p-5">
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-6 w-1/2" />
      <div className="mt-auto flex gap-2">
        <div className="skeleton h-6 w-16" />
        <div className="skeleton h-6 w-16" />
      </div>
    </div>
  </div>
);
