import axios from "axios";
import { FormEvent, useEffect, useState } from "react";

export default function App() {
  const [url, setUrl] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [samples, setSamples] = useState<string[]>([]);
  const [activeSampleIndex, setActiveSampleIndex] = useState<null | number>(
    null
  );

  return (
    <main className="max-w-2xl mx-auto flex gap-16 px-4">
      <div className="py-8 flex flex-col justify-center">
        <h1 className="text-4xl font-bold uppercase mb-4">
          <span className="text-5xl">URL to Video</span>
          <br />
          <span className="bg-gradient-to-br from-emerald-300 from-30% to-sky-300 bg-clip-text text-transparent">
            with power of AI
          </span>
        </h1>
        <form
          // onSubmit={handleSubmit}
          className="grid gap-2"
        >
          <input
            className="border-2 rounded-full bg-transparent text-white px-4 py-2 grow"
            // value={url}
            // onChange={ev => setUrl(ev.target.value)}
            type="url"
            placeholder="https://..."
          />
          <button
            className="bg-emerald-500 text-white px-4 py-2 rounded-full uppercase"
            type="submit"
          >
            Create&nbsp;video
          </button>
        </form>
      </div>
      {/* RIGHT */}
      <div className="py-4">
        <div className="text-gray-500 w-[240px] h-[380px] relative">Video Here</div>
      </div>

    </main>
  );
}
