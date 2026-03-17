import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const port = 3000;
const app = express();

app.get("/movies", async (req, res) => {
    const movies = await prisma.movie.findMany({
      orderBy:{
         title: "asc"
      },
      include: {
         genres: true,
         languages:true 
      }
    });
    res.json(movies);
});

app.listen(port, () => {
    console.log(`Servidor em execução em http://localhost:${port}`);
});
