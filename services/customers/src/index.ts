import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";
import cors from "cors";

const app = express();

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
      console.log("CORS origin", origin);
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
}

setupCors(app);

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

interface Customer {
  name: string;
  email: string;
  cpf: string;
  fee: number;
}

app.get("/", async (req: Request, res: Response) => {
  const customersSnapshot = await db.collection("customers").get();
  const customersWithId = customersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  res.json(customersWithId);
});

app.get("/version", async (req: Request, res: Response) => {
  res.json({ version: "1.0.0" });
});

app.post("/", async (req: Request, res: Response) => {
  const newCustomer: Customer = req.body;
  await db.collection("customers").add(newCustomer);
  res.status(201).send();
});

app.put("/", async (req: Request, res: Response) => {
  const { id, ...updatedCustomer }: Partial<Customer> & { id: string } =
    req.body;
  await db.collection("customers").doc(id).update(updatedCustomer);
  res.status(200).send();
});

app.delete("/", async (req: Request, res: Response) => {
  const { id }: { id: string } = req.body;
  await db.collection("customers").doc(id).delete();
  res.status(204).send();
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
