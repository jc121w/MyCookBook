type ProfileCardProps = {
  name: string;
  email: string;
  img?: string;
};

export default function ProfileCard({ name, email, img }: ProfileCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="avatar p-3">
        <div className="w-20 rounded-full">
          <img src={img} />
        </div>
      </div>
      <h2> {name}</h2>
      <h5> {email}</h5>
    </div>
  );
}
