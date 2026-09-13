import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">LaunchByte</h1>
      <p className="max-w-md text-sm text-gray-500">
        Discover → Verify → Personalize → Track → Act. This is a placeholder
        home page — the real opportunity discovery UI lives under{" "}
        <code>features/opportunities/</code>.
      </p>
    </main>
  );
};

export default Home;
