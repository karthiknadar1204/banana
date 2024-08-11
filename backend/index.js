import 'dotenv/config';
import express from 'express';
import uniqid from 'uniqid';
import fs from 'fs';
import cors from 'cors';
import path from 'path';
import { GPTScript, RunEventType } from '@gptscript-ai/gptscript';

const g = new GPTScript();
const app = express();
app.use(cors());
app.use(express.static('stories'));



app.get("/test",(req,res)=>{
    return res.json("test ok")
})


app.get('/create-story', async (req, res) => {
    const url = decodeURIComponent(req.query.url);
    const dir = uniqid();
    const path = './stories/'+dir;
    fs.mkdirSync(path, {recursive: true});
  
    console.log({
      url,
    });
  
    const opts = {
      input: `--url ${url} --dir ${path}`,
      disableCache: true,
      model: 'gpt-3.5-turbo'
    };
    try{
      const run = await g.run('./sequence.gpt', opts);
  
      run.on(RunEventType.Event, ev => {
        if (ev.type === RunEventType.CallFinish && ev.output) {
          console.log(ev.output);
        }
      });
      const result = await run.text();
      return res.json(dir);
    } catch(e) {
      console.error(e);
      return  res.json('error');
    }
  });


  app.get('/build-video',(req,res)=>{
    const id='sktwi1pa0lzplywjc';
    // const id = req.query.id;
    if (!id) {
      res.json('error. missing id');
    }
    const dir = './stories/'+id;
    if (!fs.existsSync(dir+'/1.png')) {
      fs.renameSync(dir+'/b-roll-1.png', dir+'/1.png');
      fs.renameSync(dir+'/b-roll-2.png', dir+'/2.png');
      fs.renameSync(dir+'/b-roll-3.png', dir+'/3.png');
      fs.renameSync(dir+'/voiceover-1.mp3', dir+'/1.mp3');
      fs.renameSync(dir+'/voiceover-2.mp3', dir+'/2.mp3');
      fs.renameSync(dir+'/voiceover-3.mp3', dir+'/3.mp3');
      fs.renameSync(dir+'/voiceover-1.txt', dir+'/transcription-1.json');
      fs.renameSync(dir+'/voiceover-2.txt', dir+'/transcription-2.json');
      fs.renameSync(dir+'/voiceover-3.txt', dir+'/transcription-3.json');
    }
    return res.json('ok');

    // const images = ['1.png', '2.png', '3.png'];
    // const audio = ['1.mp3', '2.mp3', '3.mp3'];
    // const transcriptions = [
    //   'transcription-1.json',
    //   'transcription-2.json',
    //   'transcription-3.json'
    // ];

  })


app.listen(8080, () => console.log('Listening on port 8080'));