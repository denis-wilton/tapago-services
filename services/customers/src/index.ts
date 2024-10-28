import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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

app.post("/", async (req: Request, res: Response) => {
  const newCustomer: Customer = req.body;
  await db.collection("customers").add(newCustomer);
  res.status(201).send();
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
