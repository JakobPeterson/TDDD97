import sqlite3
import random
import math
from flask import g
import random
from random import randint

DATABASE = "database.db"

#--------BASIC NEEDS---------#

def get_db():
    db = getattr(g, 'db', None)
    if db is None:
        db = g.db = sqlite3.connect(DATABASE)
    
    return db

def init_db(app):
    with app.app_context():
        db = get_db()
        with app.open_resource('schema.sql', mode='r') as f:
            db.cursor().executescript(f.read())
        db.commit()

def disconnect():
    db = getattr(g, 'db', None)
    if db is not None:
        g.db.close()
        g.db = None


#---------Sign in----------#

def find_user(email):
    cursor = get_db()
    try:
        c = cursor.execute('SELECT * from users where email = ?', (email, ))
        matches = c.fetchone()
        c.close()

        return ['email', matches[0], 'password', matches[1]]
    
    except:
        return None


def generate_token():
    letters = "abcdefghiklmnopqrstuvwwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"
    token = ""
    for i in range (0,36):
        token = token + letters[randint(0,len(letters)-1)]
    return token

def logged_in(email, token):
    cursor = get_db()
    try:
        cursor.execute('INSERT INTO loggedinusers VALUES(?, ?)', [email,token])
        cursor.commit()
        return True
    except:
        return False



#-----------Sign up---------------#

def reguser(email, password, firstname, familyname, gender, city, country):
    cursor = get_db()
    try:
        cursor.execute('INSERT INTO users VALUES(?, ?, ?, ?, ?, ?, ?)', 
        [email, password, firstname, familyname, gender, city, country])   
        cursor.commit()
        return True
    except:
        return False


#---------Sign out-------------#

def token_to_email(token):
    try:
        cursor = get_db().execute('SELECT * from loggedinusers where token = ?', [token])
        match = cursor.fetchone()
        cursor.close()
        return match[0]
    except:
        return None

def remove_user(token):
    cursor = get_db()
    try:
        cursor.execute('DELETE from loggedinusers where token = ?', [token])
        cursor.commit()
        return True
    except:
        return False
def remove_user_by_email(email):
    cursor = get_db()
    try:
        cursor.execute('DELETE from loggedinusers where email = ?', [email])
        cursor.commit()
        return True
    except:
        return False

def already_logged_in(email):
    cursor = get_db()
    try:
        cursor = get_db().execute('SELECT * from loggedinusers where email = ?', [email])
        print("already logged in: " + email)
        cursor.close()
        return True
    except:
        return False



#----------Change password-----------#

def change_password(email, newpassword):
    cursor = get_db()
    try:
        cursor.execute('UPDATE users SET password = ? WHERE email =  ?', [newpassword, email])
        cursor.commit()
        return True
    except:
        return False

#---------Get user data-------------#

def user_data_by_email(email):
    cursor = get_db()
    try:
        c = cursor.execute('SELECT * from users where email = ?', [email,])
        match = c.fetchall()[0]
        c.close()
        return match 
    except:
        return None
    

def get_user_messages_by_email(email):
    cursor = get_db()
    try:
        c = cursor.execute('SELECT * from messages where toemail = ?', [email])
        match = c.fetchall()
        c.close()
        return match
    except:
        return None

#--------Post message----------#
def post_message(from_email, message, to_email):
    cursor = get_db()
    try: 
        cursor.execute('INSERT INTO messages(fromemail, message, toemail) VALUES(?,?,?)',[from_email, message, to_email])
        cursor.commit()
        return True
    except:
        return False
