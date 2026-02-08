import {
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  CircleUser,
} from "lucide-react";

type ProfileCardProps = {
  name: string;
  email: string;
  img?: string;
};

export default function ProfileCard({ name, email, img }: ProfileCardProps) {
  return (
    <div className="is-drawer-close:hidden flex flex-col items-center gap-2">
      <div className="avatar p-3">
        <div className="w-20 rounded-full">
          {img ? <img src={img} /> : <CircleUser className="h-auto w-20" />}
        </div>
      </div>
      <h2> {name}</h2>
      <h5> {email}</h5>
    </div>
  );
}
