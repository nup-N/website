const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");
const dbPath = path.join("data", "local.db");
const buf = fs.readFileSync(dbPath);
initSqlJs().then(SQL => {
  const db = new SQL.Database(buf);
  db.run("UPDATE users SET role = 'super_admin' WHERE username = 'admin'");
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  console.log("Updated admin to super_admin");
  db.close();
});
