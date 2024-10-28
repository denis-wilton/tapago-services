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

interface User {
  username: string;
  password: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

app.get("/", async (req: Request, res: Response) => {
  const usersSnapshot = await db.collection("users").get();
  const usersWithId = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  res.json(usersWithId);
});

app.get("/:username", async (req: Request, res: Response) => {
  const username = req.params.username;
  const usersSnapshot = await db
    .collection("users")
    .where("username", "==", username)
    .limit(1)
    .get();
  const userWithId = usersSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))[0];

  if (!userWithId) {
    res.status(404).send("User not found");
    return;
  }

  res.json(userWithId);
});

app.post("/", async (req: Request, res: Response) => {
  const newUser: User = req.body;
  console.log(`Creating new user: ${JSON.stringify(newUser)}`);
  await db
    .collection("users")
    .add({
      ...newUser,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error creating user: " + error);
      return;
    });
  console.log("User created successfully");
  res.status(201).send();
});

app.put("/", async (req: Request, res: Response) => {
  const { userId, ...updatedUser }: User & { userId: string } = req.body;

  if (!userId) {
    res.status(400).send();
    return;
  }

  console.log(`Updating user ${userId} with: ${JSON.stringify(updatedUser)}`);
  await db
    .collection("users")
    .doc(userId)
    .update({
      ...updatedUser,
      updatedAt: new Date().toISOString(),
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error updating user: " + error);
      return;
    });
  console.log("User updated successfully");
  res.status(200).send();
});

app.delete("/", async (req: Request, res: Response) => {
  const userId = req.body.userId;
  if (!userId) {
    res.status(400).send();
    return;
  }

  console.log(`Deleting user ${userId}`);
  await db
    .collection("users")
    .doc(userId)
    .delete()
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error deleting user: " + error);
      return;
    });
  console.log("User deleted successfully");
  res.status(204).send();
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
