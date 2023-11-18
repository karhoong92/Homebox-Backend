db.createUser({
  user: "osas",
  pwd: "osas2021OSAS2023!",
  roles: [
    {
      role: "readWrite",
      db: "HomeBox",
    },
  ],
});
// db.createCollection("homebox"); //MongoDB creates the database when you first store data in that database
