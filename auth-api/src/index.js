import express from "express";
import routes from "./auth.routes.js";
import { reqLogger } from "./logger.js";
import { routesIntrospect } from "./routes-introspect.js";

const app = express();
app.use(express.json());
app.use(reqLogger);
app.use(routes);

app.get("/__routes",        (req,res)=> res.json(routesIntrospect(app)));
app.get("/auth/__routes",   (req,res)=> res.json(routesIntrospect(app))); // <= NUEVO

const PORT = process.env.PORT || 3000;
console.log(JSON.stringify({ at:new Date().toISOString(), evt:"BOOT", svc:"auth-api" }));
app.listen(PORT, ()=> console.log(`auth-api on ${PORT}`));
