import "dotenv/config";
import express from "express";
import uniqid from "uniqid";
import fs from "fs";
import cors from "cors";
import path from "path";
import { GPTScript, RunEventType } from "@gptscript-ai/gptscript";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import ffprobe from "ffprobe-static";

const app = express();
app.use(cors());
app.use(express.static("stories"));

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobe.path);

const g = new GPTScript();

app.get("/test", (req, res) => {
  return res.json("test ok");
});

app.get("/create-story", async (req, res) => {
  const url = decodeURIComponent(req.query.url);
  const dir = uniqid();
  const storyPath = "./stories/" + dir;
  fs.mkdirSync(storyPath, { recursive: true });

  console.log({
    url,
  });

  const opts = {
    input: `--url ${url} --dir ${storyPath}`,
    disableCache: true,
  };
  try {
    const run = await g.run("./sequence.gpt", opts);

    run.on(RunEventType.Event, (ev) => {
      if (ev.type === RunEventType.CallFinish && ev.output) {
        console.log(ev.output);
      }
    });
    const result = await run.text();
    return res.json(dir);
  } catch (e) {
    console.error(e);
    return res.json("error");
  }
});

app.get("/build-video", async (req, res) => {
  //   const id = "sktwi1pa0lzplywjc"; // Use provided ID or default
  const id = req.query.id;
  if (!id) {
    return res.json("error. missing id");
  }

  const dir = "./stories/" + id;
  if (!fs.existsSync(dir + "/1.png")) {
    fs.renameSync(dir + "/b-roll-1.png", dir + "/1.png");
    fs.renameSync(dir + "/b-roll-2.png", dir + "/2.png");
    fs.renameSync(dir + "/b-roll-3.png", dir + "/3.png");
    fs.renameSync(dir + "/voiceover-1.mp3", dir + "/1.mp3");
    fs.renameSync(dir + "/voiceover-2.mp3", dir + "/2.mp3");
    fs.renameSync(dir + "/voiceover-3.mp3", dir + "/3.mp3");
    fs.renameSync(dir + "/voiceover-1.txt", dir + "/transcription-1.json");
    fs.renameSync(dir + "/voiceover-2.txt", dir + "/transcription-2.json");
    fs.renameSync(dir + "/voiceover-3.txt", dir + "/transcription-3.json");
  }

  const images = ["1.png", "2.png", "3.png"];
  const audio = ["1.mp3", "2.mp3", "3.mp3"];
  const transcriptions = [
    "transcription-1.json",
    "transcription-2.json",
    "transcription-3.json",
  ];

  for (let i = 0; i < images.length; i++) {
    const inputImage = path.join(dir, images[i]);
    const inputAudio = path.join(dir, audio[i]);
    const inputTranscription = path.join(dir, transcriptions[i]);
    const outputVideo = path.join(dir, `output_${i}.mp4`);

    // Read the transcription file
    const transcription = JSON.parse(
      fs.readFileSync(inputTranscription, "utf8")
    );
    const words = transcription.words;
    const duration = parseFloat(transcription.duration).toFixed(2);

    // Build the drawtext filter string
    let drawtextFilter = "";
    words.forEach((wordInfo) => {
      const word = wordInfo.word.replace(/'/g, "\\'").replace(/"/g, '\\"');
      const start = parseFloat(wordInfo.start).toFixed(2);
      const end = parseFloat(wordInfo.end).toFixed(2);
      drawtextFilter += `drawtext=text='${word}':fontcolor=white:fontsize=48:borderw=2:bordercolor=black:x=(w-text_w)/2:y=(h*3/4)-text_h:enable='between(t\\,${start}\\,${end})',`;
    });

    // Remove last comma
    drawtextFilter = drawtextFilter.slice(0, -1);

    console.log(`Processing: ${inputImage} and ${inputAudio}`);

    await new Promise((resolve, reject) => {
      ffmpeg()
        .input(inputImage)
        .loop(duration)
        .input(inputAudio)
        .audioCodec("copy")
        .videoFilter(drawtextFilter)
        .outputOptions("-t", duration)
        .outputOptions("-loglevel", "debug") // Verbose logging for debugging
        .on("error", (e) => {
          console.error(e);
          reject(e);
        })
        .on("end", () => {
          console.log(`${outputVideo} is complete`);
          resolve();
        })
        .save(outputVideo);
    });
  }

  console.log("Merging 3 videos together");
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(dir, "output_0.mp4"))
      .input(path.join(dir, "output_1.mp4"))
      .input(path.join(dir, "output_2.mp4"))
      .on("end", resolve)
      .on("error", reject)
      .mergeToFile(path.join(dir, "final.mp4"));
  });

  console.log("done");
  return res.json(`${id}/final.mp4`);
});

app.listen(8080, () => console.log("Listening on port 8080"));
