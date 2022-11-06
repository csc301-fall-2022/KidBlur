import express, { Express, Request, Response } from 'express';
import video_list from './routes/video_list'
import auth from './routes/auth';
import dotenv from 'dotenv';
import passport from 'passport';
import bodyParser from 'body-parser';

import { logger } from './utils/logger';
import upload from './routes/upload';

dotenv.config();

const app: Express = express();

app.use(express.json());
app.use(passport.initialize())
app.use("/api/auth", auth);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

app.use('/api/upload', upload);

app.use("/api/video_list", video_list);

const port = process.env.PORT;
app.get("/api/sanity_check", (req: Request, res:Response) => {
    res.send("CSC301 Sanity Check is working")
})

app.get('/', (req: Request, res: Response) => {
    res.send('CSC301 Express Server');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => logger.info(`Server started at port ${port}`));
}

export default app;
