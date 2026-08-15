import axios from "axios";
import Link from "next/link";

const RedirectMessage = (error: Error) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;

  if (status === 401) {
    return (
      <div className="mt-10 text-center text-2xl font-semibold">
        Please{" "}
        <Link href="/sign-in" className="link link-primary">
          sign in
        </Link>{" "}
        to view your library.
      </div>
    );
  }
};
export default RedirectMessage;
