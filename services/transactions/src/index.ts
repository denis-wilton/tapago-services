import express, { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Body: ${JSON.stringify(req.body)}`);
  } else {
    console.log("No body");
  }
  next();
});

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

interface Transaction {
  customerId: string;

  description: string;
  amount: number;
  createdAt: string;
  updatedAt: string;

  status: "pending" | "approved" | "declined";
}

app.get("/", async (req: Request, res: Response) => {
  const transactionsSnapshot = await db.collection("transactions").get();
  const transactions = transactionsSnapshot.docs.map((doc) => doc.data());
  res.json(transactions);
});

app.get("/customer/:customerCpf", async (req: Request, res: Response) => {
  const customerCpf = req.params.customerCpf;
  const customer = (
    await fetch(`http://customers:3000/`).then((res) => res.json())
  ).find(
    (customer: { id: string; cpf: string }) => customer.cpf === customerCpf
  );

  if (!customer) {
    res.status(404).send();
    return;
  }

  const transactionsSnapshot = await db
    .collection("transactions")
    .where("customerId", "==", customer.id)
    .get();

  const transactions = transactionsSnapshot.docs.map((doc) => doc.data());

  const transactionsWithCustomerDetails = transactions.map((transaction) => ({
    ...transaction,
    customer,
  }));

  res.json(transactionsWithCustomerDetails);
});

app.post("/", async (req: Request, res: Response) => {
  const newTransaction: Transaction = req.body;
  console.log(`Creating new transaction: ${JSON.stringify(newTransaction)}`);
  await db
    .collection("transactions")
    .add({
      ...newTransaction,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "pending",
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error creating transaction: " + error);
      return;
    });
  console.log("Transaction created successfully");
  res.status(201).send();
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
