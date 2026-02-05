import LandingPage from "./home/page";
export default async function Home() {
  return (
    <main className="m-auto flex h-screen max-w-4xl flex-col items-center gap-10">
      <LandingPage />
    </main>
  );
}
