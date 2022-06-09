//#region constants
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const prismaErrors = require("./prisma.errors.json")
const bcrypt = require("bcrypt");
const htmlspecialchars = require("htmlspecialchars");
const striptags = require("striptags");

const fs = require("fs");
const express = require("express");
const cors = require("cors");
var bodyParser = require("body-parser");

var app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// const port = "90";
const port = "8000";
//#endregion constants

//#region Multer setting
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
var custom_upload_file_name;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = file.mimetype.split("/").pop();
    custom_upload_file_name =
      "image_" + new Date().getMilliseconds() + "_" + uuidv4();
    custom_upload_file_name = `${custom_upload_file_name}.${uniqueSuffix}`;
    cb(null, custom_upload_file_name);
  },
});
const upload = multer({ storage: storage });
//#endregion Multer setting

//#region Prisma

//#region CREATE

app.post("/inscription", upload.single("image"), async (req, res) => {
  var { email, password, username } = req.body;
  var image = req.file.filename;

  if (!email || !password || !username) {
    res.status(403).send("request is wrong formated");
  }

  email = htmlspecialchars(striptags(email.trim())).toLowerCase();
  password = htmlspecialchars(striptags(password.trim()));
  image = custom_upload_file_name;
  var response;
  bcrypt.hash(password, 4, async function (err, hash) {
    try {
      response = await prisma.user.create({
        data: {
          email,
          name: username,
          password: hash,
          image: image,
        },
      });
    } catch (error) {
      console.log(error);
      return res.status(400).send(
        JSON.stringify({
          message: prismaErrors[error.code],
        })
      );
    }
    // mail(email, "New Account", "You created an account on CatFood Store.");
    delete response.password
    res.status(201).json({ response: response });
  });
});
//#endregion CREATE

//#region  READ
app.get("/user/:id", async (req, res) => {
  var user_id = htmlspecialchars(striptags(req.params.id));

  if (!user_id) {
    res.status(403).send("request is wrong formated");
  }

  var user = undefined;

  try {
    user = await prisma.user.findUnique({
      where: {
        id: Number(user_id),
      },
    });

    if (!user) {
      res.status(403).send("An error occured, please conctact your webmaster");
    }
    const { id, name, email, role, image } = user;

    if (image.trim() != "") {
      var img_decoded = fs.readFileSync(`uploads/${image}`, "base64");
      res.send({
        id,
        name,
        email,
        role,
        img_decoded: img_decoded,
        img_extension: `${image.split(".").pop()}`,
      });
      return;
    }

    res.send({ id, name, email, role, img_decoded: "", img_extension: "" });
  } catch (error) {
    res.status(403).send(`${error}`);
  }
});

app.get("/users", async (req, res) => {
  var users = undefined;

  try {
    users = await prisma.user.findMany();
    console.log("user", users);
    if (!users instanceof Array) {
      res.status(403).send("An error occured, please conctact your webmaster");
    }

    users.map((u) => {
      delete u.password
      if (u.image.trim() != "") {
        u.image = fs.readFileSync(`uploads/${u.image}`, "base64");
      }
    });

    console.log("USERS ====>", users);

    res.send(users);
  } catch (error) {
    res.status(403).send(`${error}`);
  }
});

//#endregion READ

//#region UPDATE
app.post("/user/modify/:id", async (req, res) => {
  const user_email = htmlspecialchars(striptags(req.body.email));
  const user_name = htmlspecialchars(striptags(req.body.name));
  var password = htmlspecialchars(striptags(req.body.password));
  var user_id = htmlspecialchars(striptags(req.params.id));

  const newValues = { email: user_email, name: user_name };

  if (!user_email || !password || !user_name || !user_id) {
    res.status(403).send("request is wrong formated");
  }

  var user = undefined;
  var foundedUser;
  try {
    foundedUser = await prisma.user.findUnique({
      where: {
        id: Number(user_id),
      },
    });
  } catch (error) {
    res.status(401).send(`findUnique_ERROR ${error}`);
    return;
  }

  if (!foundedUser) {
    res.status(401).send("user not found");
    return;
  }

  try {
    user = await prisma.user.updateMany({
      where: {
        id: Number(user_id),
      },
      data: newValues,
    });

    if (!user) {
      res
        .status(403)
        .send("An error occured on modify, please conctact your webmaster");
      return;
    }

    res.status(202).send("Modification réussie");
  } catch (error) {
    res.status(403).send(`${error}`);
    return;
  }
});
//#endregion UPDATE

//#region LOGIN
app.post("/login_check", async (req, res) => {
  const user_email = htmlspecialchars(striptags(req.body.email));
  const password = htmlspecialchars(striptags(req.body.password));
  var foundedUser;

  if (!user_email || !password) {
    res.status(403).send("request is wrong formated");
  }

  try {
    foundedUser = await prisma.user.findUnique({
      where: {
        email: user_email.toLowerCase(),
      },
    });
  } catch (error) {
    res.status(401).send(`findUnique_ERROR ${error}`);
    return;
  }

  if (!foundedUser) {
    console.warn("sorry no item found");
    res.status(401).send("Invalid crédentials");
    return;
  }

  try {
    bcrypt.compare(password, foundedUser?.password, function (err, result) {
      if (!result) {
        res.status(401).send("Unauthorized");
        return;
      }

      const { id, name, email, role } = foundedUser;
      res.send({ id, name, email, role });
    });
  } catch (error) {
    res.status(401).send(" COMPARE_ERROR " + error);
    return;
  }
});
//#endregion

//#region DELETE
app.post("/user/delete/:id", async (req, res) => {
  var user_id = htmlspecialchars(striptags(req.params.id));

  if (!user_id) {
    res.status(422).send(`unreconized identifier`);
    return;
  }

  var user;

  try {
    user = await prisma.user.deleteMany({
      where: {
        id: Number(user_id),
      },
    });
  } catch (error) {
    res.status(401).send(`findUnique_ERROR ${error}`);
    return;
  }

  if (user?.count < 1) {
    res.status(400).send("sorry, no item found");
    return;
  }

  res.status(202).send("Suppression réussie");
});
//#endregion DELETE

//#endregion PRISMA
app.listen(port, () => {
  console.log("server running on port " + port);
});




