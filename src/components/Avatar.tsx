// A person's photo, or their first initial on a soft circle when there's no photo.
// One component, so the navbar and the profile always look the same.
export function Avatar({
  name,
  image,
  size,
}: {
  name: string | null | undefined;
  image: string | null | undefined;
  size: number; // px
}) {
  const initial = name?.trim()[0]?.toUpperCase() ?? "?";
  return (
    <span
      className="bg-primary/15 text-primary grid shrink-0 place-items-center overflow-hidden rounded-full font-serif font-bold"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {image ? (
        <img src={image} alt="" className="h-full w-full object-cover" />
      ) : (
        initial
      )}
    </span>
  );
}
