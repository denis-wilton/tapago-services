import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: any;
  }
}

const app = express();
const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  throw new Error("JWT_SECRET is not defined");
}

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

function setupCors(app: express.Application) {
  if (!process.env.ALLOWED_ORIGINS) {
    throw new Error("ALLOWED_ORIGINS is not defined");
  }

  const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void
    ) => {
      if (
        !origin ||
        allowedOrigins.some((allowedOrigin) =>
          allowedOrigin.toLowerCase().includes(origin.toLowerCase())
        )
      ) {
        callback(null, true);
      } else {
        console.log("Not allowed by CORS", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
}

setupCors(app);

app.post("/login", async (req: Request, res: Response) => {
  try {
    const response = await fetch(`http://users:3000/${req.body.username}`);
    if (!response.ok) {
      res.status(401).send("Invalid username or password");
      return;
    }

    const user = await response.json();
    if (user.password !== req.body.password) {
      res.status(401).send("Invalid username or password");
      return;
    }

    const token = jwt.sign(
      { username: user.username, role: user.role },
      SECRET_KEY
    );
    res.cookie("token", token, { httpOnly: true });
    res.json({ token });
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.post("/logout", async (req: Request, res: Response) => {
  res.clearCookie("token");
  res.send();
});

app.get("/me", async (req: Request, res: Response) => {
  if (!req.cookies) {
    res.status(401).send("Unable to get cookies");
    return;
  }

  const token = req.cookies.token;

  if (!token) {
    res.status(401).send("Unauthorized");
    return;
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    res.json(req.user);
  } catch (error) {
    res.status(401).send("Unauthorized");
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
