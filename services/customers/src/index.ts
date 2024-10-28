import express, { Request, Response, NextFunction } from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

interface Customer {
  id: number;
  username: string;
  email: string;
}

const customers: Customer[] = [
  { id: 1, username: "customer1", email: "customer1@gmail.com" },
  { id: 2, username: "customer2", email: "customer2@gmail.com" },
];

app.get("/customers", (req: Request, res: Response) => {
  res.json(customers);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
