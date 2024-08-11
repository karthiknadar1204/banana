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


app.listen(8080, () => console.log('Listening on port 8080'));