CREATE TABLE if NOT EXISTS users(
    email varchar(50),
    password varchar(30),
    firstname varchar(50),
    familyname varchar(50),
    gender varchar(10),
    city varchar(50),
    country varchar(50),
    primary key(email)
);

CREATE TABLE if NOT EXISTS loggedinusers(
    email varchar(100),
    token varchar(50),
    primary key(token)
);

CREATE TABLE if NOT EXISTS messages(
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    from_email varchar(50),
    message varchar(250),
    to_email varchar(50)
);



